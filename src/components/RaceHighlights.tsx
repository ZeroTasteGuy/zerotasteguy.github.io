// Racing highlights table on the About page.
// Shows the races marked "highlight: true" in /results (see results/README.md),
// so the About page stays up to date with the race results.
import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {RaceResult} from '@site/plugins/race-results/types';
import {ordinal, statusLabel, useLang, type Lang} from './results/format';
import styles from './results/results.module.css';

const t = (id: string, message: string) => translate({id: `about.highlights.${id}`, message});

function place(r: RaceResult, lang: Lang): string {
  if (r.position === undefined) return '';
  const p = ordinal(r.position, lang);
  if (!r.pilots) return p;
  const n = r.pilots.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US') + (r.pilotsPlus ? '+' : '');
  return lang === 'de' ? `${p} von ${n}` : `${p} of ${n}`;
}

export default function RaceHighlights(): ReactNode {
  const lang = useLang();
  const {highlights = []} = (usePluginData('race-results') as {highlights?: RaceResult[]} | undefined) ?? {};
  if (!highlights.length) return null;
  return (
    <table>
      <thead>
        <tr>
          <th>{t('result', 'Result')}</th>
          <th>{t('event', 'Event')}</th>
        </tr>
      </thead>
      <tbody>
        {highlights.map(r => (
          <tr key={r.slug}>
            <td style={{whiteSpace: 'nowrap'}}>{place(r, lang)}</td>
            <td>
              <Link to={`/results/${r.slug}/`}>{r.event}</Link>
              {r.status && <span className={styles.status}>{statusLabel(r.status)}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
