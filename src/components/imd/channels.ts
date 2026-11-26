// 5.8 GHz FPV channel tables used by the IMD tool (/tools/imd/).
//
// Sources (checked 2026-11-26):
// - Analog bands R, F, E, B, A, L: the standard VTX tables (Betaflight / RotorHazard).
// - HDZero: hd-zero.github.io/hdzero-vtx-docs. Every VTX has R1-R8, E1, F1, F2, F4;
//   L1-L8 only after the low band is unlocked.
// - Walksnail Avatar: Avatar VRX manual and oscarliang.com/fpv-channels. Race mode uses
//   the analog Raceband frequencies, so it is the Raceband row.
// - DJI V1 / Vista / Air Unit: dji.com/support/product/fpv. Channel 8 is the public channel.
// - DJI O3 and O4: dji.com/support/product/o3-air-unit and .../o4-air-unit.
//   O4 race mode uses Raceband, like Walksnail.
//
// `width` is the rough occupied bandwidth in MHz, only used to draw the channel.

export type Channel = {
  id: string; // unique, used in share links
  name: string; // short label, e.g. "R1" or "CH8"
  mhz: number;
};

export type ChannelSystem = {
  id: string;
  name: string;
  width: number;
  channels: Channel[];
  // CE (EU) mode only offers these channel names.
  ce?: string[];
};

const band = (prefix: string, mhz: number[], idPrefix = prefix): Channel[] =>
  mhz.map((f, i) => ({id: `${idPrefix}${i + 1}`, name: `${prefix}${i + 1}`, mhz: f}));

export const RACEBAND = [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917];
export const FATSHARK = [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880];
export const BAND_E = [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945];
export const BAND_B = [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866];
export const BAND_A = [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725];
export const LOWBAND = [5362, 5399, 5436, 5473, 5510, 5547, 5584, 5621];

const DJI_FCC: Channel[] = [
  {id: 'dj1', name: 'CH1', mhz: 5660},
  {id: 'dj2', name: 'CH2', mhz: 5695},
  {id: 'dj3', name: 'CH3', mhz: 5735},
  {id: 'dj4', name: 'CH4', mhz: 5770},
  {id: 'dj5', name: 'CH5', mhz: 5805},
  {id: 'dj6', name: 'CH6', mhz: 5878},
  {id: 'dj7', name: 'CH7', mhz: 5914},
  {id: 'dj8', name: 'CH8', mhz: 5839},
];

export const SYSTEMS: ChannelSystem[] = [
  {id: 'R', name: 'Raceband', width: 20, channels: band('R', RACEBAND)},
  {id: 'F', name: 'Fatshark', width: 20, channels: band('F', FATSHARK)},
  {id: 'E', name: 'Band E', width: 20, channels: band('E', BAND_E)},
  {id: 'B', name: 'Band B', width: 20, channels: band('B', BAND_B)},
  {id: 'A', name: 'Band A', width: 20, channels: band('A', BAND_A)},
  {id: 'L', name: 'Lowband', width: 20, channels: band('L', LOWBAND)},
  {
    id: 'hz',
    name: 'HDZero',
    width: 27,
    // L1–L8 only after unlocking the low band
    channels: [
      ...band('R', RACEBAND, 'hzR'),
      {id: 'hzE1', name: 'E1', mhz: 5705},
      {id: 'hzF1', name: 'F1', mhz: 5740},
      {id: 'hzF2', name: 'F2', mhz: 5760},
      {id: 'hzF4', name: 'F4', mhz: 5800},
      ...band('L', LOWBAND, 'hzL'),
    ],
  },
  {
    id: 'ws',
    name: 'Walksnail',
    width: 20,
    // Race mode uses the Raceband channels
    channels: DJI_FCC.map(c => ({...c, id: c.id.replace('dj', 'ws')})),
    ce: ['CH1', 'CH2', 'CH3', 'CH8'],
  },
  {
    id: 'dj',
    name: 'DJI V1 / Vista',
    width: 20,
    channels: DJI_FCC,
    ce: ['CH3', 'CH4', 'CH5'],
  },
  {
    id: 'o3',
    name: 'DJI O3',
    width: 20,
    // 10/20 MHz channels, plus one 40 MHz channel
    channels: [
      {id: 'o31', name: 'CH1', mhz: 5768.5},
      {id: 'o32', name: 'CH2', mhz: 5804.5},
      {id: 'o33', name: 'CH3', mhz: 5839.5},
      {id: 'o340', name: '40M', mhz: 5794.5},
    ],
  },
  {
    id: 'o4',
    name: 'DJI O4',
    width: 20,
    // 10/20 MHz channels, plus one 40/60 MHz channel. Race mode uses Raceband
    channels: [
      {id: 'o41', name: 'CH1', mhz: 5768.5},
      {id: 'o42', name: 'CH2', mhz: 5789.5},
      {id: 'o43', name: 'CH3', mhz: 5814.5},
      {id: 'o440', name: '40M', mhz: 5794.5},
    ],
  },
];

// Wide DJI channels: drawn wider than the system default.
export const WIDE: Record<string, number> = {o340: 40, o440: 40};

export type SetChannel = Channel & {system: string; width: number};

const BY_ID = new Map<string, SetChannel>();
for (const s of SYSTEMS) {
  for (const c of s.channels) BY_ID.set(c.id.toLowerCase(), {...c, system: s.id, width: WIDE[c.id] ?? s.width});
}

// A custom channel is written as its frequency, e.g. "5800" or "5794.5".
export function channelById(id: string): SetChannel | undefined {
  const known = BY_ID.get(id.toLowerCase());
  if (known) return known;
  const mhz = Number(id);
  if (Number.isFinite(mhz) && mhz >= 4900 && mhz <= 6200) {
    return {id: String(mhz), name: `${mhz}`, mhz, system: 'custom', width: 20};
  }
  return undefined;
}

export function systemName(id: string): string {
  return SYSTEMS.find(s => s.id === id)?.name ?? '';
}

// Label that also says which system a channel belongs to, where the short name is ambiguous.
export function fullName(c: SetChannel): string {
  if (c.system === 'custom') return `${c.mhz} MHz`;
  if (['R', 'F', 'E', 'B', 'A', 'L'].includes(c.system)) return c.name;
  return `${systemName(c.system)} ${c.name}`;
}

// EU / Germany: 5725-5875 MHz, 25 mW EIRP.
export const EU_MIN = 5725;
export const EU_MAX = 5875;
export const inEU = (mhz: number) => mhz >= EU_MIN && mhz <= EU_MAX;

// Pools for "Find the cleanest channels". Each is a list of channel ids.
export type Pool = {id: string; label: string; ids: string[]};
const ids = (sys: string) => SYSTEMS.find(s => s.id === sys)!.channels.map(c => c.id);
export const POOLS: Pool[] = [
  // Max's HDZero list: Raceband, F2 and F4 (E1 and F1 are left out), plus the low band.
  {id: 'hz', label: 'HDZero', ids: [...ids('R'), 'F2', 'F4']},
  {id: 'hzL', label: 'HDZero + low band', ids: [...ids('R'), 'F2', 'F4', ...ids('L')]},
  {id: 'R', label: 'Raceband', ids: ids('R')},
  {id: 'F', label: 'Fatshark', ids: ids('F')},
  {id: 'analog', label: 'All analog', ids: [...ids('R'), ...ids('F'), ...ids('E'), ...ids('B'), ...ids('A'), ...ids('L')]},
  {id: 'ws', label: 'Walksnail', ids: ids('ws')},
  {id: 'dj', label: 'DJI V1 / Vista', ids: ids('dj')},
  {id: 'o4', label: 'DJI O4', ids: ids('o4')},
];

// Known sets for the IMD chart.
export const PRESETS: {label: string; ids: string[]}[] = [
  {label: 'R1 R3 R6 R7 (RotorHazard 4)', ids: ['R1', 'R3', 'R6', 'R7']},
  {label: 'R1 R3 R6 R8', ids: ['R1', 'R3', 'R6', 'R8']},
  {label: 'IMD 6C (R1 R2 F2 F4 R7 R8)', ids: ['R1', 'R2', 'F2', 'F4', 'R7', 'R8']},
  {label: 'Raceband R1–R8', ids: ids('R')},
];
