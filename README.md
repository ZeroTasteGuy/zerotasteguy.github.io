# maxd.ax

Source of [maxd.ax](https://maxd.ax), built with [Docusaurus](https://docusaurus.io/).

## Layout

- `src/pages/`: homepage, Tools, Race results and About pages.
- `docs/`: documentation (sidebar is generated from the folders). `docs/projects/` holds the project write-ups, their images are in `docs/projects/img/`.
- `static/`: files served as they are. `static/vltl/` is the Video Lap Tracking Lab app, so edit VLTL there.
- `src/css/custom.css`: colours and site-wide styles.
- `docusaurus.config.ts`: navbar, footer and social links.

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
