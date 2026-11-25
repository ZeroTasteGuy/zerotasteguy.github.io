import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import raceResults from './plugins/race-results';
import latest from './plugins/latest';

const config: Config = {
  title: 'maxd.ax',
  tagline: 'FPV tools, documentation and race results',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://maxd.ax',
  baseUrl: '/',
  trailingSlash: true,

  organizationName: 'ZeroTasteGuy',
  projectName: 'zerotasteguy.github.io',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en'},
      de: {label: 'Deutsch', htmlLang: 'de'},
    },
  },

  // latest: picks the newest docs and race results for the homepage.
  plugins: [raceResults, latest],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/ZeroTasteGuy/zerotasteguy.github.io/tree/main/',
          // German pages link to their own file in i18n/de/.
          editLocalizedFiles: true,
        },
        blog: false,
        sitemap: {
          // Hand-made pages in static/ are not known to Docusaurus, so list them here.
          // (The VLTL test build stays out; see robots.txt.)
          createSitemapItems: async ({defaultCreateSitemapItems, ...params}) => {
            const items = await defaultCreateSitemapItems(params);
            return [...items, {url: 'https://maxd.ax/vltl/', changefreq: 'weekly', priority: 0.5}];
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'maxd.ax',
      items: [
        {
          type: 'dropdown',
          label: 'Tools',
          to: '/tools/',
          position: 'left',
          items: [
            {label: 'All tools', to: '/tools/'},
            {label: 'Video Lap Tracking Lab', href: 'pathname:///vltl/', target: '_self'},
          ],
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/results/', label: 'Race results', position: 'left'},
        {to: '/about/', label: 'About me', position: 'left'},
        {type: 'localeDropdown', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Site',
          items: [
            {label: 'Tools', to: '/tools/'},
            {label: 'Docs', to: '/docs/'},
            {label: 'Race results', to: '/results/'},
            {label: 'About', to: '/about/'},
          ],
        },
        {
          title: 'Follow',
          items: [
            {label: 'YouTube', href: 'https://www.youtube.com/@maxdax_fpv'},
            {label: 'Instagram', href: 'https://www.instagram.com/maxdax_fpv/'},
            {label: 'GitHub', href: 'https://github.com/ZeroTasteGuy'},
            {
              html: '<span class="footer__link-item" title="Discord username">Discord: ZeroTasteGuy</span>',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} maxd.ax`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
