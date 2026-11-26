import {translate} from '@docusaurus/Translate';
import {fullName, type SetChannel} from './channels';
import type {Product} from './engine';

export const fmt = (mhz: number) => (Number.isInteger(mhz) ? String(mhz) : mhz.toFixed(1));

export function formula(p: Product, set: SetChannel[]): string {
  const n = (i: number) => fullName(set[i]);
  switch (p.type) {
    case 'im3':
      return `2·${n(p.from[0])} − ${n(p.from[1])}`;
    case 'im3t':
      return `${n(p.from[0])} + ${n(p.from[1])} − ${n(p.from[2])}`;
    case 'im5':
      return `3·${n(p.from[0])} − 2·${n(p.from[1])}`;
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
    return `${head}, ${translate({id: 'imd.desc.away', message: '{d} MHz away'}, {d: fmt(d)})}`;
  }
  if (p.hit < 0) return head;
  const target = fullName(set[p.hit]);
  if (p.dist < 1) return `${head}, ${translate({id: 'imd.desc.on', message: 'right on {ch}'}, {ch: target})}`;
  return `${head}, ${translate({id: 'imd.desc.from', message: '{d} MHz from {ch}'}, {d: fmt(p.dist), ch: target})}`;
}
