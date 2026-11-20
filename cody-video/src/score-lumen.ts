/**
 * The third piece: LUMEN. No letters, so nothing to spell. Same tempo and the
 * same instruments as the other two, but a different song: F major instead of
 * F minor, a half-time beat (kick on one, snare on three) instead of four on
 * the floor, and sixteenth-note plucks running the whole way through.
 *
 * The picture reads these lists directly: every kick, snare, roll and tom
 * below moves the cloud.
 */
import {
  type ArpNote,
  type BassNote,
  type Hat,
  type Kick,
  type LeadNote,
  type Pad,
  type Score,
  type Snare,
  type Stab,
  bar,
} from "./score";

const C = 0;
const D = 2;
const E = 4;
const F = 5;
const G = 7;
const A = 9;
const Bb = 10;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

// One chord per bar. Build: Dm - Bb - F - Csus. Drop: Bb - Dm - C - F.
const CHORDS = {
  Dm: [m(D, 3), m(A, 3), m(D, 4), m(F, 4)],
  Bb: [m(Bb, 3), m(D, 4), m(F, 4), m(C, 5)],
  F: [m(F, 3), m(C, 4), m(F, 4), m(A, 4)],
  Csus: [m(C, 4), m(F, 4), m(G, 4), m(C, 5)],
  Dm7: [m(D, 4), m(F, 4), m(A, 4), m(C, 5)],
  C: [m(G, 3), m(C, 4), m(E, 4), m(G, 4)],
  FFinal: [m(F, 3), m(C, 4), m(G, 4), m(A, 4), m(C, 5), m(F, 5)],
};

// ---------------------------------------------------------------- drums
/** Half-time: kick on one and on the "and" of two, snare on three, kick on the "and" of four. */
const kicks: Kick[] = [
  { beat: 1, vel: 1, heavy: true },
  { beat: 4.5, vel: 0.85, heavy: false },
];
for (const b of [bar(2), bar(3), bar(5), bar(6), bar(7)]) {
  kicks.push({ beat: b, vel: b === bar(5) ? 1 : 0.92, heavy: b === bar(5) });
  kicks.push({ beat: b + 1.5, vel: 0.9, heavy: false });
  if (b >= bar(3)) kicks.push({ beat: b + 2.75, vel: 0.5, heavy: false });
  if (b !== bar(7)) kicks.push({ beat: b + 3.5, vel: 0.88, heavy: false });
}
kicks.push({ beat: 13, vel: 0.92, heavy: false });
kicks.push({ beat: 14, vel: 0.92, heavy: false });
kicks.push({ beat: 29, vel: 1, heavy: true });
export const L_KICKS = kicks.sort((a, b) => a.beat - b.beat);
/** Kicks strong enough to move the picture. */
export const L_PULSES = L_KICKS.filter((x) => x.vel > 0.8).map((x) => x.beat);

/** The backbeat: one snare per bar, on three. */
export const BACKBEATS = [7, 11, 19, 23, 27];
/** Build-up roll: 8ths, then 16ths, then 32nds. */
export const ROLL = [
  13, 13.5, 14, 14.5, 15, 15.25, 15.5, 15.75, 16, 16.125, 16.25, 16.375,
];
const snares: Snare[] = [
  ...BACKBEATS.map((beat) => ({
    beat,
    vel: beat < 17 ? 0.85 : 1,
    pitch: 0.92,
  })),
  ...ROLL.map((beat, i) => ({
    beat,
    vel: 0.22 + i * 0.065,
    pitch: 1 + i * 0.045,
  })),
];
const claps = BACKBEATS.map((beat) => ({ beat, vel: beat < 17 ? 0.6 : 0.9 }));

const hats: Hat[] = [];
// bar 2: eighths
for (let b = bar(2); b < bar(3); b += 0.5)
  hats.push({ beat: b, vel: b % 1 === 0 ? 0.25 : 0.55, open: false });
// bar 3 until the kick leaves: sixteenths
for (let b = bar(3); b < 15; b += 0.25) {
  const frac = b % 1;
  hats.push({
    beat: b,
    vel: frac === 0.5 ? 0.6 : frac === 0 ? 0.22 : 0.32,
    open: false,
  });
}
// the drop: sixteenths, open on the off-beats, a 32nd flick into every snare
for (let b = bar(5); b < 28; b += 0.25) {
  const frac = b % 1;
  if (frac === 0.5) hats.push({ beat: b, vel: 0.6, open: true });
  else hats.push({ beat: b, vel: frac === 0 ? 0.22 : 0.36, open: false });
}
for (const s of [19, 23, 27])
  hats.push({ beat: s - 0.125, vel: 0.42, open: false });

/** The fill before the final hit: four toms climbing to the tonic. */
export const L_FILL = [28, 28.25, 28.5, 28.75];
const toms = L_FILL.map((beat, i) => ({
  beat,
  midi: [m(G, 2), m(A, 2), m(C, 3), m(D, 3)][i],
  vel: 0.8 + i * 0.07,
  pan: -0.45 + i * 0.3,
}));

// ---------------------------------------------------------------- bass
/** Each bar's root follows the kick: long, short, long, short. */
const RHYTHM = [
  { at: 0, dur: 1.3 },
  { at: 1.5, dur: 0.4 },
  { at: 2, dur: 1.3 },
  { at: 3.5, dur: 0.4 },
];
const bass: BassNote[] = [
  { beat: 1, dur: 3.3, midi: m(D, 2), vel: 0.9, bright: 0.2 },
];
const bassBar = (barNo: number, midi: number, bright: number, hits = 4) =>
  RHYTHM.slice(0, hits).forEach((r, i) =>
    bass.push({
      beat: bar(barNo) + r.at,
      dur: r.dur,
      midi,
      vel: i % 2 === 0 ? 1 : 0.9,
      bright,
    }),
  );
bassBar(2, m(Bb, 2), 0.3);
bassBar(3, m(F, 2), 0.45);
for (const b of [13, 14, 15, 15.5, 16, 16.25])
  bass.push({
    beat: b,
    dur: b < 15 ? 0.7 : 0.2,
    midi: m(C, 3),
    vel: 0.95,
    bright: 0.4 + (b - 13) * 0.15,
  });
bassBar(5, m(Bb, 2), 1);
bassBar(6, m(D, 3), 1);
bassBar(7, m(C, 3), 1, 3);
bass.push({ beat: 29, dur: 3.2, midi: m(F, 2), vel: 1, bright: 0.7 });

// ---------------------------------------------------------------- chords
/** The build: one slow chord per bar, opening up. */
const pads: Pad[] = [
  {
    beat: 0.6,
    dur: 4.3,
    notes: CHORDS.Dm,
    vel: 0.75,
    bright: 0.2,
    attack: 0.5,
  },
  {
    beat: 5,
    dur: 3.9,
    notes: CHORDS.Bb,
    vel: 0.85,
    bright: 0.38,
    attack: 0.12,
  },
  { beat: 9, dur: 3.9, notes: CHORDS.F, vel: 0.9, bright: 0.55, attack: 0.1 },
  {
    beat: 13,
    dur: 3.45,
    notes: CHORDS.Csus,
    vel: 0.95,
    bright: 0.8,
    attack: 0.1,
  },
  // the drop: the same chords as the stabs, held underneath them
  { beat: 17, dur: 3.9, notes: CHORDS.Bb, vel: 0.7, bright: 0.9, attack: 0.02 },
  {
    beat: 21,
    dur: 3.9,
    notes: CHORDS.Dm7,
    vel: 0.7,
    bright: 0.9,
    attack: 0.02,
  },
  { beat: 25, dur: 2.9, notes: CHORDS.C, vel: 0.7, bright: 0.9, attack: 0.02 },
  {
    beat: 29,
    dur: 3.4,
    notes: CHORDS.FFinal,
    vel: 0.75,
    bright: 0.75,
    attack: 0.01,
  },
];

const stabs: Stab[] = [];
const stabBar = (barNo: number, notes: number[], hits = 4) =>
  RHYTHM.slice(0, hits).forEach((r, i) =>
    stabs.push({
      beat: bar(barNo) + r.at,
      dur: r.dur,
      notes,
      vel: i % 2 === 0 ? 1 : 0.8,
      bright: 1,
      decay: 0.3,
    }),
  );
stabBar(5, CHORDS.Bb);
stabBar(6, CHORDS.Dm7);
stabBar(7, CHORDS.C, 3);
stabs.push({
  beat: 29,
  dur: 3.6,
  notes: CHORDS.FFinal,
  vel: 1,
  bright: 1,
  decay: 0.9,
});

// ---------------------------------------------------------------- plucks
/** Sixteenths from the first bar to the fill: the sparkle on the cloud. */
export const SPARKLE_FROM = 1;
export const SPARKLE_TO = 28;
const UP_DOWN: Record<number, number[]> = {
  1: [m(D, 4), m(A, 4), m(D, 5), m(F, 5), m(A, 5), m(F, 5), m(D, 5), m(A, 4)],
  2: [m(D, 4), m(F, 4), m(Bb, 4), m(D, 5), m(F, 5), m(D, 5), m(Bb, 4), m(F, 4)],
  3: [m(C, 4), m(F, 4), m(A, 4), m(C, 5), m(F, 5), m(C, 5), m(A, 4), m(F, 4)],
  4: [m(C, 4), m(G, 4), m(C, 5), m(F, 5), m(G, 5), m(F, 5), m(C, 5), m(G, 4)],
  5: [m(D, 5), m(F, 5), m(Bb, 5), m(D, 6), m(F, 6), m(D, 6), m(Bb, 5), m(F, 5)],
  6: [m(D, 5), m(A, 5), m(D, 6), m(F, 6), m(A, 6), m(F, 6), m(D, 6), m(A, 5)],
  7: [m(C, 5), m(G, 5), m(C, 6), m(E, 6), m(G, 6), m(E, 6), m(C, 6), m(G, 5)],
};
const arp: ArpNote[] = [];
for (let b = SPARKLE_FROM; b < SPARKLE_TO; b += 0.25) {
  if (b >= 16.5 && b < 17) continue;
  const barNo = Math.floor((b - 1) / 4) + 1;
  const step = Math.round((b - bar(barNo)) * 4);
  const build = Math.min(1, (b - 1) / 15.5);
  arp.push({
    beat: b,
    midi: UP_DOWN[barNo][step % 8] + (b >= 15 && b < 17 ? 12 : 0),
    vel: b >= 17 ? 0.5 : 0.3 + build * 0.5,
    bright: b >= 17 ? 0.85 : 0.08 + build * build * 0.9,
  });
}

// ---------------------------------------------------------------- melody
const L = (
  beat: number,
  pc: number,
  oct: number,
  dur: number,
  vel = 0.8,
): LeadNote => ({ beat, dur, midi: m(pc, oct), vel });
/** A pentatonic line on the rhythm of the kick, climbing to the last bar. */
const lead: LeadNote[] = [
  L(17, D, 6, 1.2),
  L(18.5, F, 6, 0.4, 0.7),
  L(19, D, 6, 1.2),
  L(20.5, C, 6, 0.4, 0.7),
  L(21, A, 5, 1.2),
  L(22.5, C, 6, 0.4, 0.7),
  L(23, D, 6, 1.2),
  L(24.5, F, 6, 0.4, 0.7),
  L(25, G, 6, 1.2),
  L(26.5, E, 6, 0.4, 0.7),
  L(27, C, 6, 0.45),
  L(27.5, D, 6, 0.22, 0.7),
  L(27.75, E, 6, 0.22, 0.75),
  L(29, F, 6, 2.2, 0.8),
  L(29, F, 5, 2.2, 0.7),
];

/** The last three notes: three lights landing on the finished sphere. */
export const L_LANDINGS = [30, 30.5, 30.75];
const bells = [
  // the build hints at the melody
  { beat: 5, midi: m(D, 6), vel: 0.55 },
  { beat: 7, midi: m(F, 6), vel: 0.6 },
  { beat: 9, midi: m(A, 5), vel: 0.7 },
  { beat: 10.5, midi: m(C, 6), vel: 0.7 },
  { beat: 11, midi: m(D, 6), vel: 0.8 },
  { beat: 12.5, midi: m(F, 6), vel: 0.8 },
  { beat: 30, midi: m(F, 6), vel: 1 },
  { beat: 30.5, midi: m(A, 6), vel: 0.6 },
  { beat: 30.75, midi: m(C, 7), vel: 0.38 },
];

export const LUMEN_SCORE: Score = {
  KICKS: L_KICKS,
  CLAPS: claps,
  SNARES: snares,
  HATS: hats,
  TOMS: toms,
  TICKS: [],
  BASS: bass,
  STABS: stabs,
  PADS: pads,
  ARP: arp,
  LEAD: lead,
  BELLS: bells,
  IMPACTS: [
    { beat: 1, size: 0.8 },
    { beat: 17, size: 1.2 },
    { beat: 29, size: 1.05 },
  ],
  RISERS: [],
  THUNDER: [],
  SFX: [],
  GAIN: [],
};
