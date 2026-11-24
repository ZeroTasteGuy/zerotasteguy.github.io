import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import {sponsors} from '@site/src/data/sponsors';
import styles from './Sponsors.module.css';

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
                  <img className={styles.logo} src={s.logo} alt={s.name} loading="lazy" />
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
