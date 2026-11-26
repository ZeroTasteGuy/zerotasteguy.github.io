import {useEffect, useMemo, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {translate} from '@docusaurus/Translate';
import {PRESETS, channelById, fullName, type SetChannel} from './channels';
import {analyze} from './engine';
import Chart from './Chart';
import Finder from './Finder';
import {HitList, Improvements, ScorePanel} from './Scores';
import {describeProduct} from './text';
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
  const [moreBands, setMoreBands] = useState(false);
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = readHash();
    if (h.ids.length) setIds(h.ids);
    if (h.bleed) {
      setShowBleed(true);
      setBleedOffset(h.bleed);
    }
  }, []);
  useEffect(() => {
    const hash = `#${ids.join(',')}${showBleed ? `&bleed=${bleedOffset}` : ''}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, [ids, showBleed, bleedOffset]);

  const set: SetChannel[] = useMemo(() => ids.map(id => channelById(id)!).filter(Boolean), [ids]);
  const analysis = useMemo(() => analyze(set.map(c => c.mhz), showBleed ? bleedOffset : 0), [set, showBleed, bleedOffset]);
  const needLow = set.some(c => c.mhz < 5630);

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

  // One plain sentence on top of the numbers.
  const verdict = (() => {
    if (set.length < 2) return null;
    const bad = analysis.products.filter(p => p.hit >= 0 && p.dist < 10 && (showBleed || p.type !== 'bleed'));
    const close = analysis.minSep < 30;
    if (!bad.length && !close) {
      return {cls: styles.verdictGood, text: translate({id: 'imd.verdict.good', message: 'Clean: no IMD lands on any of your channels.'})};
    }
    const worst = [...bad].sort((a, b) => a.dist - b.dist)[0];
    const hitChannels = new Set(bad.map(p => p.hit)).size;
    const parts: string[] = [];
    if (close && analysis.minSepPair) {
      parts.push(
        translate(
          {id: 'imd.verdict.close', message: '{a} and {b} are only {d} MHz apart.'},
          {a: fullName(set[analysis.minSepPair[0]]), b: fullName(set[analysis.minSepPair[1]]), d: String(analysis.minSep)},
        ),
      );
    }
    if (worst) {
      parts.push(
        translate(
          {id: 'imd.verdict.hits', message: 'Interference lands on {n} of your channels, e.g. {example}.'},
          {n: hitChannels, example: describeProduct(worst, set)},
        ),
      );
    }
    return {cls: styles.verdictBad, text: parts.join(' ')};
  })();

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

        <Chart set={set} analysis={analysis} showBleed={showBleed} moreBands={moreBands || needLow} onToggle={toggle} />

        <div className={styles.options}>
          <label className={styles.check}>
            <input type="checkbox" checked={moreBands || needLow} disabled={needLow} onChange={e => setMoreBands(e.target.checked)} />
            {translate({id: 'imd.opt.moreBands', message: 'Show bands E, B, A and low band'})}
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} />
            {translate({id: 'imd.opt.bleed', message: 'Show VTX bleed at ±'})}
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
          <form
            className={styles.customForm}
            onSubmit={e => {
              e.preventDefault();
              addCustom();
            }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder={translate({id: 'imd.opt.customPh', message: 'Other MHz, e.g. 5790'})}
              value={custom}
              onChange={e => setCustom(e.target.value)}
              aria-label={translate({id: 'imd.opt.custom', message: 'Add a frequency in MHz'})}
            />
            <button type="submit" className="button button--sm button--secondary">
              {translate({id: 'imd.opt.add', message: 'Add'})}
            </button>
          </form>
          <button type="button" className="button button--sm button--secondary" onClick={share} disabled={!set.length}>
            {copied ? '✓' : translate({id: 'imd.share', message: 'Copy link'})}
          </button>
        </div>

        {verdict && <p className={`${styles.verdict} ${verdict.cls}`}>{verdict.text}</p>}
        <ScorePanel set={set} analysis={analysis} showBleed={showBleed} />

        {set.length >= 2 && (
          <>
            <details className={styles.details}>
              <summary>{translate({id: 'imd.hits.title', message: 'Everything that lands near your channels'})}</summary>
              <HitList set={set} analysis={analysis} showBleed={showBleed} />
            </details>
            <details className={styles.details}>
              <summary>{translate({id: 'imd.better.title', message: 'Small changes that make it cleaner'})}</summary>
              <Improvements set={set} bleedOffset={showBleed ? bleedOffset : 0} onApply={setIds} />
            </details>
          </>
        )}
      </section>

      <section className={`glass ${styles.card}`}>
        <Heading as="h2" className={styles.cardTitle}>
          {translate({id: 'imd.find.title', message: 'Find the cleanest channels'})}
        </Heading>
        <p className={styles.muted}>
          {translate({id: 'imd.find.intro', message: 'Choose how many pilots fly at once and which channels you may use. Click Show on a result to see it in the chart.'})}
        </p>
        <Finder bleedOffset={bleedOffset} onShow={showSet} current={ids} />
      </section>
    </main>
  );
}
