/**
 * Volumes: fire, gas, dust. A ray is marched from the camera through the
 * medium; at every step the medium gives off its own light and scatters the
 * light of a source at the origin. That source casts real shadows: a grid
 * stores how much of its light survives to every distance in every
 * direction, so a dense clump darkens everything behind it and light pours
 * through the gaps.
 *
 * Volumes are marched at a third of the size, every ray from a slightly
 * different starting offset (see `jitter`); a small blur smooths what is left.
 * Motion blur is not sampled ray by ray (that is very noisy); instead
 * `radialBlur` smears the result along the way things move on screen.
 */
import { type Camera, H, W, noise, smooth } from "./engine";

export const VW = 640;
export const VH = 360;
/** light the volume gives towards the camera, rgb */
export const VRGB = new Float32Array(VW * VH * 3);
/** how much of what is behind the volume still shows through */
export const VT = new Float32Array(VW * VH);
/** depth at which the volume becomes more than half opaque (Infinity if never) */
export const VZ = new Float32Array(VW * VH);
/** depth of the light the volume gives, weighted by how much each depth gives */
export const VD = new Float32Array(VW * VH);
const TMPV = new Float32Array(VW * VH * 3);
const TMPT = new Float32Array(VW * VH);

export type Light = {
  r: number;
  g: number;
  b: number;
  /** light at distance d falls as 1 / (d² + soft²) */
  soft: number;
  /** how far from the origin the light has reached so far; null: everywhere */
  front: number | null;
  /** Henyey-Greenstein: 0 scatters evenly, towards 1 mostly onwards */
  anisotropy: number;
  /** how much of the light the medium scatters rather than swallows */
  albedo: number;
};

export type Medium = {
  /** The moment the next ray sees, in beats (each ray gets its own, for motion blur). */
  at: (beat: number) => void;
  /**
   * Extinction at a point; writes the light the medium itself gives off
   * (linear rgb) into `src`. `step` is the length of the step the march is
   * taking there: detail much finer than that cannot be seen and should be
   * left out (it would only turn into noise).
   */
  sample: (
    x: number,
    y: number,
    z: number,
    src: Float32Array,
    step: number,
  ) => number;
  /** A cheaper, smoother extinction, for the shadows of the light. */
  coarse: (x: number, y: number, z: number) => number;
};

// ---------------------------------------------------------------- the shadow grid
// Directions are stored on an octahedron unfolded into a square (no poles,
// nearly even), distances in NR shells out to the edge of the medium.
const NO = 96;
const NR = 56;
const LG = new Float32Array(NO * NO * NR);
let RMAX = 1;

/** Fill the shadow grid for a light at the origin and a medium inside radius `bound`. */
export const shadows = (m: Medium, bound: number) => {
  RMAX = bound;
  const dr = bound / NR;
  for (let j = 0; j < NO; j++)
    for (let i = 0; i < NO; i++) {
      let ox = ((i + 0.5) / NO) * 2 - 1;
      let oy = ((j + 0.5) / NO) * 2 - 1;
      const oz = 1 - Math.abs(ox) - Math.abs(oy);
      if (oz < 0) {
        const ax = ox;
        ox = (1 - Math.abs(oy)) * (ax >= 0 ? 1 : -1);
        oy = (1 - Math.abs(ax)) * (oy >= 0 ? 1 : -1);
      }
      const l = Math.hypot(ox, oy, oz);
      const dx = ox / l;
      const dy = oy / l;
      const dz = oz / l;
      let tau = 0;
      for (let k = 0; k < NR; k++) {
        const r = (k + 0.5) * dr;
        const s = m.coarse(dx * r, dy * r, dz * r) * dr;
        tau += s * 0.5;
        LG[(k * NO + j) * NO + i] = Math.exp(-tau);
        tau += s * 0.5;
      }
    }
};

/** How much of the light at the origin reaches (x, y, z), which is r from it. */
export const lit = (x: number, y: number, z: number, r: number) => {
  const l1 = Math.abs(x) + Math.abs(y) + Math.abs(z) + 1e-12;
  let ox = x / l1;
  let oy = y / l1;
  if (z < 0) {
    const ax = ox;
    ox = (1 - Math.abs(oy)) * (ax >= 0 ? 1 : -1);
    oy = (1 - Math.abs(ax)) * (oy >= 0 ? 1 : -1);
  }
  let fu = (ox * 0.5 + 0.5) * NO - 0.5;
  let fv = (oy * 0.5 + 0.5) * NO - 0.5;
  let fr = (r / RMAX) * NR - 0.5;
  fu = fu < 0 ? 0 : fu > NO - 1 ? NO - 1 : fu;
  fv = fv < 0 ? 0 : fv > NO - 1 ? NO - 1 : fv;
  fr = fr < 0 ? 0 : fr > NR - 1 ? NR - 1 : fr;
  const i0 = Math.floor(fu);
  const j0 = Math.floor(fv);
  const k0 = Math.floor(fr);
  const i1 = Math.min(i0 + 1, NO - 1);
  const j1 = Math.min(j0 + 1, NO - 1);
  const k1 = Math.min(k0 + 1, NR - 1);
  const tu = fu - i0;
  const tv = fv - j0;
  const tr = fr - k0;
  const a0 = k0 * NO * NO;
  const a1 = k1 * NO * NO;
  const r0 = j0 * NO;
  const r1 = j1 * NO;
  const s0 =
    (LG[a0 + r0 + i0] * (1 - tu) + LG[a0 + r0 + i1] * tu) * (1 - tv) +
    (LG[a0 + r1 + i0] * (1 - tu) + LG[a0 + r1 + i1] * tu) * tv;
  const s1 =
    (LG[a1 + r0 + i0] * (1 - tu) + LG[a1 + r0 + i1] * tu) * (1 - tv) +
    (LG[a1 + r1 + i0] * (1 - tu) + LG[a1 + r1 + i1] * tu) * tv;
  return s0 + (s1 - s0) * tr;
};

// ---------------------------------------------------------------- the march
const SRC = new Float32Array(3);

/**
 * March every ray of the small buffer through a medium inside radius `bound`
 * round the origin. `light` is at the origin (call `shadows` first), or null.
 * `beat` is the middle of the shutter, `shutter` how long it is open, in beats.
 *
 * Steps grow with distance, like the footprint of a pixel: `nearStep` close
 * to the lens, `growth` times the distance further out, never more than
 * `farStep`.
 */
export const march = (
  cam: Camera,
  m: Medium,
  bound: number,
  light: Light | null,
  nearStep: number,
  growth: number,
  farStep: number,
  frame: number,
  beat: number,
  shutter: number,
) => {
  const g = light ? light.anisotropy : 0;
  const g2 = g * g;
  const hgA = 1 - g2;
  const hgB = 1 + g2;
  const b2 = bound * bound;
  m.at(beat);
  void frame;
  void shutter;
  for (let j = 0, p = 0; j < VH; j++) {
    const sy = ((j + 0.5) / VH) * H;
    for (let i = 0; i < VW; i++, p++) {
      const sx = ((i + 0.5) / VW) * W;
      // random, not patterned: what is left after the blur reads as grain
      // Where the ray starts, as a fraction of a step. Random per pixel would turn
      // thin bright sheets into sand; the same for every pixel would slice them
      // into contour lines. Smoothly varying across the screen and fixed in
      // time breaks the slices up without noise or flicker.
      const jitter = 0.5 + 0.5 * noise(i * 0.031, j * 0.031, 7.7);
      let dx =
        cam.fx +
        ((sx - cam.cx) / cam.focal) * cam.rx -
        ((sy - cam.cy) / cam.focal) * cam.ux;
      let dy =
        cam.fy +
        ((sx - cam.cx) / cam.focal) * cam.ry -
        ((sy - cam.cy) / cam.focal) * cam.uy;
      let dz =
        cam.fz +
        ((sx - cam.cx) / cam.focal) * cam.rz -
        ((sy - cam.cy) / cam.focal) * cam.uz;
      const dl = Math.hypot(dx, dy, dz);
      dx /= dl;
      dy /= dl;
      dz /= dl;
      // where the ray is inside the bounding sphere
      const bb = cam.x * dx + cam.y * dy + cam.z * dz;
      const cc = cam.x * cam.x + cam.y * cam.y + cam.z * cam.z - b2;
      const disc = bb * bb - cc;
      VT[p] = 1;
      VZ[p] = Infinity;
      VD[p] = Infinity;
      VRGB[p * 3] = 0;
      VRGB[p * 3 + 1] = 0;
      VRGB[p * 3 + 2] = 0;
      if (disc <= 0) continue;
      const sq = Math.sqrt(disc);
      const t0 = Math.max(0.02, -bb - sq);
      const t1 = -bb + sq;
      if (t1 <= t0) continue;
      let t = t0 + Math.max(nearStep, t0 * growth) * jitter;
      let T = 1;
      let cr = 0;
      let cg = 0;
      let cb = 0;
      let zhalf = Infinity;
      let wsum = 0;
      let zsum = 0;
      while (t < t1) {
        let dt = t * growth;
        dt = dt < nearStep ? nearStep : dt > farStep ? farStep : dt;
        const x = cam.x + dx * t;
        const y = cam.y + dy * t;
        const z = cam.z + dz * t;
        const sigma = m.sample(x, y, z, SRC, dt);
        t += dt;
        if (sigma < 1e-5) continue;
        let sr = SRC[0];
        let sg = SRC[1];
        let sb = SRC[2];
        if (light) {
          const r2 = x * x + y * y + z * z;
          const r = Math.sqrt(r2);
          // angle between the light's travel and the way to the camera
          const cos = r > 1e-6 ? -(x * dx + y * dy + z * dz) / r : 1;
          const ph = hgA / Math.pow(hgB - 2 * g * cos, 1.5);
          const reach =
            light.front === null
              ? 1
              : smooth(light.front, light.front * 0.7, r);
          const k2 =
            (light.albedo * lit(x, y, z, r) * ph * reach) /
            (r2 + light.soft * light.soft);
          sr += light.r * k2;
          sg += light.g * k2;
          sb += light.b * k2;
        }
        const a = 1 - Math.exp(-sigma * dt);
        const ta = T * a;
        cr += ta * sr;
        cg += ta * sg;
        cb += ta * sb;
        const wl = ta * (sr + sg + sb);
        wsum += wl;
        zsum += wl * (t - dt * 0.5);
        T -= ta;
        if (T < 0.5 && zhalf === Infinity) zhalf = t - dt;
        if (T < 0.003) {
          T = 0;
          break;
        }
      }
      VT[p] = T;
      VZ[p] = zhalf;
      VD[p] = wsum > 0 ? zsum / wsum : Infinity;
      VRGB[p * 3] = cr;
      VRGB[p * 3 + 1] = cg;
      VRGB[p * 3 + 2] = cb;
    }
  }
  // smooth the noise of the jittered rays: 1-2-1 across and down
  for (let pass = 0; pass < 2; pass++) {
    const sx = pass === 0 ? 1 : 0;
    const sy = pass === 0 ? 0 : 1;
    TMPV.set(VRGB);
    TMPT.set(VT);
    for (let j = 0, p = 0; j < VH; j++)
      for (let i = 0; i < VW; i++, p++) {
        const im = Math.max(i - sx, 0);
        const ip = Math.min(i + sx, VW - 1);
        const jm = Math.max(j - sy, 0);
        const jp = Math.min(j + sy, VH - 1);
        const a = jm * VW + im;
        const c = jp * VW + ip;
        VT[p] = (TMPT[a] + 2 * TMPT[p] + TMPT[c]) / 4;
        for (let ch = 0; ch < 3; ch++)
          VRGB[p * 3 + ch] =
            (TMPV[a * 3 + ch] + 2 * TMPV[p * 3 + ch] + TMPV[c * 3 + ch]) / 4;
      }
  }
};

/**
 * Motion blur for a medium that streams straight out of one point on screen
 * (cx, cy): a point s pixels from it, at depth z, moves k · s / z pixels while
 * the shutter is open. Smears the volume along that path.
 */
export const radialBlur = (cx: number, cy: number, k: number) => {
  if (k <= 0) return;
  TMPV.set(VRGB);
  TMPT.set(VT);
  const sxv = VW / W;
  const syv = VH / H;
  for (let j = 0, p = 0; j < VH; j++)
    for (let i = 0; i < VW; i++, p++) {
      const z = VD[p];
      if (!(z < Infinity)) continue;
      const dx = ((i + 0.5) / VW) * W - cx;
      const dy = ((j + 0.5) / VH) * H - cy;
      const s = Math.hypot(dx, dy);
      if (s < 1) continue;
      // length of the smear, in pixels of the small buffer
      const len = Math.min((k * s) / Math.max(z, 0.4), 260) * sxv;
      if (len < 0.8) continue;
      const n = Math.min(16, Math.ceil(len * 1.5));
      const ux = ((dx / s) * len) / (n - 1 || 1);
      const uy = ((dy / s) * len * (syv / sxv)) / (n - 1 || 1);
      let r = 0;
      let g = 0;
      let b = 0;
      let t = 0;
      let x = i - (ux * (n - 1)) / 2;
      let y = j - (uy * (n - 1)) / 2;
      for (let q = 0; q < n; q++, x += ux, y += uy) {
        const xi = x < 0 ? 0 : x > VW - 1 ? VW - 1 : Math.round(x);
        const yi = y < 0 ? 0 : y > VH - 1 ? VH - 1 : Math.round(y);
        const o = yi * VW + xi;
        r += TMPV[o * 3];
        g += TMPV[o * 3 + 1];
        b += TMPV[o * 3 + 2];
        t += TMPT[o];
      }
      VRGB[p * 3] = r / n;
      VRGB[p * 3 + 1] = g / n;
      VRGB[p * 3 + 2] = b / n;
      VT[p] = t / n;
    }
};

/** How much of a point at screen (x, y) and `depth` shows through the volume. */
export const seen = (x: number, y: number, depth: number) => {
  const i = Math.min(VW - 1, Math.max(0, Math.floor((x / W) * VW)));
  const j = Math.min(VH - 1, Math.max(0, Math.floor((y / H) * VH)));
  const p = j * VW + i;
  if (depth < VZ[p]) return 1;
  return 0.12 + 0.88 * VT[p];
};
