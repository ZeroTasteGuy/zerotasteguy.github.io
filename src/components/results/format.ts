export function formatTime(seconds?: number): string {
  if (seconds === undefined) return '';
  if (seconds < 60) return seconds.toFixed(3);
  const m = Math.floor(seconds / 60);
  return `${m}:${(seconds - m * 60).toFixed(3).padStart(6, '0')}`;
}

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatPosition(position?: number, pilots?: number): string {
  if (position === undefined) return '';
  return pilots ? `${position} / ${pilots}` : String(position);
}

export function medal(position?: number): string {
  return position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
}
