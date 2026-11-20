/**
 * COSMOS, the music: one minute of trailer score in D minor at 150 BPM, on
 * the same synthesizer as the other pieces. Every hit here is a moment in the
 * picture; the beats come from src/cosmos/timeline.ts.
 *
 * The shape follows the film: a held breath, the bang, a quiet sky full of
 * new stars, a build through the galaxy into the supernova, the Moon-forming
 * impact, a storm, a quiet stretch for the first life, the asteroid, and then
 * drums on every beat from fire to the rocket. It ends on D major.
 */
import type {
  ArpNote,
  BassNote,
  Hat,
  Kick,
  LeadNote,
  Pad,
  Score,
  Snare,
  Stab,
} from "../score";
import {
  BIG_HITS,
  DIVIDE_BEATS,
  LIGHTNING_BEATS,
  STAR_BEATS,
} from "./timeline";

const C = 0;
const Cs = 1;
const D = 2;
const E = 4;
const F = 5;
const Fs = 6;
const G = 7;
const A = 9;
const Bb = 10;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

/** Low, wide voicings for the big brass hits. */
const LOW = {
  Dm: [m(D, 2), m(A, 2), m(D, 3), m(F, 3)],
  Bb: [m(Bb, 1), m(F, 2), m(Bb, 2), m(D, 3)],
  F: [m(F, 2), m(C, 3), m(F, 3), m(A, 3)],
  C: [m(C, 2), m(G, 2), m(C, 3), m(E, 3)],
  Gm: [m(G, 1), m(D, 2), m(G, 2), m(Bb, 2)],
  A: [m(A, 1), m(E, 2), m(A, 2), m(Cs, 3)],
  D: [m(D, 2), m(A, 2), m(D, 3), m(Fs, 3), m(A, 3), m(D, 4)],
};
/** Higher voicings for the held chords. */
const MID = {
  Dm: [m(D, 3), m(A, 3), m(E, 4), m(F, 4)],
  Bb: [m(Bb, 2), m(F, 3), m(D, 4), m(F, 4)],
  F: [m(F, 3), m(C, 4), m(G, 4), m(A, 4)],
  C: [m(C, 3), m(G, 3), m(E, 4), m(G, 4)],
  Gm: [m(G, 2), m(D, 3), m(Bb, 3), m(D, 4)],
  A: [m(A, 2), m(E, 3), m(Cs, 4), m(E, 4)],
  D: [m(D, 3), m(A, 3), m(Fs, 4), m(A, 4), m(D, 5)],
};

// ---------------------------------------------------------------- the big hits
const kicks: Kick[] = [];
const stabs: Stab[] = [];
const braaam = (beat: number, notes: number[], dur: number, vel = 1.2) =>
  stabs.push({ beat, dur, notes, vel, bright: 0.6, decay: 1.5 });
for (const b of BIG_HITS) kicks.push({ beat: b, vel: 1, heavy: true });
braaam(12, LOW.Dm, 5.5, 1.3);
braaam(18, LOW.Bb, 5, 1.1);
braaam(48, LOW.A, 3.8, 1.3);
braaam(60, LOW.Gm, 3.6, 0.8);
braaam(64, LOW.Bb, 3.6, 0.9);
braaam(68, LOW.Dm, 3.8, 1.3);
braaam(104, LOW.A, 3.6, 0.8);
braaam(108, LOW.Dm, 3.8, 1.4);
braaam(144, LOW.D, 5.5, 1.2);

// ---------------------------------------------------------------- held chords
const pads: Pad[] = [];
const pad = (
  beat: number,
  dur: number,
  notes: number[],
  vel: number,
  bright: number,
  attack: number,
) => pads.push({ beat, dur, notes, vel, bright, attack });
pad(0, 11.5, [m(D, 2), m(A, 2), m(D, 3)], 0.6, 0.15, 2.5);
pad(12, 6, MID.Dm, 0.75, 0.45, 0.05);
pad(18, 6, MID.Bb, 0.7, 0.4, 0.05);
pad(24, 8, [m(D, 3), m(A, 3), m(E, 4), m(A, 4)], 0.5, 0.25, 0.6);
pad(32, 4, MID.Bb, 0.55, 0.3, 0.3);
pad(36, 4, MID.F, 0.6, 0.35, 0.3);
pad(40, 4, MID.C, 0.65, 0.4, 0.3);
pad(44, 3.8, MID.Dm, 0.7, 0.5, 0.3);
pad(48, 4, MID.A, 0.75, 0.6, 0.02);
pad(52, 4, MID.F, 0.6, 0.35, 0.4);
pad(56, 4, MID.C, 0.6, 0.35, 0.4);
pad(60, 4, MID.Gm, 0.65, 0.4, 0.2);
pad(64, 3.8, MID.Bb, 0.7, 0.5, 0.2);
pad(68, 4, MID.Dm, 0.75, 0.5, 0.02);
pad(72, 8, [m(D, 2), m(A, 2), m(F, 3), m(A, 3)], 0.6, 0.2, 0.8);
pad(80, 4, MID.F, 0.5, 0.3, 0.5);
pad(84, 4, MID.C, 0.5, 0.3, 0.5);
pad(88, 4, MID.Dm, 0.5, 0.3, 0.5);
pad(92, 4, MID.Bb, 0.55, 0.35, 0.5);
pad(96, 4, MID.Bb, 0.6, 0.45, 0.2);
pad(100, 4, MID.C, 0.65, 0.5, 0.2);
pad(104, 3.8, MID.A, 0.7, 0.55, 0.2);
pad(108, 4, MID.Dm, 0.75, 0.5, 0.02);
const CLIMAX = [MID.Dm, MID.Bb, MID.F, MID.C, MID.Dm, MID.Bb];
const CLIMAX_LOW = [LOW.Dm, LOW.Bb, LOW.F, LOW.C, LOW.Dm, LOW.Bb];
CLIMAX.forEach((notes, i) => {
  pad(112 + i * 4, 4, notes, 0.75, 0.6, 0.1);
  braaam(112 + i * 4, CLIMAX_LOW[i], 3.6, i === 0 ? 1.2 : 1);
});
pad(136, 4, MID.Bb, 0.7, 0.4, 0.3);
pad(140, 3.9, MID.A, 0.75, 0.5, 0.3);
pad(144, 6, MID.D, 0.8, 0.5, 0.02);

// ---------------------------------------------------------------- bass
const bass: BassNote[] = [];
const hold = (beat: number, dur: number, midi: number, vel = 0.8) =>
  bass.push({ beat, dur, midi, vel, bright: 0.08 });
/** The trailer ostinato: the root on every eighth. */
const pulse = (from: number, to: number, midi: number, bright: number) => {
  for (let b = from; b < to; b += 0.5)
    bass.push({
      beat: b,
      dur: 0.35,
      midi,
      vel: b % 1 === 0 ? 0.95 : 0.75,
      bright,
    });
};
hold(0, 11.4, m(D, 2), 0.6);
hold(12, 5.8, m(D, 2));
hold(18, 5.8, m(Bb, 1));
hold(32, 3.8, m(Bb, 1), 0.6);
hold(36, 3.8, m(F, 2), 0.6);
hold(40, 3.8, m(C, 2), 0.65);
hold(44, 3.4, m(D, 2), 0.7);
hold(48, 3.8, m(A, 1));
hold(52, 3.8, m(F, 2), 0.6);
hold(56, 3.8, m(C, 2), 0.6);
pulse(60, 67.5, m(D, 2), 0.35);
hold(68, 3.8, m(D, 2));
hold(72, 7.8, m(D, 2), 0.65);
pulse(96, 100, m(Bb, 1), 0.3);
pulse(100, 104, m(C, 2), 0.4);
pulse(104, 107.5, m(A, 1), 0.55);
hold(108, 3.8, m(D, 2));
[m(D, 2), m(Bb, 1), m(F, 2), m(C, 2), m(D, 2), m(Bb, 1)].forEach((midi, i) =>
  pulse(112 + i * 4, 116 + i * 4, midi, 0.6),
);
hold(136, 3.8, m(Bb, 1), 0.75);
hold(140, 3.8, m(A, 1), 0.8);
hold(144, 5, m(D, 2), 0.85);

// ---------------------------------------------------------------- drums
/** Taiko: a low, a middle and a high drum. */
const LO = m(A, 1);
const MI = m(C, 2);
const HI = m(D, 2);
const ticks: { beat: number; midi: number; vel: number; pan: number }[] = [];
const taiko = (beat: number, midi: number, vel: number, pan = 0) =>
  ticks.push({ beat, midi, vel, pan });
// after the bang, the echoes of it
[13, 14, 14.5, 15, 16].forEach((b, i) => taiko(b, LO, 0.7 - i * 0.1));
taiko(18, LO, 0.9);
// the galaxy turns faster, into the supernova
[36, 40, 42, 44, 45, 46, 46.5, 47, 47.25, 47.5, 47.75].forEach((b, i) =>
  taiko(b, i < 4 ? LO : MI, 0.45 + i * 0.05, (i % 2) * 0.4 - 0.2),
);
// Theia closing in
[60, 62, 64, 65, 66, 66.5, 67, 67.25, 67.5, 67.75].forEach((b, i) =>
  taiko(b, i < 3 ? LO : HI, 0.5 + i * 0.05, (i % 2) * 0.4 - 0.2),
);
// the forest grows, the asteroid comes
[
  96, 98, 100, 101, 102, 103, 104, 105, 106, 106.5, 107, 107.25, 107.5, 107.75,
].forEach((b, i) =>
  taiko(b, i < 6 ? LO : MI, 0.45 + i * 0.04, (i % 2) * 0.4 - 0.2),
);
// fire to the rocket: a drum on every beat
for (let b = 112; b < 136; b++) {
  const step = (b - 112) % 4;
  taiko(
    b,
    [LO, MI, HI, MI][step],
    [1, 0.7, 0.85, 0.7][step],
    [-0.2, 0.3, 0, -0.3][step],
  );
  if (b >= 124) taiko(b + 0.5, HI, 0.45, step % 2 ? 0.4 : -0.4);
  if (step === 0) kicks.push({ beat: b, vel: 0.8, heavy: true });
  if (step === 2) kicks.push({ beat: b, vel: 0.55, heavy: false });
}

const snares: Snare[] = [];
const roll = (from: number, step: number, n: number, vel: number) => {
  for (let k = 0; k < n; k++)
    snares.push({
      beat: from + k * step,
      vel: vel * (0.5 + (0.5 * k) / n),
      pitch: 1 + k * 0.02,
    });
};
roll(119, 0.25, 4, 0.8);
roll(127, 0.25, 4, 0.9);
roll(134, 0.125, 16, 1);

const hats: Hat[] = [];
// rain on the first ocean
for (let b = 72; b < 80; b += 0.25)
  hats.push({ beat: b, vel: 0.1 + 0.12 * (((b * 37) % 7) / 7), open: false });
// the climax: eighths, opening on the off-beats
for (let b = 120; b < 136; b += 0.5)
  hats.push({ beat: b, vel: b % 1 === 0 ? 0.3 : 0.5, open: b % 1 !== 0 });

// ---------------------------------------------------------------- bells and plucks
const bells: { beat: number; midi: number; vel: number }[] = [];
const bell = (beat: number, midi: number, vel: number) =>
  bells.push({ beat, midi, vel });
// the point, pulsing in the dark
[
  [2, m(D, 6), 0.35],
  [6, m(A, 5), 0.35],
  [9, m(D, 6), 0.4],
  [10, m(F, 6), 0.45],
  [11, m(A, 6), 0.5],
].forEach(([b, n, v]) => bell(b, n, v));
// one bell for every new star, up the scale
const STAR_NOTES = [
  m(D, 5),
  m(F, 5),
  m(A, 5),
  m(C, 6),
  m(D, 6),
  m(F, 6),
  m(G, 6),
  m(A, 6),
  m(C, 7),
  m(D, 7),
  m(F, 7),
];
STAR_BEATS.forEach((b, i) => bell(b, STAR_NOTES[i], 0.55 + i * 0.03));
// sparks of the supernova
[48.5, 49, 49.5, 50.5].forEach((b, i) =>
  bell(b, [m(A, 6), m(E, 6), m(Cs, 7), m(A, 6)][i], 0.5 - i * 0.08),
);
// the Sun: a slow, warm figure
[
  [52, m(C, 6)],
  [53, m(A, 5)],
  [54, m(F, 5)],
  [56, m(G, 5)],
  [57, m(E, 5)],
  [58, m(C, 5)],
].forEach(([b, n]) => bell(b, n, 0.4));
// life: a little tune, and two notes every time a cell divides
[
  [80, m(D, 5)],
  [80.5, m(F, 5)],
  [81, m(A, 5)],
].forEach(([b, n]) => bell(b, n, 0.45));
DIVIDE_BEATS.forEach((b, i) => {
  bell(b, [m(A, 5), m(G, 5), m(F, 5)][i], 0.55);
  bell(b + 0.5, [m(C, 6), m(C, 6), m(D, 6)][i], 0.5);
});
// a pale blue dot
[
  [137, m(A, 5)],
  [138, m(D, 6)],
  [139, m(A, 5)],
  [140, m(E, 6)],
  [141, m(Cs, 6)],
  [142, m(A, 5)],
].forEach(([b, n]) => bell(b, n, 0.4));
[
  [144, m(D, 6)],
  [144.5, m(Fs, 6)],
  [145, m(A, 6)],
  [146, m(D, 7)],
].forEach(([b, n], i) => bell(b, n, 0.55 - i * 0.08));

const arp: ArpNote[] = [];
const run = (
  from: number,
  to: number,
  chords: [number, number[]][],
  vel0: number,
  vel1: number,
  bright0: number,
  bright1: number,
) => {
  for (let b = from; b < to; b += 0.5) {
    const k = (b - from) / (to - from);
    let notes = chords[0][1];
    for (const [at, n] of chords) if (b >= at) notes = n;
    const step = Math.round((b - from) * 2);
    arp.push({
      beat: b,
      midi: notes[[0, 2, 1, 2][step % 4]],
      vel: vel0 + (vel1 - vel0) * k,
      bright: bright0 + (bright1 - bright0) * k,
    });
  }
};
const UP = {
  Bb: [m(Bb, 4), m(D, 5), m(F, 5)],
  F: [m(F, 4), m(A, 4), m(C, 5)],
  C: [m(C, 5), m(E, 5), m(G, 5)],
  Dm: [m(D, 5), m(F, 5), m(A, 5)],
};
run(
  32,
  44,
  [
    [32, UP.Bb],
    [36, UP.F],
    [40, UP.C],
  ],
  0.35,
  0.6,
  0.2,
  0.7,
);
run(
  52,
  60,
  [
    [52, UP.F],
    [56, UP.C],
  ],
  0.3,
  0.35,
  0.25,
  0.35,
);
run(
  88,
  104,
  [
    [88, UP.Dm],
    [92, UP.Bb],
    [96, UP.Bb],
    [100, UP.C],
  ],
  0.25,
  0.6,
  0.15,
  0.7,
);

// ---------------------------------------------------------------- the melody of the climax
const L = (beat: number, pc: number, oct: number, dur: number): LeadNote => ({
  beat,
  dur,
  midi: m(pc, oct),
  vel: 0.75,
});
const lead: LeadNote[] = [
  L(120, A, 5, 1.4),
  L(121.5, G, 5, 0.45),
  L(122, F, 5, 0.9),
  L(123, E, 5, 0.9),
  L(124, E, 5, 1.4),
  L(125.5, F, 5, 0.45),
  L(126, G, 5, 1.9),
  L(128, A, 5, 1.4),
  L(129.5, C, 6, 0.45),
  L(130, D, 6, 1.9),
  L(132, D, 6, 1.4),
  L(133.5, C, 6, 0.45),
  L(134, Bb, 5, 0.9),
  L(135, A, 5, 0.9),
];

export const COSMOS_SCORE: Score = {
  KICKS: kicks.sort((a, b) => a.beat - b.beat),
  CLAPS: [],
  SNARES: snares,
  HATS: hats,
  TOMS: [],
  TICKS: ticks,
  BASS: bass,
  STABS: stabs,
  PADS: pads,
  ARP: arp,
  LEAD: lead,
  BELLS: bells,
  IMPACTS: [
    { beat: 12, size: 1.3 },
    { beat: 48, size: 1.4 },
    { beat: 68, size: 1.4 },
    { beat: 108, size: 1.5 },
    { beat: 112, size: 0.6 },
    { beat: 120, size: 0.6 },
    { beat: 128, size: 0.7 },
    { beat: 136, size: 0.8 },
    { beat: 144, size: 1.2 },
  ],
  RISERS: [
    { from: 6, to: 11.5, noise: 0.5, tone: 0, lo: 0, hi: 0 },
    { from: 8, to: 11.5, noise: 0, tone: 0.4, lo: 73.4, hi: 1174.7 },
    { from: 44, to: 47.85, noise: 0.55, tone: 0.4, lo: 110, hi: 1760 },
    { from: 64, to: 67.85, noise: 0.55, tone: 0.4, lo: 146.8, hi: 1174.7 },
    { from: 104, to: 107.85, noise: 0.6, tone: 0.45, lo: 110, hi: 1760 },
    { from: 132, to: 135.9, noise: 0.5, tone: 0.35, lo: 146.8, hi: 1174.7 },
    { from: 141, to: 143.9, noise: 0.3, tone: 0.25, lo: 110, hi: 880 },
  ],
  THUNDER: [
    ...LIGHTNING_BEATS.map((beat, i) => ({
      beat,
      vel: [0.8, 0.6, 1, 0.55, 0.85][i],
    })),
    { beat: 68, vel: 0.7 },
    { beat: 108, vel: 1 },
    { beat: 109.5, vel: 0.6 },
  ],
  /** Overall level through the film, [beat, gain]; a repeated beat is a step. */
  GAIN: [
    [0, 0.85],
    [11.45, 0.85],
    [11.5, 0.02],
    [11.98, 0.02],
    [12, 1],
    [20, 1],
    [24, 0.6],
    [32, 0.65],
    [44, 0.85],
    [47.8, 1],
    [47.8, 0.12],
    [47.98, 0.12],
    [48, 1],
    [52, 0.7],
    [60, 0.75],
    [67.85, 1],
    [67.85, 0.1],
    [67.98, 0.1],
    [68, 1],
    [72, 0.75],
    [80, 0.55],
    [92, 0.6],
    [96, 0.75],
    [107.85, 1],
    [107.85, 0.08],
    [107.98, 0.08],
    [108, 1],
    [112, 0.95],
    [136, 0.95],
    [136, 0.8],
    [144, 0.9],
    [147, 0.9],
    [150, 0.2],
  ],
};
