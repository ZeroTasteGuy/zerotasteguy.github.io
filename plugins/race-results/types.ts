export type RaceResult = {
  slug: string;
  event: string;
  type: 'race' | 'series'; // series = a season total, not counted as a race
  status?: 'provisional' | 'self-reported';
  date: string; // YYYY-MM-DD, YYYY-MM or YYYY
  endDate?: string;
  year: number;
  source: string;
  sourceLabel: string;
  url?: string;
  location?: string;
  country?: string;
  series?: string;
  class?: string;
  position?: number;
  qualifying?: number; // qualifying place
  pilots?: number;
  pilotsPlus?: boolean; // "more than `pilots`"
  bestLap?: number; // seconds
  best3Laps?: number; // seconds
  notes?: string;
  /** German version of notes, shown on the German site. */
  notesDe?: string;
};

export type YearSummary = {
  year: number | 'all';
  races: number;
  wins: number;
  podiums: number;
  bestFinish?: number;
  avgPosition?: number;
  countries: string[];
  series: {slug: string; event: string; position?: number; status?: RaceResult['status']}[];
};

export type ResultsData = {
  results: RaceResult[];
  summaries: YearSummary[];
};
