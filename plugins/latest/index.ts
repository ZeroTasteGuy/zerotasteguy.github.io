// Picks the newest content for the "Latest" sections on the homepage, at build time.
// Runs after every other plugin has loaded its content, so it sees the docs (already
// translated for the language being built) and the race results, and hands the result
// to the homepage as global data. Nothing here needs editing when content is added.
//
// Date of a docs page: `date: 2026-11-24` in its front matter if set, otherwise the day
// the English file was first committed to git. Pages that should never show up can set
// `hide_from_latest: true`. The docs landing page and category overview pages are skipped.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {LoadContext, Plugin} from '@docusaurus/types';
import type {RaceResult, ResultsData} from '../race-results/types';

export type LatestDoc = {
  id: string;
  title: string;
  description?: string;
  permalink: string;
  category?: string;
  date: string; // YYYY-MM-DD
};

// The race results as the race-results plugin reads them.
export type LatestRace = RaceResult;

export type LatestData = {docs: LatestDoc[]; races: LatestRace[]};

const DOC_COUNT = 3;
const RACE_COUNT = 3;

// Minimal shapes of the loaded docs content that this plugin reads.
type LoadedDoc = {
  id: string;
  title: string;
  description?: string;
  permalink: string;
  slug: string;
  unlisted?: boolean;
  draft?: boolean;
  sidebarPosition?: number;
  frontMatter: Record<string, unknown>;
};
type SidebarItem = {type: string; label?: string; id?: string; items?: SidebarItem[]; link?: {type: string; id?: string}};
type LoadedDocsContent = {
  loadedVersions: {versionName: string; docs: LoadedDoc[]; sidebars: Record<string, SidebarItem[]>}[];
};

// Doc id -> the label of the sidebar category it sits in (translated), plus the ids of
// docs that are a category's overview page.
function walkSidebar(items: SidebarItem[], parent: string | undefined, out: Map<string, string>, overviews: Set<string>) {
  for (const item of items) {
    if (item.type === 'category') {
      if (item.link?.type === 'doc' && item.link.id) overviews.add(item.link.id);
      walkSidebar(item.items ?? [], item.label, out, overviews);
    } else if (item.type === 'doc' && item.id && parent) {
      out.set(item.id, parent);
    }
  }
}

function toDay(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return undefined;
}

export default function latestPlugin(context: LoadContext): Plugin {
  const gitCache = new Map<string, string | undefined>();

  // Day the English source of a doc was first committed. German pages use the
  // English file's date, so both languages list the same pages.
  function addedDate(docId: string): string | undefined {
    if (gitCache.has(docId)) return gitCache.get(docId);
    const base = path.join(context.siteDir, 'docs', docId);
    const file = ['.md', '.mdx'].map(ext => base + ext).find(f => fs.existsSync(f));
    let date: string | undefined;
    if (file) {
      try {
        const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%cs', '--', file], {
          cwd: context.siteDir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        date = out.split('\n').filter(Boolean).pop();
      } catch {
        // Not a git checkout: fall back to the file's modification time below.
      }
      date ??= fs.statSync(file).mtime.toISOString().slice(0, 10);
    }
    gitCache.set(docId, date);
    return date;
  }

  return {
    name: 'latest',
    async allContentLoaded({allContent, actions}) {
      const docsContent = allContent['docusaurus-plugin-content-docs']?.default as LoadedDocsContent | undefined;
      const version = docsContent?.loadedVersions.find(v => v.versionName === 'current') ?? docsContent?.loadedVersions[0];
      const categories = new Map<string, string>();
      const overviews = new Set<string>();
      for (const items of Object.values(version?.sidebars ?? {})) walkSidebar(items, undefined, categories, overviews);

      const docs: (LatestDoc & {order: number})[] = [];
      for (const d of version?.docs ?? []) {
        if (d.unlisted || d.draft || d.slug === '/' || overviews.has(d.id)) continue;
        if (d.frontMatter.hide_from_latest === true) continue;
        const date = toDay(d.frontMatter.date) ?? addedDate(d.id);
        if (!date) continue;
        docs.push({
          id: d.id,
          title: d.title,
          description: d.description || undefined,
          permalink: d.permalink,
          category: categories.get(d.id),
          date,
          order: d.sidebarPosition ?? 999,
        });
      }
      // Newest first; pages added the same day keep their sidebar order.
      docs.sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order || a.id.localeCompare(b.id));

      const results = (allContent['race-results']?.default as ResultsData | undefined)?.results ?? [];
      const races: LatestRace[] = results
        .filter(r => r.type === 'race')
        .sort((a, b) => (b.endDate ?? b.date).localeCompare(a.endDate ?? a.date))
        .slice(0, RACE_COUNT);
      const data: LatestData = {docs: docs.slice(0, DOC_COUNT).map(({order, ...d}) => d), races};
      actions.setGlobalData(data);
    },
  };
}
