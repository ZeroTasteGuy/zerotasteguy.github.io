// Sponsors shown in the scrolling logo strip on the homepage.
// Logos live in static/img/sponsors/. Each logo is shown in its own colours in
// light mode. For dark mode, either give a separate `logoDark` file or set
// `invertInDark` for black-only logos (they then show white).
export type Sponsor = {
  name: string;
  url?: string;
  logo?: string;
  logoDark?: string;
  invertInDark?: boolean;
};

export const sponsors: Sponsor[] = [
  {name: 'Tattu', url: 'https://gensace.de/', logo: '/img/sponsors/tattu.svg', invertInDark: true},
  {name: 'Gemfan', url: 'https://www.gemfanhobby.com/', logo: '/img/sponsors/gemfan.svg', logoDark: '/img/sponsors/gemfan-dark.svg'},
  {name: 'T-Hobby', url: 'https://www.t-hobby.com/', logo: '/img/sponsors/t-hobby.svg', invertInDark: true},
  {name: 'Superbrezn', url: 'https://www.instagram.com/superbrezn/', logo: '/img/sponsors/superbrezn.svg'},
  {name: 'Sticky Fingers', logo: '/img/sponsors/sticky-fingers.svg'},
  {name: 'Rotormaniacs', url: 'https://www.instagram.com/rotormaniacs/', logo: '/img/sponsors/rotormaniacs.webp'},
];
