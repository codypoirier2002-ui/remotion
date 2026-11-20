/**
 * COSMOS, remade deep: the renderer the six shots share.
 *
 * Everything is light, added up in floating point at full size, 1920 x 1080.
 * Points of light go into a pyramid of images, at the level that matches how
 * far out of focus they are. Then the film: bloom, red halation round the
 * brightest light, a horizontal lens streak, lens ghosts, chromatic
 * aberration, heat haze, vignette, a filmic curve and grain.
 *
 * A frame depends on nothing but its number.
 */
export const W = 1920;
export const H = 1080;
const PIX = W * H;

/** Deterministic 0..1 from an integer. */
export const rand = (n: number) => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
export const gauss = (n: number) =>
  Math.sqrt(-2 * Math.log(rand(n) + 1e-9)) *
  Math.cos(6.283185307 * rand(n + 7919));
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
/** Smoothstep from a to b; a > b gives a falling edge. */
export const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ================================================================ noise
// Gradient noise on a lattice that repeats every 8 units, baked once into a
// 128³ texture and read back with trilinear interpolation. Reading it is
// several times cheaper than computing noise, which is what makes volumes
// affordable on a CPU.
const TN = 128;
const TP = 8;
const TS = TN / TP;
let TEX = new Float32Array(1);
let prepared = false;
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Noise, about -1..1. */
export const noise = (x: number, y: number, z: number) => {
  const t = TEX;
  const fx = x * TS;
  const fy = y * TS;
  const fz = z * TS;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const iz = Math.floor(fz);
  const tx = fx - ix;
  const ty = fy - iy;
  const tz = fz - iz;
  const x0 = ix & 127;
  const x1 = (ix + 1) & 127;
  const y0 = (iy & 127) << 7;
  const y1 = ((iy + 1) & 127) << 7;
  const z0 = (iz & 127) << 14;
  const z1 = ((iz + 1) & 127) << 14;
  const a = t[z0 + y0 + x0];
  const b = t[z0 + y0 + x1];
  const c = t[z0 + y1 + x0];
  const d = t[z0 + y1 + x1];
  const e = t[z1 + y0 + x0];
  const f = t[z1 + y0 + x1];
  const g = t[z1 + y1 + x0];
  const h = t[z1 + y1 + x1];
  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  const ef = e + (f - e) * tx;
  const gh = g + (h - g) * tx;
  const abcd = ab + (cd - ab) * ty;
  const efgh = ef + (gh - ef) * ty;
  return abcd + (efgh - abcd) * tz;
};

/** Fractal noise: octaves turned and doubled, so no grid shows. About -1..1. */
export const fbm = (x: number, y: number, z: number, octaves: number) => {
  let sum = 0;
  let amp = 0.5;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x, y, z);
    const nx = -0.8 * y - 0.6 * z;
    const ny = 0.8 * x + 0.36 * y - 0.48 * z;
    const nz = 0.6 * x - 0.48 * y + 0.64 * z;
    x = nx * 2.03 + 1.7;
    y = ny * 2.03 - 3.1;
    z = nz * 2.03 + 0.9;
    amp *= 0.5;
  }
  return sum * 1.6;
};

// ================================================================ colour
const BB = new Float32Array(400 * 3);
/** Linear colour of a blackbody at `kelvin`, brightest channel 1. */
export const blackbody = (kelvin: number, out: Float32Array) => {
  const f = clamp(kelvin / 100, 10, 398);
  const i = Math.floor(f);
  const t = f - i;
  const a = i * 3;
  out[0] = BB[a] + (BB[a + 3] - BB[a]) * t;
  out[1] = BB[a + 1] + (BB[a + 4] - BB[a + 1]) * t;
  out[2] = BB[a + 2] + (BB[a + 5] - BB[a + 2]) * t;
};

/**
 * The colour of fire at heat x (0..1), linear light, getting brighter as it
 * gets hotter: dark red, red, orange, yellow, white. More saturated than a
 * true blackbody, which at these temperatures is peach.
 */
const RAMP: [number, number, number, number][] = [
  [0, 0, 0, 0],
  [0.15, 0.08, 0.004, 0],
  [0.35, 0.55, 0.06, 0.005],
  [0.55, 1.6, 0.42, 0.04],
  [0.75, 3.2, 1.55, 0.35],
  [0.9, 5.5, 4.0, 1.8],
  [1, 8, 7.5, 6.5],
];
export const fire = (x: number, out: Float32Array) => {
  const c = x < 0 ? 0 : x > 1 ? 1 : x;
  let i = 1;
  while (i < RAMP.length - 1 && c > RAMP[i][0]) i++;
  const [x0, r0, g0, b0] = RAMP[i - 1];
  const [x1, r1, g1, b1] = RAMP[i];
  const t = (c - x0) / (x1 - x0);
  out[0] = r0 + (r1 - r0) * t;
  out[1] = g0 + (g1 - g0) * t;
  out[2] = b0 + (b1 - b0) * t;
};

// ================================================================ the image
const LEVELS = 8;
const LW: number[] = [];
const LH: number[] = [];
const ACC: Float32Array[] = [];
/** The picture: linear light, rgb, full size. */
export let IMG: Float32Array = new Float32Array(1);

const B: { w: number; h: number; a: Float32Array }[] = [];
let HAL = new Float32Array(1);
let STR = new Float32Array(1);
let TMP = new Float32Array(1);
let VIGNETTE = new Float32Array(1);
const GRAIN_N = 512;
let GRAIN = new Float32Array(1);
/** the curve, on brightness: linear in, linear out, indexed by the square root */
const FILM = new Float32Array(4097);
/** display gamma: linear 0..1 in 4096 steps to 0..255 */
const GAMMA = new Float32Array(4097);

/** Bake the noise and the tables, and size the buffers. Only the first call does anything. */
const prepare = () => {
  if (prepared) return;
  prepared = true;
  // noise
  const n = TP * TP * TP;
  const g = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const z = 1 - 2 * rand(i * 7 + 1);
    const a = 6.283185307 * rand(i * 7 + 2);
    const s = Math.sqrt(1 - z * z);
    g[i * 3] = s * Math.cos(a);
    g[i * 3 + 1] = s * Math.sin(a);
    g[i * 3 + 2] = z;
  }
  const dot = (
    ix: number,
    iy: number,
    iz: number,
    dx: number,
    dy: number,
    dz: number,
  ) => {
    const k = (((iz % TP) * TP + (iy % TP)) * TP + (ix % TP)) * 3;
    return g[k] * dx + g[k + 1] * dy + g[k + 2] * dz;
  };
  const tex = new Float32Array(TN * TN * TN);
  let max = 0;
  for (let k = 0; k < TN; k++) {
    const z = k / TS;
    const iz = Math.floor(z);
    const dz = z - iz;
    const wz = fade(dz);
    for (let j = 0; j < TN; j++) {
      const y = j / TS;
      const iy = Math.floor(y);
      const dy = y - iy;
      const wy = fade(dy);
      for (let i = 0; i < TN; i++) {
        const x = i / TS;
        const ix = Math.floor(x);
        const dx = x - ix;
        const wx = fade(dx);
        const c000 = dot(ix, iy, iz, dx, dy, dz);
        const c100 = dot(ix + 1, iy, iz, dx - 1, dy, dz);
        const c010 = dot(ix, iy + 1, iz, dx, dy - 1, dz);
        const c110 = dot(ix + 1, iy + 1, iz, dx - 1, dy - 1, dz);
        const c001 = dot(ix, iy, iz + 1, dx, dy, dz - 1);
        const c101 = dot(ix + 1, iy, iz + 1, dx - 1, dy, dz - 1);
        const c011 = dot(ix, iy + 1, iz + 1, dx, dy - 1, dz - 1);
        const c111 = dot(ix + 1, iy + 1, iz + 1, dx - 1, dy - 1, dz - 1);
        const x00 = c000 + (c100 - c000) * wx;
        const x10 = c010 + (c110 - c010) * wx;
        const x01 = c001 + (c101 - c001) * wx;
        const x11 = c011 + (c111 - c011) * wx;
        const y0 = x00 + (x10 - x00) * wy;
        const y1 = x01 + (x11 - x01) * wy;
        const v = y0 + (y1 - y0) * wz;
        tex[(k * TN + j) * TN + i] = v;
        if (Math.abs(v) > max) max = Math.abs(v);
      }
    }
  }
  for (let i = 0; i < tex.length; i++) tex[i] /= max;
  TEX = tex;

  // blackbody colours, 0 to 39,900 K
  for (let i = 0; i < 400; i++) {
    const t = Math.max(i, 10);
    let r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    let gg =
      t <= 66
        ? 99.4708025861 * Math.log(t) - 161.1195681661
        : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    let b =
      t >= 66
        ? 255
        : t <= 19
          ? 0
          : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    r = Math.pow(clamp(r / 255), 2.2);
    gg = Math.pow(clamp(gg / 255), 2.2);
    b = Math.pow(clamp(b / 255), 2.2);
    const m = Math.max(r, gg, b, 1e-6);
    BB[i * 3] = r / m;
    BB[i * 3 + 1] = gg / m;
    BB[i * 3 + 2] = b / m;
  }

  // the pyramid for points of light
  for (let l = 0; l < LEVELS; l++) {
    LW.push(Math.ceil(W / 2 ** l));
    LH.push(Math.ceil(H / 2 ** l));
    ACC.push(new Float32Array(LW[l] * LH[l] * 3));
  }
  IMG = ACC[0];
  // bloom levels: 1/2 down to 1/64
  for (let l = 1; l <= 6; l++) {
    const w = Math.ceil(W / 2 ** l);
    const h = Math.ceil(H / 2 ** l);
    B.push({ w, h, a: new Float32Array(w * h * 3) });
  }
  HAL = new Float32Array(B[1].a.length);
  STR = new Float32Array(B[2].a.length);
  TMP = new Float32Array(B[0].a.length);

  VIGNETTE = new Float32Array(PIX);
  for (let y = 0, p = 0; y < H; y++)
    for (let x = 0; x < W; x++, p++) {
      // natural fall-off of a lens: cos⁴ of the angle off axis, gently
      const dx = (x + 0.5 - W / 2) / (W * 0.62);
      const dy = (y + 0.5 - H / 2) / (W * 0.62);
      const c = 1 / Math.sqrt(1 + dx * dx + dy * dy);
      VIGNETTE[p] = Math.pow(c, 3.2);
    }

  // grain: soft clumps rather than single pixels, std 1
  const raw = new Float32Array(GRAIN_N * GRAIN_N);
  for (let i = 0; i < raw.length; i++) raw[i] = gauss(i * 5 + 3);
  GRAIN = new Float32Array(raw.length);
  let sq = 0;
  for (let y = 0; y < GRAIN_N; y++)
    for (let x = 0; x < GRAIN_N; x++) {
      let s = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const w = (i === 0 ? 2 : 1) * (j === 0 ? 2 : 1);
          s +=
            w *
            raw[
              ((y + j + GRAIN_N) % GRAIN_N) * GRAIN_N +
                ((x + i + GRAIN_N) % GRAIN_N)
            ];
        }
      GRAIN[y * GRAIN_N + x] = s;
      sq += s * s;
    }
  const k = 1 / Math.sqrt(sq / GRAIN.length);
  for (let i = 0; i < GRAIN.length; i++) GRAIN[i] *= k;

  // the film curve, indexed by the square root of the light
  for (let i = 0; i <= 4096; i++) {
    const x = (i / 1024) ** 2;
    FILM[i] = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
    GAMMA[i] = 255 * Math.pow(i / 4096, 1 / 2.2);
  }
};

/** Start a frame: everything black. */
export const begin = () => {
  prepare();
  for (const a of ACC) a.fill(0);
};

// ---------------------------------------------------------------- the camera
export type Camera = {
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  rx: number;
  ry: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
  /** focal length in pixels */
  focal: number;
  /** where the axis of the lens lands on screen (shifting it frames off-centre) */
  cx: number;
  cy: number;
};

/** A camera at (px,py,pz) looking at (tx,ty,tz), turned by `roll` radians about its axis. */
export const lookAt = (
  px: number,
  py: number,
  pz: number,
  tx: number,
  ty: number,
  tz: number,
  roll: number,
  focal: number,
  cx: number,
  cy: number,
): Camera => {
  let fx = tx - px;
  let fy = ty - py;
  let fz = tz - pz;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;
  // right = up × forward, with up = +y
  let rx = fz;
  const ry = 0;
  let rz = -fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl;
  rz /= rl;
  // up = forward × right
  let ux = fy * rz - fz * ry;
  let uy = fz * rx - fx * rz;
  let uz = fx * ry - fy * rx;
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const rx2 = rx * c + ux * s;
  const ry2 = ry * c + uy * s;
  const rz2 = rz * c + uz * s;
  ux = ux * c - rx * s;
  uy = uy * c - ry * s;
  uz = uz * c - rz * s;
  return {
    x: px,
    y: py,
    z: pz,
    fx,
    fy,
    fz,
    rx: rx2,
    ry: ry2,
    rz: rz2,
    ux,
    uy,
    uz,
    focal,
    cx,
    cy,
  };
};

/** Where a point lands on screen: out = [x, y, depth]. False if it is behind the camera. */
export const project = (
  c: Camera,
  x: number,
  y: number,
  z: number,
  out: Float64Array,
) => {
  const dx = x - c.x;
  const dy = y - c.y;
  const dz = z - c.z;
  const d = dx * c.fx + dy * c.fy + dz * c.fz;
  if (d < 0.05) return false;
  out[0] = c.cx + (c.focal * (dx * c.rx + dy * c.ry + dz * c.rz)) / d;
  out[1] = c.cy - (c.focal * (dx * c.ux + dy * c.uy + dz * c.uz)) / d;
  out[2] = d;
  return true;
};

// ---------------------------------------------------------------- points of light
/** A point of light; `radius` in pixels says how far out of focus it is. */
export const splat = (
  px: number,
  py: number,
  radius: number,
  r: number,
  g: number,
  b: number,
) => {
  const level = Math.min(Math.log2(Math.max(radius, 0.5) * 2), LEVELS - 1.001);
  const lower = level <= 0 ? 0 : Math.floor(level);
  const upper = level <= 0 ? 0 : level - lower;
  put(lower, px, py, r * (1 - upper), g * (1 - upper), b * (1 - upper));
  if (upper > 0.02) put(lower + 1, px, py, r * upper, g * upper, b * upper);
};
const put = (
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
  const k = inv * inv;
  const a = ACC[level];
  const i0 = (y0 * w + x0) * 3;
  const i1 = i0 + w * 3;
  const w00 = (1 - fx) * (1 - fy) * k;
  const w10 = fx * (1 - fy) * k;
  const w01 = (1 - fx) * fy * k;
  const w11 = fx * fy * k;
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

/** A moving point: its light smeared along the path it took while the shutter was open. */
export const streak = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  r: number,
  g: number,
  b: number,
) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = len < 1 ? 1 : Math.min(64, Math.ceil(len / 1));
  const rr = Math.max(radius, (len / n) * 0.5);
  for (let s = 0; s < n; s++) {
    const k = (s + 0.5) / n;
    splat(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, rr, r / n, g / n, b / n);
  }
};

/** Diffraction spikes round a bright point: `count` thin rays that fade outward. */
export const spikes = (
  x: number,
  y: number,
  length: number,
  k: number,
  r: number,
  g: number,
  b: number,
  count: number,
  angle: number,
) => {
  for (let i = 0; i < count; i++) {
    const a = angle + (i / count) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const segs = 16;
    for (let s = 0; s < segs; s++) {
      const u0 = s / segs;
      const u1 = (s + 1) / segs;
      const w = (k * Math.pow(1 - (u0 + u1) / 2, 2.6)) / segs;
      streak(
        x + dx * length * u0,
        y + dy * length * u0,
        x + dx * length * u1,
        y + dy * length * u1,
        0.55,
        r * w,
        g * w,
        b * w,
      );
    }
  }
};

/** Add every level of the pyramid into the picture and empty them. */
export const collapse = () => {
  for (let l = LEVELS - 2; l >= 0; l--) {
    upAdd(ACC[l + 1], LW[l + 1], LH[l + 1], ACC[l], LW[l], LH[l], 1);
    ACC[l + 1].fill(0);
  }
};

/** fine += coarse, blown up bilinearly to the fine size. */
const upAdd = (
  coarse: Float32Array,
  cw: number,
  ch: number,
  fine: Float32Array,
  fw: number,
  fh: number,
  gain: number,
) => {
  const fx = cw / fw;
  const fy = ch / fh;
  for (let y = 0; y < fh; y++) {
    let sy = (y + 0.5) * fy - 0.5;
    sy = sy < 0 ? 0 : sy > ch - 1 ? ch - 1 : sy;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, ch - 1);
    const ty = sy - y0;
    const r0 = y0 * cw;
    const r1 = y1 * cw;
    for (let x = 0, o = y * fw * 3; x < fw; x++, o += 3) {
      let sx = (x + 0.5) * fx - 0.5;
      sx = sx < 0 ? 0 : sx > cw - 1 ? cw - 1 : sx;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, cw - 1);
      const tx = sx - x0;
      const a = (r0 + x0) * 3;
      const b = (r0 + x1) * 3;
      const c = (r1 + x0) * 3;
      const d = (r1 + x1) * 3;
      const k00 = (1 - tx) * (1 - ty) * gain;
      const k10 = tx * (1 - ty) * gain;
      const k01 = (1 - tx) * ty * gain;
      const k11 = tx * ty * gain;
      fine[o] +=
        coarse[a] * k00 + coarse[b] * k10 + coarse[c] * k01 + coarse[d] * k11;
      fine[o + 1] +=
        coarse[a + 1] * k00 +
        coarse[b + 1] * k10 +
        coarse[c + 1] * k01 +
        coarse[d + 1] * k11;
      fine[o + 2] +=
        coarse[a + 2] * k00 +
        coarse[b + 2] * k10 +
        coarse[c + 2] * k01 +
        coarse[d + 2] * k11;
    }
  }
};

/**
 * Lay a smaller layer over the picture: picture = picture × transmittance +
 * light, both read with bilinear interpolation.
 */
export const overlay = (
  light: Float32Array,
  transmittance: Float32Array,
  w: number,
  h: number,
) => {
  const fx = w / W;
  const fy = h / H;
  for (let y = 0; y < H; y++) {
    let sy = (y + 0.5) * fy - 0.5;
    sy = sy < 0 ? 0 : sy > h - 1 ? h - 1 : sy;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, h - 1);
    const ty = sy - y0;
    for (let x = 0, o = y * W * 3; x < W; x++, o += 3) {
      let sx = (x + 0.5) * fx - 0.5;
      sx = sx < 0 ? 0 : sx > w - 1 ? w - 1 : sx;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, w - 1);
      const tx = sx - x0;
      const p00 = y0 * w + x0;
      const p10 = y0 * w + x1;
      const p01 = y1 * w + x0;
      const p11 = y1 * w + x1;
      const k00 = (1 - tx) * (1 - ty);
      const k10 = tx * (1 - ty);
      const k01 = (1 - tx) * ty;
      const k11 = tx * ty;
      const t =
        transmittance[p00] * k00 +
        transmittance[p10] * k10 +
        transmittance[p01] * k01 +
        transmittance[p11] * k11;
      for (let c = 0; c < 3; c++)
        IMG[o + c] =
          IMG[o + c] * t +
          light[p00 * 3 + c] * k00 +
          light[p10 * 3 + c] * k10 +
          light[p01 * 3 + c] * k01 +
          light[p11 * 3 + c] * k11;
    }
  }
};

// ================================================================ the film
const down2 = (
  src: Float32Array,
  sw: number,
  sh: number,
  dst: Float32Array,
  dw: number,
  dh: number,
) => {
  for (let y = 0; y < dh; y++) {
    const ya = Math.min(y * 2, sh - 1) * sw;
    const yb = Math.min(y * 2 + 1, sh - 1) * sw;
    for (let x = 0; x < dw; x++) {
      const xa = Math.min(x * 2, sw - 1);
      const xb = Math.min(x * 2 + 1, sw - 1);
      const o = (y * dw + x) * 3;
      for (let c = 0; c < 3; c++)
        dst[o + c] =
          0.25 *
          (src[(ya + xa) * 3 + c] +
            src[(ya + xb) * 3 + c] +
            src[(yb + xa) * 3 + c] +
            src[(yb + xb) * 3 + c]);
    }
  }
};

/** 1-4-6-4-1 blur in place, across then down (or across only). */
const blur = (img: Float32Array, w: number, h: number, vertical = true) => {
  for (let pass = 0; pass < (vertical ? 2 : 1); pass++) {
    const step = pass === 0 ? 3 : w * 3;
    const lines = pass === 0 ? h : w;
    const length = pass === 0 ? w : h;
    const lineStep = pass === 0 ? w * 3 : 3;
    TMP.set(img.subarray(0, w * h * 3));
    for (let ln = 0; ln < lines; ln++) {
      const base = ln * lineStep;
      for (let k = 0; k < length; k++) {
        const o = base + k * step;
        const m1 = base + Math.max(k - 1, 0) * step;
        const m2 = base + Math.max(k - 2, 0) * step;
        const p1 = base + Math.min(k + 1, length - 1) * step;
        const p2 = base + Math.min(k + 2, length - 1) * step;
        for (let c = 0; c < 3; c++)
          img[o + c] =
            (TMP[m2 + c] +
              TMP[p2 + c] +
              4 * (TMP[m1 + c] + TMP[p1 + c]) +
              6 * TMP[o + c]) /
            16;
      }
    }
  }
};

/** A wide horizontal box blur in place (three passes ≈ Gaussian). */
const smear = (img: Float32Array, w: number, h: number, radius: number) => {
  const n = radius * 2 + 1;
  for (let pass = 0; pass < 3; pass++)
    for (let y = 0; y < h; y++) {
      const row = y * w * 3;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let i = -radius; i <= radius; i++)
          sum += img[row + Math.min(Math.max(i, 0), w - 1) * 3 + c];
        for (let x = 0; x < w; x++) {
          TMP[x] = sum / n;
          const add = Math.min(x + radius + 1, w - 1);
          const sub = Math.max(x - radius, 0);
          sum += img[row + add * 3 + c] - img[row + sub * 3 + c];
        }
        for (let x = 0; x < w; x++) img[row + x * 3 + c] = TMP[x];
      }
    }
};

export type Finish = {
  /** multiplies the light before the curve */
  exposure: number;
  /** share of the light that blooms, 0..1 */
  bloom: number;
  /** red glow round the brightest light, like film */
  halation: number;
  /** horizontal streak through very bright light */
  streak: number;
  /** a light the lens makes ghosts of: where it is on screen and how strong */
  ghosts: { x: number; y: number; k: number } | null;
  /** chromatic aberration: how far red and blue part at the corners, in pixels */
  aberration: number;
  /** heat haze: how far the picture shimmers, in pixels */
  haze: number;
  /** moves the haze */
  time: number;
  /** 0..1 */
  vignette: number;
  /** grain, in 8-bit steps */
  grain: number;
  /** 0..1 white over everything */
  flash: number;
  /** 0..1 black over everything */
  fade: number;
  /** colour multiplied into the dark tones, and into the light ones */
  shadows: [number, number, number];
  highlights: [number, number, number];
  /**
   * contrast round the frame's own middle brightness, before the curve:
   * 1 leaves it, more makes the darks darker and the lights lighter
   */
  contrast: number;
};
export const FINISH: Finish = {
  exposure: 1,
  bloom: 0.08,
  halation: 0.08,
  streak: 0.05,
  ghosts: null,
  aberration: 1.2,
  haze: 0,
  time: 0,
  vignette: 0.7,
  grain: 2.4,
  flash: 0,
  fade: 0,
  shadows: [0.92, 1.0, 1.1],
  highlights: [1.06, 1.0, 0.93],
  contrast: 1,
};

const GHOSTS = [
  { at: 0.55, size: 46, k: 0.5, r: 1.0, g: 0.75, b: 0.35 },
  { at: 0.9, size: 22, k: 0.9, r: 0.45, g: 0.8, b: 1.0 },
  { at: 1.25, size: 90, k: 0.25, r: 0.6, g: 1.0, b: 0.55 },
  { at: 1.6, size: 34, k: 0.6, r: 1.0, g: 0.5, b: 0.8 },
  { at: 2.1, size: 140, k: 0.12, r: 0.5, g: 0.6, b: 1.0 },
];

/** Develop the picture into an RGBA buffer of W x H. */
export const develop = (f: Finish, frame: number, rgba: Uint8ClampedArray) => {
  // bloom: the picture at 1/2 ... 1/64, each blurred, summed back up
  down2(IMG, W, H, B[0].a, B[0].w, B[0].h);
  blur(B[0].a, B[0].w, B[0].h);
  for (let l = 1; l < 6; l++) {
    down2(B[l - 1].a, B[l - 1].w, B[l - 1].h, B[l].a, B[l].w, B[l].h);
    blur(B[l].a, B[l].w, B[l].h);
  }
  // halation: only the brightest light, red, close round it
  const h2 = B[1].a;
  for (let i = 0; i < h2.length; i += 3) {
    const l = (h2[i] + h2[i + 1] + h2[i + 2]) / 3;
    const k = l > 1.2 ? (l - 1.2) / l : 0;
    HAL[i] = h2[i] * k;
    HAL[i + 1] = h2[i + 1] * k * 0.32;
    HAL[i + 2] = h2[i + 2] * k * 0.12;
  }
  blur(HAL, B[1].w, B[1].h);
  // the streak: very bright light smeared sideways, a little blue
  const b3 = B[2].a;
  for (let i = 0; i < b3.length; i += 3) {
    const l = (b3[i] + b3[i + 1] + b3[i + 2]) / 3;
    const k = l > 6 ? (l - 6) / l : 0;
    STR[i] = b3[i] * k * 0.55;
    STR[i + 1] = b3[i + 1] * k * 0.8;
    STR[i + 2] = b3[i + 2] * k * 1.35;
  }
  smear(STR, B[2].w, B[2].h, 26);
  for (let l = 4; l >= 0; l--)
    upAdd(B[l + 1].a, B[l + 1].w, B[l + 1].h, B[l].a, B[l].w, B[l].h, 1);
  const keep = 1 - f.bloom;
  for (let i = 0; i < PIX * 3; i++) IMG[i] *= keep;
  upAdd(B[0].a, B[0].w, B[0].h, IMG, W, H, f.bloom / 6);
  upAdd(HAL, B[1].w, B[1].h, IMG, W, H, f.halation);
  upAdd(STR, B[2].w, B[2].h, IMG, W, H, f.streak);

  // lens ghosts: soft discs on the line from the light through the centre
  if (f.ghosts && f.ghosts.k > 0.001) {
    const gx = f.ghosts.x;
    const gy = f.ghosts.y;
    for (const g of GHOSTS) {
      const cx = gx + (W / 2 - gx) * g.at * 2;
      const cy = gy + (H / 2 - gy) * g.at * 2;
      const r = g.size;
      const x0 = Math.max(0, Math.floor(cx - r - 2));
      const x1 = Math.min(W - 1, Math.ceil(cx + r + 2));
      const y0 = Math.max(0, Math.floor(cy - r - 2));
      const y1 = Math.min(H - 1, Math.ceil(cy + r + 2));
      const k = f.ghosts.k * g.k;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d >= 1.05) continue;
          // brighter at the rim, like a real ghost
          const v = k * smooth(1.05, 0.9, d) * (0.35 + 0.65 * d * d);
          const o = (y * W + x) * 3;
          IMG[o] += v * g.r;
          IMG[o + 1] += v * g.g;
          IMG[o + 2] += v * g.b;
        }
    }
  }

  // the last pass: haze, aberration, vignette, curve, flash, grain
  const ox = Math.floor(rand(frame * 3 + 1) * GRAIN_N);
  const oy = Math.floor(rand(frame * 3 + 2) * GRAIN_N);
  const ox2 = Math.floor(rand(frame * 3 + 5) * GRAIN_N);
  const hx = W / 2;
  const hy = H / 2;
  const ca = f.aberration / (hx * hx);
  const flash = f.flash;
  const keepFade = 1 - f.fade;
  const vig = f.vignette;
  const [sr0, sg0, sb0] = f.shadows;
  const [hr0, hg0, hb0] = f.highlights;
  // the middle brightness of the frame: the average of its log
  const cpow = f.contrast - 1;
  let pivot = 0.18;
  if (cpow !== 0) {
    let sum = 0;
    let n = 0;
    for (let p = 0; p < PIX; p += 7) {
      const l =
        (0.2126 * IMG[p * 3] +
          0.7152 * IMG[p * 3 + 1] +
          0.0722 * IMG[p * 3 + 2]) *
        f.exposure;
      sum += Math.log(l + 1e-4);
      n++;
    }
    pivot = Math.exp(sum / n);
  }
  for (let y = 0, p = 0, q = 0; y < H; y++) {
    const grow = ((y + oy) & (GRAIN_N - 1)) * GRAIN_N;
    const grow2 = ((y + ox2) & (GRAIN_N - 1)) * GRAIN_N;
    for (let x = 0; x < W; x++, p++, q += 4) {
      let sx = x + 0.5;
      let sy = y + 0.5;
      if (f.haze > 0) {
        sx += f.haze * noise(x * 0.011, y * 0.016 + f.time * 0.9, f.time * 0.6);
        sy +=
          f.haze *
          0.7 *
          noise(x * 0.011 + 3.7, y * 0.016 + f.time * 0.9, f.time * 0.6 + 2.1);
      }
      const dx = sx - hx;
      const dy = sy - hy;
      const d2 = (dx * dx + dy * dy) * ca;
      const R = bilinear(hx + dx * (1 + d2 / hx), hy + dy * (1 + d2 / hx), 0);
      const G = bilinear(sx, sy, 1);
      const Bc = bilinear(hx + dx * (1 - d2 / hx), hy + dy * (1 - d2 / hx), 2);
      const v = f.exposure * (1 - vig + vig * VIGNETTE[p]);
      let lr = R * v;
      let lg = G * v;
      let lb = Bc * v;
      // split toning: the darks lean cool, the lights warm
      const lum0 = (lr + lg + lb) / 3;
      const w = lum0 / (lum0 + 0.18);
      lr *= sr0 + (hr0 - sr0) * w;
      lg *= sg0 + (hg0 - sg0) * w;
      lb *= sb0 + (hb0 - sb0) * w;
      if (cpow !== 0) {
        const lc = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
        if (lc > 1e-7) {
          let kc = Math.pow(lc / pivot, cpow);
          if (kc > 1.6) kc = 1.6;
          lr *= kc;
          lg *= kc;
          lb *= kc;
        }
      }
      // the curve works on brightness, so a bright orange stays orange
      if (lr < 0) lr = 0;
      if (lg < 0) lg = 0;
      if (lb < 0) lb = 0;
      const L = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      const iL = Math.sqrt(L) * 1024;
      const Lt = FILM[iL > 4096 ? 4096 : iL | 0];
      const kk = L > 1e-9 ? Lt / L : 0;
      lr *= kk;
      lg *= kk;
      lb *= kk;
      // what a channel cannot hold spills over, and the very brightest go white
      const mx = lr > lg ? (lr > lb ? lr : lb) : lg > lb ? lg : lb;
      const spill = mx > 1 ? Math.min(1, (mx - 1) * 0.6) : 0;
      const hw = Lt > 0.75 ? ((Lt - 0.75) / 0.25) ** 2 * 0.55 : 0;
      const wt = spill > hw ? spill : hw;
      if (mx > 1) {
        lr /= mx;
        lg /= mx;
        lb /= mx;
      }
      lr += (1 - lr) * wt;
      lg += (1 - lg) * wt;
      lb += (1 - lb) * wt;
      let r = GAMMA[(lr * 4096) | 0];
      let g = GAMMA[(lg * 4096) | 0];
      let b = GAMMA[(lb * 4096) | 0];
      if (flash > 0) {
        r += (255 - r) * flash;
        g += (255 - g) * flash;
        b += (255 - b) * flash;
      }
      // grain: strongest in the mid tones, a little colour in it
      const lum = (r + g + b) / 765;
      const amt = f.grain * (0.3 + 1.4 * lum * (1 - lum) * 2);
      const n1 = GRAIN[grow + ((x + ox) & (GRAIN_N - 1))];
      const n2 = GRAIN[grow2 + ((x + oy) & (GRAIN_N - 1))];
      rgba[q] = (r + amt * (n1 * 0.85 + n2 * 0.25)) * keepFade;
      rgba[q + 1] = (g + amt * n1) * keepFade;
      rgba[q + 2] = (b + amt * (n1 * 0.85 - n2 * 0.25)) * keepFade;
      rgba[q + 3] = 255;
    }
  }
};

const bilinear = (x: number, y: number, c: number) => {
  let fx = x - 0.5;
  let fy = y - 0.5;
  fx = fx < 0 ? 0 : fx > W - 1.001 ? W - 1.001 : fx;
  fy = fy < 0 ? 0 : fy > H - 1.001 ? H - 1.001 : fy;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const o = (y0 * W + x0) * 3 + c;
  const a = IMG[o];
  const b = IMG[o + 3];
  const d = IMG[o + W * 3];
  const e = IMG[o + W * 3 + 3];
  return a + (b - a) * tx + (d - a + (e - d - b + a) * tx) * ty;
};
