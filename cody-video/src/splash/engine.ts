/**
 * SPLASH, the renderer: thick glossy paint.
 *
 * A picture is a background colour and a few layers of blobs. Inside a layer
 * every blob adds to one smooth field, and the paint is wherever that field is
 * above a threshold. That is why two blobs that come close reach out and join,
 * and why one that is pulled apart leaves a neck that snaps. Colours are
 * averaged by how much each blob contributes, so where two colours touch they
 * blend like wet paint.
 *
 * The field and the lighting are worked out at half size, where they are
 * smooth, and the edge is found again at full size, where it has to be sharp.
 */
export const W = 1920;
export const H = 1080;

export type RGB = [number, number, number];
/** x, y from the centre of the screen in pixels, y down. rx, ry are the radii, rot turns it. */
export type Blob = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  color: RGB;
};
/** `shadow` 0..1: how dark a shadow the layer drops on what is under it. */
export type Layer = { blobs: Blob[]; shadow: number };
export type Picture = { bg: RGB; layers: Layer[] };

const CW = W / 2;
const CH = H / 2;
/** Paint is where the field is above this. */
const LEVEL = 0.15;
/** A blob's field reaches this many radii out. With LEVEL, a lone blob comes out exactly its radius. */
const REACH = 1 / Math.sqrt(1 - Math.cbrt(LEVEL));
/** Flattest slope the edge finder will believe; keeps the moment two blobs join from flickering. */
const MIN_SLOPE = 0.0004;
/** How far in from the edge the surface keeps curving, in pixels. */
const BEVEL = 58;
const FAR = 64;
const SHADOW_X = 9;
const SHADOW_Y = 14;
const SHADOW_SOFT = 26;
const MAX_LAYERS = 3;

// light from the upper left, a little towards the viewer
const LIGHT = [-0.44, -0.6, 0.67];
const HALF = (() => {
  const l = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2] + 1);
  return [LIGHT[0] / l, LIGHT[1] / l, (LIGHT[2] + 1) / l];
})();

// per layer, at half size: signed distance to the edge (pixels, + inside) and the lit colour
const DIST = Array.from(
  { length: MAX_LAYERS },
  () => new Float32Array(CW * CH),
);
const LIT = Array.from(
  { length: MAX_LAYERS },
  () => new Float32Array(CW * CH * 3),
);

// blobs are sorted into tiles so that a pixel only looks at the ones near it
const TILE = 32;
const TW = Math.ceil(CW / TILE);
const TH = Math.ceil(CH / TILE);
const TILES: number[][] = Array.from({ length: TW * TH }, () => []);

// fixed paper grain and a slight darkening towards the corners
const GRAIN = new Float32Array(W * H);
const VIGNETTE = new Float32Array(W * H);
for (let y = 0, p = 0; y < H; y++)
  for (let x = 0; x < W; x++, p++) {
    let h = Math.imul((p * 3 + 17) ^ 0x9e3779b9, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    GRAIN[p] = ((h >>> 0) / 4294967296 - 0.5) * 5;
    const d = Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (W / 2));
    VIGNETTE[p] = 1.03 - 0.13 * d * d;
  }

/** Work out one layer's edge and lit colour at half size. */
const shadeLayer = (blobs: Blob[], dist: Float32Array, lit: Float32Array) => {
  for (const t of TILES) t.length = 0;
  const n = blobs.length;
  // per blob: centre, the two axes scaled so that 1 = edge of reach, colour
  const bx = new Float32Array(n);
  const by = new Float32Array(n);
  const ux = new Float32Array(n);
  const uy = new Float32Array(n);
  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const b = blobs[i];
    const c = Math.cos(b.rot);
    const s = Math.sin(b.rot);
    const ax = Math.max(b.rx, 0.5) * REACH;
    const ay = Math.max(b.ry, 0.5) * REACH;
    bx[i] = b.x + W / 2;
    by[i] = b.y + H / 2;
    ux[i] = c / ax;
    uy[i] = s / ax;
    vx[i] = -s / ay;
    vy[i] = c / ay;
    const reach = Math.max(ax, ay);
    const x0 = Math.max(0, Math.floor((bx[i] - reach) / 2 / TILE));
    const x1 = Math.min(TW - 1, Math.floor((bx[i] + reach) / 2 / TILE));
    const y0 = Math.max(0, Math.floor((by[i] - reach) / 2 / TILE));
    const y1 = Math.min(TH - 1, Math.floor((by[i] + reach) / 2 / TILE));
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) TILES[ty * TW + tx].push(i);
  }

  for (let j = 0, p = 0; j < CH; j++) {
    const py = 2 * j + 1;
    const tileRow = Math.floor(j / TILE) * TW;
    for (let i = 0; i < CW; i++, p++) {
      const list = TILES[tileRow + Math.floor(i / TILE)];
      if (list.length === 0) {
        dist[p] = -FAR;
        continue;
      }
      const px = 2 * i + 1;
      let field = 0;
      let gx = 0;
      let gy = 0;
      let weight = 0;
      let cr = 0;
      let cg = 0;
      let cb = 0;
      for (let q = 0; q < list.length; q++) {
        const k = list[q];
        const dx = px - bx[k];
        const dy = py - by[k];
        const u = dx * ux[k] + dy * uy[k];
        const v = dx * vx[k] + dy * vy[k];
        const fall = 1 - u * u - v * v;
        if (fall <= 0) continue;
        const w = fall * fall * fall;
        field += w;
        const slope = -6 * fall * fall;
        gx += slope * (u * ux[k] + v * vx[k]);
        gy += slope * (u * uy[k] + v * vy[k]);
        const share = w * w;
        const color = blobs[k].color;
        weight += share;
        cr += share * color[0];
        cg += share * color[1];
        cb += share * color[2];
      }
      if (weight <= 0) {
        dist[p] = -FAR;
        continue;
      }
      const slope = Math.hypot(gx, gy);
      const d = Math.max(
        -FAR,
        Math.min(FAR, (field - LEVEL) / Math.max(slope, MIN_SLOPE)),
      );
      dist[p] = d;
      if (d < -6) continue;

      // The surface is flat in the middle and rolls over within BEVEL of the edge.
      const inside = Math.max(0, Math.min(1, d / BEVEL));
      const tilt = (1 - inside) * (1 - inside) * 1.2;
      const lean = slope > 1e-9 ? -Math.sin(tilt) / slope : 0;
      const nx = gx * lean;
      const ny = gy * lean;
      const nz = Math.cos(tilt);
      const diffuse = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      const shade = 0.8 + 0.3 * diffuse;
      const gloss = Math.pow(
        Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]),
        46,
      );
      // a second, tighter highlight right on the shoulder: this is what makes it look wet
      const glint = Math.pow(
        Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]),
        400,
      );
      const white = Math.min(1, 0.5 * gloss + 0.6 * glint);
      const o = p * 3;
      const r = (cr / weight) * shade;
      const g = (cg / weight) * shade;
      const b = (cb / weight) * shade;
      lit[o] = r + (255 - r) * white;
      lit[o + 1] = g + (255 - g) * white;
      lit[o + 2] = b + (255 - b) * white;
    }
  }
};

/** Render a picture into an RGBA buffer of W x H pixels. */
export const renderPicture = (picture: Picture, rgba: Uint8ClampedArray) => {
  const layers = picture.layers.slice(0, MAX_LAYERS);
  layers.forEach((layer, l) => shadeLayer(layer.blobs, DIST[l], LIT[l]));
  const [br, bg, bb] = picture.bg;

  for (let y = 0, p = 0, q = 0; y < H; y++) {
    // each full-size pixel sits a quarter of the way between two half-size ones
    const ky = y >> 1;
    const ra = (y & 1 ? ky : Math.max(ky - 1, 0)) * CW;
    const rb = (y & 1 ? Math.min(ky + 1, CH - 1) : ky) * CW;
    const wa = y & 1 ? 0.75 : 0.25;
    const wb = 1 - wa;
    const sa = Math.max(0, Math.min(CH - 1, ky - SHADOW_Y)) * CW;
    for (let x = 0; x < W; x++, p++, q += 4) {
      const kx = x >> 1;
      const ca = x & 1 ? kx : Math.max(kx - 1, 0);
      const cb = x & 1 ? Math.min(kx + 1, CW - 1) : kx;
      const ua = x & 1 ? 0.75 : 0.25;
      const ub = 1 - ua;
      let r = br;
      let g = bg;
      let b = bb;
      for (let l = 0; l < layers.length; l++) {
        const dist = DIST[l];
        if (layers[l].shadow > 0) {
          const ds = dist[sa + Math.max(0, kx - SHADOW_X)];
          if (ds > -SHADOW_SOFT) {
            const dark =
              1 - layers[l].shadow * Math.min(1, 0.5 + ds / (2 * SHADOW_SOFT));
            r *= dark;
            g *= dark;
            b *= dark;
          }
        }
        if (dist[rb + cb] <= -FAR && dist[ra + ca] <= -FAR) continue;
        const d =
          wa * (ua * dist[ra + ca] + ub * dist[ra + cb]) +
          wb * (ua * dist[rb + ca] + ub * dist[rb + cb]);
        if (d <= -0.5) continue;
        const cover = d >= 0.5 ? 1 : d + 0.5;
        const lit = LIT[l];
        const a0 = (ra + ca) * 3;
        const a1 = (ra + cb) * 3;
        const b0 = (rb + ca) * 3;
        const b1 = (rb + cb) * 3;
        const k00 = wa * ua;
        const k01 = wa * ub;
        const k10 = wb * ua;
        const k11 = wb * ub;
        r +=
          (k00 * lit[a0] + k01 * lit[a1] + k10 * lit[b0] + k11 * lit[b1] - r) *
          cover;
        g +=
          (k00 * lit[a0 + 1] +
            k01 * lit[a1 + 1] +
            k10 * lit[b0 + 1] +
            k11 * lit[b1 + 1] -
            g) *
          cover;
        b +=
          (k00 * lit[a0 + 2] +
            k01 * lit[a1 + 2] +
            k10 * lit[b0 + 2] +
            k11 * lit[b1 + 2] -
            b) *
          cover;
      }
      const light = VIGNETTE[p];
      const grain = GRAIN[p];
      rgba[q] = r * light + grain;
      rgba[q + 1] = g * light + grain;
      rgba[q + 2] = b * light + grain;
      rgba[q + 3] = 255;
    }
  }
};
