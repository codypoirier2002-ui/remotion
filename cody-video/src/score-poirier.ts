/**
 * The second movement: POIRIER. Same tempo, same key, same instruments and the
 * same form as CODY (src/score.ts), so the two can be played back to back on
 * one unbroken beat grid. What changes is the material: seven letters instead
 * of four, grouped the way the name is said: POI - RI - ER.
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
const Db = 1;
const Eb = 3;
const E = 4;
const F = 5;
const G = 7;
const Ab = 8;
const Bb = 10;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

/** Which letters belong to which syllable. */
export const SYLLABLES = [
  [0, 1, 2],
  [3, 4],
  [5, 6],
];
/** Seven notes, one per letter: an F minor arpeggio, then D flat, then E flat. */
export const MOTIF7 = [
  m(F, 4),
  m(Ab, 4),
  m(C, 5),
  m(Db, 5),
  m(F, 5),
  m(Eb, 5),
  m(G, 5),
];
/** Bar 1: the name is spelled in eighth notes. */
export const SPELL_BEATS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
/** Bar 2: a ball bounces along the letters, one eighth each. */
export const BOUNCE_BEATS = [5.5, 6, 6.5, 7, 7.5, 8, 8.5];
/** Bar 3: the letters tip over like dominoes, one sixteenth each... */
export const DOMINO_BEATS = [9, 9.25, 9.5, 9.75, 10, 10.25, 10.5];
/** ...jump back up together, then a wave runs through them and back. */
export const UPRIGHT_BEAT = 11;
export const WAVE_BEATS = [0, 1, 2, 3, 4, 5, 6].map((i) => 11.75 + i * 0.125);
export const WAVE_BACK_BEATS = [0, 1, 2, 3, 4, 5, 6].map(
  (i) => 12.5 + (6 - i) * 0.07,
);
/** Bar 5: the melody spells the name again over the drop. */
export const DROP_SPELL_BEATS = [17, 17.5, 18, 18.5, 19, 19.5, 20];
/** Bar 6: each syllable takes a solo, then everyone. */
export const SOLO_BEATS = [21, 21.25, 21.5, 22, 22.25, 23, 23.25];
export const SOLO_WAVE_BEATS = [0, 1, 2, 3, 4, 5, 6].map((i) => 24 + i * 0.1);
/** Bar 7: seven toms, seven letters landing. */
export const FILL7_BEATS = [27.25, 27.5, 27.75, 28, 28.25, 28.5, 28.75];
export const DOT_LANDINGS = [30, 30.5, 30.75];

const CH = {
  Fm: [m(F, 3), m(Ab, 3), m(C, 4), m(F, 4)],
  Db: [m(Ab, 3), m(Db, 4), m(F, 4), m(Ab, 4)],
  Eb: [m(G, 3), m(Bb, 3), m(Eb, 4), m(G, 4)],
  C: [m(C, 4), m(E, 4), m(G, 4), m(C, 5)],
  C7: [m(G, 3), m(C, 4), m(E, 4), m(Bb, 4)],
  FmFinal: [m(F, 3), m(C, 4), m(Ab, 4), m(G, 4), m(C, 5), m(F, 5)],
};
/** Bar 1 voicings: the chord of each syllable, climbing so the top note is the motif. */
const SPELL_CHORDS = [
  [m(F, 3), m(Ab, 3), m(C, 4), m(F, 4)],
  [m(Ab, 3), m(C, 4), m(F, 4), m(Ab, 4)],
  [m(C, 4), m(F, 4), m(Ab, 4), m(C, 5)],
  [m(Ab, 3), m(Db, 4), m(F, 4), m(Db, 5)],
  [m(Db, 4), m(F, 4), m(Ab, 4), m(F, 5)],
  [m(G, 3), m(Bb, 3), m(Eb, 4), m(Eb, 5)],
  [m(Bb, 3), m(Eb, 4), m(G, 4), m(G, 5)],
];
const ROOT = {
  F: m(F, 2),
  Db: m(Db, 3),
  Eb: m(Eb, 3),
  C: m(C, 3),
};

// ---------------------------------------------------------------- drums
const k = (beat: number, vel = 0.92, heavy = false): Kick => ({
  beat,
  vel,
  heavy,
});
const KICKS: Kick[] = [
  // bar 1: a kick under every letter, a heavy one where a syllable starts
  k(1, 1, true),
  k(1.5, 0.8),
  k(2, 0.85),
  k(2.5, 1, true),
  k(3, 0.85),
  k(3.5, 1, true),
  k(4, 0.9),
  ...[5, 6, 7, 8, 9, 10, 11, 12].map((b) => k(b)),
  k(12.75, 0.5),
  k(13),
  k(14),
  k(17, 1, true),
  ...[18, 19, 20, 21, 22, 23, 24].map((b) => k(b)),
  k(24.75, 0.5),
  k(25),
  k(26),
  k(27),
  k(29, 1, true),
];

const CLAPS = [6, 8, 10, 12, 14, 18, 20, 22, 24, 26].map((beat) => ({
  beat,
  vel: 0.9,
}));

const SNARES: Snare[] = [
  { beat: 4.5, vel: 0.6, pitch: 1 },
  { beat: 4.75, vel: 0.8, pitch: 1.06 },
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
/** The build-up roll, for the picture. */
export const ROLL = SNARES.filter((s) => s.beat >= 13);

const HATS: Hat[] = [];
for (let b = 5; b < 9; b++)
  HATS.push({ beat: b + 0.5, vel: 0.55, open: false });
for (let b = 9; b < 15; b += 0.25) {
  const frac = b % 1;
  HATS.push({
    beat: b,
    vel: frac === 0.5 ? 0.7 : frac === 0 ? 0.22 : 0.32,
    open: false,
  });
}
for (let b = 17; b < 27; b += 0.25) {
  const frac = b % 1;
  if (frac === 0.5) HATS.push({ beat: b, vel: 0.62, open: true });
  else HATS.push({ beat: b, vel: frac === 0 ? 0.22 : 0.36, open: false });
}

const TOMS = FILL7_BEATS.map((beat, i) => ({
  beat,
  midi: MOTIF7[i] - 24,
  vel: 0.72 + i * 0.045,
  pan: -0.45 + i * 0.15,
}));

/** Knocks: dominoes falling (a line going down), then the two waves. */
const DOMINO_NOTES = [
  m(C, 5),
  m(Bb, 4),
  m(Ab, 4),
  m(F, 4),
  m(Eb, 4),
  m(C, 4),
  m(Bb, 3),
];
const TICKS = [
  ...DOMINO_BEATS.map((beat, i) => ({
    beat,
    midi: DOMINO_NOTES[i],
    vel: 0.42 + i * 0.04,
    pan: -0.6 + i * 0.2,
  })),
  ...WAVE_BEATS.map((beat, i) => ({
    beat,
    midi: MOTIF7[i] + 12,
    vel: 0.3,
    pan: -0.6 + i * 0.2,
  })),
  ...WAVE_BACK_BEATS.map((beat, i) => ({
    beat,
    midi: MOTIF7[i] + 12,
    vel: 0.3,
    pan: -0.6 + i * 0.2,
  })),
];

// ---------------------------------------------------------------- bass
const BASS: BassNote[] = [
  // bar 1: one long note per syllable
  { beat: 1, dur: 1.35, midi: ROOT.F, vel: 1, bright: 0.8 },
  { beat: 2.5, dur: 0.85, midi: ROOT.Db, vel: 1, bright: 0.8 },
  { beat: 3.5, dur: 0.85, midi: ROOT.Eb, vel: 1, bright: 0.8 },
];
const bounce = (
  startBeat: number,
  root: number,
  bright: number,
  beats: number,
) => {
  for (let i = 0; i < beats; i++) {
    BASS.push({
      beat: startBeat + i + 0.5,
      dur: 0.3,
      midi: root,
      vel: 0.95,
      bright,
    });
    if (i % 2 === 1)
      BASS.push({
        beat: startBeat + i + 0.75,
        dur: 0.18,
        midi: root + 12,
        vel: 0.8,
        bright,
      });
  }
};
bounce(bar(2), ROOT.F, 0.3, 4);
bounce(bar(3), ROOT.Db, 0.5, 2);
bounce(bar(3) + 2, ROOT.Eb, 0.55, 2);
bounce(bar(4), ROOT.C, 0.65, 2);
// bar 5: the roots move with the syllables, off the beat
[
  [17.5, ROOT.F],
  [18.5, ROOT.Db],
  [19.5, ROOT.Eb],
  [20.5, ROOT.Eb],
].forEach(([beat, root]) => {
  BASS.push({ beat, dur: 0.3, midi: root, vel: 0.95, bright: 1 });
  BASS.push({
    beat: beat + 0.25,
    dur: 0.18,
    midi: root + 12,
    vel: 0.8,
    bright: 1,
  });
});
// bar 6: one root per solo
[ROOT.F, ROOT.Db, ROOT.Eb, ROOT.C].forEach((root, i) => {
  BASS.push({
    beat: bar(6) + i + 0.5,
    dur: 0.3,
    midi: root,
    vel: 0.95,
    bright: 1,
  });
  BASS.push({
    beat: bar(6) + i + 0.75,
    dur: 0.18,
    midi: root + 12,
    vel: 0.8,
    bright: 1,
  });
});
BASS.push({ beat: 25.5, dur: 0.3, midi: ROOT.Db, vel: 0.95, bright: 1 });
BASS.push({ beat: 25.75, dur: 0.18, midi: ROOT.Db + 12, vel: 0.8, bright: 1 });
BASS.push({ beat: 26.5, dur: 0.3, midi: ROOT.Eb, vel: 0.95, bright: 1 });
BASS.push({ beat: 26.75, dur: 0.18, midi: ROOT.Eb + 12, vel: 0.8, bright: 1 });
BASS.push({ beat: 29, dur: 3.2, midi: ROOT.F, vel: 1, bright: 0.7 });

// ---------------------------------------------------------------- chord stabs
const STABS: Stab[] = [];
// bar 1: a chord under every letter
SPELL_BEATS.forEach((beat, i) =>
  STABS.push({
    beat,
    dur: i === 2 || i === 4 || i === 6 ? 0.46 : 0.4,
    notes: SPELL_CHORDS[i],
    vel: i === 0 || i === 3 || i === 5 ? 1.5 : 1.25,
    bright: 1,
    decay: 0.22,
  }),
);
const hits = (beats: number[], notes: number[], bright: number) =>
  beats.forEach((beat, i) =>
    STABS.push({
      beat,
      dur: 0.5,
      notes,
      vel: i === 0 ? 0.95 : 0.8,
      bright,
      decay: 0.16,
    }),
  );
hits([9, 9.75, 10.5], CH.Db, 0.55);
hits([11, 11.75, 12.5], CH.Eb, 0.6);
hits([13, 13.75, 14.5], CH.C7, 0.7);
hits([15, 15.5, 16], CH.C7, 0.85);
// bar 5: three, two, two
hits([17, 17.5, 18], CH.Fm, 1);
hits([18.5, 19], CH.Db, 1);
hits([19.5, 20, 20.5], CH.Eb, 1);
// bar 6: one chord per solo
hits([21, 21.5], CH.Fm, 1);
hits([22, 22.5], CH.Db, 1);
hits([23, 23.5], CH.Eb, 1);
hits([24, 24.5], CH.C, 1);
hits([25, 25.75], CH.Db, 1);
hits([26, 26.75], CH.Eb, 1);
hits([27], CH.C7, 1);
STABS.push({
  beat: 29,
  dur: 3.6,
  notes: CH.FmFinal,
  vel: 1,
  bright: 1,
  decay: 0.9,
});

// ---------------------------------------------------------------- arp (build)
const ARP: ArpNote[] = [];
const A = {
  Fm: [
    m(F, 4),
    m(C, 5),
    m(Ab, 4),
    m(C, 5),
    m(F, 5),
    m(C, 5),
    m(Ab, 4),
    m(C, 5),
  ],
  Db: [
    m(F, 4),
    m(Ab, 4),
    m(Db, 5),
    m(Ab, 4),
    m(F, 5),
    m(Ab, 4),
    m(Db, 5),
    m(Ab, 4),
  ],
  Eb: [
    m(G, 4),
    m(Bb, 4),
    m(Eb, 5),
    m(Bb, 4),
    m(G, 5),
    m(Bb, 4),
    m(Eb, 5),
    m(Bb, 4),
  ],
  C: [m(E, 4), m(G, 4), m(C, 5), m(G, 4), m(E, 5), m(G, 4), m(C, 5), m(G, 4)],
};
for (let b = 5; b < 16.5; b += 0.25) {
  const pattern = b < 9 ? A.Fm : b < 11 ? A.Db : b < 13 ? A.Eb : A.C;
  const step = Math.round((b - Math.floor((b - 1) / 2) * 2 - 1) * 4);
  const progress = (b - 5) / 11.5;
  ARP.push({
    beat: b,
    midi: pattern[step % 8] + (b >= 15 ? 12 : 0),
    vel: 0.45 + progress * 0.45,
    bright: 0.12 + progress * progress * 0.88,
  });
}

// ---------------------------------------------------------------- lead (drop)
const note = (beat: number, midi: number, dur = 0.4, vel = 0.9): LeadNote => ({
  beat,
  dur,
  midi,
  vel,
});
const LEAD: LeadNote[] = [
  // bar 5: the motif, one note per letter
  ...DROP_SPELL_BEATS.map((beat, i) =>
    note(
      beat,
      MOTIF7[i] + 12,
      0.38,
      i === 0 || i === 3 || i === 5 ? 0.95 : 0.8,
    ),
  ),
  note(20.5, m(F, 6), 0.3, 0.7),
  // bar 6: the same notes, squeezed into each solo
  ...SOLO_BEATS.map((beat, i) => note(beat, MOTIF7[i] + 12, 0.22, 0.85)),
  ...SOLO_WAVE_BEATS.map((beat, i) => note(beat, MOTIF7[i] + 12, 0.1, 0.6)),
  // bar 7
  note(25, m(Ab, 6), 0.55),
  note(25.75, m(F, 6), 0.3),
  note(26, m(G, 6), 0.55),
  note(26.75, m(Eb, 6), 0.3),
  note(27, m(E, 6), 0.3),
  // final
  note(29, m(F, 6), 2.2, 0.8),
  note(29, m(F, 5), 2.2, 0.7),
];

// ---------------------------------------------------------------- bells
const BELLS = [
  // the ball: one bounce, one bell, one letter
  ...BOUNCE_BEATS.map((beat, i) => ({
    beat,
    midi: MOTIF7[i] + 12,
    vel: 0.78 + i * 0.03,
  })),
  { beat: 30, midi: m(F, 6), vel: 1 },
  { beat: 30.5, midi: m(C, 7), vel: 0.5 },
  { beat: 30.75, midi: m(F, 7), vel: 0.28 },
];

export const POIRIER_SCORE: Score = {
  KICKS,
  CLAPS,
  SNARES,
  HATS,
  TOMS,
  TICKS,
  BASS,
  STABS,
  PADS: [],
  ARP,
  LEAD,
  BELLS,
  IMPACTS: [
    { beat: 1, size: 0.9 },
    { beat: 11, size: 0.45 },
    { beat: 17, size: 1.2 },
    { beat: 29, size: 1.05 },
  ],
  RISERS: [],
  THUNDER: [],
  GAIN: [],
};
