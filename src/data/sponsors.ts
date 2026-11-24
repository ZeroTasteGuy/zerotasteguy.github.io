// Sponsors shown on the homepage.
// Logos live in static/img/sponsors/. Each logo is shown in its own colours in
// light mode. For dark mode, either give a separate `logoDark` file or set
// `invertInDark` for black-only logos (they then show white).
export type Sponsor = {
  name: string;
  what?: string;
  url?: string;
  logo?: string;
  logoDark?: string;
  invertInDark?: boolean;
};

export const sponsors: Sponsor[] = [
  {name: 'Tattu', what: 'Batteries', logo: '/img/sponsors/tattu.svg', invertInDark: true},
  {name: 'Gemfan', what: 'Propellers', logo: '/img/sponsors/gemfan.svg', logoDark: '/img/sponsors/gemfan-dark.svg'},
  {name: 'T-Hobby', what: 'Motors and electronics', logo: '/img/sponsors/t-hobby.svg', invertInDark: true},
  {name: 'Superbrezn', logo: '/img/sponsors/superbrezn.svg'},
  {name: 'Sticky Fingers', logo: '/img/sponsors/sticky-fingers.svg'},
  {name: 'Rotormaniacs', logo: '/img/sponsors/rotormaniacs.webp'},
];
