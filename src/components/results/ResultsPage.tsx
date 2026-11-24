import {useMemo, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type {ResultsData, YearSummary} from '@site/plugins/race-results/types';
import {STATUS_LABEL, formatDates, formatPosition, formatTime, medal, ordinal} from './format';
import styles from './results.module.css';

function SummaryCard({s, active, onClick}: {s: YearSummary; active: boolean; onClick: () => void}): ReactNode {
  return (
    <button type="button" className={`glass ${styles.summary} ${active ? styles.summaryActive : ''}`} onClick={onClick}>
      <div className={styles.summaryYear}>{s.year === 'all' ? 'All time' : s.year}</div>
      <dl className={styles.stats}>
        <div><dt>Races</dt><dd>{s.races}</dd></div>
        <div><dt>Wins</dt><dd>{s.wins}</dd></div>
        <div><dt>Podiums</dt><dd>{s.podiums}</dd></div>
        <div><dt>Best</dt><dd>{s.bestFinish ?? '–'}</dd></div>
        <div><dt>Avg. place</dt><dd>{s.avgPosition !== undefined ? s.avgPosition.toFixed(1) : '–'}</dd></div>
        <div><dt>Countries</dt><dd>{s.countries.length || '–'}</dd></div>
      </dl>
      {s.series.length > 0 && (
        <ul className={styles.seriesList}>
          {s.series.map(x => (
            <li key={x.slug}>
              {x.position ? <strong>{ordinal(x.position)}</strong> : null} {x.event}
              {x.status && <span className={styles.status}>{STATUS_LABEL[x.status]}</span>}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

export default function ResultsPage({data}: {data: ResultsData}): ReactNode {
  const {results, summaries} = data;
  const [year, setYear] = useState<string>('all');
  const [source, setSource] = useState<string>('all');

  const sources = useMemo(
    () => [...new Map(results.map(r => [r.source, r.sourceLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [results],
  );
  const shown = results.filter(
    r => (year === 'all' || String(r.year) === year) && (source === 'all' || r.source === source),
  );

  // Lap-time columns only show when at least one listed race has a time.
  const showLap = shown.some(r => r.bestLap !== undefined);
  const show3 = shown.some(r => r.best3Laps !== undefined);
  const showQuali = shown.some(r => r.qualifying !== undefined);

  return (
    <Layout title="Race results" description="Max's FPV drone race results, with season summaries.">
      <main className="container margin-vert--xl">
        <Heading as="h1" className="section-title">
          Race results
        </Heading>

        {results.length === 0 ? (
          <div className="glass glass-page">No race results yet.</div>
        ) : (
          <>
            <div className={styles.summaries}>
              {summaries.map(s => (
                <SummaryCard
                  key={String(s.year)}
                  s={s}
                  active={String(s.year) === year || (s.year === 'all' && year === 'all')}
                  onClick={() => setYear(String(s.year))}
                />
              ))}
            </div>

            <div className={`glass ${styles.panel}`}>
              <div className={styles.filters}>
                <label>
                  Year{' '}
                  <select value={year} onChange={e => setYear(e.target.value)}>
                    <option value="all">All</option>
                    {summaries.filter(s => s.year !== 'all').map(s => (
                      <option key={s.year} value={String(s.year)}>{s.year}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Source{' '}
                  <select value={source} onChange={e => setSource(e.target.value)}>
                    <option value="all">All</option>
                    {sources.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
                <span className="site-muted">{shown.length} {shown.length === 1 ? 'result' : 'results'}</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Race</th>
                      <th className={styles.hideSm}>Class</th>
                      {showQuali && <th className={`${styles.num} ${styles.hideSm}`}>Quali</th>}
                      <th className={styles.num}>Place</th>
                      {showLap && <th className={styles.num}>Best lap</th>}
                      {show3 && <th className={styles.num}>Best 3 laps</th>}
                      <th className={styles.hideSm}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(r => (
                      <tr key={r.slug}>
                        <td className={styles.nowrap}>{formatDates(r)}</td>
                        <td>
                          <Link to={`/results/${r.slug}/`}>{r.event}</Link>
                          {r.type === 'series' && <span className={styles.tag}>Series total</span>}
                          {r.status && <span className={styles.status}>{STATUS_LABEL[r.status]}</span>}
                          {(r.location || r.country) && (
                            <div className={styles.sub}>{[r.location, r.country].filter(Boolean).join(', ')}</div>
                          )}
                        </td>
                        <td className={`${styles.nowrap} ${styles.hideSm}`}>{r.class}</td>
                        {showQuali && <td className={`${styles.num} ${styles.hideSm}`}>{r.qualifying}</td>}
                        <td className={`${styles.num} ${styles.nowrap}`}>
                          {medal(r.position)} {formatPosition(r.position, r.pilots, r.pilotsPlus)}
                        </td>
                        {showLap && <td className={styles.num}>{formatTime(r.bestLap)}</td>}
                        {show3 && <td className={styles.num}>{formatTime(r.best3Laps)}</td>}
                        <td className={styles.hideSm}>
                          {r.url ? (
                            <a href={r.url} target="_blank" rel="noopener noreferrer">{r.sourceLabel}</a>
                          ) : (
                            r.sourceLabel
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}
