import {useMemo, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {SYSTEMS, EU_MIN, EU_MAX, WIDE, fullName, type SetChannel} from './channels';
import {level, type Analysis, type Product} from './engine';
import {describeProduct, fmt} from './text';
import {bandStyle} from './Scores';
import styles from './styles.module.css';

// The frequency chart: your channels on top, the IMD products below them, then a row per
// channel system. A product's vertical line runs through every row, so you see which
// channel of any system it lands on.

const W = 1000;
const LABEL = 118; // left column with the row names
const RIGHT = 12;
const SET_H = 54;
const IMD_H = 74;
const AXIS_H = 24;
const ROW_H = 28;
const TOP = 6;

type Hover = {kind: 'product'; p: Product} | {kind: 'channel'; id: string} | null;

export default function Chart({
  set,
  analysis,
  showBleed,
  rows,
  showEU,
  onToggle,
}: {
  set: SetChannel[];
  analysis: Analysis;
  showBleed: boolean;
  rows: string[]; // ids of the channel systems to show; 'L' also widens the view to the low band
  showEU: boolean;
  onToggle: (id: string) => void;
}): ReactNode {
  const showLow = rows.includes('L');
  const lo = showLow ? 5340 : 5630;
  const hi = 5960;
  const x = (mhz: number) => LABEL + ((mhz - lo) / (hi - lo)) * (W - LABEL - RIGHT);
  const pxPerMhz = (W - LABEL - RIGHT) / (hi - lo);
  const inRange = (mhz: number) => mhz >= lo - 5 && mhz <= hi + 5;
  const systems = SYSTEMS.filter(s => rows.includes(s.id));
  const rowsTop = TOP + SET_H + IMD_H + AXIS_H;
  const chipW = (id: string) => Math.max(Math.min((WIDE[id] ?? 20) * pxPerMhz, 46), 22);
  // Channels that would overlap in a row (HDZero R2 and E1, DJI CH2 and the 40 MHz channel)
  // go on a second line, so the row is drawn twice as high.
  const layout = systems.map(s => {
    const chans = s.channels.filter(c => inRange(c.mhz)).sort((a, b) => a.mhz - b.mhz);
    const ends: number[] = [];
    const lanes = chans.map(c => {
      const left = x(c.mhz) - chipW(c.id) / 2;
      let lane = ends.findIndex(e => e + 2 <= left);
      if (lane < 0) lane = ends.length;
      ends[lane] = left + chipW(c.id);
      return {c, lane};
    });
    return {s, lanes, n: Math.max(1, ends.length)};
  });
  const rowY: number[] = [];
  let yy = rowsTop;
  for (const l of layout) {
    rowY.push(yy);
    yy += ROW_H + (l.n - 1) * (ROW_H - 6);
  }
  const H = yy + 20;
  const [hover, setHover] = useState<Hover>(null);

  // 5th order products are weak and many (hundreds with 8 pilots), so only the ones that
  // land near one of your channels are drawn.
  const products = useMemo(
    () => analysis.products.filter(p => (showBleed || p.type !== 'bleed') && (p.type !== 'im5' || p.dist < 20) && inRange(p.mhz)),
    [analysis, showBleed, lo],
  );
  const outside = analysis.products.filter(p => (showBleed || p.type !== 'bleed') && p.type !== 'im5' && !inRange(p.mhz) && p.dist < 35).length;

  // How close the nearest product comes to a frequency (for channels in the system rows).
  const nearest = (mhz: number) => {
    let best: Product | null = null;
    let d = Infinity;
    for (const p of products) {
      if (p.type === 'im5') continue; // weak, so it does not colour channels
      const dd = Math.abs(p.mhz - mhz);
      if (dd < d) {
        d = dd;
        best = p;
      }
    }
    return {p: best, d};
  };
  // Worst product landing on each of your channels.
  const worstOnSet = set.map((_, i) => {
    let best: Product | null = null;
    for (const p of products) if (p.type !== 'im5' && p.hit === i && (!best || p.dist < best.dist)) best = p;
    return best;
  });

  const setIds = new Set(set.map(c => c.id));
  const setFreqs = new Set(set.map(c => c.mhz));

  const info = (() => {
    if (!hover) return translate({id: 'imd.chart.hint', message: 'Click channels in any row to add or remove them. Point at a line to see where it comes from.'});
    if (hover.kind === 'product') return describeProduct(hover.p, set);
    const sys = SYSTEMS.find(s => s.channels.some(c => c.id === hover.id))!;
    const ch = sys.channels.find(c => c.id === hover.id)!;
    const n = nearest(ch.mhz);
    const head = `${sys.name} ${ch.name}: ${fmt(ch.mhz)} MHz`;
    if (!n.p || n.d >= 35) return `${head}. ${translate({id: 'imd.chart.clear', message: 'Nothing lands within 35 MHz.'})}`;
    return `${head}. ${translate({id: 'imd.chart.closest', message: 'Closest:'})} ${describeProduct(n.p, set, ch.mhz)}`;
  })();

  const ticks: number[] = [];
  const step = showLow ? 50 : 25;
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);

  const levelClass = (d: number) => styles[`lv_${level(d)}`];

  return (
    <div className={styles.chartBox}>
      <div className={styles.chartInfo} aria-live="polite">{info}</div>
      <div className={styles.chartScroll}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.chart}
          role="img"
          aria-label={translate({id: 'imd.chart.aria', message: 'Frequency chart of the chosen channels and their IMD products'})}
          onMouseLeave={() => setHover(null)}>
          {/* EU band */}
          {showEU && (
            <>
              <rect x={x(EU_MIN)} y={TOP} width={x(EU_MAX) - x(EU_MIN)} height={H - TOP - 4} className={styles.euBand} />
              <text x={x(EU_MIN) + 4} y={H - 7} className={styles.euLabel}>
                EU 5725–5875
              </text>
            </>
          )}

          {/* Lane labels */}
          <text x={8} y={TOP + SET_H / 2 + 4} className={styles.laneLabel}>
            {translate({id: 'imd.chart.yourSet', message: 'Your channels'})}
          </text>
          <text x={8} y={TOP + SET_H + IMD_H / 2 + 4} className={styles.laneLabel}>
            {translate({id: 'imd.chart.imd', message: 'Interference'})}
          </text>

          {/* Guide lines of products through every row */}
          {products.map((p, i) => (
            <line
              key={`g${i}`}
              x1={x(p.mhz)}
              x2={x(p.mhz)}
              y1={TOP + SET_H}
              y2={H - 6}
              className={`${styles.guide} ${p.dist < 20 && p.type !== 'im5' ? levelClass(p.dist) : ''}`}
              strokeDasharray={p.type === 'bleed' ? '3 3' : undefined}
            />
          ))}

          {/* Your channels */}
          {set.map((c, i) => {
            const w = Math.max(c.width * pxPerMhz, 6);
            const worst = worstOnSet[i];
            return (
              <g key={`s${c.id}-${i}`} className={styles.setChan} style={bandStyle(c.system)} onClick={() => onToggle(c.id)}>
                <rect
                  x={x(c.mhz) - w / 2}
                  y={TOP + 10}
                  width={w}
                  height={SET_H - 16}
                  rx={5}
                  className={`${styles.setRect} ${worst && worst.dist < 20 ? levelClass(worst.dist) : ''}`}
                />
                <text x={x(c.mhz)} y={TOP + 10 + (SET_H - 16) / 2 - 1} textAnchor="middle" className={styles.setName}>
                  {c.system === 'custom' ? '•' : c.name}
                </text>
                <text x={x(c.mhz)} y={TOP + 10 + (SET_H - 16) / 2 + 11} textAnchor="middle" className={styles.setMhz}>
                  {fmt(c.mhz)}
                </text>
                <title>{`${fullName(c)} ${fmt(c.mhz)} MHz`}</title>
              </g>
            );
          })}

          {/* IMD products */}
          {products.map((p, i) => {
            const base = TOP + SET_H + IMD_H - 4;
            const h = p.type === 'im5' || p.type === 'bleed' ? IMD_H * 0.45 : IMD_H * 0.85;
            const px = x(p.mhz);
            const cls = `${styles.spike} ${styles[`t_${p.type}`]} ${p.type === 'im5' ? styles.lv_near : levelClass(p.dist)}`;
            const top = base - h;
            return (
              <g
                key={`p${i}`}
                className={cls}
                onMouseEnter={() => setHover({kind: 'product', p})}
                onClick={() => setHover({kind: 'product', p})}>
                <line x1={px} x2={px} y1={base} y2={top} strokeDasharray={p.type === 'bleed' ? '4 3' : undefined} />
                {p.type === 'im3' && <path d={`M${px - 5},${top + 3} L${px},${top - 5} L${px + 5},${top + 3} Z`} />}
                {p.type === 'im3t' && <path d={`M${px},${top - 6} L${px + 5},${top} L${px},${top + 6} L${px - 5},${top} Z`} />}
                {p.type === 'im5' && <circle cx={px} cy={top} r={3.5} />}
                {/* wide invisible target for the pointer */}
                <rect x={px - 6} y={top - 8} width={12} height={h + 10} className={styles.hitArea} />
              </g>
            );
          })}

          {/* Axis */}
          <line x1={LABEL} x2={W - RIGHT} y1={rowsTop - 8} y2={rowsTop - 8} className={styles.axis} />
          {ticks.map(t => (
            <g key={`t${t}`}>
              <line x1={x(t)} x2={x(t)} y1={rowsTop - 12} y2={rowsTop - 8} className={styles.axis} />
              <text x={x(t)} y={rowsTop - 14} textAnchor="middle" className={styles.tick}>
                {t}
              </text>
            </g>
          ))}

          {/* Channel systems */}
          {layout.map(({s, lanes, n: nLanes}, r) => {
            const y = rowY[r];
            const rowH = ROW_H + (nLanes - 1) * (ROW_H - 6);
            return (
              <g key={s.id} style={bandStyle(s.id)}>
                {r % 2 === 0 && <rect x={0} y={y} width={W} height={rowH} className={styles.rowStripe} />}
                <rect x={2} y={y + rowH / 2 - 5} width={4} height={10} rx={2} className={styles.rowSwatch} />
                <text x={10} y={y + rowH / 2 + 4} className={styles.rowLabel}>
                  {s.name}
                </text>
                {lanes.map(({c, lane}) => {
                  const chosen = setIds.has(c.id);
                  const same = !chosen && setFreqs.has(c.mhz);
                  const n = nearest(c.mhz);
                  const lv = !chosen && !same && n.d < 20 ? levelClass(n.d) : '';
                  const w = chipW(c.id);
                  const cy = y + 4 + lane * (ROW_H - 6);
                  return (
                    <g
                      key={c.id}
                      className={styles.chan}
                      onClick={() => onToggle(c.id)}
                      onMouseEnter={() => setHover({kind: 'channel', id: c.id})}>
                      <rect
                        x={x(c.mhz) - w / 2}
                        y={cy}
                        width={w}
                        height={ROW_H - 8}
                        rx={4}
                        className={`${styles.chanRect} ${chosen ? styles.chanChosen : ''} ${same ? styles.chanSame : ''} ${lv}`}
                      />
                      <text x={x(c.mhz)} y={cy + (ROW_H - 8) / 2 + 4} textAnchor="middle" className={`${styles.chanText} ${chosen ? styles.chanTextChosen : ''}`}>
                        {c.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.legend}>
        <span><svg width="14" height="12"><path d="M2,11 L7,2 L12,11 Z" className={styles.legendShape} /></svg> {translate({id: 'imd.legend.im3', message: '2-pilot IMD (2·A − B)'})}</span>
        <span><svg width="14" height="14"><path d="M7,1 L13,7 L7,13 L1,7 Z" className={styles.legendShape} /></svg> {translate({id: 'imd.legend.im3t', message: '3-pilot IMD (A + B − C)'})}</span>
        <span><svg width="12" height="12"><circle cx="6" cy="6" r="4" className={styles.legendShape} /></svg> {translate({id: 'imd.legend.im5', message: '5th order (like 3·A − 2·B, weaker; shown when close)'})}</span>
        {showBleed && <span><svg width="16" height="10"><line x1="0" x2="16" y1="5" y2="5" strokeDasharray="4 3" className={styles.legendLine} /></svg> {translate({id: 'imd.legend.bleed', message: 'VTX bleed'})}</span>}
        <span><i className={`${styles.swatch} ${styles.lv_bad}`} /> {translate({id: 'imd.legend.bad', message: 'lands on a channel (under 10 MHz)'})}</span>
        <span><i className={`${styles.swatch} ${styles.lv_warn}`} /> {translate({id: 'imd.legend.warn', message: 'close (10–20 MHz)'})}</span>
        {outside > 0 && (
          <span className={styles.muted}>
            {translate({id: 'imd.legend.outside', message: '{n} close products are outside the view (show the low band)'}, {n: outside})}
          </span>
        )}
      </div>
    </div>
  );
}
