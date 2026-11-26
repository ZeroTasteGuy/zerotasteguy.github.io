import {useEffect, useMemo, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import {translate} from '@docusaurus/Translate';
import {PRESETS, SYSTEMS, channelById, type SetChannel} from './channels';
import {analyze} from './engine';
import Chart from './Chart';
import Finder from './Finder';
import {HitList, Improvements, ScorePanel} from './Scores';
import styles from './styles.module.css';

// State lives in the URL hash (#R1,R3,R6,R7), so a set can be shared as a link.
function readHash(): {ids: string[]; bleed?: number} {
  const h = decodeURIComponent(window.location.hash.slice(1));
  const [list, ...opts] = h.split('&');
  const ids = list.split(',').filter(id => channelById(id));
  const b = opts.find(o => o.startsWith('bleed='));
  return {ids, bleed: b ? Number(b.slice(6)) : undefined};
}

const DEFAULT = ['R1', 'R3', 'R6', 'R7'];

export default function ImdTool(): ReactNode {
  const [ids, setIds] = useState<string[]>(DEFAULT);
  const [showBleed, setShowBleed] = useState(false);
  const [bleedOffset, setBleedOffset] = useState(37);
  // Raceband, Fatshark and HDZero are always shown; the rest can be switched on.
  const [extra, setExtra] = useState<Set<string>>(() => new Set());
  const [showEU, setShowEU] = useState(false);
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState(false);
  const [best, setBest] = useState<{pilots: number; score: number} | null>(null);

  useEffect(() => {
    const h = readHash();
    if (h.ids.length) setIds(h.ids);
    if (h.bleed) setBleedOffset(h.bleed);
  }, []);
  useEffect(() => {
    const hash = `#${ids.join(',')}${bleedOffset !== 37 ? `&bleed=${bleedOffset}` : ''}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [ids, bleedOffset]);

  const set: SetChannel[] = useMemo(() => ids.map(id => channelById(id)!).filter(Boolean), [ids]);
  // Bleed always counts in the score; the switch only draws its lines.
  const analysis = useMemo(() => analyze(set.map(c => c.mhz), bleedOffset), [set, bleedOffset]);
  const forced = new Set<string>(set.map(c => (c.system === 'hz' && c.mhz < 5630 ? 'L' : c.system)));
  if (set.some(c => c.mhz < 5630)) forced.add('L');
  const rowOn = (id: string) => extra.has(id) || forced.has(id);
  const rows = SYSTEMS.map(s => s.id).filter(id => ['R', 'F', 'hz'].includes(id) || rowOn(id));
  const flip = (ids: string[]) =>
    setExtra(prev => {
      const next = new Set(prev);
      const on = ids.every(id => next.has(id));
      for (const id of ids) on ? next.delete(id) : next.add(id);
      return next;
    });
  const TOGGLES: {label: string; ids: string[]}[] = [
    {label: translate({id: 'imd.rows.low', message: 'Low band'}), ids: ['L']},
    {label: translate({id: 'imd.rows.eba', message: 'Bands E, B, A'}), ids: ['E', 'B', 'A']},
    {label: 'Walksnail', ids: ['ws']},
    {label: 'DJI V1 / Vista', ids: ['dj']},
    {label: 'DJI O3', ids: ['o3']},
    {label: 'DJI O4', ids: ['o4']},
  ];

  const toggle = (id: string) => setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const addCustom = () => {
    const v = custom.trim().replace(',', '.');
    const c = channelById(v);
    if (c && !ids.includes(c.id)) setIds([...ids, c.id]);
    setCustom('');
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  const showSet = (next: string[]) => {
    setIds(next);
    document.getElementById('imd-chart')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  return (
    <main className="container margin-vert--xl">
      <Heading as="h1" className="section-title">
        {translate({id: 'imd.title', message: 'IMD Channel Calculator'})}
      </Heading>
      <p className="site-muted">
        {translate({
          id: 'imd.intro',
          message:
            'When several pilots fly at once, their video transmitters mix and create interference (IMD) on other frequencies. Pick your channels and see where it lands, or let the calculator find the cleanest set.',
        })}{' '}
        <Link to="/docs/imd/">{translate({id: 'imd.introDocs', message: 'How it works'})}</Link>
      </p>

      <section id="imd-chart" className={`glass ${styles.card}`}>
        <div className={styles.cardHead}>
          <Heading as="h2" className={styles.cardTitle}>
            {translate({id: 'imd.chart.title', message: 'Your channels'})}
          </Heading>
          <div className={styles.presets}>
            {PRESETS.map(p => (
              <button key={p.label} type="button" className={styles.pill} onClick={() => setIds(p.ids)}>
                {p.label}
              </button>
            ))}
            <button type="button" className={styles.pill} onClick={() => setIds([])}>
              {translate({id: 'imd.clear', message: 'Clear'})}
            </button>
          </div>
        </div>

        <div className={styles.rowToggles}>
          <span className={styles.muted}>{translate({id: 'imd.rows.show', message: 'Also show:'})}</span>
          {TOGGLES.map(t => {
            const on = t.ids.every(rowOn);
            const locked = t.ids.some(id => forced.has(id));
            return (
              <button
                key={t.label}
                type="button"
                aria-pressed={on}
                disabled={locked}
                title={locked ? translate({id: 'imd.rows.locked', message: 'Shown because one of your channels is in it'}) : undefined}
                className={`${styles.pill} ${on ? styles.pillOn : ''}`}
                onClick={() => flip(t.ids)}>
                {on ? '✓ ' : '+ '}
                {t.label}
              </button>
            );
          })}
          <button type="button" aria-pressed={showBleed} className={`${styles.pill} ${showBleed ? styles.pillOn : ''}`} onClick={() => setShowBleed(v => !v)}>
            {showBleed ? '✓ ' : '+ '}
            {translate({id: 'imd.rows.bleed', message: 'VTX bleed lines'})}
          </button>
          <button type="button" aria-pressed={showEU} className={`${styles.pill} ${showEU ? styles.pillOn : ''}`} onClick={() => setShowEU(v => !v)}>
            {showEU ? '✓ ' : '+ '}
            {translate({id: 'imd.rows.eu', message: 'EU range'})}
          </button>
        </div>

        <Chart set={set} analysis={analysis} showBleed={showBleed} rows={rows} showEU={showEU} onToggle={toggle} />

        <ScorePanel set={set} analysis={analysis} bleedOffset={bleedOffset} best={best} />

        {set.length >= 2 && (
          <>
            <details className={styles.details}>
              <summary>{translate({id: 'imd.better.title', message: 'Small changes that make it cleaner'})}</summary>
              <Improvements set={set} bleedOffset={bleedOffset} onApply={setIds} />
            </details>
            <details className={styles.details}>
              <summary>{translate({id: 'imd.hits.title', message: 'Everything that lands near your channels'})}</summary>
              <HitList set={set} analysis={analysis} />
            </details>
          </>
        )}

        <details className={styles.details}>
          <summary>{translate({id: 'imd.opt.title', message: 'Other frequency, bleed distance, share'})}</summary>
          <div className={styles.options}>
            <form
              className={styles.customForm}
              onSubmit={e => {
                e.preventDefault();
                addCustom();
              }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder={translate({id: 'imd.opt.customPh', message: 'MHz, e.g. 5790'})}
                value={custom}
                onChange={e => setCustom(e.target.value)}
                aria-label={translate({id: 'imd.opt.custom', message: 'Add a frequency in MHz'})}
              />
              <button type="submit" className="button button--sm button--secondary">
                {translate({id: 'imd.opt.add', message: 'Add'})}
              </button>
            </form>
            <label className={styles.check}>
              {translate({id: 'imd.opt.bleed', message: 'VTX bleed at ±'})}
              <input
                type="number"
                className={styles.smallNum}
                min={5}
                max={100}
                value={bleedOffset}
                onChange={e => setBleedOffset(Math.min(100, Math.max(5, Number(e.target.value) || 37)))}
                aria-label={translate({id: 'imd.opt.bleedMhz', message: 'Bleed offset in MHz'})}
              />
              MHz
            </label>
            <button type="button" className="button button--sm button--secondary" onClick={share} disabled={!set.length}>
              {copied ? '✓' : translate({id: 'imd.share', message: 'Copy link to this set'})}
            </button>
          </div>
        </details>
      </section>

      <section className={`glass ${styles.card}`}>
        <Heading as="h2" className={styles.cardTitle}>
          {translate({id: 'imd.find.title', message: 'Find the cleanest channels'})}
        </Heading>
        <p className={styles.muted}>
          {translate({id: 'imd.find.intro', message: 'Choose how many pilots fly at once and which channels you may use. Click Show on a result to see it in the chart.'})}
        </p>
        <Finder bleedOffset={bleedOffset} onShow={showSet} current={ids} onBest={setBest} />
      </section>
      <BuildLine />
    </main>
  );
}

// "Version 26.11.2026, 14:52 (abc1234)": when this page was built, in Berlin time.
function BuildLine(): ReactNode {
  const {siteConfig, i18n} = useDocusaurusContext();
  const {buildTime, buildCommit} = siteConfig.customFields as {buildTime: string; buildCommit: string};
  const when = new Date(buildTime).toLocaleString(i18n.currentLocale === 'de' ? 'de-DE' : 'en-GB', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <p className={styles.buildLine}>
      {translate({id: 'imd.version', message: 'Version {when}'}, {when})}
      {buildCommit ? ` (${buildCommit})` : ''}
    </p>
  );
}
