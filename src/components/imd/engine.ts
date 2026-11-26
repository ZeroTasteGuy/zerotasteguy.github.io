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
export const tier = (d: number) => (d < 10 ? 0 : d < 20 ? 1 : d < ET_LIMIT ? 2 : 3);

// ---------- Ranking ----------
// Distances only get smaller as channels are added, so all of these are "bigger is better"
// numbers that can only fall as a set grows. That lets the search drop a partial set as
// soon as it can no longer reach the top 10.

export type Priority = 'imd' | 'bleed' | 'et';

export type Metrics = {
  et: number;
  t: number; // ET's raw penalty
  minSep: number;
  im3: number;
  im3t: number;
  im5: number;
  bleed: number;
  hits: number; // products of any kind (bleed too) less than 10 MHz from a channel
};

export function metrics(f: number[], bleedOffset: number): Metrics {
  const n = f.length;
  let t = 0;
  let im3 = Infinity;
  let im3t = Infinity;
  let im5 = Infinity;
  let bleed = Infinity;
  let minSep = Infinity;
  let hits = 0;
  const near = (p: number, a: number, b: number, c: number) => {
    let d = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === a || i === b || i === c) continue;
      const x = p - f[i];
      const ax = x < 0 ? -x : x;
      if (ax < d) d = ax;
    }
    if (d < 10) hits++;
    return d;
  };
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (a < b) minSep = Math.min(minSep, Math.abs(f[a] - f[b]));
      const p = 2 * f[a] - f[b];
      im3 = Math.min(im3, near(p, a, b, -1));
      im5 = Math.min(im5, near(3 * f[a] - 2 * f[b], a, b, -1));
      if (p >= ET_MIN && p <= ET_MAX) {
        let d = Infinity;
        for (const x of f) d = Math.min(d, Math.abs(p - x));
        if (d < ET_LIMIT) t += (ET_LIMIT - d) ** 2;
      }
      if (a < b) {
        for (let c = 0; c < n; c++) {
          if (c === a || c === b) continue;
          im3t = Math.min(im3t, near(f[a] + f[b] - f[c], a, b, c));
        }
      }
    }
    if (bleedOffset > 0) {
      bleed = Math.min(bleed, near(f[a] - bleedOffset, a, -1, -1), near(f[a] + bleedOffset, a, -1, -1));
    }
  }
  return {et: n ? 100 - Math.floor(Math.floor(t / 5) / n) : 100, t, minSep, im3, im3t, im5, bleed, hits};
}

// Sort key, compared left to right, bigger is better. `finalN` turns ET's rating of a
// partial set into an upper bound for the full set (T can only grow).
export function rankKey(m: Metrics, priority: Priority, finalN: number): number[] {
  const et = 100 - Math.floor(Math.floor(m.t / 5) / finalN);
  const imd = tier(Math.min(m.im3, m.im3t));
  const sep = Math.min(m.minSep, 200);
  if (priority === 'et') return [et, sep, imd, tier(m.im5), -m.hits];
  if (priority === 'bleed') return [tier(m.bleed), imd, tier(m.im5), et, -m.hits, sep];
  return [imd, tier(m.bleed), tier(m.im5), et, -m.hits, sep];
}

export function compareKeys(x: number[], y: number[]): number {
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

// ---------- Search ----------

export type SearchInput = {
  pool: {id: string; mhz: number}[];
  pilots: number;
  minSep: number;
  bleedOffset: number;
  priority: Priority;
  must: string[]; // ids that every result has to contain
  top?: number;
  timeLimitMs?: number;
};

export type SearchResult = {ids: string[]; mhz: number[]; m: Metrics; key: number[]};

export type SearchDone = {results: SearchResult[]; checked: number; complete: boolean; ms: number};

export function search(input: SearchInput, onProgress?: (checked: number) => void): SearchDone {
  const start = Date.now();
  const top = input.top ?? 10;
  const limit = input.timeLimitMs ?? 15000;
  // One entry per frequency (R7 and F8 are both 5880), lowest first.
  const seen = new Set<number>();
  const pool = [...input.pool]
    .sort((a, b) => a.mhz - b.mhz)
    .filter(c => (seen.has(c.mhz) ? false : (seen.add(c.mhz), true)));
  const must = pool.filter(c => input.must.includes(c.id));
  const rest = pool.filter(c => !input.must.includes(c.id));
  const N = input.pilots;
  const results: SearchResult[] = [];
  let checked = 0;
  let stopped = false;

  const worst = () => (results.length < top ? null : results[results.length - 1].key);
  const insert = (r: SearchResult) => {
    let i = results.length;
    while (i > 0 && compareKeys(r.key, results[i - 1].key) > 0) i--;
    results.splice(i, 0, r);
    if (results.length > top) results.pop();
  };

  const chosen: {id: string; mhz: number}[] = [...must];
  const freqs = () => chosen.map(c => c.mhz);

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
    if (chosen.length >= 2) {
      const m = metrics(freqs(), input.bleedOffset);
      if (m.minSep < input.minSep) return;
      const key = rankKey(m, input.priority, N);
      const w = worst();
      if (w && compareKeys(key, w) <= 0) return;
      if (chosen.length === N) {
        insert({ids: chosen.map(c => c.id), mhz: freqs(), m, key});
        return;
      }
    }
    if (chosen.length === N) return;
    for (let i = from; i <= rest.length - (N - chosen.length); i++) {
      chosen.push(rest[i]);
      dfs(i + 1);
      chosen.pop();
      if (stopped) return;
    }
  }

  if (must.length <= N && pool.length >= N) {
    if (must.length === N) {
      const m = metrics(freqs(), input.bleedOffset);
      insert({ids: chosen.map(c => c.id), mhz: freqs(), m, key: rankKey(m, input.priority, N)});
    } else dfs(0);
  }
  for (const r of results) {
    const order = r.mhz.map((_, i) => i).sort((a, b) => r.mhz[a] - r.mhz[b]);
    r.ids = order.map(i => r.ids[i]);
    r.mhz = order.map(i => r.mhz[i]);
  }
  return {results, checked, complete: !stopped, ms: Date.now() - start};
}
