/**
 * SPLASH, the choreography: which blobs of paint are where at a given beat.
 *
 * Everything is a pure function of the beat, and every time below comes from
 * the score. The cast is small: a dancer (one big two-coloured blob), floods
 * (a colour that takes over the whole screen), and drops.
 */
import {
  clamp,
  decay,
  easeInCubic,
  easeInOutCubic,
  hash,
  lerp,
  ring,
  spring,
  wobble,
} from "../motion";
import { BEAT_SEC, FPS } from "../score";
import {
  S_BELLS_BAR2,
  S_CLAPS,
  S_FILL,
  S_KICKS,
  S_LANDINGS,
  S_LEAD_BAR5,
  S_LEAD_BAR6,
  S_ROLL,
  S_STABS_BAR3,
} from "../score-splash";
import { type Blob, type Picture, type RGB, renderPicture } from "./engine";

const PINK: RGB = [255, 38, 122];
const ORANGE: RGB = [255, 126, 20];
const YELLOW: RGB = [255, 214, 10];
const CYAN: RGB = [20, 206, 255];
const VIOLET: RGB = [124, 58, 255];
const NAVY: RGB = [24, 12, 66];
const WHITE: RGB = [255, 250, 240];

const TAU = Math.PI * 2;
const sec = (beats: number) => beats * BEAT_SEC;
const mix = (a: RGB, b: RGB, k: number): RGB => [
  lerp(a[0], b[0], k),
  lerp(a[1], b[1], k),
  lerp(a[2], b[2], k),
];
const dot = (x: number, y: number, r: number, color: RGB): Blob => ({
  x,
  y,
  rx: r,
  ry: r,
  rot: 0,
  color,
});

/** One colour takes over the screen from a point. Bar 4 is separate: there the world shrinks instead. */
const FLOODS: { beat: number; x: number; y: number; color: RGB }[] = [
  { beat: 1, x: 0, y: 0, color: PINK },
  { beat: 2, x: -480, y: 80, color: CYAN },
  { beat: 3, x: 480, y: -60, color: YELLOW },
  { beat: 4, x: 0, y: 0, color: VIOLET },
  { beat: 9, x: 0, y: 0, color: CYAN },
  { beat: 17, x: 0, y: 0, color: YELLOW },
  { beat: 18, x: -960, y: 540, color: CYAN },
  { beat: 19, x: 960, y: -540, color: PINK },
  { beat: 20, x: 960, y: 540, color: YELLOW },
  { beat: 21, x: 0, y: 540, color: VIOLET },
  { beat: 25, x: 0, y: 0, color: CYAN },
  { beat: 27, x: 0, y: 0, color: PINK },
  { beat: 29, x: 0, y: 0, color: YELLOW },
];

/** A spreading pool with a scalloped, moving rim. */
const pool = (
  out: Blob[],
  x: number,
  y: number,
  radius: number,
  color: RGB,
  t: number,
) => {
  if (radius < 6) return;
  out.push(dot(x, y, radius, color));
  for (let k = 0; k < 13; k++) {
    const a = (k / 13) * TAU + 0.5 * Math.sin(k * 1.7);
    const r =
      radius *
      (0.17 + 0.1 * hash(k * 7 + 3)) *
      (1 + 0.4 * Math.sin(t * 5 + k * 2.2)) *
      Math.min(1, radius / 380);
    out.push(
      dot(
        x + Math.cos(a) * radius * 0.93,
        y + Math.sin(a) * radius * 0.93,
        r,
        color,
      ),
    );
  }
};

/**
 * Drops thrown out `ts` seconds ago from a circle of radius `from` (the body
 * that threw them): they slow down, fall, stretch along their path and shrink
 * away. `lasting` scales how long they live.
 */
const spray = (
  out: Blob[],
  x: number,
  y: number,
  ts: number,
  count: number,
  speed: number,
  size: number,
  colors: RGB[],
  seed: number,
  from: number,
  lasting: number,
) => {
  if (ts <= 0 || ts > 1.3 * lasting) return;
  for (let i = 0; i < count; i++) {
    const life = (0.45 + 0.75 * hash(seed + i * 5 + 1)) * lasting;
    if (ts >= life) continue;
    const a = ((i + hash(seed + i * 5 + 2)) / count) * TAU;
    const v = speed * (0.35 + 0.95 * hash(seed + i * 5 + 3));
    const travelled = from + (v * (1 - Math.exp(-3.2 * ts))) / 3.2;
    const vx = Math.cos(a) * v * Math.exp(-3.2 * ts);
    const vy = Math.sin(a) * v * Math.exp(-3.2 * ts) + 1500 * ts;
    const r =
      size *
      (0.45 + 0.9 * hash(seed + i * 5 + 4)) *
      Math.min(1, ts / 0.03) *
      Math.sqrt(1 - (ts / life) * (ts / life));
    if (r < 6) continue;
    const long = 1 + Math.min(1.1, Math.hypot(vx, vy) / 1600);
    out.push({
      x: x + Math.cos(a) * travelled,
      y: y + Math.sin(a) * travelled + 750 * ts * ts,
      rx: r * long,
      ry: r / Math.sqrt(long),
      rot: Math.atan2(vy, vx),
      color: colors[i % colors.length],
    });
  }
};

/** The dancer: a big blob with a second colour inside, a squash along `rot`, and a jelly wobble. */
const jelly = (
  out: Blob[],
  x: number,
  y: number,
  r: number,
  outer: RGB,
  inner: RGB,
  squash: number,
  rot: number,
  shake: number,
  t: number,
) => {
  if (r < 6) return;
  const long = 1 + squash;
  out.push({ x, y, rx: r * long, ry: r / long, rot, color: outer });
  out.push(dot(x + 0.22 * r, y + 0.25 * r, r * 0.5, inner));
  // Three big soft lobes inside the body. At rest they sit in the middle, where
  // they do not reach the outline; a shake pushes them out against the skin.
  // They are never small (a small blob inside a big one reads as a dimple) and
  // never removed (taking them out would be a visible pop in a still picture).
  const amount = Math.min(1, shake / 0.3);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.6 + t * 1.3;
    const push = Math.min(shake, 0.8) * Math.sin(t * 24 + k * 2.1);
    const d = r * amount * (0.3 + 0.5 * push);
    out.push(dot(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.6, outer));
  }
};

/** Bar 4: every hit of the snare roll closes the world in a notch. 0 = open, 1 = one point. */
const squeeze = (t: number) => {
  let c = 0;
  let total = 0;
  S_ROLL.forEach((b, j) => {
    const w = Math.pow(j + 1, 0.8);
    total += w;
    if (t > b) c += w * spring(sec(t - b), 9, 0.55);
  });
  return clamp(c / total);
};

/** Where the dancer is on each kick of bars 1 and 2: it always lands on the beat. */
const STOPS: [number, number, number][] = [
  [1, 0, 0],
  [2, -480, 80],
  [3, 480, -60],
  [4, 0, 0],
  [5, -430, 110],
  [6, 400, -150],
  [7, -330, -180],
  [8, 390, 150],
  [9, 0, 0],
];
/** It carries the colour of the next flood, and bursts into it. */
const CARRY: RGB[] = [PINK, CYAN, YELLOW, VIOLET, PINK];
const PARTNER = (c: RGB): RGB =>
  c === PINK
    ? ORANGE
    : c === CYAN
      ? VIOLET
      : c === YELLOW
        ? ORANGE
        : c === VIOLET
          ? PINK
          : WHITE;

/** Bar 3: one becomes two, four, eight. Colours of each generation, children next to their parent. */
const FAMILY: RGB[][] = [
  [PINK],
  [PINK, YELLOW],
  [PINK, VIOLET, YELLOW, ORANGE],
  [PINK, ORANGE, VIOLET, PINK, YELLOW, PINK, ORANGE, YELLOW],
];
const FAMILY_RING = [0, 205, 305, 372];
const FAMILY_SIZE = [178, 142, 110, 86];

const COLUMN_COLORS: RGB[] = [PINK, ORANGE, YELLOW, CYAN, YELLOW, ORANGE, PINK];
const VORTEX = 28;

/** The whole picture at a beat. */
export const pictureAt = (t: number): Picture => {
  // three layers of paint: floods at the back, thrown drops over them, the bodies on top
  const back: Blob[] = [];
  const drops: Blob[] = [];
  const front: Blob[] = [];
  let bg: RGB = YELLOW;

  // ---------------------------------------------------------------- floods
  let latest = -1;
  for (let i = 0; i < FLOODS.length; i++) if (t >= FLOODS[i].beat) latest = i;
  /** How far the flood in progress has got, from its centre. Infinity once it has covered the screen. */
  let flooded = Infinity;
  if (t >= 13 && t < 17) {
    // bar 4: the dark closes in and the coloured world shrinks to a point
    bg = NAVY;
    pool(back, 0, 0, 1240 * (1 - squeeze(t)), CYAN, t);
  } else if (latest >= 0) {
    const f = FLOODS[latest];
    bg = f.beat === 17 ? NAVY : latest > 0 ? FLOODS[latest - 1].color : YELLOW;
    const reach = Math.hypot(960 + Math.abs(f.x), 540 + Math.abs(f.y)) * 1.22;
    const grown = 1 - Math.pow(1 - clamp(sec(t - f.beat) / 0.36), 2.6);
    // A flood starts wider than the body it bursts out of, so that the new colour
    // is on screen on the frame of the beat and not one frame later.
    const start = f.beat === 29 ? 330 : 240;
    if (grown >= 1) bg = f.color;
    else {
      flooded = start + (reach - start) * grown;
      pool(back, f.x, f.y, flooded, f.color, t);
    }
  }

  // ---------------------------------------------------------------- pickup
  if (t < 1) {
    // the dancer winds up; drops are pulled in from all round
    const wind = easeInCubic(t);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + 0.3;
      const from = 620 + 300 * hash(i * 3 + 1);
      const pull = Math.pow(clamp(t / (0.55 + 0.4 * hash(i * 3 + 2))), 2.2);
      const r = (26 + 22 * hash(i * 3 + 3)) * (1 - 0.5 * pull);
      if (pull < 1)
        drops.push(
          dot(
            Math.cos(a + pull) * from * (1 - pull),
            Math.sin(a + pull) * from * (1 - pull),
            r,
            i % 2 ? CYAN : VIOLET,
          ),
        );
    }
    jelly(
      front,
      Math.sin(t * 70) * 5 * wind,
      Math.cos(t * 83) * 5 * wind,
      150 - 50 * wind,
      PINK,
      ORANGE,
      0,
      0,
      0.25 + 0.5 * wind,
      t,
    );
  } else if (t < 9) {
    // ---------------------------------------------------------------- bars 1-2
    // The dancer lands somewhere new on every kick.
    let stop = 0;
    while (stop < STOPS.length - 1 && t >= STOPS[stop + 1][0]) stop++;
    const [beat, x0, y0] = STOPS[stop];
    const [, x1, y1] = STOPS[Math.min(stop + 1, STOPS.length - 1)];
    const go = easeInOutCubic((t - beat - 0.42) / 0.58);
    const x = lerp(x0, x1, go);
    const y =
      lerp(y0, y1, go) - 150 * Math.sin(Math.PI * go) * (t < 5 ? 0.5 : 1);
    const ts = sec(t - beat);
    const flying = Math.sin(Math.PI * go);
    const heading = Math.atan2(y1 - y0, x1 - x0);
    // squash on landing (across the way it came), stretch in flight (along it)
    const [, xp, yp] = STOPS[Math.max(stop - 1, 0)];
    const cameFrom = Math.atan2(y0 - yp, x0 - xp);
    const landed = wobble(ts, 5.5, 0.32);
    const squash = flying > 0.02 ? 0.3 * flying : -0.26 * landed;
    const rot = flying > 0.02 ? heading : cameFrom;

    if (t < 5) {
      // bar 1: it bursts into a flood and comes back in the next colour
      const color = CARRY[stop + 1];
      let r = 112 * spring(ts, 4.5, 0.42);
      // the two snare pickups before bar 2
      for (const b of [4.5, 4.75])
        if (t > b) r *= 1 + 0.22 * ring(sec(t - b), 6, 0.4);
      jelly(
        front,
        x,
        y,
        r,
        color,
        PARTNER(color),
        squash,
        rot,
        0.5 * decay(ts, 0.2),
        t,
      );
      spray(
        drops,
        x0,
        y0,
        ts,
        14,
        1500,
        34,
        [color, PARTNER(color)],
        stop * 100,
        70,
        1,
      );
    } else {
      // bar 2: it darts about; claps throw a ring of drops off it
      let r = 150;
      for (const b of S_KICKS)
        if (t > b) r *= 1 + 0.1 * ring(sec(t - b), 5, 0.4);
      jelly(
        front,
        x,
        y,
        r,
        PINK,
        ORANGE,
        squash,
        rot,
        0.6 * decay(ts, 0.22),
        t,
      );
      spray(
        drops,
        x0,
        y0,
        ts,
        9,
        1100,
        26,
        [ORANGE, YELLOW],
        stop * 100 + 7,
        120,
        1,
      );
      for (const c of S_CLAPS)
        if (c >= 5 && c < 9)
          spray(
            drops,
            x0,
            y0,
            sec(t - c),
            12,
            1700,
            30,
            [CYAN],
            c * 31,
            130,
            1,
          );
      // five bells, five yellow bubbles that stay...
      S_BELLS_BAR2.forEach((b, i) => {
        if (t < b) return;
        const bx = -640 + 320 * i;
        const by = (i % 2 ? -410 : 420) + 18 * Math.sin(t * 3 + i);
        // ...until the end of the bar, when they are all drawn into the middle
        const home = easeInCubic((t - 8.45) / 0.55);
        drops.push(
          dot(
            bx * (1 - home),
            by * (1 - home),
            58 * spring(sec(t - b), 4, 0.4) * (1 - 0.4 * home),
            YELLOW,
          ),
        );
      });
    }
  } else if (t < 17) {
    // ---------------------------------------------------------------- bars 3-4
    // One becomes two, four, eight; then the ring spins up and is squeezed to a bead.
    const c = t < 13 ? 0 : squeeze(t);
    let generation = 0;
    for (const b of [10, 11, 12]) if (t >= b) generation++;
    const split =
      generation === 0 ? 1 : spring(sec(t - (9 + generation)), 2.6, 0.45);
    const blend = generation === 0 ? 1 : clamp(sec(t - (9 + generation)) / 0.2);
    let turn = 0.55 * (t - 9) + 8 * Math.pow(c, 1.4);
    for (const b of S_KICKS)
      if (b >= 9 && t > b) turn += 0.38 * spring(sec(t - b), 2.4, 0.6);
    let pulse = 1;
    let hop = 1;
    for (const b of S_STABS_BAR3)
      if (t > b) {
        pulse += 0.14 * ring(sec(t - b), 4.5, 0.4);
        hop += 0.1 * ring(sec(t - b), 3.4, 0.4);
      }
    // every hit of the roll makes them flinch, and throws neighbours opposite ways
    let zigzag = 0;
    S_ROLL.forEach((b, k) => {
      if (t <= b) return;
      pulse += 0.16 * ring(sec(t - b), 7, 0.45);
      zigzag += (k % 2 ? -0.13 : 0.13) * ring(sec(t - b), 6, 0.45);
    });
    if (t >= 9 && t < 10) pulse *= 0.82 + 0.18 * spring(sec(t - 9), 4, 0.4);
    const count = 1 << generation;
    const parents = Math.max(1, count >> 1);
    const prev = Math.max(generation - 1, 0);
    for (let j = 0; j < count; j++) {
      const parent = j >> 1;
      const aParent = turn + ((parent + 0.5) / parents) * TAU;
      const aChild = turn + ((j + 0.5) / count) * TAU;
      const a = generation === 0 ? turn : lerp(aParent, aChild, split);
      const side = j % 2 ? 1 : -1;
      const rho =
        lerp(FAMILY_RING[prev], FAMILY_RING[generation], split) *
        (hop + side * (1.5 * (hop - 1) + zigzag)) *
        Math.pow(1 - c, 0.85);
      const r =
        lerp(FAMILY_SIZE[prev], FAMILY_SIZE[generation], split) *
        pulse *
        (1 - 0.66 * c);
      const color = mix(FAMILY[prev][parent], FAMILY[generation][j], blend);
      front.push(
        dot(
          Math.cos(a) * rho,
          Math.sin(a) * rho,
          r,
          mix(color, WHITE, 0.75 * c * c),
        ),
      );
    }
    spray(
      drops,
      0,
      0,
      sec(t - 9),
      16,
      1700,
      34,
      [YELLOW, ORANGE],
      900,
      150,
      0.8,
    );
    // every split (10, 11, 12) and every clap throws a ring of drops off the family
    (
      [
        [10, [WHITE, YELLOW]],
        [11, [ORANGE, VIOLET]],
        [12, [WHITE, PINK]],
        [14, [WHITE]],
      ] as [number, RGB[]][]
    ).forEach(([b, colors]) =>
      spray(
        drops,
        0,
        0,
        sec(t - b),
        18,
        2100,
        28,
        colors,
        b * 13,
        FAMILY_RING[generation] + 60,
        0.7,
      ),
    );
  } else if (t < 21) {
    // ---------------------------------------------------------------- bar 5: the drop
    const ts = sec(t - 17);
    spray(
      drops,
      0,
      0,
      ts,
      90,
      3300,
      60,
      [PINK, CYAN, VIOLET, ORANGE],
      1700,
      0,
      1,
    );
    // it bounces: down on every kick, up in between
    const phase = t - Math.floor(t);
    const up = Math.sin(Math.PI * phase);
    const hit = sec(phase);
    const x = 150 * Math.sin((Math.PI * (t - 17)) / 2);
    const y = 60 - 170 * up;
    const squash = -0.24 * wobble(hit, 5.5, 0.34) + 0.12 * up;
    const cool = clamp((t - 19) / 0.08) - clamp((t - 20) / 0.08);
    const outer = mix(PINK, VIOLET, cool);
    const inner = mix(ORANGE, CYAN, cool);
    const r = 205 * spring(ts, 4, 0.4) * (1 + 0.12 * ring(hit, 5, 0.4));
    // every note of the melody throws out an arm
    S_LEAD_BAR5.forEach((b, i) => {
      // (not on the first note: that moment belongs to the burst)
      if (t < b || i === 0) return;
      const s = sec(t - b);
      const reach = decay(s, 0.17) * (1 - Math.exp(-s / 0.02));
      if (reach < 0.03) return;
      const a = [-0.7, 3.7, -2.0, 0.5, 2.7, -2.5][i];
      for (let k = 0; k < 4; k++) {
        const d = r * (0.55 + 0.52 * k * reach * 1.9);
        front.push(
          dot(
            x + Math.cos(a) * d,
            y + Math.sin(a) * d,
            r * (0.5 - 0.085 * k),
            outer,
          ),
        );
      }
      spray(
        drops,
        x + Math.cos(a) * r * 2.2,
        y + Math.sin(a) * r * 2.2,
        s - 0.05,
        5,
        900,
        26,
        [inner],
        i * 77,
        0,
        0.7,
      );
    });
    jelly(
      front,
      x,
      y,
      r,
      outer,
      inner,
      squash,
      Math.PI / 2,
      0.7 * decay(hit, 0.2),
      t,
    );
    for (const b of [18, 19, 20])
      spray(
        drops,
        x,
        60,
        sec(t - b),
        22,
        2300,
        38,
        b === 19 ? [YELLOW, CYAN] : [PINK, VIOLET],
        b * 53,
        190,
        1,
      );
    for (const cl of [18, 20])
      spray(drops, x, y, sec(t - cl), 14, 2800, 26, [WHITE], cl * 17, 200, 0.8);
  } else if (t < 25) {
    // ---------------------------------------------------------------- bar 6: liquid equaliser
    const rise = spring(sec(t - 21), 3.2, 0.5);
    let bump = 0;
    for (const b of S_KICKS)
      if (b >= 21 && t > b) bump += ring(sec(t - b), 4.5, 0.4);
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 258;
      let hop = 0;
      for (const [b, column] of S_LEAD_BAR6)
        if (column === i && t > b) {
          const s = sec(t - b);
          hop += (1 - Math.exp(-s / 0.025)) * Math.exp(-s / 0.2);
          // The top of the jump flicks a drop off the top of the screen. It must
          // not come back: two drops hanging in the air read as a pair of eyes.
          const fly = s - 0.04;
          if (fly > 0 && fly < 0.3) {
            const top = 540 - (150 + 520) + 60;
            drops.push({
              x: x + 60 * Math.sin(b * 9) * fly,
              y: top - 2700 * fly,
              rx: 30,
              ry: 30 * (1.9 - 2 * fly),
              rot: 0,
              color: COLUMN_COLORS[i],
            });
          }
        }
      // the two outer columns answer on the claps
      for (const cl of [22, 24])
        if ((i === 0 || i === 6) && t > cl) {
          const s = sec(t - cl);
          hop += 0.8 * (1 - Math.exp(-s / 0.025)) * Math.exp(-s / 0.22);
        }
      const height =
        (150 + 46 * bump + 26 * Math.sin(t * 2.2 + i * 1.3)) * rise + 520 * hop;
      const steps = Math.ceil((height + 60) / 62);
      for (let k = 0; k <= steps; k++) {
        const y = 600 - (k / steps) * (height + 60);
        const sway = 14 * Math.sin(t * 3.1 + i + k * 0.5) * (k / steps);
        front.push(dot(x + sway, y, k === steps ? 104 : 90, COLUMN_COLORS[i]));
      }
    }
    // the dancer from the drop dives into the sea, behind the columns as they come up
    const dive = sec(t - 21);
    if (dive < 0.3)
      jelly(
        drops,
        0,
        60 + 9000 * dive * dive + 500 * dive,
        205,
        PINK,
        ORANGE,
        0.3,
        Math.PI / 2,
        0,
        t,
      );
    spray(drops, 0, 540, dive - 0.1, 22, 2400, 36, [WHITE, PINK], 2100, 0, 0.6);
  } else {
    // ---------------------------------------------------------------- bars 7-8: vortex, then one clean drop
    const ts = sec(t - 25);
    let pulse = 1;
    let spin = 0;
    for (const b of [26, 27])
      if (t > b) {
        pulse += 0.14 * ring(sec(t - b), 4.5, 0.4);
        spin += 0.55 * spring(sec(t - b), 2.4, 0.6);
      }
    let arrived = 0;
    for (const b of S_FILL) if (t >= b) arrived++;
    // pink would vanish on the pink flood of beat 27, so that arm turns cyan as the flood passes
    const groups: RGB[] = [YELLOW, VIOLET, ORANGE, t >= 27 ? CYAN : PINK];
    // a pinwheel: four arms of paint, one colour each, thick at the hub and tapering out
    if (t < 29)
      for (let i = 0; i < VORTEX; i++) {
        const arm = i % 4;
        const along = Math.floor(i / 4);
        // each tom pulls one arm into the middle; it gets there exactly on the tom
        const fall = easeInCubic((t - (S_FILL[arm] - 0.7)) / 0.7);
        if (fall >= 0.985) continue;
        const rho =
          (150 + 66 * along) *
          spring(ts - 0.012 * along, 2.6, 0.5) *
          pulse *
          (1 - fall);
        const a =
          (arm / 4) * TAU -
          0.3 * along * (1 + 0.5 * Math.sin(t * 1.6)) +
          2.2 * (t - 25) +
          spin +
          2.4 * fall;
        const r = (80 - 7.5 * along) * (1 - 0.3 * fall);
        // the pink arm turns cyan where the pink flood has reached it, not before
        const color = arm === 3 && rho > 0.95 * flooded ? PINK : groups[arm];
        front.push(dot(Math.cos(a) * rho, Math.sin(a) * rho, r, color));
      }
    spray(
      drops,
      0,
      0,
      ts,
      30,
      2600,
      36,
      [YELLOW, VIOLET, ORANGE, PINK],
      2500,
      0,
      0.7,
    );
    for (const b of [26, 27])
      spray(drops, 0, 0, sec(t - b), 20, 2600, 30, [WHITE], b * 19, 560, 0.7);

    // the drop in the middle: grows with each tom, then becomes the last thing on screen
    if (arrived > 0) {
      const last = sec(t - (t >= 29 ? 29 : S_FILL[arrived - 1]));
      const end = sec(t - 29);
      const settled = t >= 29 ? spring(end, 2.6, 0.38) : 0;
      let r = lerp([0, 92, 128, 158, 184][arrived], 232, settled);
      let shake = 0.8 * decay(last, 0.2);
      // three last notes, three drops falling in from above
      S_LANDINGS.forEach((b, i) => {
        const fall = sec(t - b);
        if (fall < 0 && fall > -0.42) {
          const y = -r - 30 - 5200 * fall * fall + 300 * fall;
          front.push({
            x: 0,
            y,
            rx: 26 - 3 * i,
            ry: (26 - 3 * i) * (1 + Math.min(0.9, -fall * 4)),
            rot: 0,
            color: [CYAN, VIOLET, WHITE][i],
          });
        }
        if (fall >= 0) {
          r += 5 * spring(fall, 4, 0.4);
          shake += [0.5, 0.4, 0.3][i] * decay(fall, 0.13);
          // a small crown where it lands: up, out, and gone
          for (let k = 0; k < 6 && fall < 0.36; k++) {
            const a = -Math.PI * (0.16 + 0.136 * k);
            const size = 15 * (1 - fall / 0.36);
            if (size > 6)
              front.push(
                dot(
                  Math.cos(a) * (r + 30 + 520 * fall),
                  Math.sin(a) * (r + 30 + 520 * fall) + 1700 * fall * fall,
                  size,
                  [CYAN, VIOLET, WHITE][i],
                ),
              );
          }
        }
      });
      const final = t >= 29 ? 1 : 0;
      const squash =
        t >= 29 ? -0.2 * wobble(end, 4.2, 0.3) : -0.14 * wobble(last, 6, 0.4);
      if (final < 1)
        for (let g = 0; g < arrived; g++) {
          const a = (g / 4) * TAU + t * 2.2;
          front.push(
            dot(
              Math.cos(a) * r * 0.42 * (1 - final),
              Math.sin(a) * r * 0.42 * (1 - final),
              r * 0.6,
              mix(groups[g], PINK, final),
            ),
          );
        }
      jelly(
        front,
        0,
        0,
        r * (t < 29 ? 0.86 : lerp(0.86, 1, final)),
        mix(groups[(arrived - 1) % 4], PINK, final),
        mix(groups[arrived % 4], ORANGE, final),
        squash,
        0,
        shake,
        t,
      );
      spray(
        drops,
        0,
        0,
        end,
        56,
        3000,
        46,
        [VIOLET, CYAN, ORANGE, WHITE],
        2900,
        170,
        0.62,
      );
    }
  }

  // ---------------------------------------------------------------- the camera
  let zoom = 1;
  let shakeX = 0;
  let shakeY = 0;
  for (const b of S_KICKS)
    if (t > b) {
      const s = sec(t - b);
      const big = b === 1 || b === 17 || b === 29;
      const weight = big ? 1 : b >= 17 && b < 29 ? 0.45 : 0.25;
      zoom += 0.045 * weight * ring(s, 4, 0.42);
      shakeX += 26 * weight * decay(s, 0.1) * Math.sin(s * 95);
      shakeY += 26 * weight * decay(s, 0.1) * Math.cos(s * 81);
    }
  for (const list of [back, drops, front])
    for (const b of list) {
      b.x = b.x * zoom + shakeX;
      b.y = b.y * zoom + shakeY;
      b.rx *= zoom;
      b.ry *= zoom;
    }

  return {
    bg,
    layers: [
      { blobs: back, shadow: 0 },
      { blobs: drops, shadow: 0.26 },
      { blobs: front, shadow: 0.3 },
    ],
  };
};

/** Render one frame into an RGBA buffer. Half a frame of lead, so hits land on the frame nearest the sound. */
export const renderSplash = (frame: number, rgba: Uint8ClampedArray) =>
  renderPicture(pictureAt((frame + 0.5) / FPS / BEAT_SEC), rgba);
