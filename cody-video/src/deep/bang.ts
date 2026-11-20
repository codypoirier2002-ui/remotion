/**
 * Shot 1: the Big Bang. Ten seconds, 24 beats (src/deep/timeline.ts).
 *
 *   0–5       one point in the dark; a foam of sparks round it flickers, and a
 *             ring of light runs through the foam on every heartbeat
 *   4.75–5.5  it pulls everything in
 *   5.5–6     nothing at all
 *   6         the bang
 *   6–8       a fireball grows towards the camera
 *   8         it reaches us
 *   8–18      inside: the blast streams past. The core lights the fire from
 *             behind, so every clump throws a shadow towards us and light
 *             pours through the gaps; the core flares on every drum, and six
 *             great tongues of fire pass right by the lens
 *   18–22     it cools and clears: the first light
 *   22–24     the dark ages: a web of faint threads, and the first star
 *             lights up where the point was
 *
 * The scene has one centre, the origin: the point, the core of the fire, and
 * the first star are all there.
 */
import {
  FINISH,
  type Finish,
  W,
  H,
  begin,
  blackbody,
  clamp,
  fire,
  collapse,
  develop,
  fbm,
  gauss,
  lookAt,
  noise,
  overlay,
  project,
  rand,
  smooth,
  spikes,
  splat,
  streak,
  type Camera,
} from "./engine";
import { BANG as E, D_BEAT, D_FPS } from "./timeline";
import {
  type Light,
  type Medium,
  VH,
  VRGB,
  VT,
  VW,
  march,
  radialBlur,
  seen,
  shadows,
} from "./volume";

const TAU = Math.PI * 2;
/** Where the centre of everything sits on screen. */
const CX = 0.43 * W;
const CY = 0.45 * H;
const FOCAL = 1550;
/** A 180° shutter: open for half a frame, in beats. */
const SHUTTER = 0.5 / D_FPS / D_BEAT;
const sec = (beats: number) => beats * D_BEAT;
const decay = (t: number, tau: number) => (t < 0 ? 0 : Math.exp(-t / tau));
const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** A value that moves through [beat, value] keys, easing between them. */
const keys = (k: [number, number][], b: number) => {
  if (b <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++)
    if (b < k[i][0]) {
      const [b0, v0] = k[i - 1];
      const [b1, v1] = k[i];
      return v0 + (v1 - v0) * smooth(0, 1, (b - b0) / (b1 - b0));
    }
  return k[k.length - 1][1];
};

// ================================================================ time and space
/** Radius of the fireball: nothing before the bang, the camera's distance at the engulf. */
const radius = (b: number) =>
  b <= E.bang ? 0 : 10 * Math.pow((b - E.bang) / (E.engulf - E.bang), 0.75);

/** How far the camera is from the centre. */
const distance = (b: number) =>
  b < E.bang
    ? 12.5 - 2 * easeInOut(b / E.bang)
    : b < E.engulf
      ? 10.5 - 0.25 * (b - E.bang)
      : 10 + 2.2 * (1 - Math.exp(-(b - E.engulf) / 5));

/** The camera kicks on the bang, harder on the engulf, a little on every drum. */
const SHAKES: [number, number][] = [
  [E.bang, 22],
  [E.engulf, 30],
  ...E.drums.filter((d) => d > E.engulf).map((d): [number, number] => [d, 5]),
];

const cameraAt = (b: number): Camera => {
  const d = distance(b);
  // a slow orbit round the centre, so near and far drift apart
  const phi = 0.1 - 0.17 * (b / 24);
  const lift = 0.45 * Math.sin(0.13 * b + 0.4) - 0.15;
  let sx = 0;
  let sy = 0;
  let roll = 0.025 * Math.sin(b * 0.19 + 0.5);
  for (const [hb, amp] of SHAKES)
    if (b > hb) {
      const s = sec(b - hb);
      const a = amp * decay(s, 0.16);
      sx += a * Math.sin(s * 71 + hb);
      sy += a * Math.cos(s * 59 + hb);
      roll += a * 0.0005 * Math.sin(s * 43);
    }
  return lookAt(
    d * Math.sin(phi),
    lift,
    -d * Math.cos(phi),
    0,
    0,
    0,
    roll,
    FOCAL,
    CX + sx,
    CY + sy,
  );
};

// ================================================================ the fire
const temperature = (b: number) =>
  keys(
    [
      [6, 7000],
      [7, 5000],
      [8, 4300],
      [12, 3300],
      [16, 2800],
      [18, 2500],
      [20, 2100],
      [22, 1700],
    ],
    b,
  );
const glowAt = (b: number) =>
  keys(
    [
      [6, 2.5],
      [6.3, 0.7],
      [7, 0.45],
      [7.85, 0.4],
      [8.1, 0.8],
      [12, 0.65],
      [16, 0.5],
      [18, 0.32],
      [19, 0.15],
      [20, 0.04],
      [21, 0.01],
      [22, 0.003],
    ],
    b,
  );
const densityAt = (b: number) =>
  keys(
    [
      [6, 30],
      [7, 10],
      [7.8, 2.5],
      [8.1, 0.55],
      [12, 0.17],
      [16, 0.1],
      [18, 0.15],
      [19, 0.35],
      [20.3, 0.35],
      [21.5, 0.06],
      [22.3, 0],
    ],
    b,
  );
/** The drums: the core flares, then settles. */
const flare = (b: number) => {
  let f = 0;
  for (const d of E.drums)
    if (b > d) f += Math.exp(-sec(b - d) / 0.11) * (d === E.engulf ? 1.5 : 1);
  return f;
};
/** The light at the centre: the bang, the core of the fire, then the first star. */
const lightAt = (b: number) => {
  if (b < E.bang) return 0;
  if (b >= E.firstStar - 0.02) {
    const s = sec(b - E.firstStar);
    return 9 * smooth(-0.02, 0.03, s) * (1 + 2 * decay(s, 0.14));
  }
  const bang = 60 * decay(sec(b - E.bang), 0.25);
  const core = keys(
    [
      [6, 9],
      [8, 5],
      [12, 3.4],
      [16, 2.5],
      [18, 1.6],
      [19, 0.3],
      [20, 0],
    ],
    b,
  );
  return bang + core * (1 + 1.4 * flare(b));
};
const webAt = (b: number) => smooth(20.6, 22.4, b);
/** Where the first light sits on the fire ramp: it reddens as it fades. */
const skyTone = (b: number) =>
  keys(
    [
      [18, 0.68],
      [20.5, 0.55],
      [22.5, 0.36],
    ],
    b,
  );
/** The afterglow of the whole sky, the first light: it comes, reddens and goes. */
const skyAt = (b: number) =>
  keys(
    [
      [17.5, 0],
      [18.5, 0.35],
      [19.3, 0.9],
      [20.3, 0.8],
      [21.5, 0.18],
      [22.4, 0.03],
      [24, 0.01],
    ],
    b,
  );

// ---------------------------------------------------------------- tongues of fire
// Each is a dense, twisted slab placed so that the expansion carries it right
// past the camera on its beat; its whoosh in the score is on the same beat.
type Tongue = {
  cx: number;
  cy: number;
  cz: number;
  ax: number;
  ay: number;
  az: number;
  mx: number;
  my: number;
  mz: number;
  sx: number;
  sy: number;
  sz: number;
  la: number;
  lm: number;
  ls: number;
  reach2: number;
  f: number;
  seed: number;
};
const TONGUES: Tongue[] = E.tongues.map((t, i) => {
  const cam = cameraAt(t.beat);
  const R = radius(t.beat);
  // beside the camera, off to one side
  const ox = cam.rx * t.side * 2.6 + cam.ux * t.lift * 2;
  const oy = cam.ry * t.side * 2.6 + cam.uy * t.lift * 2;
  const oz = cam.rz * t.side * 2.6 + cam.uz * t.lift * 2;
  const ol = Math.hypot(ox, oy, oz);
  // long axis: out to the side, so it streaks across the frame
  const ax = ox / ol;
  const ay = oy / ol;
  const az = oz / ol;
  // short axis: along the view; middle axis: the other way across
  const sx = cam.fx;
  const sy = cam.fy;
  const sz = cam.fz;
  const mx = ay * sz - az * sy;
  const my = az * sx - ax * sz;
  const mz = ax * sy - ay * sx;
  const la = 2.4 / R;
  return {
    cx: (cam.x + ox) / R,
    cy: (cam.y + oy) / R,
    cz: (cam.z + oz) / R,
    ax,
    ay,
    az,
    mx,
    my,
    mz,
    sx,
    sy,
    sz,
    la,
    lm: 0.8 / R,
    ls: 0.6 / R,
    reach2: la * la * 2.2,
    f: 1.6 / la,
    seed: i * 7.3,
  };
});

// ---------------------------------------------------------------- the first star's threads
// Threads of gas that meet where the first star lights. They are points, not
// volume, so they stay sharp at any distance; each is a few twisted fibres.
// x, y, z of every point, and how far it is from the star. Made on first use,
// once the noise is ready.
let STRANDS_MADE: Float32Array | null = null;
const strands = () => {
  if (STRANDS_MADE) return STRANDS_MADE;
  const out: number[] = [];
  // x, y, z, distance from the star, brightness, blur in world units
  const add = (x: number, y: number, z: number, k: number, blur: number) =>
    out.push(x, y, z, Math.hypot(x, y, z), k, blur);
  for (let i = 0; i < 13; i++) {
    // seven threads meet at the star; the others pass it by
    const hub = i < 7;
    const a = hub
      ? (i / 7) * TAU + 0.8 * (rand(i * 7 + 1) - 0.5)
      : TAU * rand(i * 7 + 1);
    let ux = Math.cos(a);
    let uy = 0.8 * Math.sin(a);
    let uz = 0.9 * (rand(i * 7 + 2) - 0.5);
    const ul = Math.hypot(ux, uy, uz);
    ux /= ul;
    uy /= ul;
    uz /= ul;
    // two directions across the thread
    let vx = -uy;
    let vy = ux;
    const vl = Math.hypot(vx, vy) || 1;
    vx /= vl;
    vy /= vl;
    const wx = -uz * vy;
    const wy = uz * vx;
    const wz = ux * vy - uy * vx;
    // how near a passing thread comes, and from which side
    const pass = hub ? 0 : 0.8 + 2.4 * rand(i * 7 + 6);
    const side = TAU * rand(i * 7 + 7);
    const px = pass * (vx * Math.cos(side) + wx * Math.sin(side));
    const py = pass * (vy * Math.cos(side) + wy * Math.sin(side));
    const pz = pass * wz * Math.sin(side);
    const t0 = hub ? 0.12 : -(4 + 10 * rand(i * 7 + 8));
    const t1 = hub ? 6 + 16 * rand(i * 7 + 3) : 4 + 12 * rand(i * 7 + 3);
    const thick = 0.25 + Math.pow(rand(i * 7 + 5), 1.5) * (hub ? 1.3 : 0.8);
    // the middle of the thread: it wanders on two scales
    const at = (t: number, ox: number, oy: number, k: number, blur: number) => {
      const n1 =
        noise(i * 3.1 + t * 0.17, 1.7, 4.4) +
        0.4 * noise(i * 3.1 + t * 0.6, 5.2, 1.1);
      const n2 =
        noise(i * 3.1 + t * 0.17, 8.3, 2.9) +
        0.4 * noise(i * 3.1 + t * 0.6, 3.3, 7.7);
      const reach = 1.1 * (hub ? Math.min(1, t * 0.3) : 1);
      const ax = reach * n1 + ox;
      const bx = reach * n2 + oy;
      add(
        px + ux * t + vx * ax + wx * bx,
        py + uy * t + vy * ax + wy * bx,
        pz + uz * t + wz * bx,
        k,
        blur,
      );
    };
    const clump = (t: number, f: number) =>
      0.3 + 0.7 * smooth(-0.3, 0.6, noise(i * 7.7 + f * 0.3, t * 0.9, 3.3));
    // fibres, twisting round each other, parting and closing
    const fibres = 2 + Math.round(6 * thick);
    for (let f = 0; f < fibres; f++) {
      const off = (0.02 + 0.12 * rand(i * 31 + f)) * thick;
      const ph = TAU * rand(i * 37 + f);
      const twist = 0.1 + 0.3 * rand(i * 41 + f);
      const kf = ((0.4 + 0.6 * rand(i * 43 + f)) * thick * 4) / fibres;
      const from = t0 + (hub ? 0.3 * rand(i * 47 + f) : 0);
      const to = t1 * (0.7 + 0.3 * rand(i * 53 + f));
      for (let t = from; t < to; t += 0.012) {
        const spread =
          off *
          (1 + 0.08 * Math.abs(t)) *
          (0.6 + 0.8 * Math.abs(noise(f * 1.3, t * 0.35, i * 2.1)));
        at(
          t,
          spread * Math.cos(ph + t * twist),
          spread * Math.sin(ph + t * twist),
          kf * clump(t, f),
          0,
        );
      }
    }
    // and a haze of fine gas round them
    for (let t = t0; t < t1; t += 0.05)
      for (let h = 0; h < 2; h++) {
        const sp = 0.3 * thick * (1 + 0.05 * Math.abs(t));
        const seed = i * 977 + Math.round(t * 20) * 2 + h;
        at(
          t,
          sp * gauss(seed * 3 + 1),
          sp * gauss(seed * 3 + 2),
          6 * thick * clump(t, 0),
          0.08,
        );
      }
  }
  STRANDS_MADE = new Float32Array(out);
  return STRANDS_MADE;
};

// ---------------------------------------------------------------- the medium
let R = 1;
let inv = 1;
let dens = 0;
/** 1 while we see the fireball from outside, 0 once we are in it */
let outside = 0;
let glow = 1;
let boil = 0;
let web = 0;
let coreDens = 0;
let clear = 0;
/** shifts the whole fire hotter or cooler on the fire ramp */
let warmth = 0;

const COL = new Float32Array(3);
/** the colour of the first light, and how bright it is */
const SKYC = new Float32Array(3);
let skyL = 0;

const tongues = (qx: number, qy: number, qz: number) => {
  let d = 0;
  for (let i = 0; i < TONGUES.length; i++) {
    const t = TONGUES[i];
    const ox = qx - t.cx;
    const oy = qy - t.cy;
    const oz = qz - t.cz;
    if (ox * ox + oy * oy + oz * oz > t.reach2) continue;
    const a = (ox * t.ax + oy * t.ay + oz * t.az) / t.la;
    const m = (ox * t.mx + oy * t.my + oz * t.mz) / t.lm;
    const s = (ox * t.sx + oy * t.sy + oz * t.sz) / t.ls;
    const e =
      Math.sqrt(a * a + m * m + s * s) +
      0.5 * noise(qx * t.f + t.seed, qy * t.f, qz * t.f - boil);
    if (e < 1) d += 2.4 * smooth(1, 0.4, e);
  }
  return d;
};

const medium: Medium = {
  at: (b) => {
    R = Math.max(radius(b), 1e-3);
    inv = 1 / R;
    dens = densityAt(b);
    outside = smooth(7.95, 7.6, b);
    glow = glowAt(b);
    boil = b * 0.06;
    web = webAt(b);
    coreDens = keys(
      [
        [6, 3],
        [9, 1.5],
        [16, 0.8],
        [19, 0],
      ],
      b,
    );
    // as it cools, the gaps between the clouds widen until only veils are left
    clear = 0.8 * smooth(17, 21, b);
    skyL = skyAt(b);
    fire(skyTone(b), SKYC);
    const m = Math.max(SKYC[0], SKYC[1], SKYC[2]);
    SKYC[0] /= m;
    SKYC[1] /= m;
    SKYC[2] /= m;
    warmth = keys(
      [
        [6, 0.3],
        [7, 0.15],
        [7.85, 0.12],
        [8.1, 0.04],
        [12, 0.03],
        [16, -0.03],
        [18, -0.06],
        [20, -0.12],
        [21.5, -0.25],
        [22, -0.35],
      ],
      b,
    );
  },
  sample: (x, y, z, src, step) => {
    const qx = x * inv;
    const qy = y * inv;
    const qz = z * inv;
    const rq2 = qx * qx + qy * qy + qz * qz;
    if (rq2 > 1.6) {
      src[0] = src[1] = src[2] = 0;
      return 0;
    }
    let sigma = 0;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    if (dens > 0.001) {
      const rq = Math.sqrt(rq2);
      // the edge of the fireball: a boiling surface
      const e =
        noise(qx * 2.3 + 4.1, qy * 2.3 - 1.3, qz * 2.3 + boil) * 0.6 +
        noise(qx * 5.1, qy * 5.1 + 2.2, qz * 5.1 - boil) * 0.3;
      const env = smooth(1.1, 0.88, rq + 0.22 * e);
      if (env > 0.001) {
        // turbulence: noise pushed about by slower noise
        const wx = noise(qx * 1.7 + 11.3, qy * 1.7, qz * 1.7 + boil * 0.7);
        const wy = noise(qx * 1.7, qy * 1.7 + 7.9, qz * 1.7 - boil * 0.7);
        const wz = noise(qx * 1.7 - 5.2, qy * 1.7 + boil * 0.7, qz * 1.7);
        const px = qx * 5.2 + wx * 1.2;
        const py = qy * 5.2 + wy * 1.2;
        const pz = qz * 5.2 + wz * 1.2;
        // only the octaves this step can resolve: finer ones would just be noise
        const wave = R / (5.2 * 2.5 * step);
        const ob = wave > 4 ? 3 : wave > 2 ? 2 : 1;
        const or = wave > 9 ? 3 : wave > 4.4 ? 2 : 1;
        const blob = fbm(px, py, pz, ob);
        const rid =
          1 - Math.abs(fbm(px * 2.2 + 3.3, py * 2.2, pz * 2.2 - 1.7, or));
        const r2 = rid * rid;
        const fil = r2 * r2;
        // as it clears, only the filaments are left
        let d =
          env *
          smooth(0.02 + 0.4 * clear, 0.42 + 0.12 * clear, blob) *
          (0.3 - 0.3 * clear + (0.7 + 0.3 * clear) * fil);
        // the tongues are thick: they stay dark against the light
        const tg = tongues(qx, qy, qz);
        if (tg > 0)
          d += (tg * env * (0.45 + 0.9 * fil) * 0.5) / Math.max(dens, 0.05);
        d += coreDens * Math.exp(-rq2 * 500);
        // hotter towards the core and along the filaments; what is cool is smoke
        const hot = Math.exp(-rq2 * 70);
        // from outside, the surface boils in big cells; inside, it is filaments
        const cells = smooth(-0.15, 0.55, blob);
        const heat =
          0.6 +
          (1 - outside) * (0.62 * fil + 0.35 * cells) +
          outside * (0.35 * fil + 0.75 * cells) +
          0.6 * hot;
        fire((heat - 0.5) / 1.4 + warmth, COL);
        const g = glow;
        sigma = d * dens;
        // the first light shines through the thin edges of the veils
        const rim = skyL > 0.01 ? skyL * 5 * Math.exp(-d * 6) : 0;
        sr = COL[0] * g + SKYC[0] * rim;
        sg = COL[1] * g + SKYC[1] * rim;
        sb = COL[2] * g + SKYC[2] * rim;
      }
    }
    if (web > 0.001) {
      // the cosmic web: thin threads where the matter has gathered, a few of
      // them meeting at the centre, where the first star will light
      const n1 = fbm(qx * 3.4 + 2.1, qy * 3.4 - 0.7, qz * 3.4 + 1.3, 2);
      const n2 = fbm(qx * 3.4 - 3.3, qy * 3.4 + 5.1, qz * 3.4 - 2.2, 2);
      const a1 = 1 - Math.abs(n1) * 9;
      const a2 = 1 - Math.abs(n2) * 9;
      const sw = (a1 > 0 && a2 > 0 ? a1 * a2 * 0.35 : 0) * web;
      if (sw > 1e-5) {
        const t = sigma + sw;
        sr = (sr * sigma + 0.004 * sw) / t;
        sg = (sg * sigma + 0.005 * sw) / t;
        sb = (sb * sigma + 0.012 * sw) / t;
        sigma = t;
      }
    }
    src[0] = sr;
    src[1] = sg;
    src[2] = sb;
    return sigma;
  },
  coarse: (x, y, z) => {
    const qx = x * inv;
    const qy = y * inv;
    const qz = z * inv;
    const rq2 = qx * qx + qy * qy + qz * qz;
    if (rq2 > 1.6) return 0;
    let d = 0;
    if (dens > 0.001) {
      const rq = Math.sqrt(rq2);
      const e = noise(qx * 2.3 + 4.1, qy * 2.3 - 1.3, qz * 2.3 + boil) * 0.6;
      const env = smooth(1.1, 0.88, rq + 0.22 * e);
      if (env > 0.001) {
        const wx = noise(qx * 1.7 + 11.3, qy * 1.7, qz * 1.7 + boil * 0.7);
        const wy = noise(qx * 1.7, qy * 1.7 + 7.9, qz * 1.7 - boil * 0.7);
        const wz = noise(qx * 1.7 - 5.2, qy * 1.7 + boil * 0.7, qz * 1.7);
        const blob = fbm(
          qx * 5.2 + wx * 1.2,
          qy * 5.2 + wy * 1.2,
          qz * 5.2 + wz * 1.2,
          2,
        );
        d = env * smooth(0.02 + 0.4 * clear, 0.42 + 0.3 * clear, blob) * 0.32;
        const tg = tongues(qx, qy, qz);
        if (tg > 0) d += (tg * env * 0.4) / Math.max(dens, 0.05);
      }
      d += coreDens * Math.exp(-rq2 * 500);
      d *= dens;
    }
    if (web > 0.001) {
      const n1 = fbm(qx * 3.4 + 2.1, qy * 3.4 - 0.7, qz * 3.4 + 1.3, 2);
      const n2 = fbm(qx * 3.4 - 3.3, qy * 3.4 + 5.1, qz * 3.4 - 2.2, 2);
      const a1 = 1 - Math.abs(n1) * 9;
      const a2 = 1 - Math.abs(n2) * 9;
      d += (a1 > 0 && a2 > 0 ? a1 * a2 * 0.35 : 0) * web;
    }
    return d;
  },
};

/** How much of the light at the centre reaches the camera, straight through the fire. */
const coreSeen = (cam: Camera) => {
  const n = 96;
  const len = Math.hypot(cam.x, cam.y, cam.z);
  const dt = len / n;
  let tau = 0;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    tau +=
      medium.coarse(cam.x * (1 - t), cam.y * (1 - t), cam.z * (1 - t)) * dt;
  }
  return Math.exp(-tau * 1.3);
};

// ================================================================ things that are points
const P0 = new Float64Array(3);
const P1 = new Float64Array(3);
const C = new Float32Array(3);
/** colour of the light at the centre */
const LC = new Float32Array(3);
/** Depth of field: blur radius in pixels for a point at depth z when focused at zf. */
const DOF = 60;
const coc = (z: number, zf: number) =>
  Math.min(150, 0.6 + (DOF * Math.abs(z - zf)) / (z * zf));

/** Draw a moving point seen through a moving camera, with motion blur and depth of field. */
const point = (
  c0: Camera,
  c1: Camera,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  zf: number,
  r: number,
  g: number,
  b: number,
  occlude: boolean,
) => {
  if (!project(c0, x0, y0, z0, P0) || !project(c1, x1, y1, z1, P1)) return;
  const m = 200;
  if (
    (P0[0] < -m && P1[0] < -m) ||
    (P0[0] > W + m && P1[0] > W + m) ||
    (P0[1] < -m && P1[1] < -m) ||
    (P0[1] > H + m && P1[1] > H + m)
  )
    return;
  const z = (P0[2] + P1[2]) / 2;
  const v = occlude ? seen((P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2, z) : 1;
  streak(P0[0], P0[1], P1[0], P1[1], coc(z, zf), r * v, g * v, b * v);
};

// The foam round the point: sparks that flicker in and out.
const FOAM = Array.from({ length: 3200 }, (_, i) => {
  const zz = 1 - 2 * rand(i * 9 + 1);
  const a = TAU * rand(i * 9 + 2);
  const s = Math.sqrt(1 - zz * zz);
  const r = 1.5 * Math.pow(rand(i * 9 + 3), 0.75);
  return {
    x: r * s * Math.cos(a),
    y: r * s * Math.sin(a),
    z: r * zz,
    r,
    period: 0.22 + 0.8 * rand(i * 9 + 4),
    phase: rand(i * 9 + 5),
    k: 0.3 + rand(i * 9 + 6),
  };
});
// The vacuum before anything: sparks that flicker in and out all through the
// dark, near and far, so the push-in has depth.
const VACUUM = Array.from({ length: 5000 }, (_, i) => {
  const zz = 1 - 2 * rand(i * 13 + 1);
  const a = TAU * rand(i * 13 + 2);
  const s = Math.sqrt(1 - zz * zz);
  const r = 2.5 + 25 * Math.cbrt(rand(i * 13 + 3));
  return {
    x: r * s * Math.cos(a),
    y: r * s * Math.sin(a),
    z: r * zz,
    r,
    period: 0.12 + 0.5 * rand(i * 13 + 4),
    phase: rand(i * 13 + 5),
    k: 0.2 + rand(i * 13 + 6),
    warm: rand(i * 13 + 7) < 0.12,
  };
});
// Motes near the lens, far out of focus.
const MOTES = Array.from({ length: 70 }, (_, i) => ({
  x: (rand(i * 5 + 1) - 0.5) * 6,
  y: (rand(i * 5 + 2) - 0.5) * 3.6,
  z: -11.6 + 3.2 * rand(i * 5 + 3),
  k: 0.4 + rand(i * 5 + 4),
  w: rand(i * 5 + 5) * TAU,
}));
// Sparks thrown out by the bang; some live on as embers.
const SPARKS = Array.from({ length: 14000 }, (_, i) => {
  let dx = gaussLike(i * 11 + 1);
  let dy = gaussLike(i * 11 + 2);
  let dz = gaussLike(i * 11 + 3);
  if (rand(i * 11 + 4) < 0.6) {
    // thrown our way
    dx = dx * 0.5;
    dy = dy * 0.5;
    dz = dz * 0.5 - 1;
  }
  const l = Math.hypot(dx, dy, dz) || 1;
  return {
    dx: dx / l,
    dy: dy / l,
    dz: dz / l,
    q0: 0.02 + 0.95 * Math.pow(rand(i * 11 + 5), 0.8),
    v: 0.2 + 1.6 * rand(i * 11 + 6),
    k: 0.25 + 3 * Math.pow(rand(i * 11 + 7), 6),
    heat: 0.9 + 0.6 * rand(i * 11 + 8),
    ember: rand(i * 11 + 9) < 0.14,
  };
});
function gaussLike(n: number) {
  return rand(n) + rand(n + 101) + rand(n + 202) - 1.5;
}
// Fine dust in the fire, lit from the core: it glints as it crosses the light.
const DUST = Array.from({ length: 6000 }, (_, i) => {
  const zz = 1 - 2 * rand(i * 7 + 1);
  const a = TAU * rand(i * 7 + 2);
  const s = Math.sqrt(1 - zz * zz);
  const q = 0.08 + 0.9 * Math.cbrt(rand(i * 7 + 3));
  return {
    x: q * s * Math.cos(a),
    y: q * s * Math.sin(a),
    z: q * zz,
    k: 0.3 + rand(i * 7 + 4),
  };
});
// Embers that drift right by the lens at the end.
const DRIFT = Array.from({ length: 260 }, (_, i) => ({
  x: (rand(i * 6 + 1) - 0.5) * 5,
  y: (rand(i * 6 + 2) - 0.5) * 3,
  d: 0.6 + 6 * rand(i * 6 + 3),
  vx: (rand(i * 6 + 4) - 0.5) * 0.25,
  vy: 0.08 + 0.2 * rand(i * 6 + 5),
  k: 0.2 + rand(i * 6 + 6),
}));

// ================================================================ the frame
const BGW = 480;
const BGH = 270;
const BG = new Float32Array(BGW * BGH * 3);
const ONE = new Float32Array(BGW * BGH).fill(1);

/** The empty sky behind everything: the faintest texture of the void, then the first light. */
const sky = (cam: Camera, b: number) => {
  const level = skyAt(b);
  fire(skyTone(b), COL);
  {
    const m = Math.max(COL[0], COL[1], COL[2]);
    COL[0] /= m;
    COL[1] /= m;
    COL[2] /= m;
  }
  for (let j = 0, p = 0; j < BGH; j++)
    for (let i = 0; i < BGW; i++, p++) {
      const sx = ((i + 0.5) / BGW) * W;
      const sy = ((j + 0.5) / BGH) * H;
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
      const l = Math.hypot(dx, dy, dz);
      dx /= l;
      dy /= l;
      dz /= l;
      // the first light is almost even, with the faintest mottling: the seeds of everything
      const n = fbm(dx * 2.2 + 1, dy * 2.2, dz * 2.2 - 2, 4);
      const v = 0.0007;
      const k = level * 1.0 * (1 + 0.45 * n);
      BG[p * 3] = v * 0.5 + COL[0] * k;
      BG[p * 3 + 1] = v * 0.6 + COL[1] * k;
      BG[p * 3 + 2] = v * 1.0 + COL[2] * k;
    }
  overlay(BG, ONE, BGW, BGH);
};

const LIGHT: Light = {
  r: 1,
  g: 1,
  b: 1,
  soft: 0.7,
  anisotropy: 0.72,
  albedo: 0.9,
  front: null,
};
/** How far the first star's light has reached, in world units. */
const frontAt = (b: number) => 22 * sec(b - E.firstStar);

/** Render frame `frame` of the shot (the shot starts at frame 0) into an RGBA buffer of W x H. */
export const renderBang = (frame: number, rgba: Uint8ClampedArray) => {
  const b = (frame + 0.5) / D_FPS / D_BEAT;
  const s = sec(b);
  begin();
  const cam = cameraAt(b);
  const c0 = cameraAt(b - SHUTTER / 2);
  const c1 = cameraAt(b + SHUTTER / 2);
  const f: Finish = { ...FINISH, time: s };
  sky(cam, b);

  if (b < E.bang) {
    // ------------------------------------------------ the point
    let pulse = 0;
    for (const h of E.heartbeats) if (b > h) pulse += decay(sec(b - h), 0.3);
    const pull = clamp((b - E.inhale) / (E.silence - E.inhale));
    const pullE = pull * pull * pull;
    const gone = b >= E.silence;
    const P = gone
      ? 0
      : (1 + 1.6 * pulse) * (1 - 0.9 * pullE) * smooth(0, 0.35, b);
    // foam: flickering, with a ring of light running out through it on each heartbeat
    const zf = distance(b);
    for (let i = 0; i < FOAM.length && !gone; i++) {
      const p = FOAM[i];
      const ph = (s / p.period + p.phase) % 1;
      const blink = Math.pow(Math.max(0, Math.sin(ph * Math.PI)), 8);
      let ringK = 0;
      for (const h of E.heartbeats)
        if (b > h) {
          const front = sec(b - h) * 3.2;
          ringK +=
            2.5 *
            Math.exp(-(((p.r - front) / 0.12) ** 2)) *
            decay(sec(b - h), 0.5);
        }
      const k =
        (p.k * 0.18 * (0.15 + blink) * (1 + ringK) * smooth(0, 0.6, b)) /
        (0.3 + p.r * p.r);
      if (k < 0.004) continue;
      const shrink = 1 - pullE;
      const jx = 0.04 * noise(p.x * 3 + s * 0.4, p.y * 3, p.z * 3);
      const jy = 0.04 * noise(p.x * 3, p.y * 3 + s * 0.4, p.z * 3 + 5);
      const x = (p.x + jx) * shrink;
      const y = (p.y + jy) * shrink;
      const z = p.z * shrink;
      // as they fall in, they streak
      const back = 1 + 0.25 * pull;
      point(
        c0,
        c1,
        x * back,
        y * back,
        z * back,
        x,
        y,
        z,
        zf,
        k * 0.8,
        k * 0.92,
        k * 1.25,
        false,
      );
    }
    // the vacuum: flickering everywhere, a ring of light running out through
    // it on every heartbeat, and all of it falling in on the inhale
    for (let i = 0; i < VACUUM.length && !gone; i++) {
      const p = VACUUM[i];
      const ph = (s / p.period + p.phase) % 1;
      const blink = Math.pow(Math.max(0, Math.sin(ph * Math.PI)), 10);
      let ringK = 0;
      for (const h of E.heartbeats)
        if (b > h) {
          const front = sec(b - h) * 16;
          ringK +=
            3 *
            Math.exp(-(((p.r - front) / 1.6) ** 2)) *
            decay(sec(b - h), 0.7);
        }
      const k = p.k * 1.5 * (0.04 + blink + ringK * 0.5) * smooth(0, 0.8, b);
      if (k < 0.01) continue;
      const fall = 1 - pullE;
      const fall0 =
        1 -
        Math.pow(
          clamp((b - SHUTTER / 2 - E.inhale) / (E.silence - E.inhale)),
          3,
        );
      const x = p.x * fall;
      const y = p.y * fall;
      const z = p.z * fall;
      const w = p.warm ? [1, 0.7, 0.45] : [0.75, 0.88, 1.2];
      point(
        c0,
        c1,
        p.x * fall0,
        p.y * fall0,
        p.z * fall0,
        x,
        y,
        z,
        zf,
        k * w[0],
        k * w[1],
        k * w[2],
        false,
      );
    }
    for (const m of MOTES) {
      if (gone) break;
      const shrink = 1 - pullE * 0.7;
      const x = (m.x + 0.08 * Math.sin(s * 0.5 + m.w)) * shrink;
      const y = (m.y + 0.06 * Math.cos(s * 0.4 + m.w)) * shrink;
      const z = m.z;
      const k = 6 * m.k * (1 + 0.8 * pulse) * smooth(0, 1, b);
      point(c0, c1, x, y, z, x, y, z, zf, k * 0.7, k * 0.85, k * 1.2, false);
    }
    if (P > 0 && project(cam, 0, 0, 0, P0)) {
      const x = P0[0];
      const y = P0[1];
      splat(x, y, 0.6, 90 * P, 96 * P, 120 * P);
      splat(x, y, 3, 5 * P, 5.5 * P, 7.5 * P);
      splat(x, y, 16, 0.9 * P, 1.0 * P, 1.6 * P);
      splat(x, y, 70, 0.22 * P, 0.26 * P, 0.45 * P);
      spikes(x, y, 110 + 90 * pulse, 2.2 * P, 0.85, 0.95, 1.25, 6, 0.3);
      f.ghosts = { x, y, k: 0.0004 * P };
    }
    f.exposure = 1;
    f.streak = 0.06;
  } else {
    // ------------------------------------------------ the fire
    medium.at(b);
    const bound = R * 1.25;
    const I = lightAt(b);
    if (b >= E.firstStar - 0.02) blackbody(21000, LC);
    else {
      fire(
        0.86 +
          Math.min(
            0.12,
            Math.max(
              -0.2,
              keys(
                [
                  [6, 0.12],
                  [12, 0],
                  [18, -0.12],
                  [20, -0.2],
                ],
                b,
              ),
            ),
          ),
        LC,
      );
      const m = Math.max(LC[0], LC[1], LC[2]);
      LC[0] /= m;
      LC[1] /= m;
      LC[2] /= m;
    }
    const star = b >= E.firstStar - 0.02;
    LIGHT.soft = star ? 1.2 : 0.7;
    LIGHT.front = star ? Math.max(0.05, frontAt(b)) : null;
    LIGHT.r = LC[0] * I;
    LIGHT.g = LC[1] * I;
    LIGHT.b = LC[2] * I;
    if (I > 0.01) shadows(medium, bound);
    march(
      cam,
      medium,
      bound,
      I > 0.01 ? LIGHT : null,
      0.12,
      0.045,
      2,
      frame,
      b,
      SHUTTER,
    );
    // motion blur: everything streams out of the centre. A point s pixels from
    // it at depth z moves s · (R'/R) · D / z pixels while the shutter is open.
    if (project(cam, 0, 0, 0, P0)) {
      const rate =
        (radius(b + SHUTTER / 2) - radius(b - SHUTTER / 2)) /
        Math.max(radius(b), 1e-3);
      radialBlur(P0[0], P0[1], rate * distance(b));
    }
    overlay(VRGB, VT, VW, VH);

    // the core: through the fire when it can be seen through
    medium.at(b);
    const zf =
      b < E.engulf ? Math.max(distance(b) - radius(b), 1) : distance(b) * 0.85;
    if (I > 0.01 && b < E.firstStar - 0.05 && project(cam, 0, 0, 0, P0)) {
      const vis = coreSeen(cam);
      const k = I * vis * 12;
      const x = P0[0];
      const y = P0[1];
      splat(x, y, 0.8, 1.1 * k * LC[0], 1.1 * k * LC[1], 1.1 * k * LC[2]);
      splat(x, y, 6, 0.06 * k * LC[0], 0.06 * k * LC[1], 0.06 * k * LC[2]);
      splat(x, y, 40, 0.008 * k * LC[0], 0.008 * k * LC[1], 0.008 * k * LC[2]);
      spikes(x, y, 150 + 0.4 * k, 0.012 * k, LC[0], LC[1], LC[2], 6, 0.3);
      f.ghosts = { x, y, k: Math.min(0.03, 0.00006 * k) };
    }

    // sparks
    const R0 = radius(b - SHUTTER / 2);
    const R1 = radius(b + SHUTTER / 2);
    const life = (bb: number) => (0.12 * (bb - E.bang)) / 6;
    const T = temperature(b);
    for (let i = 0; i < SPARKS.length; i++) {
      const p = SPARKS[i];
      let fade: number;
      let heat: number;
      if (p.ember) {
        fade =
          smooth(E.bang, E.bang + 0.15, b) *
          (b < 22 ? 1 : 1 - 0.6 * smooth(22, 24, b));
        heat = Math.max(1500, T * p.heat * (b < 18 ? 1 : 0.8));
      } else {
        fade = smooth(E.bang, E.bang + 0.15, b) * smooth(19.5, 16.5, b);
        heat = T * p.heat * 1.3;
      }
      if (fade < 0.01) continue;
      // embers slow down once the fire has spent itself
      const slow = p.ember ? 1 - 0.7 * smooth(16, 22, b) : 1;
      const q0 = p.q0 * (1 + p.v * life(b - SHUTTER / 2) * slow) * R0;
      const q1 = p.q0 * (1 + p.v * life(b + SHUTTER / 2) * slow) * R1;
      const flick = 0.55 + 0.45 * noise(i * 0.37, s * 3.1, 0.5);
      blackbody(heat, C);
      const k =
        5 *
        p.k *
        fade *
        flick *
        (p.ember ? 0.7 : 1) *
        keys(
          [
            [6, 3],
            [8, 1.6],
            [14, 1],
            [18, 0.6],
          ],
          b,
        );
      point(
        c0,
        c1,
        p.dx * q0,
        p.dy * q0,
        p.dz * q0,
        p.dx * q1,
        p.dy * q1,
        p.dz * q1,
        zf,
        k * C[0],
        k * C[1],
        k * C[2],
        true,
      );
    }
    // dust, glinting in the light of the core
    if (b > 7.5 && b < 21 && I > 0.01) {
      const fadeD = smooth(7.5, 8.5, b) * smooth(21, 19, b);
      for (const d of DUST) {
        const x = d.x * R;
        const y = d.y * R;
        const z = d.z * R;
        const r2 = x * x + y * y + z * z;
        const k = (fadeD * d.k * I * 0.5) / (r2 + 1);
        if (k < 0.002) continue;
        point(
          cam,
          cam,
          x,
          y,
          z,
          x,
          y,
          z,
          zf,
          k * LC[0],
          k * LC[1],
          k * LC[2],
          true,
        );
      }
    }
    // embers drifting past the lens as the fire dies
    if (b > 16) {
      const k0 = smooth(16, 18.5, b) * (1 - 0.55 * smooth(22, 24, b));
      blackbody(
        keys(
          [
            [16, 2600],
            [24, 1500],
          ],
          b,
        ),
        C,
      );
      for (const e of DRIFT) {
        const t = sec(b - 16);
        // in front of the camera, in its own frame
        const dx = e.x + e.vx * t + 0.15 * Math.sin(t * 0.9 + e.d);
        const dy = e.y + e.vy * t;
        const px = cam.x + cam.rx * dx + cam.ux * dy + cam.fx * e.d;
        const py = cam.y + cam.ry * dx + cam.uy * dy + cam.fy * e.d;
        const pz = cam.z + cam.rz * dx + cam.uz * dy + cam.fz * e.d;
        const flick = 0.5 + 0.5 * noise(e.x * 3, t * 2.3, e.d);
        const k = 0.5 * e.k * k0 * flick;
        point(
          cam,
          cam,
          px,
          py,
          pz,
          px,
          py,
          pz,
          zf,
          k * C[0],
          k * C[1],
          k * C[2],
          false,
        );
      }
    }
    // the threads the star lights, as far as its light has reached
    if (b >= E.firstStar - 0.02) {
      const front = Math.max(0.05, frontAt(b));
      const soft2 = LIGHT.soft * LIGHT.soft;
      const STRANDS = strands();
      for (let i = 0; i < STRANDS.length; i += 6) {
        const r = STRANDS[i + 3];
        if (r > front) continue;
        let k =
          (0.3 * STRANDS[i + 4] * I * smooth(front, front * 0.7, r)) /
          (r * r + soft2);
        if (k < 0.004) continue;
        if (!project(cam, STRANDS[i], STRANDS[i + 1], STRANDS[i + 2], P0))
          continue;
        const x = P0[0];
        const y = P0[1];
        if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
        const rad = Math.max(coc(P0[2], zf), (STRANDS[i + 5] * FOCAL) / P0[2]);
        k *= seen(x, y, P0[2]);
        splat(x, y, rad, k * LC[0], k * LC[1], k * LC[2]);
      }
    }
    // the first star
    if (b >= E.firstStar - 0.02 && project(cam, 0, 0, 0, P0)) {
      const st = sec(b - E.firstStar);
      const k = smooth(-0.02, 0.03, st) * (1 + 3 * decay(st, 0.15));
      const x = P0[0];
      const y = P0[1];
      splat(x, y, 0.7, 14 * k, 16 * k, 24 * k);
      splat(x, y, 3, 30 * k, 36 * k, 52 * k);
      splat(x, y, 12, 80 * k, 95 * k, 150 * k);
      splat(x, y, 45, 220 * k, 270 * k, 480 * k);
      spikes(x, y, 160 * Math.sqrt(k), 0.25 * k, 0.8, 0.95, 1.3, 6, 0.3);
      f.ghosts = { x, y, k: 0.002 * k };
    }

    f.exposure = keys(
      [
        [6, 0.45],
        [8, 0.45],
        [12, 0.5],
        [18, 0.6],
        [19.3, 0.75],
        [20.5, 0.9],
        [22, 1.8],
        [23, 1.4],
        [24, 1.3],
      ],
      b,
    );
    f.haze = keys(
      [
        [6, 3],
        [8, 4],
        [14, 2.2],
        [18, 1],
        [20, 0],
      ],
      b,
    );
    // the bang and the engulf blow the exposure out, as light does on film
    f.exposure *=
      1 + 7 * decay(sec(b - E.bang), 0.06) + 3 * decay(sec(b - E.engulf), 0.09);
    f.flash = 0.35 * decay(sec(b - E.bang), 0.035);
    f.bloom = keys(
      [
        [8, 0.1],
        [9, 0.05],
        [22, 0.05],
        [23, 0.1],
      ],
      b,
    );
    f.halation = 0.14;
    f.streak = 0.06;
    // a grade: real darks in the smoke, without crushing the dark ages
    f.contrast = keys(
      [
        [7.5, 1],
        [8.5, 1.7],
        [17, 1.7],
        [18.5, 1.8],
        [21, 1.8],
        [22, 1.2],
        [24, 1.1],
      ],
      b,
    );
  }
  collapse();
  develop(f, frame, rgba);
};
