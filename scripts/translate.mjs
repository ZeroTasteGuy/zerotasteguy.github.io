#!/usr/bin/env node
// Keeps the English and German versions of the docs and Markdown pages in step.
//
// Write a page in English or German, then run this script (GitHub runs it for you
// after every push to main, see .github/workflows/translate.yml). It creates the
// missing language with Opus-MT, an open-source translation model that runs locally:
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
// Usage: npm install --no-save @huggingface/transformers@4.3.2   (once)
//        node scripts/translate.mjs [--dry-run] [--init]
//   --init     only record the current files as in step (no translating)
//   --dry-run  show what would happen without translating or writing files

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

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const init = args.has('--init');

const sha = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
const read = rel => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), 'utf8') : undefined);
function write(rel, text) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), {recursive: true});
  fs.writeFileSync(path.join(ROOT, rel), text);
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

// ---------- Markdown → Opus-MT → Markdown ----------
// The translation runs on this computer (or the GitHub runner) with the open-source
// Opus-MT models from the University of Helsinki (MarianMT, CC-BY 4.0), through
// transformers.js. No account or key is needed. The models (about 100 MB each) are
// downloaded once into .cache/opus-mt/.
//
// The models translate plain sentences, so the file is translated line by line:
// code blocks, front matter keys, list and heading markers and table borders stay as
// they are, and everything inside a line that is not prose (code, link targets, JSX,
// HTML tags, URLs) is swapped for a token like <x1/> that the model copies through.
// If a token gets lost, that line is kept in the original language and reported.

const MODELS = {de: 'Xenova/opus-mt-en-de', en: 'Xenova/opus-mt-de-en'};

// Things inside a line that are never translated. Each becomes a token like <x1/>.
const PROTECT = [
  /<!--[\s\S]*?-->/g, // comments
  /\{[^{}\n]*(?:\{[^{}\n]*\}[^{}\n]*)*\}/g, // JSX expressions like {/* #font */} or {'text'}
  /<\/?[A-Za-z][^<>]*>/g, // HTML / JSX tags
  /`[^`\n]+`/g, // inline code
  /https?:\/\/[^\s)<>]+/g, // bare URLs
];
// Formatting around words: the words are translated, the formatting is kept.
// Each becomes a pair like <p1>words</p1>.
const PAIRED = [
  [/!\[([^\]\n]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g, (text, url) => ['![', `](${url})`]], // images
  [/(?<!!)\[([^\]\n]+)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g, (text, url) => ['[', `](${url})`]], // links
  [/\*\*([^*\n]+?)\*\*/g, () => ['**', '**']], // bold
  [/(?<![\w*])\*([^*\n]+?)\*(?![\w*])/g, () => ['*', '*']], // italics
  [/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, () => ['_', '_']], // italics
];
// Whole lines that are never translated.
const KEEP_LINE = [
  /^\s*$/,
  /^(?:import|export) /, // MDX imports
  /^:::\w*\s*$/, // admonition markers without a title
  /^\s*(?:---|\*\*\*|___)\s*$/, // horizontal rules
  /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-*:?\s*$/, // table header separators
];

// Names and terms with a fixed translation (or none), from i18n/glossary.json.
const GLOSSARY = (() => {
  const file = path.join(ROOT, 'i18n/glossary.json');
  const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).terms : [];
  return list.sort((a, b) => Math.max(b.en.length, b.de.length) - Math.max(a.en.length, a.de.length));
})();
const escapeRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let pipelines = {};
async function translator(target) {
  if (!pipelines[target]) {
    let tf;
    try {
      tf = await import('@huggingface/transformers');
    } catch {
      throw new Error(
        'The translator is not installed. Run: npm install --no-save @huggingface/transformers@4.3.2',
      );
    }
    tf.env.cacheDir = path.join(ROOT, '.cache/opus-mt');
    log(`Loading ${MODELS[target]} (downloaded once, then cached)...`);
    pipelines[target] = await tf.pipeline('translation', MODELS[target], {dtype: 'fp32'});
  }
  return pipelines[target];
}

// Turns a piece of Markdown into plain text with tokens, and back.
function mask(text, target) {
  const from = target === 'de' ? 'en' : 'de';
  const store = [];
  const put = v => {
    store.push(v);
    return `\u0000${store.length - 1}\u0000`;
  };
  let out = text;
  for (const re of PROTECT) out = out.replace(re, put);
  const pairs = [];
  for (const [re, wrap] of PAIRED) {
    out = out.replace(re, (m, inner, ...rest) => {
      pairs.push(wrap(inner, ...rest));
      return `\u0001${pairs.length}\u0001${inner}\u0002${pairs.length}\u0002`;
    });
  }
  for (const term of GLOSSARY) {
    out = out.replace(new RegExp(`(?<![\\p{L}\\d-])${escapeRe(term[from])}(?![\\p{L}\\d-])`, 'giu'), (m, at) =>
      // At the start of a line ("## Batteries") the term is capitalised.
      put(at === 0 ? term[target][0].toUpperCase() + term[target].slice(1) : term[target]),
    );
  }
  // Number the tokens 1, 2, 3 in reading order.
  const atoms = [];
  out = out
    .replace(/\u0000(\d+)\u0000/g, (_, n) => {
      atoms.push(Number(n));
      return `<x${atoms.length}/>`;
    })
    .replace(/\u0001(\d+)\u0001/g, '<p$1>')
    .replace(/\u0002(\d+)\u0002/g, '</p$1>');
  const unstore = t => {
    let r = t;
    for (let i = 0; i < 20 && /\u0000\d+\u0000/.test(r); i++) r = r.replace(/\u0000(\d+)\u0000/g, (_, n) => store[Number(n)]);
    return r;
  };
  // Keep <kbd>F6</kbd> tight: no space after an opening tag or before a closing tag
  // where the original has none.
  const tight = [];
  out.replace(/<x(\d+)\/>/g, (tok, k, i, str) => {
    const raw = store[atoms[k - 1]];
    tight[k] = {
      before: /^<\//.test(raw) && i > 0 && !/\s/.test(str[i - 1]),
      after: /^<[A-Za-z][^>]*[^/]>$/.test(raw) && i + tok.length < str.length && !/\s/.test(str[i + tok.length]),
    };
    return tok;
  });
  return {
    masked: out,
    // Every token must come back exactly once, or the line is not used.
    check: t =>
      atoms.every((_, i) => t.split(`<x${i + 1}/>`).length === 2) &&
      pairs.every((_, i) => t.split(`<p${i + 1}>`).length === 2 && t.split(`</p${i + 1}>`).length === 2),
    unmask: t => {
      let r = t;
      for (const [k, sp] of tight.entries()) {
        if (!sp) continue;
        if (sp.before) r = r.replace(new RegExp(`\\s+<x${k}/>`), `<x${k}/>`);
        if (sp.after) r = r.replace(new RegExp(`<x${k}/>\\s+`), `<x${k}/>`);
      }
      r = r.replace(/<x(\d+)\s*\/>/g, (_, k) => `\u0000${atoms[Number(k) - 1]}\u0000`);
      for (let i = pairs.length; i >= 1; i--) {
        r = r.replace(new RegExp(`<p${i}>\\s*([\\s\\S]*?)\\s*</p${i}>`), (_, inner) => pairs[i - 1][0] + inner + pairs[i - 1][1]);
      }
      return unstore(r);
    },
  };
}

const looped = t => /([^\s\w])\1{4,}|\b(\w+)\b(?:\W+\2\b){3,}/u.test(t.replace(/<\/?[xp]\d+\/?>/g, ''));
const hasProse = t => /\p{L}{2,}/u.test(t.replace(/<\/?[xp]\d+\/?>/g, ''));
// Splits after . ! ? followed by a space and a capital letter, a token or a quote.
const sentences = t => t.split(/(?<=[.!?])\s+(?=[\p{Lu}<"„(])/u);

// Collects every piece of prose in a file, translates them in batches, then
// puts the file back together.
class Job {
  constructor(target) {
    this.target = target;
    this.units = [];
    this.out = [];
  }
  // Adds a piece of text; returns a function that gives back its translation.
  add(text) {
    const core = text.trim();
    const m = mask(core, this.target);
    if (!core) return () => text;
    // Nothing to translate, but glossary terms may still change.
    if (!hasProse(m.masked)) return () => text.replace(core, m.unmask(m.masked));
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    // Tokens at the start or end of the line (like <small> ... </small>) stay outside.
    const head = m.masked.match(/^(?:\s*<x\d+\/>)+\s*/)?.[0] ?? '';
    const rest = m.masked.slice(head.length);
    const tail = rest.match(/\s*(?:<x\d+\/>\s*)+$/)?.[0] ?? '';
    const middle = rest.slice(0, rest.length - tail.length);
    const parts = sentences(middle).map(s => this.units.push(s) - 1);
    return () => {
      const joined = head + parts.map(i => this.out[i]).join(' ') + tail;
      // A broken translation (lost tokens, or the model repeating itself) is not used.
      if (!m.check(joined) || (looped(joined) && !looped(m.masked))) {
        warnings.push(`Kept in the original language (formatting got lost): ${core.slice(0, 80)}`);
        return text;
      }
      return lead + m.unmask(joined) + trail;
    };
  }
  async run() {
    if (!this.units.length) return;
    const t = await translator(this.target);
    // One sentence at a time: batching pads the inputs, which makes these models
    // produce garbage for the shorter sentences.
    for (const [i, unit] of this.units.entries()) {
      const [r] = await t(unit, {max_new_tokens: Math.min(512, 2 * unit.length + 20)});
      this.out[i] = r.translation_text;
    }
  }
}

function addLine(job, line) {
  if (KEEP_LINE.some(re => re.test(line))) return () => line;
  // Admonition with a title, like :::note[Title]
  const adm = line.match(/^(:::\w+\[)(.*)(\]\s*)$/);
  if (adm) {
    const f = job.add(adm[2]);
    return () => adm[1] + f() + adm[3];
  }
  // Table rows: each cell on its own.
  if (/^\s*\|.*\|\s*$/.test(line)) {
    const cells = line.split('|');
    const fs_ = cells.map((c, i) => (i === 0 || i === cells.length - 1 ? () => c : job.add(c)));
    return () => fs_.map(f => f()).join('|');
  }
  // List, heading and quote markers stay as they are.
  const m = line.match(/^(\s*(?:(?:[-*+]|\d+\.|#{1,6}|>)\s+)*)(.*)$/);
  const f = job.add(m[2]);
  return () => m[1] + f();
}

// Translates a whole Markdown file into `target` ('en' or 'de').
async function translateFile(text, target) {
  const {fm, body} = splitFrontMatter(text);
  const job = new Job(target);
  const fields = TEXT_FIELDS.filter(f => fmGet(fm, f)).map(f => [f, job.add(fmGet(fm, f))]);
  let inCode = false;
  const lines = body.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      inCode = !inCode;
      return () => line;
    }
    return inCode ? () => line : addLine(job, line);
  });
  await job.run();
  let newFm = fm;
  for (const [f, get] of fields) newFm = fmSet(newFm, f, JSON.stringify(get()));
  return {fm: newFm, body: lines.map(f => f()).join('\n')};
}

// A page is German if it says `lang: de`, or if it has more common German words
// than English ones.
function detectLanguage(text) {
  const {fm, body} = splitFrontMatter(text);
  const lang = fmGet(fm, 'lang');
  if (lang === 'de' || lang === 'en') return lang;
  const words = body.replace(/```[\s\S]*?```/g, '').toLowerCase().match(/\p{L}+/gu) ?? [];
  const count = list => words.filter(w => list.includes(w)).length;
  const de = count(['der', 'die', 'das', 'und', 'ist', 'nicht', 'ich', 'du', 'mit', 'für', 'auf', 'ein', 'eine', 'den', 'dem', 'zu', 'auch', 'wenn']);
  const en = count(['the', 'and', 'is', 'not', 'you', 'with', 'for', 'on', 'a', 'an', 'to', 'of', 'it', 'if', 'this', 'your']);
  return de > en ? 'de' : 'en';
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
      const lang = detectLanguage(en);
      if (lang === 'de') {
        // Translate first (nothing is written if that fails), then move the German original.
        await translateInto(enRel, 'de', enRel, 'en');
        log(`${enRel} was German: original moved to ${deRel}`);
        const {fm, body} = splitFrontMatter(en);
        write(deRel, join(fmSet(fm, 'lang', undefined), fixImages(body, enRel)));
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
