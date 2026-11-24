export type RaceResult = {
  slug: string;
  event: string;
  date: string; // YYYY-MM-DD
  year: number;
  source: string;
  sourceLabel: string;
  url?: string;
  location?: string;
  country?: string;
  series?: string;
  class?: string;
  position?: number;
  pilots?: number;
  bestLap?: number; // seconds
  best3Laps?: number; // seconds
  notes?: string;
};

export type YearSummary = {
  year: number | 'all';
  races: number;
  wins: number;
  podiums: number;
  bestFinish?: number;
  avgPosition?: number;
  countries: string[];
};

export type ResultsData = {
  results: RaceResult[];
  summaries: YearSummary[];
};
