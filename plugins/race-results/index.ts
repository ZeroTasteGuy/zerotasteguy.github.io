// Reads the race results in /results (one YAML file per race), checks them,
// and creates the /results/ page plus one page per race.
// A file with a mistake stops the build with a message naming the file and
// the field, so a typo never reaches the live site.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type {LoadContext, Plugin} from '@docusaurus/types';
import {SOURCES} from './sources';
import type {RaceResult, ResultsData, YearSummary} from './types';

const FIELDS = [
  'event', 'type', 'status', 'date', 'end_date', 'source', 'url', 'location', 'country', 'series',
  'class', 'qualifying', 'position', 'pilots', 'best_lap', 'best_3_laps', 'notes',
];

// Accepts 18.432, "18.432" or "1:02.345" and returns seconds.
function parseTime(value: unknown, field: string, fail: (m: string) => never): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && value > 0) return value;
  if (typeof value === 'string') {
    const m = value.trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
    if (m) return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
  }
  return fail(`"${field}" must be a time in seconds like 18.432 or 1:02.345, got "${value}"`);
}

function parseInt(value: unknown, field: string, fail: (m: string) => never): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  return fail(`"${field}" must be a whole number above 0, got "${value}"`);
}

function optString(value: unknown, field: string, fail: (m: string) => never): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fail(`"${field}" must be text`);
}

const TYPES = ['race', 'series'];
const STATUSES = ['provisional', 'self-reported'];

// Full date (2026-05-17), or only month (2026-05) or year (2026) when the day is unknown.
function checkDate(value: string, field: string, fail: (m: string) => never): string {
  const ok = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value) && !Number.isNaN(Date.parse(value));
  return ok ? value : fail(`"${field}" must look like 2026-05-17 (or 2026-05, or just 2026), got "${value}"`);
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return /\.ya?ml$/i.test(entry.name) ? [full] : [];
  });
}

export function readResult(file: string, root: string): RaceResult {
  const rel = path.relative(root, file);
  const fail = (message: string): never => {
    throw new Error(`Race results: ${rel}: ${message}`);
  };
  let raw: unknown;
  try {
    // JSON schema keeps dates as plain text, so "2026-05-17" stays "2026-05-17".
    raw = yaml.load(fs.readFileSync(file, 'utf8'), {schema: yaml.JSON_SCHEMA});
  } catch (e) {
    fail(`not valid YAML (${(e as Error).message.split('\n')[0]})`);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('expected fields like "event: ..." and "date: ..."');
  const d = raw as Record<string, unknown>;

  for (const key of Object.keys(d)) {
    if (!FIELDS.includes(key)) fail(`unknown field "${key}". Allowed: ${FIELDS.join(', ')}`);
  }
  const event = optString(d.event, 'event', fail) ?? fail('"event" (the race name) is missing');
  const type = (optString(d.type, 'type', fail) ?? 'race') as RaceResult['type'];
  if (!TYPES.includes(type)) fail(`"type" must be one of: ${TYPES.join(', ')}. Got "${type}"`);
  const status = optString(d.status, 'status', fail) as RaceResult['status'];
  if (status && !STATUSES.includes(status)) fail(`"status" must be one of: ${STATUSES.join(', ')}. Got "${status}"`);
  const date = checkDate(optString(d.date, 'date', fail) ?? fail('"date" is missing'), 'date', fail);
  const endDate = d.end_date === undefined ? undefined : checkDate(optString(d.end_date, 'end_date', fail) ?? '', 'end_date', fail);
  if (endDate && endDate < date) fail('"end_date" is before "date"');
  const source = optString(d.source, 'source', fail) ?? 'manual';
  if (!(source in SOURCES)) fail(`"source" must be one of: ${Object.keys(SOURCES).join(', ')}. Got "${source}"`);
  const url = optString(d.url, 'url', fail);
  if (url && !/^https?:\/\//.test(url)) fail(`"url" must start with https://, got "${url}"`);
  const position = parseInt(d.position, 'position', fail);
  const qualifying = parseInt(d.qualifying, 'qualifying', fail);
  // "1100+" means "more than 1100".
  const pilotsPlus = typeof d.pilots === 'string' && /^\d+\+$/.test(d.pilots.trim());
  const pilots = parseInt(pilotsPlus ? Number((d.pilots as string).trim().slice(0, -1)) : d.pilots, 'pilots', fail);
  if (position && pilots && position > pilots) fail(`"position" (${position}) is higher than "pilots" (${pilots})`);

  const slug = path.basename(file).replace(/\.ya?ml$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return {
    slug,
    event,
    type,
    status,
    date,
    endDate,
    year: Number(date.slice(0, 4)),
    source,
    sourceLabel: SOURCES[source],
    url,
    location: optString(d.location, 'location', fail),
    country: optString(d.country, 'country', fail),
    series: optString(d.series, 'series', fail),
    class: optString(d.class, 'class', fail),
    position,
    qualifying,
    pilots,
    pilotsPlus: pilotsPlus || undefined,
    bestLap: parseTime(d.best_lap, 'best_lap', fail),
    best3Laps: parseTime(d.best_3_laps, 'best_3_laps', fail),
    notes: optString(d.notes, 'notes', fail),
  };
}

export function summarize(all: RaceResult[], year: number | 'all'): YearSummary {
  // Series totals are listed on their own and don't count as races.
  const results = all.filter(r => r.type === 'race');
  const placed = results.map(r => r.position).filter((p): p is number => p !== undefined);
  return {
    year,
    races: results.length,
    wins: placed.filter(p => p === 1).length,
    podiums: placed.filter(p => p <= 3).length,
    bestFinish: placed.length ? Math.min(...placed) : undefined,
    avgPosition: placed.length ? placed.reduce((a, b) => a + b, 0) / placed.length : undefined,
    countries: [...new Set(results.map(r => r.country).filter((c): c is string => !!c))].sort(),
    series: all
      .filter(r => r.type === 'series')
      .map(r => ({slug: r.slug, event: r.event, position: r.position, status: r.status})),
  };
}

export function loadResults(siteDir: string): ResultsData {
  const dir = path.join(siteDir, 'results');
  const results = listFiles(dir).map(f => readResult(f, siteDir));
  const seen = new Map<string, string>();
  for (const r of results) {
    if (seen.has(r.slug)) throw new Error(`Race results: two files are named "${r.slug}". Give one a different name.`);
    seen.set(r.slug, r.slug);
  }
  // Newest year first; within a year, series totals go last, then dated races before
  // ones with only a month or year.
  results.sort(
    (a, b) =>
      b.year - a.year ||
      Number(a.type === 'series') - Number(b.type === 'series') ||
      b.date.localeCompare(a.date) ||
      a.event.localeCompare(b.event),
  );
  const years = [...new Set(results.map(r => r.year))].sort((a, b) => b - a);
  const summaries = years.map(y => summarize(results.filter(r => r.year === y), y));
  if (years.length > 1) summaries.unshift(summarize(results, 'all'));
  return {results, summaries};
}

export default function raceResultsPlugin(context: LoadContext): Plugin {
  return {
    name: 'race-results',
    getPathsToWatch() {
      return [path.join(context.siteDir, 'results/**/*.{yml,yaml}')];
    },
    async loadContent() {
      return loadResults(context.siteDir);
    },
    async contentLoaded({content: loaded, actions}) {
      const content = loaded as ResultsData;
      const dataPath = await actions.createData('results.json', JSON.stringify(content));
      actions.addRoute({
        path: '/results/',
        component: '@site/src/components/results/ResultsPage.tsx',
        exact: true,
        modules: {data: dataPath},
      });
      for (const r of content.results) {
        const eventPath = await actions.createData(`result-${r.slug}.json`, JSON.stringify(r));
        actions.addRoute({
          path: `/results/${r.slug}/`,
          component: '@site/src/components/results/EventPage.tsx',
          exact: true,
          modules: {result: eventPath},
        });
      }
    },
  };
}
