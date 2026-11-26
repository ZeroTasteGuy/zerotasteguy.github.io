// IMD maths for the IMD tool (/tools/imd/). No React in here, so the worker can use it too.
//
// Products of a set of channels F1..Fn:
//   im3  2-pilot, 3rd order:  2·Fa − Fb
//   im3t 3-pilot, 3rd order:  Fa + Fb − Fc
//   im5  2-pilot, 5th order:  3·Fa − 2·Fb
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

export function analyze(f: number[], bleedOffset: number): Analysis {
  const n = f.length;
  const products: Product[] = [];
  const add = (type: ProductType, mhz: number, from: number[], sign?: 1 | -1) => {
    const [hit, dist] = nearestOther(f, mhz, from);
    products.push({type, mhz, from, hit, dist, sign});
  };
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b || f[a] === f[b]) continue;
      add('im3', 2 * f[a] - f[b], [a, b]);
      add('im5', 3 * f[a] - 2 * f[b], [a, b]);
    }
  }
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = 0; c < n; c++) {
        if (c === a || c === b || f[c] === f[a] || f[c] === f[b]) continue;
        add('im3t', f[a] + f[b] - f[c], [a, b, c]);
      }
    }
  }
  if (bleedOffset > 0) {
    for (let a = 0; a < n; a++) {
      add('bleed', f[a] - bleedOffset, [a], -1);
      add('bleed', f[a] + bleedOffset, [a], 1);
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
// One number per set, so sets can be ranked and compared at a glance.
// Every product adds a penalty that grows as it gets closer to a channel (ET's curve,
// scaled to 1 for a direct hit): ((35 − d) / 35)², times a weight for how strong that
// kind of interference is. Two channels closer than 35 MHz add a penalty the same way.
//   score = 100 · e^(−penalty / 2n)   → 100 = nothing within 35 MHz; for 4 pilots one
//   direct 2-pilot hit gives 88. Dividing by the number of pilots keeps 6 or 8 pilots readable.
// The penalty only grows as channels are added, which lets the search skip sets early.

export type Mode = 'balanced' | 'imd' | 'bleed';
export type Weights = Record<ProductType, number> & {gap: number};
export const WEIGHTS: Record<Mode, Weights> = {
  balanced: {im3: 1, im3t: 1, im5: 0.3, bleed: 0.6, gap: 4},
  imd: {im3: 1, im3t: 1, im5: 0.3, bleed: 0.2, gap: 4},
  bleed: {im3: 1, im3t: 1, im5: 0.3, bleed: 2, gap: 4},
};

const curve = (d: number) => (d < ET_LIMIT ? ((ET_LIMIT - d) / ET_LIMIT) ** 2 : 0);

export function penalty(f: number[], bleedOffset: number, w: Weights): number {
  const n = f.length;
  let pen = 0;
  const near = (p: number, a: number, b: number, c: number) => {
    let d = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === a || i === b || i === c) continue;
      const x = p - f[i];
      const ax = x < 0 ? -x : x;
      if (ax < d) d = ax;
    }
    return curve(d);
  };
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (a < b) {
        pen += w.gap * curve(Math.abs(f[a] - f[b]));
        for (let c = 0; c < n; c++) {
          if (c !== a && c !== b) pen += w.im3t * near(f[a] + f[b] - f[c], a, b, c);
        }
      }
      pen += w.im3 * near(2 * f[a] - f[b], a, b, -1);
      pen += w.im5 * near(3 * f[a] - 2 * f[b], a, b, -1);
    }
    if (bleedOffset > 0) pen += w.bleed * (near(f[a] - bleedOffset, a, -1, -1) + near(f[a] + bleedOffset, a, -1, -1));
  }
  return pen;
}

export const scoreOf = (pen: number, n: number) => Math.round(100 * Math.exp(-pen / (2 * Math.max(n, 1))));

// ---------- What to watch out for ----------
// Short findings for a set, used under the chart and in the search results.
export type Finding =
  | {kind: 'gap'; a: number; b: number; d: number}
  | {kind: 'hit'; type: ProductType; on: number[]; close: number[]}
  | {kind: 'neighbours'; pairs: [number, number][]};

export function findings(f: number[], analysis: Analysis): Finding[] {
  const out: Finding[] = [];
  for (let a = 0; a < f.length; a++) {
    for (let b = a + 1; b < f.length; b++) {
      const d = Math.abs(f[a] - f[b]);
      if (d < 30) out.push({kind: 'gap', a, b, d});
    }
  }
  for (const type of ['im3t', 'im3', 'im5'] as const) {
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
  return out;
}

// ---------- Search ----------

export type SearchInput = {
  pool: {id: string; mhz: number}[];
  pilots: number;
  minSep: number;
  bleedOffset: number;
  mode: Mode;
  top?: number;
  timeLimitMs?: number;
};

export type SearchResult = {ids: string[]; mhz: number[]; pen: number; score: number; et: number; minSep: number};

export type SearchDone = {results: SearchResult[]; checked: number; complete: boolean; ms: number};

export function search(input: SearchInput, onProgress?: (checked: number) => void): SearchDone {
  const start = Date.now();
  const top = input.top ?? 10;
  const limit = input.timeLimitMs ?? 15000;
  const w = WEIGHTS[input.mode];
  // One entry per frequency (R7 and F8 are both 5880), lowest first.
  const seen = new Set<number>();
  const pool = [...input.pool]
    .sort((a, b) => a.mhz - b.mhz)
    .filter(c => (seen.has(c.mhz) ? false : (seen.add(c.mhz), true)));
  const N = input.pilots;
  const results: SearchResult[] = [];
  let checked = 0;
  let stopped = false;
  const chosen: {id: string; mhz: number}[] = [];

  // Best first; ties go to the better ET rating, then the wider gap.
  const better = (x: SearchResult, y: SearchResult) =>
    x.pen !== y.pen ? x.pen < y.pen : x.et !== y.et ? x.et > y.et : x.minSep > y.minSep;
  const keys = new Set<string>();
  const insert = (r: SearchResult) => {
    const k = r.ids.join();
    if (keys.has(k)) return;
    keys.add(k);
    let i = results.length;
    while (i > 0 && better(r, results[i - 1])) i--;
    results.splice(i, 0, r);
    if (results.length > top) results.pop();
  };

  function dfs(from: number) {
    if (stopped) return;
    checked++;
    if ((checked & 4095) === 0) {
      if (Date.now() - start > limit) {
        stopped = true;
        return;
      }
      onProgress?.(checked);
    }
    const f = chosen.map(c => c.mhz);
    if (chosen.length >= 2) {
      const last = f[f.length - 1];
      for (let i = 0; i < f.length - 1; i++) if (last - f[i] < input.minSep) return;
      const pen = penalty(f, input.bleedOffset, w);
      if (results.length === top && pen > results[top - 1].pen + 1e-9) return;
      if (chosen.length === N) {
        let minSep = Infinity;
        for (let i = 1; i < f.length; i++) minSep = Math.min(minSep, f[i] - f[i - 1]);
        insert({ids: chosen.map(c => c.id), mhz: f, pen, score: scoreOf(pen, N), et: etRating(f), minSep});
        return;
      }
    }
    for (let i = from; i <= pool.length - (N - chosen.length); i++) {
      chosen.push(pool[i]);
      dfs(i + 1);
      chosen.pop();
      if (stopped) return;
    }
  }
  const make = (idx: number[]): SearchResult | null => {
    const cs = [...idx].sort((a, b) => a - b).map(i => pool[i]);
    const f = cs.map(c => c.mhz);
    let minSep = Infinity;
    for (let i = 1; i < f.length; i++) minSep = Math.min(minSep, f[i] - f[i - 1]);
    if (minSep < input.minSep) return null;
    const pen = penalty(f, input.bleedOffset, w);
    return {ids: cs.map(c => c.id), mhz: f, pen, score: scoreOf(pen, N), et: etRating(f), minSep};
  };

  // Quick local search first (swap one channel while it helps, from random starts). Good
  // sets found here make the full search below skip far more, without changing its result.
  if (pool.length >= N && pool.length > 16) {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const until = Date.now() + 250;
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
  if (pool.length >= N) dfs(0);
  return {results, checked, complete: !stopped, ms: Date.now() - start};
}
