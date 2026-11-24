# maxd.ax

Source of [maxd.ax](https://maxd.ax), built with [Docusaurus](https://docusaurus.io/).

## Layout

- `src/pages/`: homepage, Tools, Race results and About pages.
- `docs/`: documentation (sidebar is generated from the folders).
- `static/`: files served as they are. `static/vltl/` is the Video Lap Tracking Lab app, so edit VLTL there.
- `src/css/custom.css`: colours and site-wide styles.
- `docusaurus.config.ts`: navbar, footer and social links.
- `i18n/de/`: the German site (served under `/de/`), see below.

## Work on it locally

```sh
npm install
npm start          # dev server at http://localhost:3000
npm run build      # production build into build/
npm run serve      # serve the production build (static/ pages like /vltl/ work here)
```

## Deploy

Every push to `main` builds the site and deploys it with GitHub Actions
(`.github/workflows/deploy.yml`). In the repo's Settings → Pages, the source must be set to **GitHub Actions**.

To add a tool: put it in `static/<name>/`, then add it to `src/pages/tools/index.tsx` and to the Tools dropdown in `docusaurus.config.ts`.

## English and German

The site is in English at `/` and in German at `/de/`, with a language switch in the navbar
(Docusaurus i18n). Both are built and deployed together.

- **Docs and Markdown pages** (`docs/`, `src/pages/*.mdx`): the German version of `docs/x.md` is
  `i18n/de/docusaurus-plugin-content-docs/current/x.md`, of `src/pages/x.mdx` it is
  `i18n/de/docusaurus-plugin-content-pages/x.mdx`. A page that only exists in one language is
  shown in that language on both sites.
- **Homepage, Tools page, race results labels**: English text is in the `.tsx` files, German in
  `i18n/de/code.json`. Navbar and footer labels are in `i18n/de/docusaurus-theme-classic/`.
- **Race results**: one file for both languages. `notes_de` holds the German note.

### Write in any language

Write a new page in English or German, and the other language is created for you:

- English: put it in `docs/` as usual.
- German: put it in `docs/` with `lang: de` in the front matter (or straight into the German folder).

After you push to `main`, the **Translate new pages** workflow (`.github/workflows/translate.yml`)
runs `scripts/translate.mjs`. It translates new and changed pages, moves German originals into the
German folder, commits that to `main` and deploys again. Translated pages show a small
"automatically translated" note. If you change the page you wrote, the translation is redone; if
you fix the translation by hand, your fix is kept.

The translation uses [Opus-MT](https://github.com/Helsinki-NLP/Opus-MT), open-source translation
models from the University of Helsinki, run with
[transformers.js](https://github.com/huggingface/transformers.js) right on the GitHub runner.
No account, key or paid service is needed. It is machine translation, so check the result: it
uses the formal "Sie", and it can get FPV words wrong. Names and terms that must not be translated
(or always translated the same way) go in `i18n/glossary.json`.

To run it on your computer (downloads about 800 MB of models once, into `.cache/`):

```sh
npm install --no-save @huggingface/transformers@4.3.2
npm run translate              # add -- --dry-run to only see what it would do
```
