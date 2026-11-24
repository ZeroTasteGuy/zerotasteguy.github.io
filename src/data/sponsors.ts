// Sponsors shown on the homepage.
// To add a logo: put the file in static/img/sponsors/ and set `logo` to its path,
// e.g. '/img/sponsors/tattu.svg'. Logos should look good on a dark gray background
// (a white or light version works best). Without a logo the name is shown instead.
export type Sponsor = {
  name: string;
  what: string;
  url?: string;
  logo?: string;
};

export const sponsors: Sponsor[] = [
  {name: 'Tattu', what: 'Batteries'},
  {name: 'Gemfan', what: 'Propellers'},
  {name: 'T-Hobby', what: 'Motors and electronics'},
  {name: 'Superbrezn', what: ''},
  {name: 'Sticky Fingers', what: ''},
];
