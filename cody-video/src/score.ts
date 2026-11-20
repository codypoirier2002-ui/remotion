/**
 * The score. One beat grid shared by the synthesizer (scripts/make-music.ts)
 * and by the visuals, so picture and sound cannot drift apart.
 *
 * 132 BPM -> 15 s is exactly 33 beats: one pickup beat + 8 bars of 4/4.
 */

export const FPS = 60;
export const DURATION_SEC = 15;
export const DURATION_FRAMES = FPS * DURATION_SEC;
export const BPM = 132;
export const BEAT_SEC = 60 / BPM;

/** First beat of bar n (1-based). Beat 0 is the pickup. */
export const bar = (n: number) => 1 + (n - 1) * 4;
export const beatToFrame = (b: number) => b * BEAT_SEC * FPS;
export const frameToBeat = (f: number) => f / (BEAT_SEC * FPS);

// ---------------------------------------------------------------- pitches
const C = 0;
const Db = 1;
const E = 4;
const F = 5;
const G = 7;
const Ab = 8;
const Bb = 10;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

/** The four-note motif: one note per letter. F - Ab - Bb - C. */
export const MOTIF = [F, Ab, Bb, C] as const;

const CHORDS = {
  Fm: [m(F, 3), m(Ab, 3), m(C, 4), m(F, 4)],
  Ab: [m(Ab, 3), m(C, 4), m(Db + 2, 4), m(Ab, 4)],
  Bbm: [m(Bb, 3), m(Db, 4), m(F, 4), m(Bb, 4)],
  C: [m(C, 4), m(E, 4), m(G, 4), m(C, 5)],
  Db: [m(Ab, 3), m(Db, 4), m(F, 4), m(Ab, 4)],
  C7: [m(G, 3), m(C, 4), m(E, 4), m(Bb, 4)],
  FmFinal: [m(F, 3), m(C, 4), m(Ab, 4), m(G, 4), m(C, 5), m(F, 5)],
};

// ---------------------------------------------------------------- drums
export type Kick = { beat: number; vel: number; heavy: boolean };
const k = (beat: number, vel = 0.92, heavy = false): Kick => ({
  beat,
  vel,
  heavy,
});

export const KICKS: Kick[] = [
  // bar 1: four stomps, one per letter
  k(1, 1, true),
  k(2, 1, true),
  k(3, 1, true),
  k(4, 1, true),
  // bars 2-4: four on the floor, kick leaves for the build-up
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
  // bar 8: final hit
  k(29, 1, true),
];

/** Kicks strong enough to move the picture. */
export const MAIN_KICKS = KICKS.filter((x) => x.vel > 0.8).map((x) => x.beat);

export const CLAPS = [6, 8, 10, 12, 14, 18, 20, 22, 24, 26].map((beat) => ({
  beat,
  vel: 0.9,
}));

export type Snare = { beat: number; vel: number; pitch: number };
export const SNARES: Snare[] = [
  { beat: 4.5, vel: 0.6, pitch: 1 },
  { beat: 4.75, vel: 0.8, pitch: 1.06 },
  // build-up roll: 8ths -> 16ths -> 32nds
  ...[13, 13.5, 14, 14.5].map((beat, i) => ({
    beat,
    vel: 0.22 + i * 0.05,
    pitch: 1 + i * 0.02,
  })),
  ...[15, 15.25, 15.5, 15.75].map((beat, i) => ({
    beat,
    vel: 0.45 + i * 0.07,
    pitch: 1.1 + i * 0.04,
  })),
  ...[16, 16.125, 16.25, 16.375].map((beat, i) => ({
    beat,
    vel: 0.75 + i * 0.08,
    pitch: 1.3 + i * 0.07,
  })),
];

export type Hat = { beat: number; vel: number; open: boolean };
const hats: Hat[] = [];
// bar 2: off-beats only
for (let b = 5; b < 9; b++)
  hats.push({ beat: b + 0.5, vel: 0.55, open: false });
// bars 3-4 (until the kick leaves): 16ths
for (let b = 9; b < 15; b += 0.25) {
  const frac = b % 1;
  hats.push({
    beat: b,
    vel: frac === 0.5 ? 0.7 : frac === 0 ? 0.22 : 0.32,
    open: false,
  });
}
// bars 5-7: 16ths + open hats on the off-beats
for (let b = 17; b < 28; b += 0.25) {
  const frac = b % 1;
  if (frac === 0.5) hats.push({ beat: b, vel: 0.62, open: true });
  else hats.push({ beat: b, vel: frac === 0 ? 0.22 : 0.36, open: false });
}
export const HATS = hats;

/** The fill before the final hit: four toms playing the motif, one per letter. */
export const FILL_BEATS = [28, 28.25, 28.5, 28.75];
export const TOMS = FILL_BEATS.map((beat, i) => ({
  beat,
  midi: m(MOTIF[i], i === 3 ? 3 : 2),
  vel: 0.8 + i * 0.07,
  pan: -0.45 + i * 0.3,
}));

// ---------------------------------------------------------------- bass
export type BassNote = {
  beat: number;
  dur: number;
  midi: number;
  vel: number;
  bright: number;
};
const bass: BassNote[] = [];
const ROOT = {
  F: m(F, 2),
  Ab: m(Ab, 2),
  Bb: m(Bb, 2),
  C: m(C, 3),
  Db: m(Db, 3),
};

// bar 1: long notes under the stomps
[ROOT.F, ROOT.Ab, ROOT.Bb, ROOT.C].forEach((midi, i) =>
  bass.push({ beat: 1 + i, dur: 0.8, midi, vel: 1, bright: 0.8 }),
);
// off-beat bounce: root on every "and", octave pickup before beats 3 and 1
const bounce = (startBeat: number, root: number, bright: number, beats = 4) => {
  for (let i = 0; i < beats; i++) {
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
bounce(bar(2), ROOT.F, 0.3);
bounce(bar(3), ROOT.Db, 0.5);
bounce(bar(4), ROOT.C, 0.65, 2);
bounce(bar(5), ROOT.F, 1);
// bar 6: the motif again, one root per beat
[ROOT.F, ROOT.Ab, ROOT.Bb, ROOT.C].forEach((root, i) => {
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
bounce(bar(7), ROOT.Db, 1, 2);
bounce(bar(7) + 2, ROOT.C, 1, 1);
bass.push({ beat: 29, dur: 3.2, midi: ROOT.F, vel: 1, bright: 0.7 });
export const BASS = bass;

// ---------------------------------------------------------------- chord stabs
export type Stab = {
  beat: number;
  dur: number;
  notes: number[];
  vel: number;
  bright: number;
  decay: number;
};
const stabs: Stab[] = [];
// bar 1: one chord per letter
[CHORDS.Fm, CHORDS.Ab, CHORDS.Bbm, CHORDS.C].forEach((notes, i) =>
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
tres(bar(3), CHORDS.Db, 0.55);
tres(bar(3) + 2, CHORDS.Db, 0.6);
tres(bar(4), CHORDS.C7, 0.7);
tres(bar(4) + 2, CHORDS.C7, 0.85, [0, 0.5, 1]);
tres(bar(5), CHORDS.Fm, 1);
tres(bar(5) + 2, CHORDS.Fm, 1);
[CHORDS.Fm, CHORDS.Ab, CHORDS.Bbm, CHORDS.C].forEach((notes, i) =>
  tres(bar(6) + i, notes, 1, [0, 0.5]),
);
tres(bar(7), CHORDS.Db, 1);
tres(bar(7) + 2, CHORDS.C7, 1, [0, 0.75]);
stabs.push({
  beat: 29,
  dur: 3.6,
  notes: CHORDS.FmFinal,
  vel: 1,
  bright: 1,
  decay: 0.9,
});
export const STABS = stabs;
/** A held chord with a slow attack. `attack` is in seconds. */
export type Pad = {
  beat: number;
  dur: number;
  notes: number[];
  vel: number;
  bright: number;
  attack: number;
};
/** Beats where a chord lands. Secondary accents for the picture. */
export const STAB_BEATS = stabs.map((s) => s.beat);

// ---------------------------------------------------------------- arp (build)
export type ArpNote = {
  beat: number;
  midi: number;
  vel: number;
  bright: number;
};
const arp: ArpNote[] = [];
const ARP_PATTERNS: Record<number, number[]> = {
  2: [m(F, 4), m(C, 5), m(Ab, 4), m(C, 5), m(F, 5), m(C, 5), m(Ab, 4), m(C, 5)],
  3: [
    m(F, 4),
    m(Ab, 4),
    m(Db, 5),
    m(Ab, 4),
    m(F, 5),
    m(Ab, 4),
    m(Db, 5),
    m(Ab, 4),
  ],
  4: [m(E, 4), m(G, 4), m(C, 5), m(G, 4), m(E, 5), m(G, 4), m(C, 5), m(G, 4)],
};
for (let b = 5; b < 16.5; b += 0.25) {
  const barNo = Math.floor((b - 1) / 4) + 1;
  const step = Math.round((b - bar(barNo)) * 4);
  const progress = (b - 5) / 11.5;
  arp.push({
    beat: b,
    midi: ARP_PATTERNS[barNo][step % 8] + (b >= 15 ? 12 : 0),
    vel: 0.45 + progress * 0.45,
    bright: 0.12 + progress * progress * 0.88,
  });
}
export const ARP = arp;

// ---------------------------------------------------------------- lead (drop)
export type LeadNote = { beat: number; dur: number; midi: number; vel: number };
const L = (
  beat: number,
  pc: number,
  oct: number,
  dur = 0.55,
  vel = 0.9,
): LeadNote => ({
  beat,
  dur,
  midi: m(pc, oct),
  vel,
});
export const LEAD: LeadNote[] = [
  // bar 5: the motif, on the same rhythm as the stabs
  L(17, F, 5),
  L(17.75, Ab, 5),
  L(18.5, Bb, 5, 0.4),
  L(19, C, 6),
  L(19.75, Bb, 5),
  L(20.5, Ab, 5, 0.4),
  // bar 6: one step per letter solo, climbing
  L(21, C, 6, 0.4),
  L(21.5, Ab, 5, 0.3, 0.7),
  L(22, Db + 2, 6, 0.4),
  L(22.5, C, 6, 0.3, 0.7),
  L(23, F, 6, 0.4),
  L(23.5, Db, 6, 0.3, 0.7),
  L(24, G, 6, 0.4),
  L(24.5, E, 6, 0.2, 0.7),
  L(24.75, G, 6, 0.2, 0.8),
  // bar 7: come down, then run up into the fill
  L(25, Ab, 6),
  L(25.75, F, 6),
  L(26.5, Db, 6, 0.4),
  L(27, C, 6, 0.4),
  L(27.5, E, 6, 0.25),
  L(27.75, G, 6, 0.25),
  // final
  L(29, F, 6, 2.2, 0.8),
  L(29, F, 5, 2.2, 0.7),
];

// ---------------------------------------------------------------- bells
/** Glassy plucks: the motif as each letter inflates, and the dot landing at the end. */
export const BELLS = [
  { beat: 6, midi: m(F, 5), vel: 0.8 },
  { beat: 6.5, midi: m(Ab, 5), vel: 0.8 },
  { beat: 7, midi: m(Bb, 5), vel: 0.85 },
  { beat: 7.5, midi: m(C, 6), vel: 0.9 },
  { beat: 8, midi: m(F, 6), vel: 1 },
  { beat: 30, midi: m(F, 6), vel: 1 },
  { beat: 30.5, midi: m(C, 7), vel: 0.5 },
  { beat: 30.75, midi: m(F, 7), vel: 0.28 },
];
export const DOT_LANDINGS = [30, 30.5, 30.75];

// ---------------------------------------------------------------- big hits
export const IMPACTS = [
  { beat: 1, size: 0.9 },
  { beat: 17, size: 1.2 },
  { beat: 29, size: 1.05 },
];

/** Everything stops for half a beat before the drop. */
export const SILENCE = { from: 16.5, to: 17 };
/** The drop: the one big moment. */
export const DROP = 17;
export const FINAL = 29;

// ---------------------------------------------------------------- the whole thing
/** Everything the synthesizer needs to play one 33-beat piece. */
export type Score = {
  KICKS: Kick[];
  CLAPS: { beat: number; vel: number }[];
  SNARES: Snare[];
  HATS: Hat[];
  TOMS: { beat: number; midi: number; vel: number; pan: number }[];
  /** small pitched knocks, for things that tip over or hop */
  TICKS: { beat: number; midi: number; vel: number; pan: number }[];
  BASS: BassNote[];
  STABS: Stab[];
  PADS: Pad[];
  ARP: ArpNote[];
  LEAD: LeadNote[];
  BELLS: { beat: number; midi: number; vel: number }[];
  IMPACTS: { beat: number; size: number }[];
  /** a noise sweep and/or a pitched sweep from `lo` to `hi` Hz, beats `from` to `to` */
  RISERS: {
    from: number;
    to: number;
    noise: number;
    tone: number;
    lo: number;
    hi: number;
  }[];
  THUNDER: { beat: number; vel: number }[];
  /** overall level, [beat, gain]; only the "film" form reads it */
  GAIN: [number, number][];
};

export const CODY_SCORE: Score = {
  KICKS,
  CLAPS,
  SNARES,
  HATS,
  TOMS,
  TICKS: [],
  BASS,
  STABS,
  PADS: [],
  ARP,
  LEAD,
  BELLS,
  IMPACTS,
  RISERS: [],
  THUNDER: [],
  GAIN: [],
};
