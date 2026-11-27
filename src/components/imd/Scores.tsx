import type {ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {fullName, SYSTEMS, channelById, type SetChannel} from './channels';
import {findings, level, noiseOf, penalty, scoreOf, PARTS, type Analysis, type Noise, type Part, type Product, type Weights} from './engine';
import {describeProduct, findingText, fmt, typeName} from './text';
import styles from './styles.module.css';

export const scoreLevel = (s: number) => (s >= 85 ? 'ok' : s >= 60 ? 'warn' : 'bad');

export function ScoreBadge({score}: {score: number}): ReactNode {
  return <span className={`${styles.badge} ${styles[`b_${scoreLevel(score)}`]}`}>{score}</span>;
}

// Score, ET rating, closest gap, and the problems in plain words.
export function ScorePanel({
  set,
  analysis,
  bleedOffset,
  weights,
  best,
}: {
  set: SetChannel[];
  analysis: Analysis;
  bleedOffset: number;
  weights: Weights;
  best?: {pilots: number; score: number} | null;
}): ReactNode {
  if (set.length < 2) {
    return <p className={styles.muted}>{translate({id: 'imd.score.empty', message: 'Pick at least two channels to see their interference.'})}</p>;
  }
  const f = set.map(c => c.mhz);
  const noise = noiseOf(f, bleedOffset, weights);
  const score = scoreOf(noise.pen, f.length, weights.even);
  const list = findings(f, analysis);
  return (
    <div className={styles.summary}>
      <div className={styles.summaryNums}>
        <div className={`${styles.metric} ${styles[`m_${scoreLevel(score)}`]}`}>
          <div className={styles.metricLabel}>{translate({id: 'imd.score.score', message: 'Score'})}</div>
          <div className={styles.metricValue}>
            {score}
            <small> / 100</small>
          </div>
        </div>
        <div className={styles.metric} title={translate({id: 'imd.score.etHelp', message: 'The same number as ET\'s IMDTabler and RotorHazard. Only counts 2-pilot products.'})}>
          <div className={styles.metricLabel}>{translate({id: 'imd.score.et', message: 'ET rating'})}</div>
          <div className={styles.metricValue}>{analysis.et}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>{translate({id: 'imd.score.sep', message: 'Closest channels'})}</div>
          <div className={styles.metricValue}>
            {fmt(analysis.minSep)}
            <small> MHz</small>
          </div>
        </div>
      </div>
      <NoiseBars set={set} noise={noise} big />
      {best && best.pilots === set.length && (
        <p className={styles.muted}>
          {best.score >= score
            ? translate(
                {id: 'imd.score.best', message: 'Best possible with {n} pilots in the channels allowed below: {best}.'},
                {n: best.pilots, best: best.score},
              )
            : translate({id: 'imd.score.beatsBest', message: 'Better than every set from the channels allowed below.'})}
        </p>
      )}
      {list.length === 0 ? (
        <p className={`${styles.verdict} ${styles.verdictGood}`}>
          {translate({id: 'imd.verdict.good', message: 'Clean: nothing lands on any of your channels.'})}
        </p>
      ) : (
        <ul className={styles.findings}>
          {list.map((x, i) => (
            <li key={i} className={x.kind === 'hit' && x.on.length === 0 ? styles.lv_warn : x.kind === 'hit' && x.type === 'im5' ? styles.lv_warn : styles.lv_bad}>
              <i className={styles.dot} />
              {findingText(x, set)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HitList({set, analysis}: {set: SetChannel[]; analysis: Analysis}): ReactNode {
  // Products that come within 20 MHz of one of your channels, closest first.
  const seen = new Set<string>();
  const hits: Product[] = analysis.products
    .filter(p => p.hit >= 0 && p.dist < 20)
    .sort((a, b) => a.dist - b.dist || a.type.localeCompare(b.type))
    .filter(p => {
      const k = `${p.type}|${p.mhz}|${p.hit}|${[...p.from].sort().join(',')}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  if (hits.length === 0) {
    return <p className={styles.good}>{translate({id: 'imd.hits.none', message: 'Nothing lands within 20 MHz of your channels.'})}</p>;
  }
  return (
    <ul className={styles.hitList}>
      {hits.slice(0, 40).map((p, i) => (
        <li key={i} className={styles[`lv_${level(p.dist)}`]}>
          <i className={styles.dot} />
          {describeProduct(p, set)}
        </li>
      ))}
      {hits.length > 40 && <li className={styles.muted}>… {hits.length - 40}</li>}
    </ul>
  );
}

// "Swap R8 for R7": single-channel swaps that raise the score, using channels from the
// systems already in the set.
export function Improvements({set, bleedOffset, weights, onApply}: {set: SetChannel[]; bleedOffset: number; weights: Weights; onApply: (ids: string[]) => void}): ReactNode {
  const pen = (cs: SetChannel[]) => penalty(cs.map(c => c.mhz), bleedOffset, weights);
  const current = pen(set);
  const systems = new Set(set.map(c => c.system));
  const pool = SYSTEMS.filter(s => systems.has(s.id))
    .flatMap(s => s.channels.map(c => channelById(c.id)!))
    .filter(c => !set.some(x => x.mhz === c.mhz));
  const swaps: {label: string; ids: string[]; p: number}[] = [];
  set.forEach((out, i) => {
    for (const c of pool) {
      const next = set.map((x, j) => (j === i ? c : x));
      const p = pen(next);
      if (p < current - 0.05) {
        swaps.push({
          label: translate({id: 'imd.better.swap', message: 'Swap {a} for {b}'}, {a: fullName(out), b: fullName(c)}),
          ids: next.map(x => x.id),
          p,
        });
      }
    }
  });
  swaps.sort((a, b) => a.p - b.p);
  if (swaps.length === 0) {
    return <p className={styles.muted}>{translate({id: 'imd.better.none', message: 'No single swap of a channel makes this set cleaner.'})}</p>;
  }
  return (
    <div className={styles.better}>
      {swaps.slice(0, 4).map(o => (
        <button key={o.label} type="button" className="button button--sm button--secondary" onClick={() => onApply(o.ids)}>
          {o.label} <span className={styles.betterScore}>→ {scoreOf(o.p, set.length, weights.even)}</span>
        </button>
      ))}
    </div>
  );
}

// What each part of the noise is called, for the bars and their legend.
export function partName(p: Part): string {
  if (p === 'gap') return translate({id: 'imd.part.gap', message: 'Channel too close'});
  if (p === 'edge') return translate({id: 'imd.part.edge', message: 'Antenna range'});
  return typeName(p);
}

// One small stacked bar per channel: how much noise lands on it, split by kind. A full
// bar (scale) is noise of 2, about two direct hits; more is cut off with a mark.
export function NoiseBars({set, noise, big = false}: {set: SetChannel[]; noise: Noise; big?: boolean}): ReactNode {
  const scale = 2;
  const unit = translate({id: 'imd.bars.unit', message: '1 = one direct hit'});
  return (
    <div className={`${styles.bars} ${big ? styles.barsBig : ''}`} role="img" aria-label={translate({id: 'imd.bars.aria', message: 'Interference on each channel'})}>
      {noise.channels.map((c, i) => {
        const total = c.noise + c.parts.edge;
        const parts = PARTS.filter(k => c.parts[k] > 0.005);
        const tip = `${set[i] ? fullName(set[i]) : ''}: ${total.toFixed(2)} (${unit})${parts.length ? '\n' : ''}${parts.map(k => `${partName(k)} ${c.parts[k].toFixed(2)}`).join('\n')}`;
        return (
          <div key={i} className={styles.barCol} title={tip}>
            <div className={styles.barTrack}>
              {parts.map(k => (
                <i key={k} className={styles[`part_${k}`]} style={{height: `${Math.min(100, (c.parts[k] / scale) * 100)}%`}} />
              ))}
              {total > scale && <b className={styles.barOver}>+</b>}
            </div>
            <span className={styles.barName}>
              {set[i]?.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BarsLegend(): ReactNode {
  return (
    <div className={styles.barsLegend}>
      {PARTS.map(k => (
        <span key={k}>
          <i className={styles[`part_${k}`]} /> {partName(k)}
        </span>
      ))}
    </div>
  );
}
