import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import type {RaceResult} from '@site/plugins/race-results/types';

// 'en' or 'de'. Everything else falls back to English formatting.
export type Lang = 'en' | 'de';

export function useLang(): Lang {
  return useDocusaurusContext().i18n.currentLocale === 'de' ? 'de' : 'en';
}

export function formatTime(seconds?: number, lang: Lang = 'en'): string {
  if (seconds === undefined) return '';
  const out = seconds < 60 ? seconds.toFixed(3) : (() => {
    const m = Math.floor(seconds / 60);
    return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`;
  })();
  return lang === 'de' ? out.replace('.', ',') : out;
}

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'],
};

const day = (d: string, lang: Lang) => (lang === 'de' ? `${Number(d)}.` : String(Number(d)));

// Accepts 2026-05-17, 2026-05 or 2026.
export function formatDate(date: string, lang: Lang = 'en'): string {
  const [y, m, d] = date.split('-');
  if (!m) return y;
  if (!d) return `${MONTHS[lang][Number(m) - 1]} ${y}`;
  return `${day(d, lang)} ${MONTHS[lang][Number(m) - 1]} ${y}`;
}

export function formatDates(r: RaceResult, lang: Lang = 'en'): string {
  if (r.type === 'series') return `${lang === 'de' ? 'Saison' : 'Season'} ${r.year}`;
  if (!r.endDate || r.endDate === r.date) return formatDate(r.date, lang);
  const [y1, m1, d1] = r.date.split('-');
  const [y2, m2, d2] = r.endDate.split('-');
  if (d1 && d2 && y1 === y2 && m1 === m2) return `${day(d1, lang)}–${formatDate(r.endDate, lang)}`;
  return `${formatDate(r.date, lang)} – ${formatDate(r.endDate, lang)}`;
}

export function formatPosition(position?: number, pilots?: number, plus?: boolean, lang: Lang = 'en'): string {
  if (position === undefined) return '';
  const n = pilots?.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US');
  return pilots ? `${position} / ${n}${plus ? '+' : ''}` : String(position);
}

export function medal(position?: number): string {
  return position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
}

export function statusLabel(status: string): string {
  return status === 'provisional'
    ? translate({id: 'results.status.provisional', message: 'Provisional'})
    : translate({id: 'results.status.selfReported', message: 'Unconfirmed'});
}

export function ordinal(n: number, lang: Lang = 'en'): string {
  if (lang === 'de') return `${n}.`;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Country names are written in English in the results files.
const COUNTRIES_DE: Record<string, string> = {
  Germany: 'Deutschland',
  Austria: 'Österreich',
  Switzerland: 'Schweiz',
  Belgium: 'Belgien',
  Italy: 'Italien',
  France: 'Frankreich',
  Netherlands: 'Niederlande',
  Poland: 'Polen',
  Czechia: 'Tschechien',
  'Czech Republic': 'Tschechien',
  Spain: 'Spanien',
  Denmark: 'Dänemark',
  Slovenia: 'Slowenien',
  Hungary: 'Ungarn',
  Luxembourg: 'Luxemburg',
  'United Kingdom': 'Vereinigtes Königreich',
  'United States': 'USA',
  USA: 'USA',
  Online: 'Online',
};

export function countryName(country: string | undefined, lang: Lang): string | undefined {
  if (!country || lang !== 'de') return country;
  return COUNTRIES_DE[country] ?? country;
}
