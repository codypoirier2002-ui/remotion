/**
 * COSMOS, the renderer. Everything in the picture band is computed here, on
 * the CPU, from nothing but numbers: no images are read.
 *
 * Light is added up in floating point in a pyramid of images (full size,
 * half, quarter...). Soft things like fog are worked out at half or quarter
 * size; points of light go into the level that matches how blurred they are.
 * The pyramid is then collapsed into one image, which gets bloom, a
 * horizontal lens streak, a film curve, a grade, a vignette and grain.
 *
 * The shots are written for a band BW x BH. The same picture can be rendered
 * larger (`setScale`): every drawing call multiplies positions and sizes by
 * the scale, so the shots do not change. At scale 1 every one of those
 * multiplications is by exactly 1, so the picture is the same to the bit.
 */
export const BW = 1080;
export const BH = 608;
/** Scale for the landscape version: the band drawn 1920 wide. */
export const WIDE = 16 / 9;
/** Pixel size of the picture rendered at a scale. */
export const renderSize = (scale: number) => ({
  w: Math.round(BW * scale),
  h: Math.round(BH * scale),
});

const LEVELS = 7;
/** Render pixels per band pixel; its square; how many pyramid levels soft layers step up. */
let K = 0;
let K2 = 1;
let SHIFT = 0;
let RW = 0;
let RH = 0;
let LW: number[] = [];
let LH: number[] = [];
/** The pyramid. Level 0 is the picture itself. */
let ACC: Float32Array[] = [];
let IMG: Float32Array = new Float32Array(0);
/** Coverage mask for silhouettes and bolts, 0..1, full size. */
let MASK = new Float32Array(0);

// ================================================================ noise
const PERM = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 0x2545f491;
  for (let i = 255; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const grad = (h: number, x: number, y: number, z: number) => {
  const k = h & 15;
  const u = k < 8 ? x : y;
  const v = k < 4 ? y : k === 12 || k === 14 ? x : z;
  return ((k & 1) === 0 ? u : -u) + ((k & 2) === 0 ? v : -v);
};
/** Improved Perlin noise, about -1..1. */
export const noise3 = (x: number, y: number, z: number) => {
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const Z = Math.floor(z);
  x -= X;
  y -= Y;
  z -= Z;
  const xi = X & 255;
  const yi = Y & 255;
  const zi = Z & 255;
  const u = x * x * x * (x * (x * 6 - 15) + 10);
  const v = y * y * y * (y * (y * 6 - 15) + 10);
  const w = z * z * z * (z * (z * 6 - 15) + 10);
  const A = PERM[xi] + yi;
  const AA = PERM[A] + zi;
  const AB = PERM[A + 1] + zi;
  const B = PERM[xi + 1] + yi;
  const BA = PERM[B] + zi;
  const BB = PERM[B + 1] + zi;
  const l1 =
    grad(PERM[AA], x, y, z) +
    u * (grad(PERM[BA], x - 1, y, z) - grad(PERM[AA], x, y, z));
  const l2 =
    grad(PERM[AB], x, y - 1, z) +
    u * (grad(PERM[BB], x - 1, y - 1, z) - grad(PERM[AB], x, y - 1, z));
  const l3 =
    grad(PERM[AA + 1], x, y, z - 1) +
    u * (grad(PERM[BA + 1], x - 1, y, z - 1) - grad(PERM[AA + 1], x, y, z - 1));
  const l4 =
    grad(PERM[AB + 1], x, y - 1, z - 1) +
    u *
      (grad(PERM[BB + 1], x - 1, y - 1, z - 1) -
        grad(PERM[AB + 1], x, y - 1, z - 1));
  const m1 = l1 + v * (l2 - l1);
  const m2 = l3 + v * (l4 - l3);
  return m1 + w * (m2 - m1);
};
/** Fractal noise: octaves of noise3, each turned a little so no grid shows. */
export const fbm = (x: number, y: number, z: number, octaves: number) => {
  let sum = 0;
  let amp = 0.5;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise3(x, y, z);
    const nx = x * 1.6 + y * 1.2;
    y = y * 1.6 - x * 1.2;
    x = nx + 17.3;
    z = z * 1.9 + 3.1;
    amp *= 0.5;
  }
  return sum;
};

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
  Math.cos(6.283185 * rand(n + 7919));

// ================================================================ drawing
export const clear = () => {
  for (const a of ACC) a.fill(0);
};

/**
 * Fill one pyramid level pixel by pixel. `fn(x, y)` gets the pixel centre in
 * band coordinates and writes into `out`, which is added. Rows `y0` to `y1`
 * (band coordinates) only.
 */
const OUT = new Float32Array(3);
export const shade = (
  level: number,
  fn: (x: number, y: number, out: Float32Array) => void,
  y0 = 0,
  y1 = BH,
) => {
  const l = level + SHIFT;
  const w = LW[l];
  const s = 1 << l;
  const a = ACC[l];
  const j0 = Math.max(0, Math.floor((y0 * K) / s));
  const j1 = Math.min(LH[l], Math.ceil((y1 * K) / s));
  for (let j = j0; j < j1; j++) {
    const y = ((j + 0.5) * s) / K;
    for (let i = 0, o = j * w * 3; i < w; i++, o += 3) {
      OUT[0] = 0;
      OUT[1] = 0;
      OUT[2] = 0;
      fn(((i + 0.5) * s) / K, y, OUT);
      a[o] += OUT[0];
      a[o + 1] += OUT[1];
      a[o + 2] += OUT[2];
    }
  }
};

/** A point of light: `radius` in pixels picks how blurred it is. */
export const splat = (
  px: number,
  py: number,
  radius: number,
  r: number,
  g: number,
  b: number,
) => {
  // bigger picture: the same light spread over K^2 more pixels, so K^2 more of it
  const x = px * K;
  const y = py * K;
  const rr = r * K2;
  const gg = g * K2;
  const bb = b * K2;
  const level = Math.min(
    Math.log2(Math.max(radius * K, 0.5) * 2),
    LEVELS - 1.001,
  );
  const lower = level <= 0 ? 0 : Math.floor(level);
  const upper = level <= 0 ? 0 : level - lower;
  put(lower, x, y, rr * (1 - upper), gg * (1 - upper), bb * (1 - upper));
  if (upper > 0.02) put(lower + 1, x, y, rr * upper, gg * upper, bb * upper);
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

/** A moving point: its light smeared along the path it travelled while the shutter was open. */
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
  const n = len < 1.2 ? 1 : Math.min(40, Math.ceil(len / 1.2));
  const rr = Math.max(radius, (len / n) * 0.45);
  for (let s = 0; s < n; s++) {
    const k = (s + 0.5) / n;
    splat(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, rr, r / n, g / n, b / n);
  }
};

/** Add every level into the picture and empty them, so more can be drawn on top. */
export const collapse = () => {
  for (let l = LEVELS - 2; l >= 0; l--) {
    upAdd(ACC[l + 1], LW[l + 1], LH[l + 1], ACC[l], LW[l], LH[l], 1);
    ACC[l + 1].fill(0);
  }
};

/** fine += coarse blown up by any whole factor, bilinear. */
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
    for (let x = 0, o = y * fw * 3; x < fw; x++, o += 3) {
      let sx = (x + 0.5) * fx - 0.5;
      sx = sx < 0 ? 0 : sx > cw - 1 ? cw - 1 : sx;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, cw - 1);
      const tx = sx - x0;
      const a = (y0 * cw + x0) * 3;
      const b = (y0 * cw + x1) * 3;
      const c = (y1 * cw + x0) * 3;
      const d = (y1 * cw + x1) * 3;
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

// ---------------------------------------------------------------- shapes over the picture
/** A thick line, round ends, anti-aliased, into MASK (max). Width can taper from w0 to w1. */
export const line = (
  bx0: number,
  by0: number,
  bx1: number,
  by1: number,
  bw0: number,
  bw1 = bw0,
) => {
  const x0 = bx0 * K;
  const y0 = by0 * K;
  const x1 = bx1 * K;
  const y1 = by1 * K;
  const w0 = bw0 * K;
  const w1 = bw1 * K;
  const pad = Math.max(w0, w1) / 2 + 1;
  const xa = Math.max(0, Math.floor(Math.min(x0, x1) - pad));
  const xb = Math.min(RW - 1, Math.ceil(Math.max(x0, x1) + pad));
  const ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad));
  const yb = Math.min(RH - 1, Math.ceil(Math.max(y0, y1) + pad));
  const dx = x1 - x0;
  const dy = y1 - y0;
  const ll = dx * dx + dy * dy || 1;
  for (let y = ya; y <= yb; y++)
    for (let x = xa; x <= xb; x++) {
      const px = x + 0.5 - x0;
      const py = y + 0.5 - y0;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / ll));
      const d = Math.hypot(px - dx * t, py - dy * t);
      const half = (w0 + (w1 - w0) * t) / 2;
      const cover = Math.max(0, Math.min(1, half - d + 0.5));
      const p = y * RW + x;
      if (cover > MASK[p]) MASK[p] = cover;
    }
};

/** Everything below `top(x)` (band coordinates, from the top of the band), anti-aliased, into MASK. */
export const ground = (top: (x: number) => number) => {
  for (let x = 0; x < RW; x++) {
    const h = top((x + 0.5) / K) * K;
    const y0 = Math.max(0, Math.floor(h));
    for (let y = y0; y < RH; y++) {
      const cover = Math.max(0, Math.min(1, y + 1 - h));
      const p = y * RW + x;
      if (cover > MASK[p]) MASK[p] = cover;
    }
  }
};

/** Paint MASK onto the picture in one colour, then empty it. */
export const fillMask = (r: number, g: number, b: number) => {
  for (let p = 0, o = 0; p < RW * RH; p++, o += 3) {
    const m = MASK[p];
    if (m <= 0) continue;
    IMG[o] += (r - IMG[o]) * m;
    IMG[o + 1] += (g - IMG[o + 1]) * m;
    IMG[o + 2] += (b - IMG[o + 2]) * m;
    MASK[p] = 0;
  }
};

/**
 * A lit sphere at full size. `surface(nx, ny, nz, out)` gets the normal facing
 * the camera (nz > 0) and writes the light leaving that point.
 */
export const sphere = (
  bcx: number,
  bcy: number,
  br: number,
  surface: (nx: number, ny: number, nz: number, out: Float32Array) => void,
) => {
  const cx = bcx * K;
  const cy = bcy * K;
  const r = br * K;
  const xa = Math.max(0, Math.floor(cx - r - 1));
  const xb = Math.min(RW - 1, Math.ceil(cx + r + 1));
  const ya = Math.max(0, Math.floor(cy - r - 1));
  const yb = Math.min(RH - 1, Math.ceil(cy + r + 1));
  for (let y = ya; y <= yb; y++)
    for (let x = xa; x <= xb; x++) {
      const nx = (x + 0.5 - cx) / r;
      const ny = (y + 0.5 - cy) / r;
      const d = Math.sqrt(nx * nx + ny * ny);
      const cover = Math.max(0, Math.min(1, (1 - d) * r + 0.5));
      if (cover <= 0) continue;
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(d, 1) ** 2));
      OUT[0] = 0;
      OUT[1] = 0;
      OUT[2] = 0;
      surface(
        Math.min(d, 1) === d ? nx : nx / d,
        d <= 1 ? ny : ny / d,
        nz,
        OUT,
      );
      const o = (y * RW + x) * 3;
      IMG[o] += (OUT[0] - IMG[o]) * cover;
      IMG[o + 1] += (OUT[1] - IMG[o + 1]) * cover;
      IMG[o + 2] += (OUT[2] - IMG[o + 2]) * cover;
    }
};

// ================================================================ the film
// Bloom at a quarter, an eighth and a sixteenth of the band (more steps down when it is drawn bigger).
let B2W = 0;
let B2H = 0;
let B3W = 0;
let B3H = 0;
let B4W = 0;
let B4H = 0;
let B2 = new Float32Array(0);
let B3 = new Float32Array(0);
let B4 = new Float32Array(0);
let STREAK = new Float32Array(0);
let TMP = new Float32Array(0);

const down = (
  src: Float32Array,
  sw: number,
  sh: number,
  out: Float32Array,
  ow: number,
  oh: number,
) => {
  const f = Math.round(sw / ow);
  const k = 1 / (f * f);
  for (let y = 0; y < oh; y++)
    for (let x = 0; x < ow; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < f; j++) {
        const yy = Math.min(y * f + j, sh - 1);
        for (let i = 0; i < f; i++) {
          const o = (yy * sw + Math.min(x * f + i, sw - 1)) * 3;
          r += src[o];
          g += src[o + 1];
          b += src[o + 2];
        }
      }
      const o = (y * ow + x) * 3;
      out[o] = r * k;
      out[o + 1] = g * k;
      out[o + 2] = b * k;
    }
};

/** 1-4-6-4-1 blur, in place; `vertical` false for a horizontal-only pass. */
const blur = (img: Float32Array, w: number, h: number, vertical = true) => {
  for (let pass = 0; pass < (vertical ? 2 : 1); pass++) {
    const step = pass === 0 ? 3 : w * 3;
    const lines = pass === 0 ? h : w;
    const length = pass === 0 ? w : h;
    const lineStep = pass === 0 ? w * 3 : 3;
    TMP.set(img.subarray(0, w * h * 3));
    for (let ln = 0; ln < lines; ln++)
      for (let k = 0; k < length; k++) {
        const base = ln * lineStep;
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
};

/** Fixed grain pattern, larger than the frame so each frame can read it from a different place. */
let GRAIN_W = 0;
let GRAIN = new Float32Array(0);
let VIGNETTE = new Float32Array(0);

/** Size every buffer for a scale. Called again only when the scale changes. */
export const setScale = (scale: number) => {
  if (scale === K) return;
  K = scale;
  K2 = scale * scale;
  SHIFT = Math.max(0, Math.round(Math.log2(scale)));
  ({ w: RW, h: RH } = renderSize(scale));
  LW = [];
  LH = [];
  ACC = [];
  for (let l = 0; l < LEVELS; l++) {
    LW.push(Math.ceil(RW / 2 ** l));
    LH.push(Math.ceil(RH / 2 ** l));
    ACC.push(new Float32Array(LW[l] * LH[l] * 3));
  }
  IMG = ACC[0];
  MASK = new Float32Array(RW * RH);
  const f = 4 << SHIFT;
  B2W = Math.ceil(RW / f);
  B2H = Math.ceil(RH / f);
  B3W = Math.ceil(RW / (f * 2));
  B3H = Math.ceil(RH / (f * 2));
  B4W = Math.ceil(RW / (f * 4));
  B4H = Math.ceil(RH / (f * 4));
  B2 = new Float32Array(B2W * B2H * 3);
  B3 = new Float32Array(B3W * B3H * 3);
  B4 = new Float32Array(B4W * B4H * 3);
  STREAK = new Float32Array(B3W * B3H * 3);
  TMP = new Float32Array(B2W * B2H * 3);
  GRAIN_W = RW + 64;
  GRAIN = new Float32Array(GRAIN_W * (RH + 64));
  for (let i = 0; i < GRAIN.length; i++) GRAIN[i] = gauss(i * 3 + 11);
  VIGNETTE = new Float32Array(RW * RH);
  for (let y = 0, p = 0; y < RH; y++)
    for (let x = 0; x < RW; x++, p++) {
      const dx = (x - RW / 2) / (RW / 2);
      const dy = (y - RH / 2) / (RH / 2);
      VIGNETTE[p] =
        1 - 0.32 * Math.pow(Math.min(1, (dx * dx * 0.8 + dy * dy) / 1.8), 1.4);
    }
};
const FILM = new Uint8ClampedArray(4097);
for (let i = 0; i <= 4096; i++) {
  // ACES fit, then the display curve; indexed by sqrt so the dark end stays smooth
  const x = (i / 1024) ** 2;
  const a = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  FILM[i] = 255 * Math.pow(Math.min(1, Math.max(0, a)), 1 / 2.2);
}

export type Grade = {
  /** multiplies the light before the film curve */
  exposure: number;
  /** colour of the darks and of the lights, multiplied in */
  shadows: [number, number, number];
  highlights: [number, number, number];
  bloom: number;
  /** horizontal lens streak through bright points */
  streak: number;
  /** 0..1 white over everything */
  flash: number;
  /** 0..1 black over everything */
  fade: number;
  grain: number;
};
export const GRADE: Grade = {
  exposure: 1,
  shadows: [0.9, 1.0, 1.08],
  highlights: [1.08, 1.0, 0.9],
  bloom: 0.5,
  streak: 0.25,
  flash: 0,
  fade: 0,
  grain: 4,
};

/** Bloom, streak, film curve, grade, vignette and grain, into an RGBA buffer of the rendered size. */
export const develop = (g: Grade, frame: number, rgba: Uint8ClampedArray) => {
  down(IMG, RW, RH, B2, B2W, B2H);
  blur(B2, B2W, B2H);
  down(B2, B2W, B2H, B3, B3W, B3H);
  blur(B3, B3W, B3H);
  down(B3, B3W, B3H, B4, B4W, B4H);
  blur(B4, B4W, B4H);
  blur(B4, B4W, B4H);
  // the lens streak: only what is very bright, smeared sideways
  for (let i = 0; i < B3.length; i += 3) {
    const l = (B3[i] + B3[i + 1] + B3[i + 2]) / 3;
    const k = l > 0.5 ? (l - 0.5) / l : 0;
    STREAK[i] = B3[i] * k * 0.5;
    STREAK[i + 1] = B3[i + 1] * k * 0.8;
    STREAK[i + 2] = B3[i + 2] * k * 1.4;
  }
  for (let n = 0; n < 9; n++) blur(STREAK, B3W, B3H, false);
  upAdd(B2, B2W, B2H, IMG, RW, RH, 0.14 * g.bloom);
  upAdd(B3, B3W, B3H, IMG, RW, RH, 0.22 * g.bloom);
  upAdd(B4, B4W, B4H, IMG, RW, RH, 0.34 * g.bloom);
  upAdd(STREAK, B3W, B3H, IMG, RW, RH, g.streak * 2.4);

  const ox = (frame * 37) % 64;
  const oy = (frame * 23) % 64;
  const [sr, sg, sb] = g.shadows;
  const [hr, hg, hb] = g.highlights;
  const keep = 1 - g.fade;
  for (let y = 0, p = 0, o = 0, q = 0; y < RH; y++) {
    const grow = (y + oy) * GRAIN_W + ox;
    for (let x = 0; x < RW; x++, p++, o += 3, q += 4) {
      const v = VIGNETTE[p] * g.exposure;
      let r = IMG[o] * v;
      let gg = IMG[o + 1] * v;
      let b = IMG[o + 2] * v;
      // split toning: cool darks, warm lights
      const l = Math.min(1, (r + gg + b) / 3);
      r *= sr + (hr - sr) * l;
      gg *= sg + (hg - sg) * l;
      b *= sb + (hb - sb) * l;
      const ir = Math.sqrt(r) * 1024;
      const ig = Math.sqrt(gg) * 1024;
      const ib = Math.sqrt(b) * 1024;
      let R = FILM[ir > 4096 ? 4096 : ir | 0];
      let G = FILM[ig > 4096 ? 4096 : ig | 0];
      let B = FILM[ib > 4096 ? 4096 : ib | 0];
      if (g.flash > 0) {
        R += (255 - R) * g.flash;
        G += (255 - G) * g.flash;
        B += (255 - B) * g.flash;
      }
      // grain is strongest in the mid tones, like film
      const n =
        GRAIN[grow + x] *
        g.grain *
        (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, (R + G + B) / 600)));
      rgba[q] = (R + n) * keep;
      rgba[q + 1] = (G + n) * keep;
      rgba[q + 2] = (B + n) * keep;
      rgba[q + 3] = 255;
    }
  }
};
