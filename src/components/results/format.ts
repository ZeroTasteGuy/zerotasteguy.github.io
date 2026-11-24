import type {RaceResult} from '@site/plugins/race-results/types';

export function formatTime(seconds?: number): string {
  if (seconds === undefined) return '';
  if (seconds < 60) return seconds.toFixed(3);
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Accepts 2026-05-17, 2026-05 or 2026.
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  if (!m) return y;
  if (!d) return `${MONTHS[Number(m) - 1]} ${y}`;
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function formatDates(r: RaceResult): string {
  if (r.type === 'series') return `Season ${r.year}`;
  if (!r.endDate || r.endDate === r.date) return formatDate(r.date);
  const [y1, m1, d1] = r.date.split('-');
  const [y2, m2, d2] = r.endDate.split('-');
  if (d1 && d2 && y1 === y2 && m1 === m2) return `${Number(d1)}–${formatDate(r.endDate)}`;
  return `${formatDate(r.date)} – ${formatDate(r.endDate)}`;
}

export function formatPosition(position?: number, pilots?: number, plus?: boolean): string {
  if (position === undefined) return '';
  return pilots ? `${position} / ${pilots.toLocaleString('en-US')}${plus ? '+' : ''}` : String(position);
}

export function medal(position?: number): string {
  return position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
}

export const STATUS_LABEL: Record<string, string> = {
  provisional: 'Provisional',
  'self-reported': 'Unconfirmed',
};

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
