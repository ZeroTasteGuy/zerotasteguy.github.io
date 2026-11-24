import type {ReactNode} from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import {sponsors, type Sponsor} from '@site/src/data/sponsors';
import styles from './Sponsors.module.css';

function Logo({s}: {s: Sponsor}) {
  const light = useBaseUrl(s.logo ?? '');
  const dark = useBaseUrl(s.logoDark ?? s.logo ?? '');
  if (!s.logo) return <span className={styles.wordmark}>{s.name}</span>;
  return (
    <ThemedImage
      className={clsx(styles.logo, s.invertInDark && styles.invertInDark)}
      sources={{light, dark}}
      alt={s.name}
    />
  );
}

function Item({s, hidden}: {s: Sponsor; hidden?: boolean}) {
  // The second copy of the list only exists to make the loop seamless,
  // so it is hidden from screen readers and keyboard focus.
  const props = hidden ? {'aria-hidden': true, tabIndex: -1} : {};
  return (
    <li className={styles.item} aria-hidden={hidden || undefined}>
      {s.url ? (
        <a className={styles.link} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} {...props}>
          <Logo s={s} />
        </a>
      ) : (
        <span className={styles.link} title={s.name}>
          <Logo s={s} />
        </span>
      )}
    </li>
  );
}

export default function Sponsors(): ReactNode {
  return (
    <section className={styles.section} aria-labelledby="sponsors-heading">
      <div className="container">
        <Heading as="h2" id="sponsors-heading" className={styles.heading}>
          Sponsors
        </Heading>
      </div>
      <div className={styles.viewport}>
        <ul className={styles.track}>
          {sponsors.map(s => (
            <Item key={s.name} s={s} />
          ))}
          {sponsors.map(s => (
            <Item key={`${s.name}-copy`} s={s} hidden />
          ))}
        </ul>
      </div>
    </section>
  );
}
