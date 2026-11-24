#!/usr/bin/env node
// Keeps the English and German versions of the docs and Markdown pages in step.
//
// Write a page in English or German, then run this script (GitHub runs it for you
// after every push to main, see .github/workflows/translate.yml). It creates the
// missing language with DeepL:
//
//   docs/<page>.md(x)       English version (the default language)
//   i18n/de/docusaurus-plugin-content-docs/current/<page>.md(x)   German version
//   src/pages/<page>.md(x)  English version of a page like About
//   i18n/de/docusaurus-plugin-content-pages/<page>.md(x)          German version
//
// Rules:
// - A new page in English: write it in docs/. The German copy is created.
// - A new page in German: write it in the German folder, or in docs/ with `lang: de`
//   in the front matter. The script moves it to the German folder and puts the
//   English translation in docs/.
// - You change the page you wrote: the other language is translated again.
// - You fix the translated page by hand: your fix is kept.
// - You change both: nothing is overwritten, and the script tells you. Delete the
//   one that should be redone and run it again.
// - Translated pages get `translated_from: en` (or `de`) in the front matter, which
//   shows a small "automatically translated" note on the page.
//
// What was translated from what is stored in i18n/translations.json.
//
// Usage: DEEPL_API_KEY=... node scripts/translate.mjs [--dry-run] [--init]
//   --init     only record the current files as in step (no translating)
//   --dry-run  show what would happen without calling DeepL or writing files

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MANIFEST = path.join(ROOT, 'i18n/translations.json');
const PAIRS = [
  {en: 'docs', de: 'i18n/de/docusaurus-plugin-content-docs/current'},
  {en: 'src/pages', de: 'i18n/de/docusaurus-plugin-content-pages'},
];
const LANG_NAME = {en: 'English', de: 'German'};
const DEEPL_TARGET = {en: 'EN-US', de: 'DE'};

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const init = args.has('--init');
const key = process.env.DEEPL_API_KEY;

const sha = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
const read = rel => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), 'utf8') : undefined);
function write(rel, text) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), {recursive: true});
  fs.writeFileSync(path.join(ROOT, rel), text);
}
function remove(rel) {
  if (!dryRun) fs.rmSync(path.join(ROOT, rel));
}

function listMarkdown(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, {withFileTypes: true, recursive: true})
    .filter(e => e.isFile() && /\.mdx?$/.test(e.name) && !e.name.startsWith('_'))
    .map(e => path.relative(abs, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/'));
}

// ---------- front matter ----------

function splitFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? {fm: m[1], body: text.slice(m[0].length)} : {fm: undefined, body: text};
}
function fmGet(fm, field) {
  const m = fm?.match(new RegExp(`^${field}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
}
function fmSet(fm, field, value) {
  const line = value === undefined ? '' : `${field}: ${value}`;
  const re = new RegExp(`^${field}:.*$\\n?`, 'm');
  if (fm === undefined) return value === undefined ? undefined : line;
  if (re.test(fm)) return fm.replace(re, line ? `${line}\n` : '').replace(/\n$/, '');
  return value === undefined ? fm : `${fm}\n${line}`;
}
const join = (fm, body) => (fm === undefined ? body : `---\n${fm}\n---\n\n${body.replace(/^\n+/, '')}`);
// Front matter fields with text people read.
const TEXT_FIELDS = ['title', 'sidebar_label', 'description'];

// ---------- Markdown → DeepL → Markdown ----------
// Everything that is not prose (code, links, JSX, HTML tags, list markers, ...) is
// swapped for <x i="n"/> before DeepL sees it, and put back afterwards.

const PROTECT = [
  /^(?:import|export) .*$/gm, // MDX imports
  /^:::\w*.*$/gm, // admonition markers
  /^\s*(?:---|\*\*\*)\s*$/gm, // horizontal rules
  /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-*:?\s*$/gm, // table header separators
  /<!--[\s\S]*?-->/g, // comments
  /\{[^{}\n]*(?:\{[^{}\n]*\}[^{}\n]*)*\}/g, // JSX expressions like {/* #font */} or {'text'}
  /<\/?[A-Za-z][^<>]*>/g, // HTML / JSX tags
  /`[^`\n]+`/g, // inline code
  /\]\([^)\s]+(?:\s+"[^"]*")?\)/g, // link targets ](url)
  /https?:\/\/[^\s)<>]+/g, // bare URLs
  /^\s*(?:[-*+]|\d+\.|#{1,6}|>)\s+/gm, // list, heading and quote markers
  /\|/g, // table cell borders
];

function protect(text, store) {
  let out = text;
  for (const re of PROTECT) {
    out = out.replace(re, m => {
      store.push(m);
      return `\u0000${store.length - 1}\u0000`;
    });
  }
  // Placeholders may hold other placeholders; that is fine, they are restored in reverse.
  return out
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u0000(\d+)\u0000/g, '<x i="$1"/>');
}

function restore(text, store) {
  let out = text
    .replace(/<x i="(\d+)"\s*\/>/g, '\u0000$1\u0000')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
  for (let i = 0; i < 20 && /\u0000\d+\u0000/.test(out); i++) {
    out = out.replace(/\u0000(\d+)\u0000/g, (_, n) => store[Number(n)]);
  }
  return out;
}

async function deepl(texts, target) {
  const host =
    process.env.DEEPL_API_URL ?? (key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');
  const res = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: {Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text: texts,
      target_lang: DEEPL_TARGET[target],
      tag_handling: 'xml',
      ignore_tags: ['x'],
      preserve_formatting: true,
      split_sentences: 'nonewlines',
      // Informal "du" for German.
      ...(target === 'de' ? {formality: 'prefer_less'} : {}),
    }),
  });
  if (!res.ok) throw new Error(`DeepL: ${res.status} ${await res.text()}`);
  return (await res.json()).translations;
}

// Translates a whole Markdown file. Returns {text, from}.
async function translateFile(text, target) {
  const {fm, body} = splitFrontMatter(text);
  const store = [];
  // Code blocks are never translated.
  const parts = body.split(/(^```[\s\S]*?^```[^\n]*$)/m);
  const prose = [];
  parts.forEach((p, i) => {
    if (i % 2 === 0) prose.push(p);
  });
  const fields = TEXT_FIELDS.filter(f => fmGet(fm, f));
  const inputs = [...fields.map(f => protect(fmGet(fm, f), store)), ...prose.map(p => protect(p, store))];
  const out = await deepl(inputs, target);
  let newFm = fm;
  fields.forEach((f, i) => {
    newFm = fmSet(newFm, f, JSON.stringify(restore(out[i].text, store)));
  });
  let k = fields.length;
  const newBody = parts.map((p, i) => (i % 2 === 0 ? restore(out[k++].text, store) : p)).join('');
  const from = out.at(-1)?.detected_source_language?.toLowerCase().slice(0, 2);
  return {fm: newFm, body: newBody, from};
}

async function detectLanguage(text) {
  const {fm, body} = splitFrontMatter(text);
  const lang = fmGet(fm, 'lang');
  if (lang === 'de' || lang === 'en') return lang;
  if (!key) return 'en';
  const sample = body.replace(/```[\s\S]*?```/g, '').slice(0, 1500);
  const [r] = await deepl([protect(sample, [])], 'en');
  return r.detected_source_language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Images next to a page (./img/x.png) are only in the original folder, so a copy in
// the other folder points to them with @site/... instead.
function fixImages(body, fromRel) {
  return body.replace(/(\]\()(\.{1,2}\/[^)\s]+\.(?:png|jpe?g|gif|svg|webp|avif))/gi, (m, pre, ref) => {
    const abs = path.join(ROOT, path.dirname(fromRel), ref);
    return fs.existsSync(abs) ? `${pre}@site/${path.relative(ROOT, abs).split(path.sep).join('/')}` : m;
  });
}

// ---------- main ----------

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
let changed = 0;
const warnings = [];
const log = msg => console.log(`${dryRun ? '[dry run] ' : ''}${msg}`);

if (!key && !init && !dryRun) {
  console.log('DEEPL_API_KEY is not set, so nothing is translated. Pages that exist in only one');
  console.log('language are shown in that language on both sites.');
  process.exit(0);
}

async function translateInto(srcRel, srcLang, dstRel, dstLang) {
  log(`${srcRel} (${LANG_NAME[srcLang]}) → ${dstRel} (${LANG_NAME[dstLang]})`);
  if (dryRun) return;
  const src = read(srcRel);
  const t = await translateFile(src, dstLang);
  let fm = fmSet(t.fm ?? '', 'translated_from', srcLang);
  fm = fmSet(fm, 'lang', undefined);
  write(dstRel, join(fm, fixImages(t.body, srcRel)));
}

for (const pair of PAIRS) {
  const pages = [...new Set([...listMarkdown(pair.en), ...listMarkdown(pair.de)])].sort();
  for (const page of pages) {
    const enRel = `${pair.en}/${page}`;
    const deRel = `${pair.de}/${page}`;
    const id = `${pair.en}/${page}`;
    let en = read(enRel);
    let de = read(deRel);
    const entry = manifest[id];

    if (init) {
      if (en && de) manifest[id] = {source: entry?.source ?? 'en', en: sha(en), de: sha(de)};
      continue;
    }

    if (en && de) {
      if (!entry) {
        warnings.push(`${id}: both languages exist but were never synced; recorded as they are.`);
        manifest[id] = {source: 'en', en: sha(en), de: sha(de)};
        changed++;
        continue;
      }
      const enChanged = sha(en) !== entry.en;
      const deChanged = sha(de) !== entry.de;
      if (!enChanged && !deChanged) continue;
      const src = entry.source;
      const other = src === 'en' ? 'de' : 'en';
      const srcChanged = src === 'en' ? enChanged : deChanged;
      const otherChanged = src === 'en' ? deChanged : enChanged;
      if (srcChanged && otherChanged) {
        warnings.push(
          `${id}: both the ${LANG_NAME[src]} original and the ${LANG_NAME[other]} translation changed. ` +
            `Nothing was overwritten. Delete ${other === 'en' ? enRel : deRel} to translate it again.`,
        );
        continue;
      }
      if (srcChanged) {
        await translateInto(src === 'en' ? enRel : deRel, src, other === 'en' ? enRel : deRel, other);
      } else {
        log(`${id}: hand-made fix to the ${LANG_NAME[other]} translation kept.`);
      }
    } else if (en && !de) {
      // A page in docs/ (or src/pages/). It is English unless it says or looks German.
      const lang = await detectLanguage(en);
      if (lang === 'de') {
        log(`${enRel} is German: moving it to ${deRel}`);
        if (!dryRun) {
          const {fm, body} = splitFrontMatter(en);
          write(deRel, join(fmSet(fm, 'lang', undefined), fixImages(body, enRel)));
          remove(enRel);
        }
        await translateInto(deRel, 'de', enRel, 'en');
        manifest[id] = {source: 'de'};
      } else {
        await translateInto(enRel, 'en', deRel, 'de');
        manifest[id] = {source: 'en'};
      }
    } else if (de && !en) {
      await translateInto(deRel, 'de', enRel, 'en');
      manifest[id] = {source: 'de'};
    }
    en = read(enRel);
    de = read(deRel);
    if (en && de && !dryRun) manifest[id] = {...manifest[id], en: sha(en), de: sha(de)};
    changed++;
  }
}

// Forget pages that no longer exist.
for (const id of Object.keys(manifest)) {
  if (!PAIRS.some(p => id.startsWith(`${p.en}/`) && read(id) !== undefined)) {
    const pair = PAIRS.find(p => id.startsWith(`${p.en}/`));
    if (!pair || read(`${pair.de}/${id.slice(pair.en.length + 1)}`) === undefined) delete manifest[id];
  }
}

if (!dryRun) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
}
for (const w of warnings) console.warn(`::warning::${w}`);
log(init ? 'Recorded the current pages as in step.' : changed ? `Done, ${changed} page(s) updated.` : 'Everything is already translated.');
