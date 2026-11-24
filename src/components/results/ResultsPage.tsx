import {useMemo, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type {ResultsData, YearSummary} from '@site/plugins/race-results/types';
import Translate, {translate} from '@docusaurus/Translate';
import {countryName, formatDates, formatPosition, medal, ordinal, statusLabel, useLang, type Lang} from './format';
import styles from './results.module.css';

const t = (id: string, message: string) => translate({id: `results.${id}`, message});

function SummaryCard({s, active, onClick, lang}: {s: YearSummary; active: boolean; onClick: () => void; lang: Lang}): ReactNode {
  return (
    <button type="button" className={`glass ${styles.summary} ${active ? styles.summaryActive : ''}`} onClick={onClick}>
      <div className={styles.summaryYear}>{s.year === 'all' ? t('allTime', 'All time') : s.year}</div>
      <dl className={styles.stats}>
        <div><dt>{t('stats.races', 'Races')}</dt><dd>{s.races}</dd></div>
        <div><dt>{t('stats.wins', 'Wins')}</dt><dd>{s.wins}</dd></div>
        <div><dt>{t('stats.podiums', 'Podiums')}</dt><dd>{s.podiums}</dd></div>
        <div><dt>{t('stats.best', 'Best')}</dt><dd>{s.bestFinish ?? '–'}</dd></div>
        <div><dt>{t('stats.avgPlace', 'Avg. place')}</dt><dd>{s.avgPosition !== undefined ? s.avgPosition.toFixed(1).replace('.', lang === 'de' ? ',' : '.') : '–'}</dd></div>
        <div><dt>{t('stats.countries', 'Countries')}</dt><dd>{s.countries.length || '–'}</dd></div>
      </dl>
      {s.series.length > 0 && (
        <ul className={styles.seriesList}>
          {s.series.map(x => (
            <li key={x.slug}>
              {x.position ? <strong>{ordinal(x.position, lang)}</strong> : null} {x.event}
              {x.status && <span className={styles.status}>{statusLabel(x.status)}</span>}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

export default function ResultsPage({data}: {data: ResultsData}): ReactNode {
  const {results, summaries} = data;
  const lang = useLang();
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
  const showQuali = shown.some(r => r.qualifying !== undefined);

  return (
    <Layout
      title={t('title', 'Race results')}
      description={t('description', "Max's FPV drone race results, with season summaries.")}>
      <main className="container margin-vert--xl">
        <Heading as="h1" className="section-title">
          <Translate id="results.title">Race results</Translate>
        </Heading>

        {results.length === 0 ? (
          <div className="glass glass-page">{t('empty', 'No race results yet.')}</div>
        ) : (
          <>
            <div className={styles.summaries}>
              {summaries.map(s => (
                <SummaryCard
                  key={String(s.year)}
                  s={s}
                  active={String(s.year) === year || (s.year === 'all' && year === 'all')}
                  onClick={() => setYear(String(s.year))}
                  lang={lang}
                />
              ))}
            </div>

            <div className={`glass ${styles.panel}`}>
              <div className={styles.filters}>
                <label>
                  {t('filter.year', 'Year')}{' '}
                  <select value={year} onChange={e => setYear(e.target.value)}>
                    <option value="all">{t('filter.all', 'All')}</option>
                    {summaries.filter(s => s.year !== 'all').map(s => (
                      <option key={s.year} value={String(s.year)}>{s.year}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('filter.source', 'Source')}{' '}
                  <select value={source} onChange={e => setSource(e.target.value)}>
                    <option value="all">{t('filter.all', 'All')}</option>
                    {sources.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
                <span className="site-muted">{shown.length === 1
                    ? t('count.one', '1 result')
                    : translate({id: 'results.count.other', message: '{count} results'}, {count: shown.length})}</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t('col.date', 'Date')}</th>
                      <th>{t('col.race', 'Race')}</th>
                      <th className={styles.hideSm}>{t('col.class', 'Class')}</th>
                      {showQuali && <th className={`${styles.num} ${styles.hideSm}`}>{t('col.quali', 'Quali')}</th>}
                      <th className={styles.num}>{t('col.place', 'Place')}</th>
                      <th className={styles.hideSm}>{t('col.source', 'Source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(r => (
                      <tr key={r.slug}>
                        <td className={styles.nowrap}>{formatDates(r, lang)}</td>
                        <td>
                          <Link to={`/results/${r.slug}/`}>{r.event}</Link>
                          {r.type === 'series' && <span className={styles.tag}>{t('seriesTotal', 'Series total')}</span>}
                          {r.status && <span className={styles.status}>{statusLabel(r.status)}</span>}
                          {(r.location || r.country) && (
                            <div className={styles.sub}>{[r.location, countryName(r.country, lang)].filter(Boolean).join(', ')}</div>
                          )}
                        </td>
                        <td className={`${styles.nowrap} ${styles.hideSm}`}>{r.class}</td>
                        {showQuali && <td className={`${styles.num} ${styles.hideSm}`}>{r.qualifying}</td>}
                        <td className={`${styles.num} ${styles.nowrap}`}>
                          {medal(r.position)} {formatPosition(r.position, r.pilots, r.pilotsPlus, lang)}
                        </td>
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
