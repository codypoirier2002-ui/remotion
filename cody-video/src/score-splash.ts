/**
 * The fourth piece: SPLASH. Same tempo, same instruments and the same form as
 * CODY (four hits, groove, build, silence, drop, fill, last hit), but a new
 * song in A minor: A minor, F, C, G. Four chords, and in the picture four
 * colours that take turns flooding the screen.
 *
 * The picture reads these lists directly.
 */
import {
  type ArpNote,
  type BassNote,
  type Hat,
  type Kick,
  type LeadNote,
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
const Gs = 8;
const A = 9;
const B = 11;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

const CHORDS = {
  Am: [m(A, 3), m(C, 4), m(E, 4), m(A, 4)],
  F: [m(F, 3), m(A, 3), m(C, 4), m(F, 4)],
  C: [m(G, 3), m(C, 4), m(E, 4), m(G, 4)],
  G: [m(G, 3), m(B, 3), m(D, 4), m(G, 4)],
  E7: [m(Gs, 3), m(B, 3), m(D, 4), m(E, 4)],
  AmFinal: [m(A, 3), m(E, 4), m(A, 4), m(B, 4), m(C, 5), m(E, 5)],
};
const ROOT = {
  A: m(A, 2),
  F: m(F, 2),
  C: m(C, 3),
  G: m(G, 2),
  E: m(E, 2),
};

// ---------------------------------------------------------------- drums
const k = (beat: number, vel = 0.92, heavy = false): Kick => ({
  beat,
  vel,
  heavy,
});
const kicks: Kick[] = [
  // bar 1: four hits, one per chord, one per colour
  k(1, 1, true),
  k(2, 1, true),
  k(3, 1, true),
  k(4, 1, true),
  // bars 2-4: four on the floor, the kick leaves for the build-up
  ...[5, 6, 7, 8, 9, 10, 11, 12].map((b) => k(b)),
  k(12.75, 0.5),
  k(13),
  k(14),
  // bars 5-7: the drop
  k(17, 1, true),
  ...[18, 19, 20, 21, 22, 23, 24].map((b) => k(b)),
  k(24.75, 0.5),
  k(25),
  k(26),
  k(27),
  k(29, 1, true),
];
/** Kicks strong enough to move the picture. */
export const S_KICKS = kicks.filter((x) => x.vel > 0.8).map((x) => x.beat);

export const S_CLAPS = [6, 8, 10, 12, 14, 18, 20, 22, 24, 26];
/** Build-up roll: 8ths, then 16ths, then 32nds. */
export const S_ROLL = [
  13, 13.5, 14, 14.5, 15, 15.25, 15.5, 15.75, 16, 16.125, 16.25, 16.375,
];
const snares: Snare[] = [
  { beat: 4.5, vel: 0.6, pitch: 1 },
  { beat: 4.75, vel: 0.8, pitch: 1.06 },
  ...S_ROLL.map((beat, i) => ({
    beat,
    vel: 0.22 + i * 0.065,
    pitch: 1 + i * 0.045,
  })),
];

const hats: Hat[] = [];
// bar 2: off-beats
for (let b = 5; b < 9; b++)
  hats.push({ beat: b + 0.5, vel: 0.55, open: false });
// bars 3-4 until the kick leaves: sixteenths
for (let b = 9; b < 15; b += 0.25) {
  const frac = b % 1;
  hats.push({
    beat: b,
    vel: frac === 0.5 ? 0.7 : frac === 0 ? 0.22 : 0.32,
    open: false,
  });
}
// the drop: sixteenths, open on the off-beats
for (let b = 17; b < 28; b += 0.25) {
  const frac = b % 1;
  if (frac === 0.5) hats.push({ beat: b, vel: 0.62, open: true });
  else hats.push({ beat: b, vel: frac === 0 ? 0.22 : 0.36, open: false });
}

/** The fill before the last hit: four toms climbing back to A. */
export const S_FILL = [28, 28.25, 28.5, 28.75];
const toms = S_FILL.map((beat, i) => ({
  beat,
  midi: [m(A, 2), m(C, 3), m(D, 3), m(E, 3)][i],
  vel: 0.8 + i * 0.07,
  pan: -0.45 + i * 0.3,
}));

// ---------------------------------------------------------------- bass
const bass: BassNote[] = [];
// bar 1: one long root under each hit
[ROOT.A, ROOT.F, ROOT.C, ROOT.G].forEach((midi, i) =>
  bass.push({ beat: 1 + i, dur: 0.8, midi, vel: 1, bright: 0.8 }),
);
/** Off-beat bounce: the root on every "and", an octave pickup before beats 3 and 1. */
export const S_OFFBEATS: number[] = [];
const bounce = (startBeat: number, root: number, bright: number, beats = 4) => {
  for (let i = 0; i < beats; i++) {
    S_OFFBEATS.push(startBeat + i + 0.5);
    bass.push({
      beat: startBeat + i + 0.5,
      dur: 0.3,
      midi: root,
      vel: 0.95,
      bright,
    });
    if (i % 2 === 1)
      bass.push({
        beat: startBeat + i + 0.75,
        dur: 0.18,
        midi: root + 12,
        vel: 0.8,
        bright,
      });
  }
};
bounce(bar(2), ROOT.A, 0.3);
bounce(bar(3), ROOT.F, 0.5);
bounce(bar(4), ROOT.G, 0.65, 2);
bounce(bar(5), ROOT.A, 1);
// bar 6: the four chords again, one root per beat
[ROOT.A, ROOT.F, ROOT.C, ROOT.G].forEach((root, i) => {
  S_OFFBEATS.push(bar(6) + i + 0.5);
  bass.push({
    beat: bar(6) + i + 0.5,
    dur: 0.3,
    midi: root,
    vel: 0.95,
    bright: 1,
  });
  bass.push({
    beat: bar(6) + i + 0.75,
    dur: 0.18,
    midi: root + 12,
    vel: 0.8,
    bright: 1,
  });
});
bounce(bar(7), ROOT.C, 1, 2);
bounce(bar(7) + 2, ROOT.G, 1, 1);
bass.push({ beat: 29, dur: 3.2, midi: ROOT.A, vel: 1, bright: 0.7 });

// ---------------------------------------------------------------- chords
const stabs: Stab[] = [];
[CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.G].forEach((notes, i) =>
  stabs.push({
    beat: 1 + i,
    dur: 0.85,
    notes,
    vel: 1.5,
    bright: 1,
    decay: 0.3,
  }),
);
const TRESILLO = [0, 0.75, 1.5];
const tres = (
  startBeat: number,
  notes: number[],
  bright: number,
  hits = TRESILLO,
) =>
  hits.forEach((o, i) =>
    stabs.push({
      beat: startBeat + o,
      dur: 0.5,
      notes,
      vel: i === 0 ? 0.95 : 0.8,
      bright,
      decay: 0.16,
    }),
  );
tres(bar(3), CHORDS.F, 0.55);
tres(bar(3) + 2, CHORDS.F, 0.6);
tres(bar(4), CHORDS.G, 0.7);
tres(bar(4) + 2, CHORDS.E7, 0.85, [0, 0.5, 1]);
tres(bar(5), CHORDS.Am, 1);
tres(bar(5) + 2, CHORDS.Am, 1);
[CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.G].forEach((notes, i) =>
  tres(bar(6) + i, notes, 1, [0, 0.5]),
);
tres(bar(7), CHORDS.C, 1);
tres(bar(7) + 2, CHORDS.G, 1, [0, 0.75]);
stabs.push({
  beat: 29,
  dur: 3.6,
  notes: CHORDS.AmFinal,
  vel: 1,
  bright: 1,
  decay: 0.9,
});
/** The chord hits of bar 3: the ring of blobs pulses on these. */
export const S_STABS_BAR3 = [9, 9.75, 10.5, 11, 11.75, 12.5];

// ---------------------------------------------------------------- arp (build)
const ARP_PATTERNS = {
  Am: [m(A, 4), m(E, 5), m(C, 5), m(E, 5), m(A, 5), m(E, 5), m(C, 5), m(E, 5)],
  F: [m(A, 4), m(C, 5), m(F, 5), m(C, 5), m(A, 5), m(C, 5), m(F, 5), m(C, 5)],
  G: [m(G, 4), m(B, 4), m(D, 5), m(B, 4), m(G, 5), m(B, 4), m(D, 5), m(B, 4)],
  E7: [
    m(Gs, 4),
    m(B, 4),
    m(E, 5),
    m(B, 4),
    m(Gs, 5),
    m(B, 4),
    m(E, 5),
    m(B, 4),
  ],
};
const arp: ArpNote[] = [];
for (let b = 5; b < 16.5; b += 0.25) {
  const pattern =
    b < 9
      ? ARP_PATTERNS.Am
      : b < 13
        ? ARP_PATTERNS.F
        : b < 15
          ? ARP_PATTERNS.G
          : ARP_PATTERNS.E7;
  const step = Math.round((b - 1) * 4) % 8;
  const progress = (b - 5) / 11.5;
  arp.push({
    beat: b,
    midi: pattern[step] + (b >= 15 ? 12 : 0),
    vel: 0.45 + progress * 0.45,
    bright: 0.12 + progress * progress * 0.88,
  });
}

// ---------------------------------------------------------------- lead (drop)
const L = (
  beat: number,
  pc: number,
  oct: number,
  dur = 0.55,
  vel = 0.9,
): LeadNote => ({ beat, dur, midi: m(pc, oct), vel });
/** A minor pentatonic throughout, so nothing can clash with any of the four chords. */
const lead: LeadNote[] = [
  // bar 5: on the rhythm of the stabs
  L(17, A, 5),
  L(17.75, C, 6),
  L(18.5, D, 6, 0.4),
  L(19, E, 6),
  L(19.75, D, 6),
  L(20.5, C, 6, 0.4),
  // bar 6: eighths, climbing
  L(21, C, 6, 0.4),
  L(21.5, A, 5, 0.3, 0.7),
  L(22, C, 6, 0.4),
  L(22.5, D, 6, 0.3, 0.7),
  L(23, E, 6, 0.4),
  L(23.5, D, 6, 0.3, 0.7),
  L(24, E, 6, 0.4),
  L(24.5, G, 6, 0.2, 0.7),
  L(24.75, E, 6, 0.2, 0.8),
  // bar 7: the top, then down and a run back up into the fill
  L(25, G, 6),
  L(25.75, E, 6),
  L(26.5, D, 6, 0.4),
  L(27, D, 6, 0.4),
  L(27.5, E, 6, 0.25),
  L(27.75, G, 6, 0.25),
  L(29, A, 6, 2.2, 0.8),
  L(29, A, 5, 2.2, 0.7),
];
/** Bar 5: the blob throws out an arm on every one of these. */
export const S_LEAD_BAR5 = [17, 17.75, 18.5, 19, 19.75, 20.5];
/** Bar 6: one column of the equaliser jumps per note. [beat, column 0..6] */
export const S_LEAD_BAR6: [number, number][] = [
  [21, 2],
  [21.5, 1],
  [22, 2],
  [22.5, 3],
  [23, 4],
  [23.5, 3],
  [24, 4],
  [24.5, 5],
  [24.75, 4],
];

/** Bar 2: five rising notes. The last three notes of the piece: three drops landing. */
export const S_BELLS_BAR2 = [6, 6.5, 7, 7.5, 8];
export const S_LANDINGS = [30, 30.5, 30.75];
const bells = [
  { beat: 6, midi: m(A, 5), vel: 0.8 },
  { beat: 6.5, midi: m(C, 6), vel: 0.8 },
  { beat: 7, midi: m(D, 6), vel: 0.85 },
  { beat: 7.5, midi: m(E, 6), vel: 0.9 },
  { beat: 8, midi: m(A, 6), vel: 1 },
  { beat: 30, midi: m(A, 6), vel: 1 },
  { beat: 30.5, midi: m(E, 7), vel: 0.5 },
  { beat: 30.75, midi: m(A, 7), vel: 0.28 },
];

export const SPLASH_SCORE: Score = {
  KICKS: kicks,
  CLAPS: S_CLAPS.map((beat) => ({ beat, vel: 0.9 })),
  SNARES: snares,
  HATS: hats,
  TOMS: toms,
  TICKS: [],
  BASS: bass,
  STABS: stabs,
  PADS: [],
  ARP: arp,
  LEAD: lead,
  BELLS: bells,
  IMPACTS: [
    { beat: 1, size: 0.9 },
    { beat: 17, size: 1.2 },
    { beat: 29, size: 1.05 },
  ],
  RISERS: [],
  THUNDER: [],
  SFX: [],
  GAIN: [],
};
