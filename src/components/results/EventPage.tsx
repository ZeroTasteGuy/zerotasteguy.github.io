import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import type {RaceResult} from '@site/plugins/race-results/types';
import {countryName, formatDates, formatPosition, formatTime, medal, useLang} from './format';
import styles from './results.module.css';

export default function EventPage({result: r}: {result: RaceResult}): ReactNode {
  const lang = useLang();
  const notes = lang === 'de' ? (r.notesDe ?? r.notes) : r.notes;
  const t = (id: string, message: string) => translate({id: `results.event.${id}`, message});
  const rows: [string, ReactNode][] = [
    [
      r.type === 'series' ? t('season', 'Season') : t('date', 'Date'),
      r.type === 'series' ? String(r.year) : formatDates(r, lang),
    ],
    [t('location', 'Location'), [r.location, countryName(r.country, lang)].filter(Boolean).join(', ')],
    [t('series', 'Series'), r.series],
    [t('class', 'Class'), r.class],
    [
      t('place', 'Place'),
      r.position !== undefined ? `${medal(r.position)} ${formatPosition(r.position, r.pilots, r.pilotsPlus, lang)}` : '',
    ],
    [t('qualifying', 'Qualifying place'), r.qualifying !== undefined ? String(r.qualifying) : ''],
    [t('bestLap', 'Best lap'), formatTime(r.bestLap, lang)],
    [t('best3Laps', 'Best 3 consecutive laps'), formatTime(r.best3Laps, lang)],
    [
      t('status', 'Status'),
      r.status === 'provisional'
        ? t('statusProvisional', 'Provisional, not yet official')
        : r.status === 'self-reported'
          ? t('statusSelfReported', 'Unconfirmed, no published results yet')
          : '',
    ],
    [
      t('source', 'Source'),
      r.url ? (
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {translate({id: 'results.event.fullResults', message: 'Full results on {source}'}, {source: r.sourceLabel})}
        </a>
      ) : (
        r.sourceLabel
      ),
    ],
  ];
  return (
    <Layout
      title={translate({id: 'results.event.pageTitle', message: '{event} – Race results'}, {event: r.event})}
      description={translate(
        {id: 'results.event.description', message: "Max's result at {event}, {date}."},
        {event: r.event, date: formatDates(r, lang)},
      )}>
      <main className="container margin-vert--xl">
        <Link to="/results/">
          <Translate id="results.event.back">← All race results</Translate>
        </Link>
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
          {notes && <p className="margin-top--md margin-bottom--none">{notes}</p>}
        </div>
      </main>
    </Layout>
  );
}
