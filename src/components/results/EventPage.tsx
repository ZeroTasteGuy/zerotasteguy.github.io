import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type {RaceResult} from '@site/plugins/race-results/types';
import {STATUS_LABEL, formatDates, formatPosition, formatTime, medal} from './format';
import styles from './results.module.css';

export default function EventPage({result: r}: {result: RaceResult}): ReactNode {
  const rows: [string, ReactNode][] = [
    [r.type === 'series' ? 'Season' : 'Date', r.type === 'series' ? String(r.year) : formatDates(r)],
    ['Location', [r.location, r.country].filter(Boolean).join(', ')],
    ['Series', r.series],
    ['Class', r.class],
    ['Place', r.position !== undefined ? `${medal(r.position)} ${formatPosition(r.position, r.pilots, r.pilotsPlus)}` : ''],
    ['Best lap', formatTime(r.bestLap)],
    ['Best 3 consecutive laps', formatTime(r.best3Laps)],
    ['Status', r.status === 'provisional' ? 'Provisional, not yet official' : r.status === 'self-reported' ? 'Unconfirmed, no published results yet' : ''],
    [
      'Source',
      r.url ? (
        <a href={r.url} target="_blank" rel="noopener noreferrer">Full results on {r.sourceLabel}</a>
      ) : (
        r.sourceLabel
      ),
    ],
  ];
  return (
    <Layout title={`${r.event} – Race results`} description={`Max's result at ${r.event}, ${formatDates(r)}.`}>
      <main className="container margin-vert--xl">
        <Link to="/results/">← All race results</Link>
        <Heading as="h1" className="section-title margin-top--md">
          {r.event}
        </Heading>
        <div className="glass glass-page">
          <dl className={styles.details}>
            {rows
              .filter(([, v]) => v !== undefined && v !== '')
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          {r.notes && <p className="margin-top--md margin-bottom--none">{r.notes}</p>}
        </div>
      </main>
    </Layout>
  );
}
