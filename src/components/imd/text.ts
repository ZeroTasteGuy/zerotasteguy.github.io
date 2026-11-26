import {translate} from '@docusaurus/Translate';
import {fullName, type SetChannel} from './channels';
import type {Finding, Product} from './engine';

export const fmt = (mhz: number) => (Number.isInteger(mhz) ? String(mhz) : mhz.toFixed(1));

export function formula(p: Product, set: SetChannel[]): string {
  const n = (i: number) => fullName(set[i]);
  switch (p.type) {
    case 'im3':
    case 'im3t':
    case 'im5':
      // "2·R1 + R3 − R5 − R8"
      return p.from
        .map((ch, i) => {
          const c = p.coef![i];
          const term = `${Math.abs(c) === 1 ? '' : `${Math.abs(c)}·`}${n(ch)}`;
          return i === 0 ? term : `${c < 0 ? '−' : '+'} ${term}`;
        })
        .join(' ');
    case 'bleed':
      return translate(
        {id: 'imd.formula.bleed', message: 'bleed of {ch} ({sign}{offset})'},
        {ch: n(p.from[0]), sign: p.sign === 1 ? '+' : '−', offset: String(Math.abs(p.mhz - set[p.from[0]].mhz))},
      );
  }
}

export function typeName(t: Product['type']): string {
  switch (t) {
    case 'im3':
      return translate({id: 'imd.type.im3', message: '2-pilot IMD'});
    case 'im3t':
      return translate({id: 'imd.type.im3t', message: '3-pilot IMD'});
    case 'im5':
      return translate({id: 'imd.type.im5', message: '5th order IMD'});
    case 'bleed':
      return translate({id: 'imd.type.bleed', message: 'VTX bleed'});
  }
}

// "2-pilot IMD: 2·R1 − R3 = 5584 MHz, 37 MHz from R2". With `at`, the distance is
// measured to that frequency instead of to the nearest of your channels.
export function describeProduct(p: Product, set: SetChannel[], at?: number): string {
  const head = `${typeName(p.type)}: ${formula(p, set)} = ${fmt(p.mhz)} MHz`;
  if (at !== undefined) {
    const d = Math.abs(p.mhz - at);
    if (d < 1) return `${head}, ${translate({id: 'imd.desc.onIt', message: 'right on it'})}`;
    return `${head}, ${translate({id: 'imd.desc.away', message: '{d} MHz away'}, {d: fmt(d)})}`;
  }
  if (p.hit < 0) return head;
  const target = fullName(set[p.hit]);
  if (p.dist < 1) return `${head}, ${translate({id: 'imd.desc.on', message: 'right on {ch}'}, {ch: target})}`;
  return `${head}, ${translate({id: 'imd.desc.from', message: '{d} MHz from {ch}'}, {d: fmt(p.dist), ch: target})}`;
}

// "R1, R3 and R6"
export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  const and = translate({id: 'imd.list.and', message: 'and'});
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

// Plain sentences for the problems of a set (see findings() in engine.ts).
export function findingText(x: Finding, set: SetChannel[]): string {
  const n = (i: number) => fullName(set[i]);
  if (x.kind === 'gap') {
    return translate(
      {id: 'imd.issue.gap', message: '{a} and {b} are only {d} MHz apart, so they interfere directly.'},
      {a: n(x.a), b: n(x.b), d: fmt(x.d)},
    );
  }
  if (x.kind === 'neighbours') {
    const pairs = listNames(x.pairs.map(([a, b]) => `${n(a)}/${n(b)}`));
    return translate(
      {id: 'imd.issue.neighbours', message: 'Neighbours {pairs}: if a VTX bleeds, it hits the other pilot.'},
      {pairs},
    );
  }
  if (x.kind === 'low') {
    return translate(
      {id: 'imd.issue.low', message: '{ch}: outside the range of common 5.8 GHz antennas (about 5600–6000 MHz), so the picture gets weaker.'},
      {ch: listNames(x.on.map(n))},
    );
  }
  const on = listNames(x.on.map(n));
  const close = listNames(x.close.map(n));
  const what = typeName(x.type);
  if (x.on.length && x.close.length) {
    return translate({id: 'imd.issue.onClose', message: '{what} lands on {on} and close to {close}.'}, {what, on, close});
  }
  if (x.on.length) return translate({id: 'imd.issue.on', message: '{what} lands on {on}.'}, {what, on});
  return translate({id: 'imd.issue.close', message: '{what} lands close to {close}.'}, {what, close});
}
