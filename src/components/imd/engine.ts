// IMD maths for the IMD tool (/tools/imd/). No React in here, so the worker can use it too.
//
// Products of a set of channels F1..Fn:
//   im3  2-pilot, 3rd order:  2·Fa − Fb
//   im3t 3-pilot, 3rd order:  Fa + Fb − Fc
//   im5  5th order, much weaker, with 2 to 5 transmitters: 3·Fa − 2·Fb, 3·Fa − Fb − Fc,
//        2·Fa + Fb − 2·Fc, 2·Fa + Fb − Fc − Fd, Fa + Fb + Fc − 2·Fd, Fa + Fb + Fc − Fd − Fe
//   bleed: a VTX that also puts out power at its channel ± an offset (default 37 MHz,
//          one Raceband channel). Not IMD, but it lands on channels the same way.
// The distance of a product is measured to the nearest channel that did not create it.
//
// ET's rating (etheli.com IMDTabler, checked against etserv.etheli.com on 2026-11-26:
// 12 of 12 random sets gave the same number): for every ordered pair a≠b, p = 2·Fa − Fb,
// counted only inside 5100–6099 MHz; d = distance from p to the nearest channel in the set;
// if d < 35, add (35 − d)² to T. rating = 100 − floor(floor(T / 5) / n). Not clamped.

export type ProductType = 'im3' | 'im3t' | 'im5' | 'bleed';

export type Product = {
  type: ProductType;
  mhz: number;
  from: number[]; // indexes into the set: [a, b] for 2·Fa − Fb, [a, b, c] for Fa + Fb − Fc, [a] for bleed
  coef?: number[]; // IMD: the coefficient of each channel in `from` (2, −1 for 2·Fa − Fb)
  sign?: 1 | -1; // bleed: above or below the channel
  hit: number; // index of the nearest channel that did not create it, or -1
  dist: number; // distance to it in MHz (Infinity when there is none)
};

export type Analysis = {
  n: number;
  et: number;
  minSep: number;
  minSepPair: [number, number] | null;
  products: Product[];
  closest: Record<ProductType, Product | null>;
};

export const ET_LIMIT = 35;
const ET_MIN = 5100;
const ET_MAX = 6099;

export function etRating(f: number[]): number {
  const n = f.length;
  if (n === 0) return 100;
  let t = 0;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      const p = 2 * f[a] - f[b];
      if (p < ET_MIN || p > ET_MAX) continue;
      let d = Infinity;
      for (const x of f) d = Math.min(d, Math.abs(p - x));
      if (d < ET_LIMIT) t += (ET_LIMIT - d) ** 2;
    }
  }
  return 100 - Math.floor(Math.floor(t / 5) / n);
}

function nearestOther(f: number[], p: number, skip: number[]): [number, number] {
  let best = -1;
  let d = Infinity;
  for (let i = 0; i < f.length; i++) {
    if (skip.includes(i)) continue;
    const x = Math.abs(p - f[i]);
    if (x < d) {
      d = x;
      best = i;
    }
  }
  return [best, d];
}


// Every kind of IMD product as coefficients on the channels that make it. 3rd order (the
// strong ones) needs 2 or 3 transmitters, 5th order (much weaker) 2 to 5. More pilots do
// not add a new kind: they add more combinations of these.
export type Pattern = {type: Exclude<ProductType, 'bleed'>; coef: number[]};
export const PATTERNS: Pattern[] = [
  {type: 'im3', coef: [2, -1]},
  {type: 'im3t', coef: [1, 1, -1]},
  {type: 'im5', coef: [3, -2]},
  {type: 'im5', coef: [3, -1, -1]},
  {type: 'im5', coef: [2, 1, -2]},
  {type: 'im5', coef: [2, 1, -1, -1]},
  {type: 'im5', coef: [1, 1, 1, -2]},
  {type: 'im5', coef: [1, 1, 1, -1, -1]},
];
export const MAX_PILOTS = 8;

// All index tuples of a pattern for n channels: different channels, and ascending where
// coefficients repeat (A + B − C and B + A − C are the same product).
function tuplesOf(coef: number[], n: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const rec = (pos: number) => {
    if (pos === coef.length) {
      out.push([...cur]);
      return;
    }
    const start = pos > 0 && coef[pos] === coef[pos - 1] ? cur[pos - 1] + 1 : 0;
    for (let i = start; i < n; i++) {
      if (cur.includes(i)) continue;
      cur.push(i);
      rec(pos + 1);
      cur.pop();
    }
  };
  rec(0);
  return out;
}
// TUPLES[p][n]: all tuples for n channels; NEW[p][n]: only those that use channel n − 1.
const TUPLES: number[][][][] = PATTERNS.map(p => Array.from({length: MAX_PILOTS + 1}, (_, n) => tuplesOf(p.coef, n)));
const NEW: number[][][][] = TUPLES.map(byN => byN.map((ts, n) => ts.filter(t => t.includes(n - 1))));

const distinct = (f: number[], t: number[]) => {
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (f[t[i]] === f[t[j]]) return false;
  return true;
};

export function analyze(f: number[], bleedOffset: number): Analysis {
  const n = Math.min(f.length, MAX_PILOTS);
  const products: Product[] = [];
  const add = (type: ProductType, mhz: number, from: number[], coef?: number[], sign?: 1 | -1) => {
    const [hit, dist] = nearestOther(f, mhz, from);
    products.push({type, mhz, from, coef, hit, dist, sign});
  };
  PATTERNS.forEach((p, k) => {
    for (const t of TUPLES[k][n]) {
      if (!distinct(f, t)) continue;
      let mhz = 0;
      for (let i = 0; i < t.length; i++) mhz += p.coef[i] * f[t[i]];
      add(p.type, mhz, t, p.coef);
    }
  });
  if (bleedOffset > 0) {
    for (let a = 0; a < n; a++) {
      add('bleed', f[a] - bleedOffset, [a], undefined, -1);
      add('bleed', f[a] + bleedOffset, [a], undefined, 1);
    }
  }
  const closest: Analysis['closest'] = {im3: null, im3t: null, im5: null, bleed: null};
  for (const p of products) {
    const c = closest[p.type];
    if (p.hit >= 0 && (!c || p.dist < c.dist)) closest[p.type] = p;
  }
  let minSep = Infinity;
  let minSepPair: [number, number] | null = null;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const d = Math.abs(f[a] - f[b]);
      if (d < minSep) {
        minSep = d;
        minSepPair = [a, b];
      }
    }
  }
  return {n, et: etRating(f), minSep, minSepPair, products, closest};
}


// ---------- How bad is a distance ----------
// A product inside the receiver's channel (about ±10 MHz) is a direct hit; up to 20 MHz
// still hurts a 20 MHz wide analog channel's edge; ET counts anything under 35 MHz.
export type Level = 'bad' | 'warn' | 'near' | 'ok';
export function level(d: number): Level {
  if (d < 10) return 'bad';
  if (d < 20) return 'warn';
  if (d < ET_LIMIT) return 'near';
  return 'ok';
}


// ---------- Score ----------
// One number per set, so sets can be ranked and compared at a glance. It works per channel,
// because what matters is the picture each pilot gets:
//
// 1. Noise on a channel: every product that lands near it adds weight · nearness(d), where
//    d is the distance in MHz. nearness is 1 on the channel, about 0.9 at 10 MHz, 0.56 at
//    20, 0.1 at 37 (one Raceband channel away) and 0 from 60 MHz. So a near miss still
//    counts a little, and sets on the 37 MHz Raceband grid don't all tie.
//    A channel closer than 60 MHz to another one adds spacing noise to both the same way.
// 2. Each channel's noise counts as noise + even · noise² (even = 1 by default), so one channel with a lot of noise
//    costs more than the same noise spread over several channels.
// 3. A channel outside the range of common antennas gets a weaker picture, so its noise
//    counts (1 + antenna penalty) times, and the antenna penalty is added on top.
//    From the penalty per channel, x is the noise a channel would have if all had the same
//    (x + x² = penalty / n), and score = 100 / √(1 + x). So 0 noise is 100, noise of one
//    direct hit on every channel is 71, and crowded 8-pilot sets still differ (20s–30s).
// Adding a channel never lowers the penalty, which lets the search skip sets early.

export type Mode = 'balanced' | 'imd' | 'bleed';
export type Part = ProductType | 'gap' | 'edge';
export const PARTS: Part[] = ['im3', 'im3t', 'im5', 'bleed', 'gap', 'edge'];
// The priorities, all adjustable with sliders on the page:
//   im3 … bleed, gap: how much each kind of noise counts
//   edge: how much the antenna range counts (1 = the penalty below)
//   even: how much worse one badly hit channel is than the same noise spread out
//         (a channel's noise x counts as x + even · x²; 0 = only the total counts)
export type Weights = Record<ProductType, number> & {gap: number; edge: number; even: number};
export const DEFAULT_WEIGHTS: Weights = {im3: 1, im3t: 1, im5: 0.1, bleed: 0.6, gap: 3, edge: 1, even: 1};
// "Your video transmitters" only changes how much bleed counts.
export const MODE_BLEED: Record<Mode, number> = {balanced: 0.6, imd: 0.2, bleed: 2};
export const WEIGHTS: Record<Mode, Weights> = {
  balanced: DEFAULT_WEIGHTS,
  imd: {...DEFAULT_WEIGHTS, bleed: MODE_BLEED.imd},
  bleed: {...DEFAULT_WEIGHTS, bleed: MODE_BLEED.bleed},
};

export const REACH = 60;
// Looked up in steps of 0.25 MHz (channels sit on whole or half MHz), because the search
// needs it millions of times.
const STEPS = 4;
const NEAR = Float64Array.from({length: REACH * STEPS + 1}, (_, i) => {
  const c = (1 + Math.cos((Math.PI * i) / STEPS / REACH)) / 2;
  return i === REACH * STEPS ? 0 : c * c;
});
export const nearness = (d: number) => {
  if (d < 0) d = -d;
  return d >= REACH ? 0 : NEAR[Math.round(d * STEPS)];
};

// Channels outside the range of common 5.8 GHz antennas. Rated bands (maker specs):
// Foxeer Lollipop 4 5500–6000 MHz, TrueRC/Pagoda-2 5550–6050, RushFPV Cherry 2 5600–6000
// (wideband ones like the Lumenier AXII 2 go down to 5300). All of them are in spec from
// 5600 to 6000 MHz, so that costs nothing. Below 5600 more and more antennas are out of
// spec (and 5470–5725 MHz is also 5 GHz Wi-Fi); below 5500 all of them are. The penalty
// grows with the square of the distance, 1 (one direct IMD hit) at 100 MHz outside:
// L8 0, L7 ≈ 0.03, L6 ≈ 0.3, L5 ≈ 0.8, L4 ≈ 1.6, L3 ≈ 2.7, L2 ≈ 4, L1 ≈ 5.7.
export const ANT_MIN = 5600;
export const ANT_MAX = 6000;
export const edgePenalty = (mhz: number) =>
  mhz < ANT_MIN ? ((ANT_MIN - mhz) / 100) ** 2 : mhz > ANT_MAX ? ((mhz - ANT_MAX) / 100) ** 2 : 0;

export type ChannelNoise = {noise: number; parts: Record<Part, number>};
export type Noise = {pen: number; channels: ChannelNoise[]};

const emptyParts = (): Record<Part, number> => ({im3: 0, im3t: 0, im5: 0, bleed: 0, gap: 0, edge: 0});

// The full calculation, with the noise of each channel split by kind (for the bars).
export function noiseOf(f: number[], bleedOffset: number, w: Weights): Noise {
  const n = Math.min(f.length, MAX_PILOTS);
  const channels: ChannelNoise[] = Array.from({length: n}, () => ({noise: 0, parts: emptyParts()}));
  const hit = (mhz: number, mask: number, type: Part, weight: number) => {
    for (let c = 0; c < n; c++) {
      if (mask & (1 << c)) continue;
      const v = weight * nearness(mhz - f[c]);
      if (v > 0) {
        channels[c].noise += v;
        channels[c].parts[type] += v;
      }
    }
  };
  const allDistinct = new Set(f.slice(0, n)).size === n;
  PATTERNS.forEach((p, k) => {
    for (const t of TUPLES[k][n]) {
      if (!allDistinct && !distinct(f, t)) continue;
      let mhz = 0;
      let mask = 0;
      for (let i = 0; i < t.length; i++) {
        mhz += p.coef[i] * f[t[i]];
        mask |= 1 << t[i];
      }
      hit(mhz, mask, p.type, w[p.type]);
    }
  });
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const v = w.gap * nearness(f[a] - f[b]);
      for (const c of [a, b]) {
        channels[c].noise += v;
        channels[c].parts.gap += v;
      }
    }
    if (bleedOffset > 0) {
      hit(f[a] - bleedOffset, 1 << a, 'bleed', w.bleed);
      hit(f[a] + bleedOffset, 1 << a, 'bleed', w.bleed);
    }
  }
  let pen = 0;
  for (let c = 0; c < n; c++) {
    const e = w.edge * edgePenalty(f[c]);
    const ch = channels[c];
    for (const k of PARTS) ch.parts[k] *= 1 + e;
    ch.noise *= 1 + e;
    ch.parts.edge = e;
    pen += ch.noise + w.even * ch.noise * ch.noise + e;
  }
  return {pen, channels};
}

export const penalty = (f: number[], bleedOffset: number, w: Weights) => noiseOf(f, bleedOffset, w).pen;
export const scoreOf = (pen: number, n: number, even = DEFAULT_WEIGHTS.even) => {
  const p = pen / Math.max(n, 1);
  const x = even > 0 ? (Math.sqrt(1 + 4 * even * p) - 1) / (2 * even) : p;
  return Math.round(100 / Math.sqrt(1 + x));
};


// ---------- What to watch out for ----------
// Short findings for a set, used under the chart and in the search results.
export type Finding =
  | {kind: 'gap'; a: number; b: number; d: number}
  | {kind: 'hit'; type: ProductType; on: number[]; close: number[]}
  | {kind: 'neighbours'; pairs: [number, number][]}
  | {kind: 'low'; on: number[]};

export function findings(f: number[], analysis: Analysis): Finding[] {
  const out: Finding[] = [];
  for (let a = 0; a < f.length; a++) {
    for (let b = a + 1; b < f.length; b++) {
      const d = Math.abs(f[a] - f[b]);
      if (d < 30) out.push({kind: 'gap', a, b, d});
    }
  }
  // 5th order is weak, and with 4+ pilots it lands near almost every channel; the bars show it.
  for (const type of ['im3t', 'im3'] as const) {
    const on = new Set<number>();
    const close = new Set<number>();
    for (const p of analysis.products) {
      if (p.type !== type || p.hit < 0) continue;
      if (p.dist < 10) on.add(p.hit);
      else if (p.dist < 20) close.add(p.hit);
    }
    for (const i of on) close.delete(i);
    if (on.size || close.size) out.push({kind: 'hit', type, on: [...on].sort((x, y) => f[x] - f[y]), close: [...close].sort((x, y) => f[x] - f[y])});
  }
  const pairs = new Map<string, [number, number]>();
  for (const p of analysis.products) {
    if (p.type !== 'bleed' || p.hit < 0 || p.dist >= 10) continue;
    const pair: [number, number] = f[p.from[0]] < f[p.hit] ? [p.from[0], p.hit] : [p.hit, p.from[0]];
    pairs.set(pair.join(), pair);
  }
  if (pairs.size) out.push({kind: 'neighbours', pairs: [...pairs.values()]});
  const low = f.map((_, i) => i).filter(i => edgePenalty(f[i]) >= 0.25);
  if (low.length) out.push({kind: 'low', on: low});
  return out;
}


// ---------- Search ----------

export type SearchInput = {
  pool: {id: string; mhz: number}[];
  pilots: number;
  minSep: number;
  bleedOffset: number;
  weights: Weights;
  top?: number;
  timeLimitMs?: number;
};

export type Twin = {ids: string[]; mhz: number[]};
export type SearchResult = {
  ids: string[];
  mhz: number[];
  pen: number;
  score: number;
  et: number;
  minSep: number;
  worst: number; // noise on the worst channel
  twins: Twin[]; // sets that score exactly the same with the same spacing (mirrored or shifted)
};

export type SearchDone = {results: SearchResult[]; checked: number; complete: boolean; ms: number};

export function search(input: SearchInput, onProgress?: (checked: number) => void): SearchDone {
  const start = Date.now();
  const top = input.top ?? 10;
  const keep = top * 3; // more than shown, because twins are merged at the end
  const limit = input.timeLimitMs ?? 15000;
  const w = input.weights;
  const bleed = input.bleedOffset;
  // One entry per frequency (R7 and F8 are both 5880), lowest first.
  const seen = new Set<number>();
  const pool = [...input.pool]
    .sort((a, b) => a.mhz - b.mhz)
    .filter(c => (seen.has(c.mhz) ? false : (seen.add(c.mhz), true)));
  const N = Math.min(input.pilots, MAX_PILOTS);
  const results: SearchResult[] = [];
  let checked = 0;
  let stopped = false;
  if (pool.length < N || N < 1) return {results, checked, complete: true, ms: 0};

  // Best first; ties go to the set whose worst channel is better, then ET, then the wider gap.
  const better = (x: SearchResult, y: SearchResult) =>
    Math.abs(x.pen - y.pen) > 1e-9 ? x.pen < y.pen : Math.abs(x.worst - y.worst) > 1e-9 ? x.worst < y.worst : x.et !== y.et ? x.et > y.et : x.minSep > y.minSep;
  const keys = new Set<string>();
  const insert = (r: SearchResult) => {
    const k = r.ids.join();
    if (keys.has(k)) return;
    keys.add(k);
    let i = results.length;
    while (i > 0 && better(r, results[i - 1])) i--;
    results.splice(i, 0, r);
    if (results.length > keep) results.pop();
  };
  const result = (cs: {id: string; mhz: number}[], pen: number, worst: number): SearchResult => {
    const f = cs.map(c => c.mhz);
    let minSep = Infinity;
    for (let i = 1; i < f.length; i++) minSep = Math.min(minSep, f[i] - f[i - 1]);
    return {ids: cs.map(c => c.id), mhz: f, pen, score: scoreOf(pen, N, w.even), et: etRating(f), minSep, worst, twins: []};
  };

  // The search adds one channel at a time and only works out what that channel adds:
  // the noise that existing products put on it, and the new products it makes with the
  // channels before it. Products are kept on a stack and dropped again on the way back.
  const lo = pool[0].mhz - REACH;
  const hi = pool[pool.length - 1].mhz + REACH;
  const f: number[] = [];
  const chosen: {id: string; mhz: number}[] = [];
  const pm: number[] = [];
  const pw: number[] = [];
  const pmask: number[] = [];
  let plen = 0;
  const noise = Array.from({length: N + 1}, () => new Float64Array(N));
  const edge = new Float64Array(N + 1); // sum of the antenna penalties of the first k channels
  const gain = new Float64Array(N); // 1 + antenna penalty of each channel
  const push = (mhz: number, weight: number, mask: number, k: number, nz: Float64Array) => {
    if (mhz < lo || mhz > hi) return;
    pm[plen] = mhz;
    pw[plen] = weight;
    pmask[plen] = mask;
    plen++;
    for (let c = 0; c <= k; c++) {
      if (mask & (1 << c)) continue;
      const v = nearness(mhz - f[c]);
      if (v > 0) nz[c] += weight * v;
    }
  };
  const addChannel = (k: number): number => {
    const prev = noise[k];
    const nz = noise[k + 1];
    for (let c = 0; c < k; c++) nz[c] = prev[c];
    const fk = f[k];
    let own = 0;
    for (let j = 0; j < plen; j++) {
      const v = nearness(pm[j] - fk);
      if (v > 0) own += pw[j] * v;
    }
    nz[k] = own;
    for (let j = 0; j < k; j++) {
      const v = w.gap * nearness(fk - f[j]);
      nz[k] += v;
      nz[j] += v;
    }
    if (bleed > 0) {
      push(fk - bleed, w.bleed, 1 << k, k, nz);
      push(fk + bleed, w.bleed, 1 << k, k, nz);
    }
    const n = k + 1;
    for (let p = 0; p < PATTERNS.length; p++) {
      const coef = PATTERNS[p].coef;
      const weight = w[PATTERNS[p].type];
      for (const t of NEW[p][n]) {
        let mhz = 0;
        let mask = 0;
        for (let i = 0; i < t.length; i++) {
          mhz += coef[i] * f[t[i]];
          mask |= 1 << t[i];
        }
        push(mhz, weight, mask, k, nz);
      }
    }
    const e = w.edge * edgePenalty(fk);
    edge[n] = edge[k] + e;
    gain[k] = 1 + e;
    let pen = edge[n];
    for (let c = 0; c <= k; c++) {
      const x = nz[c] * gain[c];
      pen += x + w.even * x * x;
    }
    return pen;
  };

  function dfs(from: number, depth: number) {
    for (let i = from; i <= pool.length - (N - depth); i++) {
      if (stopped) return;
      if (depth > 0 && pool[i].mhz - f[depth - 1] < input.minSep) continue;
      checked++;
      if ((checked & 4095) === 0) {
        if (Date.now() - start > limit) {
          stopped = true;
          return;
        }
        onProgress?.(checked);
      }
      f.push(pool[i].mhz);
      chosen.push(pool[i]);
      const saved = plen;
      const pen = addChannel(depth);
      if (!(results.length === keep && pen > results[keep - 1].pen + 1e-9)) {
        if (depth + 1 === N) {
          let worst = 0;
          for (let c = 0; c < N; c++) worst = Math.max(worst, noise[N][c] * gain[c]);
          insert(result(chosen, pen, worst));
        } else dfs(i + 1, depth + 1);
      }
      plen = saved;
      f.pop();
      chosen.pop();
    }
  }

  const make = (idx: number[]): SearchResult | null => {
    const cs = [...idx].sort((a, b) => a - b).map(i => pool[i]);
    const fs = cs.map(c => c.mhz);
    for (let i = 1; i < fs.length; i++) if (fs[i] - fs[i - 1] < input.minSep) return null;
    const nz = noiseOf(fs, bleed, w);
    return result(cs, nz.pen, Math.max(...nz.channels.map(c => c.noise)));
  };

  // Quick local search first (swap one channel while it helps, from random starts). Good
  // sets found here make the full search below skip far more, without changing its result.
  if (pool.length > 16) {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    // Up to a quarter of the time when there are many sets (the full search may not finish).
    const until = Date.now() + (pool.length > 24 && N >= 6 ? limit / 4 : 250);
    while (Date.now() < until) {
      let cur: number[] = [];
      while (cur.length < N) {
        const i = Math.floor(rnd() * pool.length);
        if (!cur.includes(i)) cur.push(i);
      }
      let best = make(cur);
      for (let improved = true; improved; ) {
        improved = false;
        for (let k = 0; k < N; k++) {
          for (let i = 0; i < pool.length; i++) {
            if (cur.includes(i)) continue;
            const next = cur.map((x, j) => (j === k ? i : x));
            const r = make(next);
            if (r && (!best || r.pen < best.pen)) {
              best = r;
              cur = next;
              improved = true;
            }
          }
        }
      }
      if (best) insert(best);
    }
  }
  dfs(0, 0);

  // Merge twins: same score and the same spacing, mirrored or shifted (R1 R3 R6 R7 and
  // R2 R3 R6 R8). They behave the same, so they are one result with "also works as".
  const gaps = (m: number[]) => m.slice(1).map((x, i) => x - m[i]);
  const sameGaps = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-6);
  const merged: SearchResult[] = [];
  for (const r of results) {
    const g = gaps(r.mhz);
    const twin = merged.find(q => Math.abs(q.pen - r.pen) < 1e-6 && (sameGaps(gaps(q.mhz), g) || sameGaps(gaps(q.mhz), [...g].reverse())));
    if (twin) twin.twins.push({ids: r.ids, mhz: r.mhz});
    else merged.push(r);
  }
  return {results: merged.slice(0, top), checked, complete: !stopped, ms: Date.now() - start};
}
