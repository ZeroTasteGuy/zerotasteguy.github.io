import type {ReactNode} from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import {sponsors} from '@site/src/data/sponsors';
import styles from './Sponsors.module.css';

function Logo({src, dark, alt, invert}: {src: string; dark?: string; alt: string; invert?: boolean}) {
  const light = useBaseUrl(src);
  const darkUrl = useBaseUrl(dark ?? src);
  return (
    <ThemedImage
      className={clsx(styles.logo, invert && styles.invertInDark)}
      sources={{light, dark: darkUrl}}
      alt={alt}
      loading="lazy"
    />
  );
}

export default function Sponsors(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.heading}>
          Sponsors
        </Heading>
        <ul className={styles.grid}>
          {sponsors.map(s => {
            const inner = (
              <>
                {s.logo ? (
                  <Logo src={s.logo} dark={s.logoDark} alt={s.name} invert={s.invertInDark} />
                ) : (
                  <span className={styles.wordmark}>{s.name}</span>
                )}
                {s.what && <span className={styles.what}>{s.what}</span>}
              </>
            );
            return (
              <li key={s.name}>
                {s.url ? (
                  <a className={styles.tile} href={s.url} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div className={styles.tile}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
