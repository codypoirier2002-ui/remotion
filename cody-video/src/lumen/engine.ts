/**
 * LUMEN: one cloud of points of light that keeps becoming something else.
 *
 * Nothing here is drawn with shapes. Every frame, each point is placed in 3D,
 * projected, and its light is added into a floating-point image; the image is
 * then exposed like a photograph. Where many points line up the light piles up
 * and burns towards white, which is where all the shading comes from.
 *
 * A frame depends on nothing but its number, so frames can be rendered in any
 * order. All timing is in beats and comes from the score.
 */
import { clamp, decay, ring, spring, wobble } from "../motion";
import { BEAT_SEC, FPS } from "../score";
import {
  BACKBEATS,
  L_FILL,
  L_LANDINGS,
  L_PULSES,
  ROLL,
  SPARKLE_FROM,
  SPARKLE_TO,
} from "../score-lumen";

export const W = 1920;
export const H = 1080;

const N = 170_000;
const TAU = Math.PI * 2;
/** Camera sits on +z looking at the origin. A length of 1 at the origin is 300 px. */
const CAM = 4.2;
const FOCAL = 1260;
/** Fraction of a frame the shutter stays open. */
const SHUTTER = 0.6;
/** Points get this soft even in perfect focus. */
const BASE_RADIUS = 0.62;
const APERTURE = 19;
const EXPOSURE = 1.25;

const hash32 = (n: number) => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const frac = (x: number) => x - Math.floor(x);
const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const sec = (beats: number) => beats * BEAT_SEC;

// ================================================================ the points
// Every point owns a place (u, v) on one sheet. Each form is a way of folding
// that sheet, so a point keeps its neighbours from one form to the next.
const U = new Float32Array(N);
const V = new Float32Array(N);
/** The same place, but for some points snapped to a grid line drawn on the sheet. */
const UL = new Float32Array(N);
const VL = new Float32Array(N);
const MERIDIANS = 18;
const PARALLELS = 12;
const GAUSS = new Float32Array(N);
const RND = new Float32Array(N);
/** Light each point gives off, linear RGB. */
const COLOR = new Float32Array(N * 3);
/** A few points that turn rose when the drop hits, and how bright they get. */
const HOT = new Float32Array(N);
/** Stagger groups: by chance, by v, and by distance from the equator. */
const BY_CHANCE = new Uint8Array(N);
const BY_V = new Uint8Array(N);
const BY_POLE = new Uint8Array(N);
/** ...and by how far out the point starts in the opening dust. */
const BY_DISTANCE = new Uint8Array(N);

const MINT = [0.03, 0.9, 0.56];
const VIOLET = [0.2, 0.07, 1.0];
const ROSE = [1.0, 0.16, 0.42];

for (let i = 0; i < N; i++) {
  // a low-discrepancy sequence spreads the points evenly: no clumps, no holes
  U[i] = frac(0.5 + i * 0.7548776662466927 + (hash32(i * 7 + 1) - 0.5) * 0.002);
  V[i] = frac(0.5 + i * 0.5698402909980532 + (hash32(i * 7 + 2) - 0.5) * 0.002);
  const line = hash32(i * 7 + 9);
  UL[i] = line < 0.13 ? Math.round(U[i] * MERIDIANS) / MERIDIANS : U[i];
  VL[i] = line > 0.87 ? (Math.floor(V[i] * PARALLELS) + 0.5) / PARALLELS : V[i];
  GAUSS[i] =
    Math.sqrt(-2 * Math.log(hash32(i * 7 + 3) + 1e-9)) *
    Math.cos(TAU * hash32(i * 7 + 4));
  RND[i] = hash32(i * 7 + 5);
  BY_CHANCE[i] = Math.floor(RND[i] * 64);
  BY_V[i] = Math.floor(V[i] * 64);
  BY_POLE[i] = Math.floor(Math.abs(2 * V[i] - 1) * 63.99);

  const k = smooth(0.12, 0.88, V[i] + (hash32(i * 7 + 6) - 0.5) * 0.3);
  const h = hash32(i * 7 + 7);
  const star = h > 0.988;
  const energy = star ? 3.4 : 0.2 + 0.8 * h * h;
  HOT[i] = h > 0.9 && !star ? 1.1 + 2.2 * hash32(i * 7 + 8) : 0;
  for (let c = 0; c < 3; c++)
    COLOR[i * 3 + c] =
      (star ? 0.8 + 0.2 * MINT[c] : MINT[c] + (VIOLET[c] - MINT[c]) * k) *
      energy;
}

// ================================================================ the forms
const SPHERE = new Float32Array(N * 3);
const TORUS = new Float32Array(N * 3);
const KNOT = new Float32Array(N * 3);
const HELIX = new Float32Array(N * 3);
const DUST = new Float32Array(N * 3);
const SCATTER = new Float32Array(N * 3);
/** Galaxy, in polar form: radius, angle, thickness, angular speed. */
const GALAXY = new Float32Array(N * 4);
const GALAXY_R = 2.5;

for (let i = 0; i < N; i++) {
  const u = U[i];
  const v = V[i];
  const g = GAUSS[i];
  const o = i * 3;
  const lined = UL[i] !== u || VL[i] !== v;
  const th = TAU * UL[i];
  const vl = VL[i];

  // sphere: v runs from the top pole to the bottom one
  const cosPhi = 1 - 2 * vl;
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  const sr = 1 + (lined ? 0.003 : 0.012) * g;
  SPHERE[o] = sr * sinPhi * Math.cos(th);
  SPHERE[o + 1] = sr * cosPhi;
  SPHERE[o + 2] = sr * sinPhi * Math.sin(th);

  // torus: both poles of the sphere are pulled into the hole
  const ps = Math.PI - TAU * vl;
  const tr = 0.4 * (1 + (lined ? 0.006 : 0.03) * g);
  TORUS[o] = (0.92 + tr * Math.cos(ps)) * Math.cos(th);
  TORUS[o + 1] = tr * Math.sin(ps);
  TORUS[o + 2] = (0.92 + tr * Math.cos(ps)) * Math.sin(th);

  // trefoil knot: the same tube, tied
  const c3 = Math.cos(3 * th);
  const s3 = Math.sin(3 * th);
  const c2 = Math.cos(2 * th);
  const s2 = Math.sin(2 * th);
  const tx = -3 * s3 * c2 - 2 * (2 + c3) * s2;
  const ty = -3 * s3 * s2 + 2 * (2 + c3) * c2;
  const tz = -3 * c3;
  const tl = Math.hypot(tx, ty, tz);
  // normal = tangent x z, binormal = tangent x normal
  const nl = Math.hypot(ty, tx);
  const nx = ty / nl;
  const ny = -tx / nl;
  const bx = (ty / tl) * 0 - (tz / tl) * ny;
  const by = (tz / tl) * nx - (tx / tl) * 0;
  const bz = (tx / tl) * ny - (ty / tl) * nx;
  const kr = 0.155 * (1 + (lined ? 0.008 : 0.04) * g);
  const ka = TAU * vl;
  KNOT[o] = 0.37 * (2 + c3) * c2 + kr * (Math.cos(ka) * nx + Math.sin(ka) * bx);
  KNOT[o + 1] =
    0.37 * (2 + c3) * s2 + kr * (Math.cos(ka) * ny + Math.sin(ka) * by);
  KNOT[o + 2] = -0.37 * s3 + kr * Math.sin(ka) * bz;

  // double helix: the sheet cut into two ribbons. Its grid lines become the
  // ribbons' edges and the ties across them.
  const strand = u < 0.5 ? 0 : 1;
  const across = UL[i] === u ? frac(u * 2) : frac(u * 2) < 0.5 ? 0 : 1;
  const hv = VL[i] === v ? v : Math.round(v * 56) / 56;
  const ha = TAU * 2.25 * hv + strand * Math.PI;
  const hr = 0.6 + (lined ? 0.003 : 0.01) * g;
  HELIX[o] = hr * Math.cos(ha);
  HELIX[o + 1] = (hv - 0.5) * 2.4 + (across - 0.5) * 0.2;
  HELIX[o + 2] = hr * Math.sin(ha);

  // dust: a ball of stars around the camera
  const d1 = hash32(i * 11 + 1);
  const d2 = hash32(i * 11 + 2);
  const d3 = hash32(i * 11 + 3);
  const dz = 1 - 2 * d1;
  const dxy = Math.sqrt(1 - dz * dz);
  const dr = 0.6 + 5.6 * Math.cbrt(d3);
  BY_DISTANCE[i] = Math.floor(Math.cbrt(d3) * 63.99);
  DUST[o] = dr * dxy * Math.cos(TAU * d2);
  DUST[o + 1] = dr * dxy * Math.sin(TAU * d2);
  DUST[o + 2] = dr * dz;

  // where a point is thrown when a form shatters: outwards, plus chance
  const throwBy = 0.35 + 1.9 * d3 * d3;
  const sx = dxy * Math.cos(TAU * d2) * 0.7 + TORUS[o];
  const sy = dxy * Math.sin(TAU * d2) * 0.7 + TORUS[o + 1] * 2;
  const sz = dz * 0.7 + TORUS[o + 2];
  const sl = Math.hypot(sx, sy, sz) + 1e-6;
  SCATTER[o] = (sx / sl) * throwBy;
  SCATTER[o + 1] = (sy / sl) * throwBy;
  SCATTER[o + 2] = (sz / sl) * throwBy;

  // galaxy: v is the distance from the core, two arms, wound into a spiral
  const bulge = RND[i] < 0.1;
  const rho = bulge
    ? 0.15 * Math.sqrt(-2 * Math.log(hash32(i * 11 + 4) + 1e-9))
    : 0.1 + GALAXY_R * Math.pow(v, 0.8);
  const arm = th - 0.36 * Math.sin(2 * th);
  GALAXY[i * 4] = rho;
  GALAXY[i * 4 + 1] = arm + 2.3 * Math.log(rho + 0.35);
  GALAXY[i * 4 + 2] = (bulge ? 0.1 : 0.028 + 0.05 * Math.exp(-rho / 0.5)) * g;
  GALAXY[i * 4 + 3] = 0.2 + 0.28 / (0.45 + rho);
}

// ================================================================ choreography
const TABLE = new Float32Array(64);
/** Spring progress for each of the 64 stagger groups; the last group starts `spread` seconds late. */
const springTable = (t: number, spread: number, f: number, z: number) => {
  for (let b = 0; b < 64; b++) TABLE[b] = spring(t - (spread * b) / 63, f, z);
};

/** Place a stored form in space: turn it (roll, then yaw, then pitch) and scale it. */
const pose = (
  src: Float32Array,
  out: Float32Array,
  yaw: number,
  pitch: number,
  roll: number,
  scale: number,
) => {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const m00 = cy * cr * scale;
  const m01 = -cy * sr * scale;
  const m02 = sy * scale;
  const m10 = (cp * sr + sp * sy * cr) * scale;
  const m11 = (cp * cr - sp * sy * sr) * scale;
  const m12 = -sp * cy * scale;
  const m20 = (sp * sr - cp * sy * cr) * scale;
  const m21 = (sp * cr + cp * sy * sr) * scale;
  const m22 = cp * cy * scale;
  for (let o = 0; o < N * 3; o += 3) {
    const x = src[o];
    const y = src[o + 1];
    const z = src[o + 2];
    out[o] = m00 * x + m01 * y + m02 * z;
    out[o + 1] = m10 * x + m11 * y + m12 * z;
    out[o + 2] = m20 * x + m21 * y + m22 * z;
  }
};

/** out = a + (b - a) * progress, with each point reading its own stagger group. */
const blend = (
  out: Float32Array,
  a: Float32Array,
  b: Float32Array,
  group: Uint8Array,
) => {
  for (let i = 0, o = 0; i < N; i++, o += 3) {
    const s = TABLE[group[i]];
    out[o] = a[o] + (b[o] - a[o]) * s;
    out[o + 1] = a[o + 1] + (b[o + 1] - a[o + 1]) * s;
    out[o + 2] = a[o + 2] + (b[o + 2] - a[o + 2]) * s;
  }
};

/** Every strong kick turns the form a notch. It snaps round and settles. */
const turn = (t: number) => {
  let a = 0.3 * t;
  for (const k of L_PULSES)
    if (t > k) a += 0.42 * spring(sec(t - k), 2.2, 0.55);
  return a;
};
/** The backbeat flicks it: swing out, ring back to zero. */
const flick = (t: number, from: number, to: number) => {
  let a = 0;
  for (const b of BACKBEATS)
    if (b >= from && b < to && t > b) a += wobble(sec(t - b), 2.6, 0.32);
  return a;
};

/** Every form drifts towards the camera a little while it is on, so nothing sits still. */
const sphere = (t: number, out: Float32Array) =>
  pose(SPHERE, out, turn(t), 0.5, 0.25, t < 17 ? 1.14 + 0.03 * (t - 1) : 1.22);

const torus = (t: number, out: Float32Array) =>
  pose(
    TORUS,
    out,
    turn(t),
    1.02 + 0.16 * Math.sin(0.55 * (t - 5)),
    0.2 + 0.75 * flick(t, 5, 9),
    1.06 + 0.02 * (t - 5),
  );

const knot = (t: number, out: Float32Array) =>
  pose(
    KNOT,
    out,
    0.45 * Math.sin(0.7 * (t - 10.5)) + 0.9 * flick(t, 9, 13),
    0.12,
    -0.3 * (t - 9),
    1.04 + 0.02 * (t - 9),
  );

/** Bar 4: every hit of the snare roll squeezes the helix a notch, until it is a point. */
const squeeze = (t: number) => {
  let c = 0;
  let total = 0;
  ROLL.forEach((b, j) => {
    const w = Math.pow(j + 1, 1.5);
    total += w;
    if (t > b) c += w * spring(sec(t - b), 9, 0.55);
  });
  return clamp(c / total);
};
const helix = (t: number, out: Float32Array) => {
  const c = squeeze(t);
  pose(
    HELIX,
    out,
    0.9 * (t - 13) + 9 * Math.pow(c, 1.6),
    0,
    0.16 * (1 - c),
    Math.max(1 - c, 0.004),
  );
};

const galaxy = (t: number, out: Float32Array) => {
  // bars 5-6: seen from above, then the camera drops down and skims it
  const dive = spring(sec(t - 21), 1.3, 0.62);
  const tilt = 1.06 + 0.22 * dive - 0.2 * flick(t, 17, 25);
  const size = 1 + 0.42 * dive;
  const bank = 0.14 + 0.1 * Math.sin(0.4 * (t - 17)) + 0.3 * flick(t, 21, 25);
  // each kick sends a ring of light out through the disc
  let front = -9;
  let lift = 0;
  for (const k of L_PULSES)
    if (t > k && t - k < 3 && k >= 17) {
      front = 0.15 + 4.2 * sec(t - k);
      lift = 0.26 * decay(sec(t - k), 0.42);
    }
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cb = Math.cos(bank);
  const sb = Math.sin(bank);
  for (let i = 0, o = 0; i < N; i++, o += 3) {
    const rho = GALAXY[i * 4];
    const a = GALAXY[i * 4 + 1] + GALAXY[i * 4 + 3] * (t - 17);
    const w = (rho - front) / 0.24;
    const x = rho * Math.cos(a) * size;
    const y = rho * Math.sin(a) * size;
    // (not in the core: lifting the densest part reads as a splash, not a ring)
    const z =
      (GALAXY[i * 4 + 2] +
        (w * w < 9 ? lift * Math.exp(-w * w) * smooth(0.3, 1.0, rho) : 0)) *
      size;
    // lay it back, then bank; on the dive the camera looks up a little, so the near rim sits low in the frame
    const yy = y * ct - z * st;
    out[o] = x * cb - yy * sb;
    out[o + 1] = x * sb + yy * cb - 0.16 * dive;
    out[o + 2] = y * st + z * ct;
  }
};

const TUNNEL_LENGTH = 10;
const tunnel = (t: number, out: Float32Array) => {
  // the tom fill closes it in four steps
  let closed = 0;
  L_FILL.forEach((b, j) => {
    if (t > b)
      closed += [0.28, 0.26, 0.23, 0.225][j] * spring(sec(t - b), 7, 0.5);
  });
  let kick = 0;
  let pushed = 0;
  for (const k of L_PULSES)
    if (k >= 25 && t > k) {
      kick += ring(sec(t - k), 3, 0.32);
      pushed += 0.035 * spring(sec(t - k), 2.5, 0.7);
    }
  // ...radius and length both, until all of it is one point in the middle
  const left = Math.max(1 - closed, 0.002);
  const radius = 1.15 * (1 + 0.1 * kick);
  const travelled = 0.15 * (t - 25) + pushed;
  const roll = 0.22 * (t - 25) + 1.1 * flick(t, 25, 29);
  for (let i = 0, o = 0; i < N; i++, o += 3) {
    const d = frac(VL[i] - travelled) * TUNNEL_LENGTH + 0.15;
    const a = TAU * UL[i] + roll + 0.13 * d;
    const r =
      radius * (1 + 0.17 * Math.sin(3 * a - 0.55 * d)) +
      (UL[i] === U[i] && VL[i] === V[i] ? 0.02 : 0.004) * GAUSS[i];
    out[o] = r * Math.cos(a) * left;
    out[o + 1] = r * Math.sin(a) * left;
    out[o + 2] = (CAM - d) * left;
  }
};

const A = new Float32Array(N * 3);
const B = new Float32Array(N * 3);

/** Where every point is at beat t. */
const cloud = (t: number, out: Float32Array) => {
  if (t < 1) {
    // pickup: a sky full of dust falls into one point
    // ...the nearest dust first, so a core lights up while the rest is still streaming in
    for (let i = 0, o = 0; i < N; i++, o += 3) {
      const s = Math.pow(clamp(t / (0.42 + (0.5 * BY_DISTANCE[i]) / 63)), 2.4);
      const k = Math.max(1 - s, 0.002);
      const c = Math.cos(1.9 * s) * k;
      const w = Math.sin(1.9 * s) * k;
      out[o] = DUST[o] * c - DUST[o + 1] * w;
      out[o + 1] = DUST[o] * w + DUST[o + 1] * c;
      out[o + 2] = DUST[o + 2] * k;
    }
  } else if (t < 5) {
    // bar 1: the point bursts into a sphere
    sphere(t, B);
    springTable(sec(t - 1), 0.04, 2.4, 0.42);
    for (let i = 0, o = 0; i < N; i++, o += 3) {
      const s = TABLE[BY_CHANCE[i]];
      out[o] = B[o] * s;
      out[o + 1] = B[o + 1] * s;
      out[o + 2] = B[o + 2] * s;
    }
  } else if (t < 9) {
    // bar 2: the poles push through and it is a ring
    if (t > 7.6) return torus(t, out);
    sphere(t, A);
    torus(t, B);
    springTable(sec(t - 5), 0.13, 1.9, 0.5);
    blend(out, A, B, BY_POLE);
  } else if (t < 13) {
    // bar 3: it shatters on the kick, hangs, and lands as a knot on the next one
    if (t >= 10.5) return knot(t, out);
    torus(t, A);
    knot(t, B);
    const ts = sec(t - 9);
    const thrown = 1 - Math.exp(-ts / 0.06) + 0.35 * ts;
    // Pulled in faster and faster, like filings to a magnet. Points leave at
    // different moments but all of them arrive on beat 10.5, and stop dead.
    for (let b = 0; b < 64; b++) {
      const start = 9.75 + (0.3 * b) / 63;
      TABLE[b] = Math.pow(clamp((t - start) / (10.5 - start)), 3);
    }
    for (let i = 0, o = 0; i < N; i++, o += 3) {
      const s = TABLE[BY_CHANCE[i]];
      for (let c = 0; c < 3; c++) {
        const from = A[o + c] + SCATTER[o + c] * thrown;
        out[o + c] = from + (B[o + c] - from) * s;
      }
    }
  } else if (t < 17) {
    // bar 4: unties into a helix, which the snare roll squeezes to a point
    if (t > 15.3) return helix(t, out);
    knot(t, A);
    helix(t, B);
    springTable(sec(t - 13), 0.13, 1.9, 0.72);
    blend(out, A, B, BY_V);
  } else if (t < 25) {
    // bars 5-6, the drop: the point goes off and leaves a galaxy
    galaxy(t, B);
    if (t > 19.6) return out.set(B);
    springTable(sec(t - 17), 0.03, 3.2, 0.4);
    for (let i = 0, o = 0; i < N; i++, o += 3) {
      const s = TABLE[BY_V[i]];
      out[o] = B[o] * s;
      out[o + 1] = B[o + 1] * s;
      out[o + 2] = B[o + 2] * s;
    }
  } else if (t < 29) {
    // bar 7: the disc is pulled into a funnel and we fly down it
    if (t > 27.4) return tunnel(t, out);
    galaxy(t, A);
    tunnel(t, B);
    springTable(sec(t - 25), 0.12, 2.0, 0.9);
    blend(out, A, B, BY_V);
  } else {
    // bar 8: the point goes off once more and it is the sphere again. Clean.
    sphere(t, B);
    springTable(sec(t - 29), 0.04, 2.4, 0.5);
    for (let i = 0, o = 0; i < N; i++, o += 3) {
      const s = TABLE[BY_CHANCE[i]];
      out[o] = B[o] * s;
      out[o + 1] = B[o + 1] * s;
      out[o + 2] = B[o + 2] * s;
    }
  }
};

/** Big hits shake the camera. [beat, pixels] */
const SHAKES = [
  [1, 16],
  [10.5, 7],
  [17, 30],
  [29, 20],
];

/** World positions at beat t, pushed around by the drums, seen through the camera: x, y in pixels, depth. */
const project = (t: number, out: Float32Array) => {
  cloud(t, out);

  // every strong kick makes the whole cloud swell and ring back
  let swell = 0;
  for (const k of L_PULSES)
    if (t > k && t - k < 3) swell += ring(sec(t - k), 3, 0.3);
  // ...except inside the tunnel, where the walls do it instead
  const scale =
    1 + 0.065 * swell * (1 - smooth(25, 25.6, t) + smooth(29, 29.1, t));

  // every backbeat sends a shell-shaped shockwave out from the middle
  let front = -9;
  let push = 0;
  for (const b of BACKBEATS)
    if (t > b && t - b < 1.6 && b < 25) {
      front = 0.1 + 6 * sec(t - b);
      push = 0.17 * decay(sec(t - b), 0.2);
    }

  let shakeX = 0;
  let shakeY = 0;
  for (const [b, px] of SHAKES)
    if (t > b) {
      const ts = sec(t - b);
      shakeX += px * decay(ts, 0.11) * Math.sin(ts * 96);
      shakeY += px * decay(ts, 0.11) * Math.cos(ts * 81);
    }
  // a slow push in over each half, so nothing ever sits perfectly still
  const zoom =
    1 + 0.05 * clamp((t - 1) / 15) + 0.04 * clamp((t - 29) / 4) - 0.02;
  const cx = W / 2 + shakeX;
  const cy = H / 2 + shakeY;

  for (let o = 0; o < N * 3; o += 3) {
    let x = out[o] * scale;
    let y = out[o + 1] * scale;
    let z = out[o + 2] * scale;
    if (push > 0.002) {
      const w = (Math.sqrt(x * x + y * y + z * z) - front) / 0.3;
      if (w * w < 9) {
        const k = 1 + push * Math.exp(-w * w);
        x *= k;
        y *= k;
        z *= k;
      }
    }
    const depth = CAM - z;
    const p = (FOCAL * zoom) / Math.max(depth, 0.01);
    out[o] = cx + x * p;
    out[o + 1] = cy - y * p;
    out[o + 2] = depth;
  }
};

// ================================================================ the image
// Light is added into a pyramid of images: full size, half, quarter... A point
// in focus goes into the full-size one; the further out of focus it is, the
// smaller the image it is added to. Blowing the small ones back up blurs them.
const LEVELS = 7;
const LW: number[] = [];
const LH: number[] = [];
const ACC: Float32Array[] = [];
for (let l = 0; l < LEVELS; l++) {
  LW.push(Math.ceil(W / 2 ** l));
  LH.push(Math.ceil(H / 2 ** l));
  ACC.push(new Float32Array(LW[l] * LH[l] * 3));
}
const BLOOM = [3, 4, 5].map((l) => new Float32Array(LW[l] * LH[l] * 3));
const SCRATCH = new Float32Array(LW[3] * LH[3] * 3);

const P0 = new Float32Array(N * 3);
const P1 = new Float32Array(N * 3);

// The background: nearly black, a little lighter and bluer in the middle.
const SKY = new Float32Array(W * H * 3);
const DITHER = new Float32Array(W * H);
for (let y = 0, p = 0; y < H; y++) {
  for (let x = 0; x < W; x++, p++) {
    const d = Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (W / 2));
    const k = Math.exp(-d * d * 2.2);
    SKY[p * 3] = 0.00012 + 0.0011 * k;
    SKY[p * 3 + 1] = 0.00018 + 0.0015 * k;
    SKY[p * 3 + 2] = 0.0011 + 0.0075 * k;
    // fixed noise, half a step either way, so dark gradients do not band
    DITHER[p] = hash32(p * 3 + 17) - 0.5;
  }
}

// Film response: light in, 8-bit value out. Indexed by sqrt(light) so the dark end stays smooth.
const FILM = new Float32Array(4097);
for (let i = 0; i <= 4096; i++) {
  const x = (i / 1024) ** 2;
  FILM[i] = 255 * Math.pow(1 - Math.exp(-x), 1 / 2.2);
}

/** Add light at a sub-pixel position of one pyramid level. */
const splat = (
  level: number,
  px: number,
  py: number,
  r: number,
  g: number,
  b: number,
) => {
  const inv = 1 / (1 << level);
  const w = LW[level];
  const fx0 = px * inv - 0.5;
  const fy0 = py * inv - 0.5;
  const x0 = Math.floor(fx0);
  const y0 = Math.floor(fy0);
  if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= LH[level] - 1) return;
  const fx = fx0 - x0;
  const fy = fy0 - y0;
  // a point spread over a level-n pixel covers 4^n real pixels
  const k = inv * inv;
  const w00 = (1 - fx) * (1 - fy) * k;
  const w10 = fx * (1 - fy) * k;
  const w01 = (1 - fx) * fy * k;
  const w11 = fx * fy * k;
  const a = ACC[level];
  const i0 = (y0 * w + x0) * 3;
  const i1 = i0 + w * 3;
  a[i0] += r * w00;
  a[i0 + 1] += g * w00;
  a[i0 + 2] += b * w00;
  a[i0 + 3] += r * w10;
  a[i0 + 4] += g * w10;
  a[i0 + 5] += b * w10;
  a[i1] += r * w01;
  a[i1 + 1] += g * w01;
  a[i1 + 2] += b * w01;
  a[i1 + 3] += r * w11;
  a[i1 + 4] += g * w11;
  a[i1 + 5] += b * w11;
};

/** fine += coarse, blown up to twice the size. */
const addUpsampled = (
  fine: Float32Array,
  fw: number,
  fh: number,
  coarse: Float32Array,
  cw: number,
  ch: number,
  gain: number,
) => {
  for (let y = 0; y < fh; y++) {
    const ky = y >> 1;
    const ra = (y & 1 ? ky : Math.max(ky - 1, 0)) * cw * 3;
    const rb = (y & 1 ? Math.min(ky + 1, ch - 1) : ky) * cw * 3;
    const wa = (y & 1 ? 0.75 : 0.25) * gain;
    const wb = (y & 1 ? 0.25 : 0.75) * gain;
    let o = y * fw * 3;
    for (let x = 0; x < fw; x++, o += 3) {
      const kx = x >> 1;
      const ca = (x & 1 ? kx : Math.max(kx - 1, 0)) * 3;
      const cb = (x & 1 ? Math.min(kx + 1, cw - 1) : kx) * 3;
      const ua = x & 1 ? 0.75 : 0.25;
      const ub = 1 - ua;
      fine[o] +=
        wa * (ua * coarse[ra + ca] + ub * coarse[ra + cb]) +
        wb * (ua * coarse[rb + ca] + ub * coarse[rb + cb]);
      fine[o + 1] +=
        wa * (ua * coarse[ra + ca + 1] + ub * coarse[ra + cb + 1]) +
        wb * (ua * coarse[rb + ca + 1] + ub * coarse[rb + cb + 1]);
      fine[o + 2] +=
        wa * (ua * coarse[ra + ca + 2] + ub * coarse[ra + cb + 2]) +
        wb * (ua * coarse[rb + ca + 2] + ub * coarse[rb + cb + 2]);
    }
  }
};

/** out = src at half the size (2x2 average). */
const halve = (
  src: Float32Array,
  sw: number,
  sh: number,
  out: Float32Array,
  ow: number,
  oh: number,
) => {
  for (let y = 0; y < oh; y++) {
    const ya = Math.min(y * 2, sh - 1) * sw * 3;
    const yb = Math.min(y * 2 + 1, sh - 1) * sw * 3;
    for (let x = 0; x < ow; x++) {
      const xa = Math.min(x * 2, sw - 1) * 3;
      const xb = Math.min(x * 2 + 1, sw - 1) * 3;
      const o = (y * ow + x) * 3;
      for (let c = 0; c < 3; c++)
        out[o + c] =
          0.25 *
          (src[ya + xa + c] +
            src[ya + xb + c] +
            src[yb + xa + c] +
            src[yb + xb + c]);
    }
  }
};

/** A soft blur in place: 1-4-6-4-1 across, then down. */
const blur = (img: Float32Array, w: number, h: number) => {
  for (let pass = 0; pass < 2; pass++) {
    const stepIn = pass === 0 ? 3 : w * 3;
    const lines = pass === 0 ? h : w;
    const length = pass === 0 ? w : h;
    const lineStep = pass === 0 ? w * 3 : 3;
    SCRATCH.set(img.subarray(0, w * h * 3));
    for (let line = 0; line < lines; line++) {
      for (let k = 0; k < length; k++) {
        const o = line * lineStep + k * stepIn;
        const m1 = line * lineStep + Math.max(k - 1, 0) * stepIn;
        const m2 = line * lineStep + Math.max(k - 2, 0) * stepIn;
        const p1 = line * lineStep + Math.min(k + 1, length - 1) * stepIn;
        const p2 = line * lineStep + Math.min(k + 2, length - 1) * stepIn;
        for (let c = 0; c < 3; c++)
          img[o + c] =
            (SCRATCH[m2 + c] +
              SCRATCH[p2 + c] +
              4 * (SCRATCH[m1 + c] + SCRATCH[p1 + c]) +
              6 * SCRATCH[o + c]) /
            16;
      }
    }
  }
};

/** Render one frame into an RGBA buffer of W x H pixels. */
export const renderLumen = (frame: number, rgba: Uint8ClampedArray) => {
  const beat = (frame + 0.5) / FPS / BEAT_SEC;
  const open = SHUTTER / FPS / BEAT_SEC;
  project(beat - open / 2, P0);
  project(beat + open / 2, P1);

  ACC[0].set(SKY);
  for (let l = 1; l < LEVELS; l++) ACC[l].fill(0);

  // The three bursts (first hit, drop, last hit) open the lens and light the sky.
  let burst = 0;
  for (const b of [1, 17, 29])
    if (beat > b) burst = Math.max(burst, decay(sec(beat - b), 0.07));
  if (burst > 0.005) {
    const top = LEVELS - 1;
    for (let y = 0, k = 0; y < LH[top]; y++)
      for (let x = 0; x < LW[top]; x++, k += 3) {
        const d = Math.hypot(
          x / (LW[top] - 1) - 0.5,
          (y / (LH[top] - 1) - 0.5) * 0.56,
        );
        const lit = burst * Math.exp(-d * d * 15);
        ACC[top][k] = 0.02 * lit;
        ACC[top][k + 1] = 0.03 * lit;
        ACC[top][k + 2] = 0.07 * lit;
      }
  }

  // Auto-exposure: when the whole cloud is packed into a few pixels, stop down,
  // or a point holding 170,000 lights would white out the frame.
  let spread = 0;
  for (let o = 0; o < N * 3; o += 3) {
    const dx = clamp(P0[o], -W, 2 * W) - W / 2;
    const dy = clamp(P0[o + 1], -H, 2 * H) - H / 2;
    spread += dx * dx + dy * dy;
  }
  spread = Math.sqrt(spread / N);
  let flash = 0;
  for (const [b] of SHAKES) if (beat > b) flash += decay(sec(beat - b), 0.14);
  // ...except on the bursts, which are allowed to white out.
  const gain =
    EXPOSURE *
    Math.max(clamp(Math.pow(spread / 245, 1.55), 0.02, 1.35), 0.8 * burst) *
    (1 + 0.9 * flash);

  // the plucked sixteenths: on each one, a different few points flare
  const sparkling =
    beat >= SPARKLE_FROM && beat < SPARKLE_TO && !(beat >= 16.5 && beat < 17);
  const step = Math.floor(beat * 4);
  const flare =
    (beat < 17 ? 3.5 + 5 * clamp((beat - 1) / 15.5) : 9) *
    decay(sec(beat - step / 4), 0.06);
  // the last three notes: a band of light runs over the sphere from pole to pole
  let band = -1;
  for (const b of L_LANDINGS) if (beat > b) band = sec(beat - b) / 0.34;
  // the one warm colour is kept for the drop
  const heat = smooth(17, 17.25, beat) * (1 - smooth(28, 29, beat));

  for (let i = 0, o = 0; i < N; i++, o += 3) {
    const z0 = P0[o + 2];
    const z1 = P1[o + 2];
    if (z0 < 0.12 || z1 < 0.12) continue;
    const x0 = P0[o];
    const y0 = P0[o + 1];
    let dx = P1[o] - x0;
    let dy = P1[o + 1] - y0;
    // a point that wrapped from one end of the tunnel to the other did not travel
    if (Math.abs(z1 - z0) > 3) {
      dx = 0;
      dy = 0;
    }
    const mx = x0 + dx * 0.5;
    const my = y0 + dy * 0.5;
    if (mx < -80 || mx > W + 80 || my < -80 || my > H + 80) continue;

    let light = gain * smooth(0.12, 0.7, z0);
    // far end of the tunnel fades into the dark
    if (z0 > 9) light *= 1 - smooth(9, TUNNEL_LENGTH, z0);
    if (sparkling && hash32(i * 31 + step * 977) < 0.03) light *= 1 + flare;
    if (band >= 0) {
      const w = (V[i] - band) / 0.07;
      if (w * w < 4) light *= 1 + 5 * Math.exp(-w * w * 1.5);
    }

    // out of focus = bigger and fainter
    const blurRadius =
      BASE_RADIUS + (APERTURE * Math.abs(z0 - CAM)) / (z0 * CAM);
    const travel = Math.sqrt(dx * dx + dy * dy);
    const samples = travel < 1.4 ? 1 : Math.min(18, Math.ceil(travel / 1.4));
    const radius = Math.max(blurRadius, (travel / samples) * 0.45);
    const level = Math.min(Math.log2(radius * 2), LEVELS - 1.001);
    const lower = level <= 0 ? 0 : Math.floor(level);
    const upper = level <= 0 ? 0 : level - lower;

    const hot = HOT[i] * heat;
    const cool = (1 - Math.min(hot, 1)) * light;
    const r = (COLOR[o] * cool + ROSE[0] * hot * light) / samples;
    const g = (COLOR[o + 1] * cool + ROSE[1] * hot * light) / samples;
    const b = (COLOR[o + 2] * cool + ROSE[2] * hot * light) / samples;
    for (let s = 0; s < samples; s++) {
      const k = (s + 0.5) / samples;
      const px = x0 + dx * k;
      const py = y0 + dy * k;
      splat(lower, px, py, r * (1 - upper), g * (1 - upper), b * (1 - upper));
      if (upper > 0.02)
        splat(lower + 1, px, py, r * upper, g * upper, b * upper);
    }
  }

  // Bloom: take everything down to 1/8 size, blur it at three widths, add it back.
  const b3 = BLOOM[0];
  const a0 = ACC[0];
  const a1 = ACC[1];
  const a2 = ACC[2];
  const a3 = ACC[3];
  for (let y = 0; y < LH[3]; y++) {
    for (let x = 0; x < LW[3]; x++) {
      const o = (y * LW[3] + x) * 3;
      for (let c = 0; c < 3; c++) {
        let s0 = 0;
        for (let j = 0; j < 8; j++) {
          const row = ((y * 8 + j) * W + x * 8) * 3 + c;
          for (let k = 0; k < 24; k += 3) s0 += a0[row + k] - SKY[row + k];
        }
        let s1 = 0;
        for (let j = 0; j < 4; j++) {
          const row = ((y * 4 + j) * LW[1] + x * 4) * 3 + c;
          for (let k = 0; k < 12; k += 3) s1 += a1[row + k];
        }
        let s2 = 0;
        for (let j = 0; j < 2; j++) {
          const row = ((y * 2 + j) * LW[2] + x * 2) * 3 + c;
          s2 += a2[row] + a2[row + 3];
        }
        b3[o + c] = s0 / 64 + s1 / 16 + s2 / 4 + a3[o + c];
      }
    }
  }
  blur(b3, LW[3], LH[3]);
  halve(b3, LW[3], LH[3], BLOOM[1], LW[4], LH[4]);
  blur(BLOOM[1], LW[4], LH[4]);
  halve(BLOOM[1], LW[4], LH[4], BLOOM[2], LW[5], LH[5]);
  blur(BLOOM[2], LW[5], LH[5]);
  for (let j = 0; j < 3; j++) {
    const dst = ACC[3 + j];
    const src = BLOOM[j];
    const glow = [0.11, 0.09, 0.07][j] * (1 + 2.5 * burst);
    for (let k = 0; k < src.length; k++) dst[k] += src[k] * glow;
  }

  for (let l = LEVELS - 2; l >= 0; l--)
    addUpsampled(ACC[l], LW[l], LH[l], ACC[l + 1], LW[l + 1], LH[l + 1], 1);

  // expose
  for (let p = 0, o = 0, q = 0; p < W * H; p++, o += 3, q += 4) {
    const d = DITHER[p];
    const ir = Math.sqrt(a0[o]) * 1024;
    const ig = Math.sqrt(a0[o + 1]) * 1024;
    const ib = Math.sqrt(a0[o + 2]) * 1024;
    rgba[q] = FILM[ir > 4096 ? 4096 : ir | 0] + d;
    rgba[q + 1] = FILM[ig > 4096 ? 4096 : ig | 0] + d;
    rgba[q + 2] = FILM[ib > 4096 ? 4096 : ib | 0] + d;
    rgba[q + 3] = 255;
  }
};
