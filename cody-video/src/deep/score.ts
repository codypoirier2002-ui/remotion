/**
 * COSMOS, remade deep: the music and the sound effects, on the same
 * synthesizer as the other pieces (scripts/make-music.ts). F minor, 144 BPM,
 * so a beat is exactly 10 frames at 24 fps. Every effect is pinned to a
 * moment in src/deep/timeline.ts, the same one the picture reads.
 *
 * Shot 1, the Big Bang:
 *   0–5.5    a low hum, a heartbeat on every pulse of the point, glints for the sparks
 *   4.75     it inhales: a swell that is cut off dead
 *   5.5–6    nothing at all
 *   6        the bang: a crack, a sub drop, a brass chord, the fireball roaring closer
 *   8        it reaches us: a hit, then the roar of the inside of the fire, crackling;
 *            a drum on every flare of the core, a whoosh for every tongue that passes
 *   19       a swell into…
 *   20       first light: the roar is cut off, and in its place a soft crash, a warm
 *            chord and a run of four bells, all on the frame the light arrives
 *   21.5     the dark ages: the hum again
 *   23       the first star: a heartbeat, a high bell, the light racing out as glints
 */
import type { BassNote, Kick, Pad, Score, Sfx, Stab } from "../score";
import { BANG } from "./timeline";

const C = 0;
const Db = 1;
const Eb = 3;
const E = 4;
const F = 5;
const G = 7;
const Ab = 8;
const A = 9;
const Bb = 10;
const m = (pc: number, oct: number) => 12 * (oct + 1) + pc;

const kicks: Kick[] = [];
const stabs: Stab[] = [];
const pads: Pad[] = [];
const bass: BassNote[] = [];
const bells: { beat: number; midi: number; vel: number }[] = [];
const sfx: Sfx[] = [];

// ---------------------------------------------------------------- before: one point in the dark
sfx.push({ kind: "hum", from: 0, to: BANG.silence, hz: 43.65, vel: 0.55 });
BANG.heartbeats.forEach((beat, i) =>
  sfx.push({ kind: "heartbeat", beat, vel: 0.65 + 0.12 * i }),
);
sfx.push({
  kind: "glints",
  from: 0,
  to: BANG.silence,
  vel: 0.1,
  rate: 6,
  lo: 2500,
  hi: 8000,
});

// ---------------------------------------------------------------- the bang
kicks.push({ beat: BANG.bang, vel: 1, heavy: true });
sfx.push({ kind: "bang", beat: BANG.bang, vel: 1 });
stabs.push({
  beat: BANG.bang,
  dur: 4,
  notes: [m(F, 1), m(C, 2), m(F, 2), m(Ab, 2)],
  vel: 1.3,
  bright: 0.6,
  decay: 1.5,
});
sfx.push({ kind: "approach", from: BANG.bang + 0.15, to: BANG.engulf, vel: 1 });

// ---------------------------------------------------------------- inside the fire
kicks.push({ beat: BANG.engulf, vel: 1, heavy: true });
sfx.push({ kind: "bang", beat: BANG.engulf, vel: 0.45 });
stabs.push({
  beat: BANG.engulf,
  dur: 4,
  notes: [m(Db, 1), m(Ab, 1), m(Db, 2), m(F, 2)],
  vel: 1.15,
  bright: 0.55,
  decay: 1.5,
});
stabs.push({
  beat: 12,
  dur: 4,
  notes: [m(Bb, 0), m(F, 1), m(Bb, 1), m(Db, 2)],
  vel: 1,
  bright: 0.5,
  decay: 1.5,
});
// the last bar of the fire waits on C: suspended, then resolved, both
// short so the drums after them are heard
stabs.push({
  beat: 16,
  dur: 1.25,
  notes: [m(C, 1), m(G, 1), m(C, 2), m(F, 2)],
  vel: 0.85,
  bright: 0.6,
  decay: 0.8,
});
stabs.push({
  beat: 18,
  dur: 1.25,
  notes: [m(C, 1), m(G, 1), m(C, 2), m(E, 2)],
  vel: 0.9,
  bright: 0.65,
  decay: 0.8,
});
const held = (beat: number, dur: number, notes: number[], bright: number) =>
  pads.push({ beat, dur, notes, vel: 0.5, bright, attack: 0.6 });
held(8, 4, [m(Db, 3), m(Ab, 3), m(C, 4), m(F, 4)], 0.35);
held(12, 4, [m(Bb, 2), m(F, 3), m(Db, 4), m(F, 4)], 0.35);
held(16, 2, [m(C, 3), m(G, 3), m(F, 4), m(G, 4)], 0.45);
held(18, BANG.cool - 18, [m(C, 3), m(G, 3), m(E, 4), m(G, 4)], 0.5);
bass.push({ beat: 8, dur: 4, midi: m(Db, 1), vel: 0.8, bright: 0.25 });
bass.push({ beat: 12, dur: 4, midi: m(Bb, 0), vel: 0.8, bright: 0.25 });
bass.push({
  beat: 16,
  dur: BANG.cool - 16,
  midi: m(C, 1),
  vel: 0.85,
  bright: 0.3,
});

// the roar does not die away: it is cut off as the light arrives
sfx.push({
  kind: "roar",
  from: BANG.engulf,
  to: BANG.cool + 0.1,
  vel: 0.85,
  surges: BANG.drums,
  fade: 0.12,
});
// the second of two quick hits is the harder one, so it is heard
const DRUM_VEL: Record<number, number> = {
  8: 1,
  10: 0.95,
  12: 0.95,
  13.5: 0.8,
  14: 1,
  16: 0.85,
  16.5: 1.15,
  17: 1.4,
  18: 1.3,
  19: 1.3,
  19.5: 1.5,
};
BANG.drums.forEach((beat) =>
  sfx.push({ kind: "taiko", beat, vel: DRUM_VEL[beat] ?? 0.9 }),
);
BANG.tongues.forEach((t) =>
  sfx.push({ kind: "whoosh", beat: t.beat, side: t.side, vel: 1.4 }),
);
sfx.push({
  kind: "crackle",
  from: BANG.engulf,
  to: BANG.cool + 0.2,
  vel: 0.45,
  rate: 28,
});

// ---------------------------------------------------------------- first light
// One event, on the beat the picture floods with light: a short moment, a
// tenth as long as the fire.
pads.push({
  beat: BANG.cool,
  dur: BANG.dark - BANG.cool + 0.25,
  notes: [m(Ab, 2), m(Eb, 3), m(C, 4), m(Eb, 4), m(G, 4)],
  vel: 0.5,
  bright: 0.45,
  attack: 0.08,
});
bass.push({
  beat: BANG.cool,
  dur: BANG.dark - BANG.cool,
  midi: m(Ab, 1),
  vel: 0.55,
  bright: 0.2,
});
[m(Eb, 5), m(Ab, 5), m(C, 6), m(Eb, 6)].forEach((midi, i) =>
  bells.push({ beat: BANG.cool + i * 0.25, midi, vel: 1.2 + 0.07 * i }),
);
sfx.push({
  kind: "shimmer",
  from: BANG.cool,
  to: BANG.dark + 0.25,
  vel: 0.07,
  hz: 1046.5,
});

// ---------------------------------------------------------------- the dark ages, and the first star
sfx.push({
  kind: "hum",
  from: BANG.dark - 0.25,
  to: BANG.firstStar + 1,
  hz: 43.65,
  vel: 0.35,
});
pads.push({
  beat: BANG.dark,
  dur: BANG.firstStar - BANG.dark,
  notes: [m(F, 2), m(C, 3), m(G, 3)],
  vel: 0.35,
  bright: 0.12,
  attack: 0.5,
});
sfx.push({ kind: "heartbeat", beat: BANG.firstStar, vel: 0.7 });
bells.push({ beat: BANG.firstStar, midi: m(C, 7), vel: 0.75 });
bells.push({ beat: BANG.firstStar + 0.02, midi: m(F, 6), vel: 0.55 });
pads.push({
  beat: BANG.firstStar,
  dur: 4,
  notes: [m(F, 3), m(C, 4), m(A, 4), m(C, 5)],
  vel: 0.45,
  bright: 0.7,
  attack: 0.15,
});
sfx.push({
  kind: "glints",
  from: BANG.firstStar,
  to: BANG.firstStar + 1.5,
  vel: 0.22,
  rate: 30,
  lo: 4000,
  hi: 12000,
});
sfx.push({
  kind: "shimmer",
  from: BANG.firstStar,
  to: BANG.firstStar + 2,
  vel: 0.14,
  hz: 2793.8,
});

export const DEEP_SCORE: Score = {
  KICKS: kicks,
  CLAPS: [],
  SNARES: [],
  HATS: [],
  TOMS: [],
  TICKS: [],
  BASS: bass,
  STABS: stabs,
  PADS: pads,
  ARP: [],
  LEAD: [],
  BELLS: bells,
  IMPACTS: [
    { beat: BANG.bang, size: 1.3 },
    { beat: BANG.engulf, size: 1 },
    // the light: soft, more air than weight
    { beat: BANG.cool, size: 0.5 },
  ],
  RISERS: [
    // the inhale, cut off by the silence
    {
      from: BANG.inhale,
      to: BANG.silence,
      noise: 0.5,
      tone: 0.35,
      lo: 43.65,
      hi: 698.5,
    },
    // a swell up to the first light, on the note the two chords share
    {
      from: BANG.cool - 1,
      to: BANG.cool,
      noise: 0.35,
      tone: 0.3,
      lo: 65.41,
      hi: 1046.5,
    },
    // a breath in before the first star
    {
      from: BANG.firstStar - 0.7,
      to: BANG.firstStar,
      noise: 0.22,
      tone: 0,
      lo: 0,
      hi: 0,
    },
  ],
  THUNDER: [],
  SFX: sfx,
  /** Overall level, [beat, gain]; a repeated beat is a step. */
  GAIN: [
    [0, 0.9],
    [BANG.silence - 0.05, 0.9],
    [BANG.silence, 0],
    [BANG.bang, 0],
    [BANG.bang, 1],
    // a breath of near silence, 60 ms, so the light is heard to arrive
    [BANG.cool - 0.16, 1],
    [BANG.cool - 0.14, 0.04],
    [BANG.cool, 0.04],
    [BANG.cool, 1],
    [BANG.dark, 0.85],
    [BANG.firstStar, 0.95],
  ],
};
