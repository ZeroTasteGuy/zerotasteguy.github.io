import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {translate} from '@docusaurus/Translate';
import {useActiveVersion, useDocById, useDocsSidebar, useDoc} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem, PropSidebarItemCategory} from '@docusaurus/plugin-content-docs';
import styles from './styles.module.css';

// Tiles for every page in the docs sidebar, grouped by sidebar category.
// Used on the docs landing page. It reads the sidebar, so new pages show up here
// on their own (in both languages), with the description from their front matter
// or their first paragraph.

// The doc behind a sidebar item: a page, or the overview page a category links to.
function useItemDocId(item: PropSidebarItem): string | undefined {
  const version = useActiveVersion(undefined);
  if (item.type === 'link') return item.docId ?? undefined;
  if (item.type === 'category' && item.href) return version?.docs.find(d => d.path === item.href)?.id;
  return undefined;
}

function countPages(items: PropSidebarItem[]): number {
  return items.reduce(
    (n, i) => n + (i.type === 'category' ? countPages(i.items) + (i.href ? 1 : 0) : i.type === 'link' ? 1 : 0),
    0,
  );
}

function Tile({item}: {item: PropSidebarItem}): ReactNode {
  const doc = useDocById(useItemDocId(item));
  if (item.type === 'html' || !item.href) return null;
  const label = item.label;
  const sub =
    item.type === 'category'
      ? translate(
          {id: 'docTiles.pages', message: '{count} pages', description: 'Number of pages in a docs category tile'},
          {count: countPages(item.items)},
        )
      : undefined;
  const external = item.type === 'link' && !item.docId;
  return (
    <Link className={styles.tile} to={item.href} target={external ? '_self' : undefined}>
      <span className={styles.tileTitle}>{label}</span>
      {(item.type === 'category' ? item.description ?? doc?.description : doc?.description) && (
        <span className={styles.tileText}>{item.type === 'category' ? item.description ?? doc?.description : doc?.description}</span>
      )}
      {sub && <span className={styles.tileMeta}>{sub}</span>}
    </Link>
  );
}

function CategoryHeader({cat}: {cat: PropSidebarItemCategory}): ReactNode {
  // A category's overview page is its link, so its description describes the category.
  const doc = useDocById(useItemDocId(cat));
  const description = cat.description ?? doc?.description;
  return (
    <div className={styles.catHead}>
      <Heading as="h2" className={`section-title ${styles.catTitle}`}>
        {cat.href ? <Link to={cat.href}>{cat.label}</Link> : cat.label}
      </Heading>
      {description && <p className={styles.catText}>{description}</p>}
    </div>
  );
}

export default function DocTiles(): ReactNode {
  const sidebar = useDocsSidebar();
  const current = useDoc().metadata.id;
  const items = (sidebar?.items ?? []).filter(i => !(i.type === 'link' && i.docId === current));
  const loose = items.filter(i => i.type === 'link');
  const categories = items.filter((i): i is PropSidebarItemCategory => i.type === 'category');
  return (
    <div className={styles.root}>
      {loose.length > 0 && (
        <div className={styles.grid}>
          {loose.map(i => (
            <Tile key={i.href} item={i} />
          ))}
        </div>
      )}
      {categories.map(cat => (
        <section key={cat.label} className={`glass ${styles.cat}`}>
          <CategoryHeader cat={cat} />
          <div className={styles.grid}>
            {cat.items.map(i => (
              <Tile key={i.type === 'html' ? i.value : i.href} item={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
