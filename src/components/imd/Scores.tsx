import type {ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {fullName, SYSTEMS, channelById, type SetChannel} from './channels';
import {level, metrics, rankKey, compareKeys, type Analysis, type Product, type ProductType} from './engine';
import {describeProduct, fmt, typeName} from './text';
import styles from './styles.module.css';

function Metric({label, value, sub, d, help}: {label: string; value: string; sub?: string; d?: number; help: string}): ReactNode {
  return (
    <div className={`${styles.metric} ${d !== undefined ? styles[`m_${level(d)}`] : ''}`} title={help}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  );
}

export function ScorePanel({set, analysis, showBleed}: {set: SetChannel[]; analysis: Analysis; showBleed: boolean}): ReactNode {
  if (set.length < 2) {
    return <p className={styles.muted}>{translate({id: 'imd.score.empty', message: 'Pick at least two channels to see their interference.'})}</p>;
  }
  const none = translate({id: 'imd.score.none', message: 'none'});
  const closest = (t: ProductType, help: string) => {
    const p = analysis.closest[t];
    return (
      <Metric
        key={t}
        label={typeName(t)}
        value={p ? `${fmt(p.dist)} MHz` : none}
        sub={p ? describeProduct(p, set).replace(/^[^:]*: /, '') : undefined}
        d={p ? p.dist : 999}
        help={help}
      />
    );
  };
  const etD = analysis.et >= 100 ? 999 : analysis.et >= 80 ? 15 : 0;
  return (
    <div className={styles.metrics}>
      <Metric
        label={translate({id: 'imd.score.et', message: 'IMD rating (ET)'})}
        value={String(analysis.et)}
        sub={translate({id: 'imd.score.etSub', message: '100 = no 2-pilot IMD within 35 MHz'})}
        d={etD}
        help={translate({id: 'imd.score.etHelp', message: 'The same number as ET\'s IMDTabler and RotorHazard. Only counts 2-pilot products.'})}
      />
      <Metric
        label={translate({id: 'imd.score.sep', message: 'Closest channels'})}
        value={`${fmt(analysis.minSep)} MHz`}
        sub={analysis.minSepPair ? `${fullName(set[analysis.minSepPair[0]])} – ${fullName(set[analysis.minSepPair[1]])}` : undefined}
        d={analysis.minSep >= 37 ? 999 : analysis.minSep >= 30 ? 25 : analysis.minSep >= 20 ? 15 : 0}
        help={translate({id: 'imd.score.sepHelp', message: 'Smallest gap between two of your channels. Under about 30 MHz the pilots see each other directly.'})}
      />
      {closest('im3', translate({id: 'imd.score.im3Help', message: 'Closest product 2·A − B to another of your channels.'}))}
      {closest('im3t', translate({id: 'imd.score.im3tHelp', message: 'Closest product A + B − C to a fourth channel. Needs three pilots in the air, and is often the strongest.'}))}
      {closest('im5', translate({id: 'imd.score.im5Help', message: 'Closest product 3·A − 2·B. Much weaker than 3rd order.'}))}
      {showBleed && closest('bleed', translate({id: 'imd.score.bleedHelp', message: 'Where a dirty VTX\'s extra output lands, at its channel ± the bleed offset.'}))}
    </div>
  );
}

export function HitList({set, analysis, showBleed}: {set: SetChannel[]; analysis: Analysis; showBleed: boolean}): ReactNode {
  // Products that come within 20 MHz of one of your channels, worst first. Mirror-image
  // products (R1 + R8 − R3 and R8 + R1 − R3) are the same thing, so list each once.
  const seen = new Set<string>();
  const hits: Product[] = analysis.products
    .filter(p => p.hit >= 0 && p.dist < 20 && (showBleed || p.type !== 'bleed'))
    .sort((a, b) => a.dist - b.dist || a.type.localeCompare(b.type))
    .filter(p => {
      const k = `${p.type}|${p.mhz}|${p.hit}|${[...p.from].sort().join(',')}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  if (set.length < 2) return null;
  if (hits.length === 0) {
    return <p className={styles.good}>{translate({id: 'imd.hits.none', message: 'Nothing lands within 20 MHz of your channels.'})}</p>;
  }
  return (
    <ul className={styles.hitList}>
      {hits.slice(0, 30).map((p, i) => (
        <li key={i} className={styles[`lv_${level(p.dist)}`]}>
          <i className={styles.dot} />
          {describeProduct(p, set)}
        </li>
      ))}
      {hits.length > 30 && <li className={styles.muted}>… {hits.length - 30}</li>}
    </ul>
  );
}

// "Swap R8 for R7": single-channel swaps that make the set cleaner. With bleed shown,
// bleed counts first (like "Safe from VTX bleed first" in the finder), otherwise IMD does.
export function Improvements({
  set,
  bleedOffset,
  onApply,
}: {
  set: SetChannel[];
  bleedOffset: number;
  onApply: (ids: string[]) => void;
}): ReactNode {
  if (set.length < 2) return null;
  const key = (cs: SetChannel[]) => rankKey(metrics(cs.map(c => c.mhz), bleedOffset || 37), bleedOffset ? 'bleed' : 'imd', cs.length);
  const current = key(set);
  // Try channels from the systems already in the set.
  const systems = new Set(set.map(c => c.system));
  const pool = SYSTEMS.filter(s => systems.has(s.id))
    .flatMap(s => s.channels.map(c => channelById(c.id)!))
    .filter(c => !set.some(x => x.mhz === c.mhz));

  type Option = {label: string; ids: string[]; k: number[]};
  const swaps: Option[] = [];
  set.forEach((out, i) => {
    for (const c of pool) {
      const next = set.map((x, j) => (j === i ? c : x));
      const k = key(next);
      if (compareKeys(k, current) > 0) {
        swaps.push({
          label: translate({id: 'imd.better.swap', message: 'Swap {a} for {b}'}, {a: fullName(out), b: fullName(c)}),
          ids: next.map(x => x.id),
          k,
        });
      }
    }
  });
  swaps.sort((a, b) => compareKeys(b.k, a.k));

  const options = swaps.slice(0, 4);
  if (options.length === 0) {
    return <p className={styles.muted}>{translate({id: 'imd.better.none', message: 'No single swap of a channel makes this set cleaner.'})}</p>;
  }
  return (
    <div className={styles.better}>
      {options.map(o => (
        <button key={o.label} type="button" className="button button--sm button--secondary" onClick={() => onApply(o.ids)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
