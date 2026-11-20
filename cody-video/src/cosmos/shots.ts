/**
 * COSMOS, the shots: what is in the picture at any beat.
 *
 * Every shot is a pure function of time, so frames can be rendered in any
 * order. All times come from src/cosmos/timeline.ts, which the soundtrack
 * reads too.
 */
import { clamp, decay, easeInCubic, lerp, ring, spring } from "../motion";
import {
  BH,
  BW,
  GRADE,
  type Grade,
  clear,
  collapse,
  develop,
  fbm,
  fillMask,
  gauss,
  ground,
  line,
  noise3,
  rand,
  shade,
  sphere,
  splat,
  streak,
} from "./engine";
import {
  BIG_HITS,
  C_BEAT,
  C_FPS,
  DIVIDE_BEATS,
  LIGHTNING_BEATS,
  STAR_BEATS,
  TAIKO_FROM,
  shotAt,
} from "./timeline";

const TAU = Math.PI * 2;
const CX = BW / 2;
const CY = BH / 2;
/** Seconds from beats. */
const sec = (beats: number) => beats * C_BEAT;
/** How long the shutter is open, in beats (half a frame, like a film camera). */
const SHUTTER = 0.5 / C_FPS / C_BEAT;
const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
type Ctx = { t: number; u: number; grade: Grade };

// ================================================================ shared pieces
const STAR_COUNT = 3000;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const temp = rand(i * 5 + 3);
  return {
    x: rand(i * 5 + 1) * 1.4 - 0.2,
    y: rand(i * 5 + 2) * 1.4 - 0.2,
    b: 0.02 + 0.5 * Math.pow(rand(i * 5 + 4), 6),
    c:
      temp < 0.2
        ? [1, 0.75, 0.55]
        : temp > 0.8
          ? [0.7, 0.8, 1.1]
          : [1, 0.96, 0.92],
  };
});
/** A field of background stars. `zoom` scales it about the centre. */
const starfield = (
  alpha: number,
  zoom = 1,
  dx = 0,
  dy = 0,
  count = STAR_COUNT,
  t = 0,
) => {
  for (let i = 0; i < count; i++) {
    const s = STARS[i];
    const x = CX + (s.x * BW - CX) * zoom + dx;
    const y = CY + (s.y * BH - CY) * zoom + dy;
    if (x < -2 || x > BW + 2 || y < -2 || y > BH + 2) continue;
    const tw = 0.75 + 0.25 * Math.sin(t * 3 + i);
    const k = s.b * alpha * tw;
    splat(x, y, 0.6, s.c[0] * k, s.c[1] * k, s.c[2] * k);
  }
};

/** A white flash that falls away, for every big hit. */
const flashes = (t: number) => {
  let f = 0;
  for (const b of BIG_HITS)
    if (t >= b) f = Math.max(f, decay(sec(t - b), 0.11));
  return f;
};
/**
 * Where the camera is: it kicks and shakes on the big hits, and punches in on
 * every drum of the last third. Applied to the whole picture by the layout.
 */
export const camera = (frame: number) => {
  const t = (frame + 0.5) / C_FPS / C_BEAT;
  let x = 0;
  let y = 0;
  let zoom = 1;
  for (const b of BIG_HITS)
    if (t > b) {
      const s = sec(t - b);
      x += 14 * decay(s, 0.16) * Math.sin(s * 90);
      y += 9 * decay(s, 0.16) * Math.cos(s * 77);
      zoom += 0.05 * ring(s, 3, 0.45);
    }
  if (t >= TAIKO_FROM && t < 136) {
    const b = Math.floor(t);
    const accent = (b - TAIKO_FROM) % 2 === 0 ? 1 : 0.55;
    zoom += 0.018 * accent * ring(sec(t - b), 4, 0.5);
  }
  return { x, y, zoom };
};

// ================================================================ the void (beats 0-12)
const DUST = Array.from({ length: 7000 }, (_, i) => ({
  r: 0.15 + 1.4 * Math.sqrt(rand(i * 7 + 1)),
  a: rand(i * 7 + 2) * TAU,
  z: gauss(i * 7 + 3) * 0.12,
  b: 0.3 + rand(i * 7 + 4),
}));
const voidShot = ({ t, grade }: Ctx) => {
  const zoom = 1 + 0.25 * easeInCubic(t / 12);
  const at = (d: (typeof DUST)[number], tt: number): [number, number] => {
    const p = clamp(tt / 12);
    // everything is pulled in, slowly, then all at once
    const pull = Math.pow(p, 2.6) + 0.06 * p;
    const r = d.r * Math.max(0.002, 1 - pull);
    const a = d.a + (0.5 * tt) / (0.3 + r) ** 1.2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.42 + d.z * r;
    return [CX + x * 420 * zoom, CY + y * 420 * zoom];
  };
  for (const d of DUST) {
    const [x0, y0] = at(d, t - SHUTTER);
    const [x1, y1] = at(d, t + SHUTTER);
    const near = Math.exp(-Math.hypot(x1 - CX, y1 - CY) / 180);
    const k = 0.3 * d.b * (0.35 + 1.6 * near) * smooth(0, 1.5, t);
    streak(x0, y0, x1, y1, 0.7, k * 0.75, k * 0.85, k * 1.1);
  }
  const charge = 1 + 30 * Math.pow(clamp(t / 12), 6);
  const pulse = 1 + 0.25 * Math.sin(t * Math.PI) * Math.sin(t * 7.3);
  const k = 1.4 * charge * pulse * smooth(0, 0.6, t);
  splat(CX, CY, 1.2, k, k, k * 1.05);
  splat(CX, CY, 10, k * 0.6, k * 0.65, k * 0.85);
  splat(CX, CY, 60, k * 0.3, k * 0.33, k * 0.5);
  grade.exposure = 1.1;
  grade.streak = 0.6;
  grade.shadows = [0.85, 0.95, 1.15];
};

// ================================================================ the big bang (12-24)
const SPARKS = Array.from({ length: 16000 }, (_, i) => ({
  a: rand(i * 5 + 1) * TAU,
  v: 0.25 + Math.pow(rand(i * 5 + 2), 2) * 2.2,
  z: 0.3 + rand(i * 5 + 3) * 3,
  b: 0.4 + rand(i * 5 + 4),
}));
const hot = (temp: number, out: number[]) => {
  // white -> gold -> orange -> deep red -> dark
  const k = clamp(temp);
  out[0] = k < 0.25 ? k * 4 * 0.6 : 0.6 + (k - 0.25) * 0.53;
  out[1] =
    k < 0.35
      ? k * 0.4
      : k < 0.7
        ? 0.14 + (k - 0.35) * 1.4
        : 0.63 + (k - 0.7) * 1.1;
  out[2] = k < 0.6 ? k * 0.12 : 0.07 + (k - 0.6) * 2.1;
  return out;
};
const HOT = [0, 0, 0];
const bangShot = ({ u, grade }: Ctx) => {
  const s = sec(u);
  const cool = 1 - 0.78 * Math.pow(clamp(s / 4.8), 0.6);
  const [sx, sy] = [0, 0];
  shade(2, (x, y, out) => {
    const dx = (x - CX - sx) / BW;
    const dy = (y - CY - sy) / BW;
    const r = Math.hypot(dx, dy) + 1e-4;
    const ca = dx / r;
    const sa = dy / r;
    // tunnel coordinates: the fire streams out from the middle
    const q = Math.log(r) * 1.6 - s * 1.4;
    const n = fbm(ca * 2.2, sa * 2.2, q, 4);
    // as it cools, only the brightest filaments are left
    const wisps = Math.pow(clamp(0.5 + n * 1.6 - 0.95 * clamp(s / 4.8)), 2.2);
    // the white core grows for a moment, then fades: it must not end up filling the frame
    const core = Math.exp(-r / (0.05 + 0.06 * s)) * Math.exp(-s / 1.2);
    const temp =
      cool * (0.55 + 0.6 * wisps) * (0.45 + 0.55 * Math.exp(-r * 1.4));
    hot(temp, HOT);
    const amount =
      (wisps * 1.8 + core * 6) * (0.25 + 0.75 * Math.exp(-s / 2.4));
    out[0] = HOT[0] * amount;
    out[1] = HOT[1] * amount;
    out[2] = HOT[2] * amount;
  });
  for (let i = 0; i < SPARKS.length; i++) {
    const p = SPARKS[i];
    const pos = (ss: number) => {
      // they come at the camera: the closer they get, the faster they cross the screen
      const d = p.v * ss * 1.4;
      const z = Math.max(0.08, p.z - ss * 0.5);
      return d / z;
    };
    const r0 = pos(s - sec(SHUTTER)) * 260;
    const r1 = pos(s + sec(SHUTTER)) * 260;
    const fade = Math.exp(-s / (1.4 + p.b)) * smooth(0, 0.05, s);
    const k = 0.18 * p.b * fade;
    hot(0.4 + 0.6 * cool * p.b, HOT);
    const c = Math.cos(p.a);
    const sn = Math.sin(p.a);
    streak(
      CX + c * r0,
      CY + sn * r0,
      CX + c * r1,
      CY + sn * r1,
      0.8,
      HOT[0] * k * 2,
      HOT[1] * k * 2,
      HOT[2] * k * 2,
    );
  }
  grade.exposure = 1.1;
  grade.bloom = 0.9;
  grade.shadows = [1.05, 0.95, 0.9];
  grade.highlights = [1.12, 1.0, 0.85];
};

// ================================================================ the first stars (24-32)
const FIRST = STAR_BEATS.map((beat, i) => ({
  beat,
  x: [0.5, 0.28, 0.71, 0.4, 0.62, 0.18, 0.84, 0.33, 0.55, 0.9, 0.1][i] * BW,
  y: [0.48, 0.33, 0.62, 0.7, 0.28, 0.58, 0.35, 0.22, 0.8, 0.7, 0.4][i] * BH,
  b: [3, 2, 2.2, 1.6, 1.8, 1.2, 1.4, 1, 1.1, 0.9, 1][i],
  c:
    i % 3 === 0
      ? [0.75, 0.85, 1.2]
      : i % 3 === 1
        ? [1, 0.95, 0.9]
        : [0.85, 0.9, 1.1],
}));
const starsShot = ({ t, u, grade }: Ctx) => {
  const zoom = 1 + 0.14 * (u / 8);
  const pos = (s: (typeof FIRST)[number]): [number, number] => [
    CX + (s.x - CX) * zoom,
    CY + (s.y - CY) * zoom,
  ];
  const lit = FIRST.map((s) => {
    if (t < s.beat) return 0;
    const ss = sec(t - s.beat);
    return s.b * (1 + 6 * decay(ss, 0.18)) * smooth(0, 0.02, ss);
  });
  shade(2, (x, y, out) => {
    const n = fbm(x / 260, y / 260, 0.15 * u, 5);
    const gas = Math.pow(clamp(0.5 + n), 2.4);
    let light = 0.0015;
    for (let i = 0; i < FIRST.length; i++) {
      if (lit[i] <= 0) continue;
      const [sx, sy] = pos(FIRST[i]);
      const d2 = ((x - sx) ** 2 + (y - sy) ** 2) / (150 * 150);
      light += (lit[i] * 0.1) / (1 + d2 * 3);
    }
    out[0] = gas * light * 0.6;
    out[1] = gas * light * 0.75;
    out[2] = gas * light * 1.15;
  });
  // the far ones arrive last, a thousand at once
  starfield(smooth(29.5, 32, t) * 0.8, zoom, 0, 0, 1800, t);
  FIRST.forEach((s, i) => {
    if (lit[i] <= 0) return;
    const [x, y] = pos(s);
    const k = lit[i] * 2;
    splat(x, y, 1.5, k * s.c[0], k * s.c[1], k * s.c[2]);
    splat(x, y, 9, k * 0.25 * s.c[0], k * 0.25 * s.c[1], k * 0.25 * s.c[2]);
    // diffraction spikes
    const len = 40 + 40 * k;
    const sk = k * 0.25;
    streak(x - len, y, x + len, y, 0.6, sk * s.c[0], sk * s.c[1], sk * s.c[2]);
    streak(x, y - len, x, y + len, 0.6, sk * s.c[0], sk * s.c[1], sk * s.c[2]);
  });
  grade.exposure = 1.3;
  grade.streak = 0.5;
  grade.shadows = [0.8, 0.92, 1.2];
};

// ================================================================ a galaxy (32-44)
const GAL = Array.from({ length: 60000 }, (_, i) => {
  const bulge = rand(i * 9 + 1) < 0.14;
  const rho = bulge
    ? 0.14 * Math.abs(gauss(i * 9 + 2))
    : 0.12 + 1.5 * Math.pow(rand(i * 9 + 3), 0.85);
  const arm = rand(i * 9 + 4) < 0.5 ? 0 : Math.PI;
  const spread = gauss(i * 9 + 5) * (0.18 + 0.15 * rho);
  const knot = !bulge && rand(i * 9 + 6) < 0.05;
  return {
    rho,
    a0: bulge ? rand(i * 9 + 7) * TAU : arm + spread,
    z: gauss(i * 9 + 8) * (bulge ? 0.08 : 0.025),
    bulge,
    knot,
    b: 0.3 + Math.pow(rand(i * 9 + 6), 3) * 2,
  };
});
const galaxyShot = ({ u, grade }: Ctx) => {
  const s = sec(u);
  // the arms start straight, and turning faster near the middle winds them into a spiral
  const wind = 2.2 * (1 - Math.exp(-s / 1.3)) + 0.12 * s;
  const tilt = 1.05 - 0.12 * (u / 12);
  const spin = 0.4 + 0.1 * s;
  const scale = 300 * (1 + 0.12 * (u / 12));
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  shade(3, (x, y, out) => {
    // which point of the disc this pixel looks at
    const X = (x - CX) / scale;
    const Y = (y - CY) / scale / ct;
    const r = Math.hypot(X, Y);
    const k = 0.22 * Math.exp(-r / 0.2) + 0.03 * Math.exp(-r / 0.8);
    out[0] = k * 0.9;
    out[1] = k * 0.72;
    out[2] = k * 0.55;
  });
  starfield(0.5, 1.05, 0, 0, 2500);
  for (let i = 0; i < GAL.length; i++) {
    const p = GAL[i];
    const ang = (ss: number) =>
      p.a0 +
      spin * ss +
      (p.bulge
        ? 1.2 * ss
        : (2.2 * (1 - Math.exp(-ss / 1.3)) + 0.12 * ss) / (p.rho + 0.25));
    const place = (ss: number): [number, number] => {
      const a = ang(ss);
      const X = Math.cos(a) * p.rho;
      const Y = Math.sin(a) * p.rho;
      return [CX + X * scale, CY + (Y * ct - p.z * st) * scale];
    };
    const [x, y] = place(s);
    if (x < -10 || x > BW + 10 || y < -10 || y > BH + 10) continue;
    const near = Math.exp(-p.rho / 0.3);
    let r = 0.55 + 0.45 * near;
    let g = 0.65 + 0.25 * near;
    let b = 1.0 - 0.45 * near;
    if (p.knot) {
      r = 1.2;
      g = 0.35;
      b = 0.6;
    }
    const k = 0.07 * p.b * (p.bulge ? 1.4 : 1) * smooth(0, 0.6, s);
    splat(x, y, 0.7, r * k, g * k, b * k);
  }
  void wind;
  grade.exposure = 1.15;
  grade.bloom = 0.7;
};

// ================================================================ a star dies (44-52)
const SHELL = Array.from({ length: 42000 }, (_, i) => {
  const z = 1 - 2 * rand(i * 6 + 1);
  const a = rand(i * 6 + 2) * TAU;
  const xy = Math.sqrt(1 - z * z);
  return {
    x: xy * Math.cos(a),
    y: xy * Math.sin(a),
    z,
    v: 0.75 + 0.35 * rand(i * 6 + 3),
    kind: rand(i * 6 + 4),
    b: 0.3 + rand(i * 6 + 5),
  };
});
const supernovaShot = ({ t, u, grade }: Ctx) => {
  starfield(0.6, 1 + 0.03 * u, 0, 0, 2500, t);
  const boom = 48;
  if (t < boom) {
    // a red supergiant, boiling; at the end it falls in on itself
    const fall = easeInCubic((t - 47.4) / 0.6);
    const r = 150 * (1 + 0.025 * Math.sin(u * 2.1)) * (1 - 0.97 * fall);
    const heat = 1 + 4 * fall;
    collapse();
    sphere(CX, CY, r, (nx, ny, nz, out) => {
      const n = fbm(nx * 3, ny * 3, nz * 3 + u * 0.35, 4);
      const cells = 0.55 + 0.9 * n;
      const limb = Math.pow(nz, 0.6);
      const k = (0.9 + cells) * limb * heat;
      out[0] = 2.2 * k;
      out[1] = 0.55 * k * (0.7 + 0.5 * fall);
      out[2] = 0.12 * k * (1 + 3 * fall);
    });
    splat(CX, CY, r * 0.9, 1.4 * heat, 0.35 * heat, 0.1 * heat);
    splat(CX, CY, r * 2, 0.5 * heat, 0.12 * heat, 0.05 * heat);
  } else {
    const s = sec(t - boom);
    const R = 40 + 420 * (1 - Math.exp(-s / 0.9));
    shade(2, (x, y, out) => {
      const dx = (x - CX) / R;
      const dy = (y - CY) / R;
      const d = Math.hypot(dx, dy);
      const n = fbm(dx * 2.5, dy * 2.5, s * 0.4, 4);
      const shell = Math.exp(-(((d - 0.85 - 0.12 * n) / 0.22) ** 2));
      const inside = Math.exp(-d * 2.2) * 0.15;
      const k =
        (shell * (0.6 + n) + inside) * (0.08 + 0.5 * Math.exp(-s / 0.7));
      out[0] = k * (0.5 + 0.8 * clamp(n + 0.3));
      out[1] = k * 0.45;
      out[2] = k * (0.75 - 0.4 * clamp(n + 0.3));
    });
    for (let i = 0; i < SHELL.length; i++) {
      const p = SHELL[i];
      const filament = 1 + 0.18 * noise3(p.x * 4, p.y * 4, p.z * 4);
      const rr = (ss: number) =>
        (40 + 520 * p.v * (1 - Math.exp(-ss / 0.9))) * filament;
      const r0 = rr(Math.max(0, s - sec(SHUTTER)));
      const r1 = rr(s + sec(SHUTTER));
      const teal = p.kind < 0.45;
      const red = p.kind > 0.75;
      const k = 0.11 * p.b * (0.4 + 1.6 * Math.exp(-s / 0.6));
      const c = teal
        ? [0.25, 0.95, 1.0]
        : red
          ? [1.3, 0.3, 0.2]
          : [1.2, 0.9, 0.55];
      streak(
        CX + p.x * r0,
        CY + p.y * r0,
        CX + p.x * r1,
        CY + p.y * r1,
        0.7,
        c[0] * k,
        c[1] * k,
        c[2] * k,
      );
    }
    // the shock front, and what is left in the middle
    const front = 60 + 1100 * (1 - Math.exp(-s / 0.7));
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * TAU;
      const k = 0.5 * Math.exp(-s / 0.5);
      splat(
        CX + Math.cos(a) * front,
        CY + Math.sin(a) * front,
        2.5,
        k * 0.8,
        k * 0.9,
        k * 1.2,
      );
    }
    const pulse = 3 + 2 * Math.abs(Math.sin(t * 9));
    splat(CX, CY, 1.2, pulse, pulse, pulse * 1.2);
    splat(CX, CY, 14, pulse * 0.2, pulse * 0.25, pulse * 0.35);
  }
  grade.exposure = 1.1;
  grade.bloom = 0.8;
  grade.streak = 0.45;
};

// ================================================================ the Sun is born (52-60)
const DISC = Array.from({ length: 52000 }, (_, i) => {
  let rho = 0.18 + 2.4 * Math.pow(rand(i * 5 + 1), 0.9);
  // gaps cleared by the planets that are forming
  for (const gap of [0.62, 1.05, 1.6])
    if (Math.abs(rho - gap) < 0.06) rho += 0.13;
  return {
    rho,
    a: rand(i * 5 + 2) * TAU,
    z: gauss(i * 5 + 3) * 0.02 * rho,
    b: 0.3 + Math.pow(rand(i * 5 + 4), 2) * 1.5,
  };
});
const PLANETS = [0.62, 1.05, 1.6].map((rho, i) => ({
  rho,
  a: [0.4, 2.6, 4.4][i],
}));
const sunShot = ({ t, u, grade }: Ctx) => {
  const s = sec(u);
  const tilt = 1.32 - 0.06 * (u / 8);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const scale = 330 * (1 + 0.1 * (u / 8));
  const cy = CY + 20;
  starfield(0.45, 1, 0, 0, 2500, t);
  shade(2, (x, y, out) => {
    const X = (x - CX) / scale;
    const Y = (y - cy) / scale / ct;
    const r = Math.hypot(X, Y);
    let k = (Math.exp(-r / 0.9) * 0.22) / (0.2 + r);
    for (const gap of [0.62, 1.05, 1.6])
      k *= 1 - 0.7 * Math.exp(-(((r - gap - 0.06) / 0.06) ** 2));
    const n = 0.7 + 0.6 * fbm(Math.atan2(Y, X) * 2, r * 4, s * 0.1, 3);
    out[0] = k * 1.2 * n;
    out[1] = k * 0.6 * n;
    out[2] = k * 0.28 * n;
  });
  for (let i = 0; i < DISC.length; i++) {
    const p = DISC[i];
    const a = p.a + (0.35 * s) / Math.pow(p.rho, 1.5);
    const X = Math.cos(a) * p.rho;
    const Y = Math.sin(a) * p.rho;
    const x = CX + X * scale;
    const y = cy + (Y * ct - p.z * st) * scale;
    const lit = 1 / (0.3 + p.rho);
    const k = 0.035 * p.b * lit;
    splat(x, y, 0.7, k * 1.2, k * 0.75, k * 0.45);
  }
  for (const pl of PLANETS) {
    const a = pl.a + (0.35 * s) / Math.pow(pl.rho, 1.5);
    const x = CX + Math.cos(a) * pl.rho * scale;
    const y = cy + Math.sin(a) * pl.rho * ct * scale;
    splat(x, y, 1.5, 1.5, 1.0, 0.7);
    splat(x, y, 10, 0.25, 0.15, 0.08);
  }
  const flare = 1 + 0.15 * Math.sin(t * 2.3);
  splat(CX, cy, 1.5, 9 * flare, 8 * flare, 6 * flare);
  splat(CX, cy, 12, 3, 2.4, 1.5);
  splat(CX, cy, 60, 1.2, 0.8, 0.4);
  grade.exposure = 1.1;
  grade.streak = 0.7;
  grade.bloom = 0.7;
};

// ================================================================ Earth is hit (60-72)
const DEBRIS = Array.from({ length: 26000 }, (_, i) => ({
  a: gauss(i * 5 + 1) * 0.55,
  v: 0.03 + Math.pow(rand(i * 5 + 2), 1.5) * 1.6,
  orbit: rand(i * 5 + 3),
  b: 0.3 + rand(i * 5 + 4),
}));
const impactShot = ({ t, u, grade }: Ctx) => {
  const hit = 68;
  const px = BW * 0.4;
  const py = BH * 0.56;
  const pr = 210;
  // the point on the limb where Theia arrives
  const ia = -0.62;
  const ix = px + Math.cos(ia) * pr;
  const iy = py + Math.sin(ia) * pr;
  starfield(0.5, 1, 0, 0, 2500, t);
  splat(-60, BH * 0.3, 140, 1.2, 1.0, 0.8);
  collapse();
  const after = t >= hit ? sec(t - hit) : -1;
  sphere(px, py, pr, (nx, ny, nz, out) => {
    const rot = 0.05 * u;
    const X = nx * Math.cos(rot) + nz * Math.sin(rot);
    const Z = -nx * Math.sin(rot) + nz * Math.cos(rot);
    const n = fbm(X * 2.4, ny * 2.4, Z * 2.4, 5);
    const crack = Math.pow(clamp(1 - Math.abs(n) * 6), 6);
    const sun = clamp(-nx * 0.8 - ny * 0.3 + nz * 0.35);
    const rock = 0.05 + 0.35 * sun * (0.6 + n);
    let glow = crack * 1.8 + Math.pow(clamp(-n * 2.5 - 0.3), 2) * 0.6;
    if (after >= 0) {
      const d = Math.hypot(nx * pr + px - ix, ny * pr + py - iy);
      glow +=
        5 * Math.exp(-d / (20 + 30 * after)) * (0.25 + Math.exp(-after / 0.6));
    }
    out[0] = rock * 0.55 + glow * 1.6;
    out[1] = rock * 0.45 + glow * 0.45;
    out[2] = rock * 0.4 + glow * 0.1;
  });
  // the lit edge of the atmosphere of rock vapour
  shade(1, (x, y, out) => {
    const d = Math.hypot(x - px, y - py) - pr;
    if (d < 0) return;
    const k = 0.35 * Math.exp(-d / 10);
    out[0] = k * 1.2;
    out[1] = k * 0.45;
    out[2] = k * 0.15;
  });
  if (t < hit) {
    // Theia comes in from the upper right, growing as it closes
    const k = easeInCubic((t - 60) / 8);
    const tx = lerp(BW * 1.1, ix + 70, k);
    const ty = lerp(-BH * 0.25, iy - 45, k);
    const tr = lerp(40, 105, k);
    sphere(tx, ty, tr, (nx, ny, nz, out) => {
      const n = fbm(nx * 3, ny * 3, nz * 3, 4);
      const sun = clamp(-nx * 0.8 - ny * 0.3 + nz * 0.35);
      const v = 0.06 + 0.5 * sun * (0.7 + n);
      out[0] = v * 0.9;
      out[1] = v * 0.8;
      out[2] = v * 0.7;
    });
  } else {
    for (let i = 0; i < DEBRIS.length; i++) {
      const p = DEBRIS[i];
      const place = (ss: number): [number, number] => {
        const out = p.v * 600 * (1 - Math.exp(-ss / 0.6));
        // most of it is flung out; some swings round into orbit
        const swing = p.orbit * 1.8 * (1 - Math.exp(-ss / 1.4));
        const a = ia + p.a + swing;
        return [
          ix + Math.cos(a) * out,
          iy + Math.sin(a) * out * 0.7 - 30 * ss * p.orbit,
        ];
      };
      const [x0, y0] = place(Math.max(0, after - sec(SHUTTER)));
      const [x1, y1] = place(after + sec(SHUTTER));
      const k = 0.09 * p.b * (0.4 + 2 * Math.exp(-after / 0.5));
      const c = 0.5 + 0.5 * Math.exp(-after / 0.9);
      streak(x0, y0, x1, y1, 0.8, k * 1.4, k * (0.5 + 0.5 * c), k * 0.25 * c);
    }
    const k = 8 * Math.exp(-after / 0.6);
    splat(ix, iy, 6, k, k * 0.8, k * 0.5);
    splat(ix, iy, 50, k * 0.4, k * 0.25, k * 0.1);
  }
  grade.exposure = 1.05;
  grade.bloom = 0.8;
};

// ================================================================ the first oceans (72-80)
const HORIZON = BH * 0.6;
const bolt = (
  seed: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  depth: number,
  k: number,
) => {
  if (depth === 0) {
    streak(x0, y0, x1, y1, 0.8, k * 0.8, k * 0.85, k * 1.2);
    return;
  }
  const mx =
    (x0 + x1) / 2 + (rand(seed) - 0.5) * Math.hypot(x1 - x0, y1 - y0) * 0.45;
  const my = (y0 + y1) / 2 + (rand(seed + 1) - 0.5) * 12;
  bolt(seed * 2 + 3, x0, y0, mx, my, depth - 1, k);
  bolt(seed * 2 + 4, mx, my, x1, y1, depth - 1, k);
  if (depth >= 3 && rand(seed + 2) < 0.5)
    bolt(
      seed * 3 + 5,
      mx,
      my,
      mx + (rand(seed + 3) - 0.5) * 160,
      my + 60 + rand(seed + 4) * 80,
      depth - 2,
      k * 0.5,
    );
};
const RAIN = Array.from({ length: 2600 }, (_, i) => ({
  x: rand(i * 4 + 1),
  y: rand(i * 4 + 2),
  v: 0.8 + 0.5 * rand(i * 4 + 3),
  z: 0.3 + rand(i * 4 + 4),
}));
const oceanShot = ({ t, u, grade }: Ctx) => {
  const s = sec(u);
  const flashes = LIGHTNING_BEATS.map((b, i) => {
    if (t < b) return 0;
    const ss = sec(t - b);
    // a bolt flickers: three strokes in a quarter of a second
    const strokes =
      Math.exp(-ss / 0.05) +
      0.7 * Math.exp(-Math.max(0, ss - 0.08) / 0.05) * (ss > 0.08 ? 1 : 0) +
      0.5 * Math.exp(-Math.max(0, ss - 0.17) / 0.06) * (ss > 0.17 ? 1 : 0);
    return strokes * [1, 0.8, 1.2, 0.7, 1][i];
  });
  const boltX = LIGHTNING_BEATS.map(
    (_, i) => [0.62, 0.25, 0.48, 0.82, 0.36][i] * BW,
  );
  shade(1, (x, y, out) => {
    if (y < HORIZON) {
      const n = fbm(x / 300 + s * 0.05, y / 160, s * 0.12, 5);
      const cloud = clamp(0.5 + n * 1.2);
      let light = 0.012 + 0.025 * (y / HORIZON);
      for (let i = 0; i < flashes.length; i++)
        if (flashes[i] > 0.01)
          light +=
            flashes[i] *
            2.4 *
            Math.exp(-Math.abs(x - boltX[i]) / 260) *
            (0.3 + cloud);
      const v = light * (0.4 + cloud);
      out[0] = v * 0.62;
      out[1] = v * 0.7;
      out[2] = v * 0.95;
    } else {
      // the sea, seen at a grazing angle: waves bunch up towards the horizon
      const d = (y - HORIZON) / BH + 0.004;
      const wx = (x - CX) / (d * BW * 2.5);
      const wz = 1 / d;
      const n = fbm(wx * 0.6, wz * 0.35 - s * 0.6, s * 0.3, 4);
      const crest = Math.pow(clamp(0.5 + n), 3);
      let light = 0.02;
      for (let i = 0; i < flashes.length; i++)
        if (flashes[i] > 0.01)
          light +=
            flashes[i] *
            Math.exp(-Math.abs(x - boltX[i]) / (90 + 400 * d)) *
            1.4;
      const v = light * (0.15 + crest * 1.4) * (0.35 + 0.65 * Math.exp(-d * 3));
      out[0] = v * 0.6;
      out[1] = v * 0.72;
      out[2] = v * 0.9;
    }
  });
  flashes.forEach((f, i) => {
    if (f < 0.02) return;
    const x = boltX[i];
    bolt(
      LIGHTNING_BEATS[i] * 100,
      x + (rand(i) - 0.5) * 80,
      -10,
      x,
      HORIZON,
      6,
      5 * f,
    );
  });
  for (const r of RAIN) {
    const fall = (r.y + s * r.v * 1.8) % 1;
    const x = ((r.x + fall * 0.12) % 1) * BW;
    const y = fall * BH * 1.1 - 20;
    const len = 18 * r.z;
    const k = 0.02 * r.z;
    streak(x, y, x + len * 0.15, y + len, 0.5, k * 0.8, k * 0.9, k * 1.1);
  }
  grade.exposure = 1.25;
  grade.streak = 0.3;
  grade.shadows = [0.8, 0.95, 1.15];
  grade.highlights = [0.95, 1.0, 1.1];
};

// ================================================================ life (80-96)
const SNOW = Array.from({ length: 1400 }, (_, i) => ({
  x: rand(i * 5 + 1),
  y: rand(i * 5 + 2),
  z: rand(i * 5 + 3),
  w: rand(i * 5 + 4) * TAU,
}));
type Cell = {
  x: number;
  y: number;
  r: number;
  pinch: number;
  px: number;
  py: number;
};
/** Where every cell is: each division splits a cell into two that drift apart. */
const cells = (t: number): Cell[] => {
  let list: Cell[] = [{ x: CX, y: CY, r: 92, pinch: 0, px: 0, py: 0 }];
  DIVIDE_BEATS.forEach((b, gen) => {
    if (t < b - 0.6) return;
    const k = spring(sec(t - (b - 0.6)), 1.6, 0.7);
    const next: Cell[] = [];
    list.forEach((c, i) => {
      const a = gen * 1.1 + i * 2.39996 + 0.3;
      const dx = Math.cos(a);
      const dy = Math.sin(a) * 0.8;
      const r = c.r * 0.8;
      const d = r * 1.15 * k;
      for (const side of [-1, 1])
        next.push({
          x: c.x + dx * d * side,
          y: c.y + dy * d * side,
          r: lerp(c.r, r, clamp(k * 1.5)),
          pinch: 0,
          px: dx,
          py: dy,
        });
    });
    list = next;
  });
  // the colony drifts and the camera eases in
  return list.map((c, i) => ({
    ...c,
    x: c.x + 8 * Math.sin(t * 0.7 + i),
    y: c.y + 6 * Math.cos(t * 0.5 + i * 2),
  }));
};
const lifeShot = ({ t, u, grade }: Ctx) => {
  const s = sec(u);
  shade(2, (x, y, out) => {
    const depth = y / BH;
    // light shafts from the surface, swaying
    const a = Math.atan2(x - BW * 0.55, y + 500);
    const rays =
      Math.pow(clamp(0.5 + 0.9 * noise3(a * 9, s * 0.15, 1.3)), 3) *
      Math.exp(-depth * 1.6);
    const water = 0.035 * Math.exp(-depth * 1.8);
    out[0] = water * 0.15 + rays * 0.05;
    out[1] = water * 0.6 + rays * 0.22;
    out[2] = water * 0.9 + rays * 0.28;
  });
  for (const p of SNOW) {
    const x = ((p.x + 0.01 * Math.sin(s * 0.5 + p.w)) % 1) * BW;
    const y = ((p.y + s * 0.012 * (0.5 + p.z)) % 1) * BH;
    // out of focus in front, sharp far away
    const r = p.z > 0.85 ? 6 + (18 * (p.z - 0.85)) / 0.15 : 0.7;
    const k = (p.z > 0.85 ? 0.12 : 0.03) * (0.4 + p.z);
    splat(x, y, r, k * 0.5, k * 0.8, k * 0.85);
  }
  const list = cells(t);
  const zoom = 1 + 0.12 * (u / 16);
  const cl = list.map((c) => ({
    x: CX + (c.x - CX) * zoom,
    y: CY + (c.y - CY) * zoom,
    r: c.r * zoom,
  }));
  let ya = BH;
  let yb = 0;
  for (const c of cl) {
    ya = Math.min(ya, c.y - c.r * 1.6);
    yb = Math.max(yb, c.y + c.r * 1.6);
  }
  shade(
    0,
    (x, y, out) => {
      let f = 0;
      let nuc = 0;
      for (const c of cl) {
        const d2 = ((x - c.x) ** 2 + (y - c.y) ** 2) / (c.r * c.r);
        f += 1 / (d2 + 1e-4);
        nuc += Math.exp(-d2 * 9);
      }
      // the membrane is where the field crosses 1: a thin bright skin
      const skin = Math.exp(-(((f - 1) / 0.09) ** 2));
      const inside = f > 1 ? Math.min(1, (f - 1) * 0.8) : 0;
      const wobble = 0.85 + 0.15 * noise3(x / 30, y / 30, s * 0.6);
      out[0] = (skin * 0.35 + inside * 0.04) * wobble + nuc * 0.9;
      out[1] = (skin * 1.3 + inside * 0.16) * wobble + nuc * 0.65;
      out[2] = (skin * 1.0 + inside * 0.14) * wobble + nuc * 0.2;
    },
    ya,
    yb,
  );
  cl.forEach((c, i) => {
    for (let k = 0; k < 6; k++) {
      const a = k * 1.7 + i + s * (0.3 + 0.1 * k);
      const d = c.r * (0.35 + 0.25 * Math.sin(k * 2.3 + s * 0.4));
      splat(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 1.4, 0.3, 0.8, 0.6);
    }
  });
  grade.exposure = 1.35;
  grade.bloom = 0.8;
  grade.streak = 0.15;
  grade.shadows = [0.75, 1.0, 1.1];
  grade.highlights = [1.05, 1.02, 0.92];
};

// ================================================================ the first forests (96-104)
type Branch = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w: number;
  birth: number;
};
/** A branching tree, as segments; `birth` 0..1 is when each one starts to grow. */
const tree = (seed: number, x: number, y: number, h: number): Branch[] => {
  const out: Branch[] = [];
  const grow = (
    x0: number,
    y0: number,
    a: number,
    len: number,
    w: number,
    depth: number,
    birth: number,
    sd: number,
  ) => {
    const x1 = x0 + Math.sin(a) * len;
    const y1 = y0 - Math.cos(a) * len;
    out.push({ x0, y0, x1, y1, w, birth });
    if (depth === 0) return;
    const n = 2 + (rand(sd) < 0.4 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const spread = (k - (n - 1) / 2) * (0.45 + 0.25 * rand(sd + k + 1));
      grow(
        x1,
        y1,
        a * 0.7 + spread + (rand(sd + k + 9) - 0.5) * 0.3,
        len * (0.68 + 0.12 * rand(sd + k + 5)),
        w * 0.66,
        depth - 1,
        birth + 1,
        sd * 3 + k + 11,
      );
    }
  };
  grow(
    x,
    y,
    (rand(seed) - 0.5) * 0.1,
    h * 0.36,
    Math.max(2, h * 0.05),
    6,
    0,
    seed * 7 + 1,
  );
  return out;
};
const ROWS = [0, 1, 2].map((row) =>
  Array.from({ length: [9, 7, 5][row] }, (_, i) => {
    const x =
      ((i + 0.5 + (rand(row * 50 + i) - 0.5) * 0.7) / [9, 7, 5][row]) * BW;
    const base = BH * [0.74, 0.8, 0.9][row];
    const h = [110, 190, 320][row] * (0.8 + 0.4 * rand(row * 50 + i + 20));
    return {
      segs: tree(row * 100 + i, x, base + 10, h),
      start: rand(row * 50 + i + 40) * 2 + row * 0.6,
    };
  }),
);
const SPORES = Array.from({ length: 500 }, (_, i) => ({
  x: rand(i * 3 + 1),
  y: rand(i * 3 + 2),
  z: rand(i * 3 + 3),
}));
const forestShot = ({ u, grade }: Ctx) => {
  const s = sec(u);
  const sunX = BW * 0.62;
  const sunY = BH * 0.66 - 30 * (u / 8);
  shade(1, (x, y, out) => {
    const h = y / BH;
    const warm = Math.exp(-Math.abs(h - 0.7) * 3.2);
    const d = Math.hypot(x - sunX, y - sunY);
    const a = Math.atan2(y - sunY, x - sunX);
    const rays =
      Math.pow(clamp(0.5 + 0.8 * noise3(a * 6, 2.1, s * 0.1)), 4) *
      Math.exp(-d / 500);
    const glow = 1.2 * Math.exp(-d / 140) + 0.4 * Math.exp(-d / 420);
    out[0] = 0.05 + warm * 0.55 + glow * 1.2 + rays * 0.5;
    out[1] = 0.04 + warm * 0.27 + glow * 0.75 + rays * 0.3;
    out[2] = 0.09 + warm * 0.12 + glow * 0.35 + rays * 0.12 + (1 - h) * 0.08;
  });
  splat(sunX, sunY, 18, 6, 4.2, 2.4);
  collapse();
  ROWS.forEach((row, ri) => {
    for (const tr of row) {
      // time-lapse: each tree grows a generation at a time
      const g = clamp((u - tr.start) / 4.5) * 7.2;
      for (const b of tr.segs) {
        const k = clamp(g - b.birth);
        if (k <= 0) continue;
        line(
          b.x0,
          b.y0,
          b.x0 + (b.x1 - b.x0) * k,
          b.y0 + (b.y1 - b.y0) * k,
          b.w,
          b.w * 0.7,
        );
      }
    }
    ground(
      (x) =>
        BH * [0.74, 0.8, 0.9][ri] + 14 * noise3(x / 160, ri * 3.3, 0.5) + 6,
    );
    // far rows are softened by mist
    const mist = [0.45, 0.2, 0][ri];
    fillMask(0.3 * mist, 0.18 * mist, 0.1 * mist);
  });
  for (const p of SPORES) {
    const x = ((p.x + s * 0.01 * (p.z - 0.3)) % 1) * BW;
    const y = (p.y * 0.8 + 0.05 * Math.sin(s + p.x * 9)) * BH;
    const k = 0.06 * p.z * Math.exp(-Math.hypot(x - sunX, y - sunY) / 400);
    splat(x, y, 0.8 + 3 * p.z * p.z, k * 1.2, k * 0.9, k * 0.5);
  }
  grade.exposure = 1.0;
  grade.bloom = 0.9;
  grade.streak = 0.35;
  grade.highlights = [1.12, 1.0, 0.85];
};

// ================================================================ the asteroid (104-112)
const FERNS = Array.from({ length: 7 }, (_, i) => ({
  x: [0.04, 0.16, 0.3, 0.75, 0.88, 0.97, 0.55][i] * BW,
  h: [330, 240, 180, 210, 300, 380, 140][i],
  lean: [0.25, -0.1, 0.15, -0.2, 0.1, -0.3, 0.05][i],
}));
const asteroidShot = ({ t, grade }: Ctx) => {
  const hit = 108;
  const hx = BW * 0.66;
  const hy = BH * 0.7;
  const after = t >= hit ? sec(t - hit) : -1;
  // before the hit the rock lights the sky; after, the sky burns
  const burn = after >= 0 ? 1 - Math.exp(-after / 0.5) : 0;
  const go = clamp((t - 104) / 4);
  const incoming = 0.25 * go + 0.75 * go * go;
  shade(1, (x, y, out) => {
    const h = y / BH;
    // the fireball swells and climbs over the horizon
    const g = after >= 0 ? 1 - Math.exp(-after / 1.1) : 0;
    const dome =
      after >= 0
        ? Math.exp(
            -Math.hypot(
              (x - hx) / (60 + 420 * g),
              (y - (hy - 150 * g)) / (40 + 230 * g),
            ) * 1.6,
          )
        : 0;
    const n = 0.6 + 0.8 * fbm(x / 120, y / 90, s(after), 4);
    const dusk = 0.12 + 0.35 * Math.exp(-Math.abs(h - 0.68) * 5);
    // the rock lights the sky as it comes; after the hit, dust darkens it and the fireball stands out
    const sky = dusk * (1 + 1.5 * incoming) * (1 - 0.65 * burn);
    out[0] = sky * 0.9 + burn * 0.12 * (1 - h * 0.5) + dome * n * 3.2;
    out[1] = sky * 0.45 + burn * 0.04 + dome * n * 0.8;
    out[2] = sky * 0.55 + burn * 0.01 + dome * n * 0.12;
  });
  if (t < hit) {
    const k = incoming;
    const x = lerp(BW * 0.06, hx, k);
    const y = lerp(BH * 0.06, hy, k);
    const dx = hx - BW * 0.06;
    const dy = hy - BH * 0.06;
    const len = Math.hypot(dx, dy);
    for (let i = 0; i < 60; i++) {
      const b = i / 60;
      const tail = 120 + 520 * k;
      const tx = x - (dx / len) * tail * b;
      const ty = y - (dy / len) * tail * b;
      const kk = 2.2 * (1 - b) ** 2 * (1 + 2 * k);
      splat(tx, ty, 1.5 + 9 * b, kk * 1.3, kk * 0.8, kk * 0.45);
    }
    // a sharp white-hot head, a glow round it, and the light it throws on the sky
    splat(x, y, 1.5, 30 + 50 * k, 26 + 40 * k, 20 + 28 * k);
    splat(x, y, 9, 4 + 8 * k, 3 + 5 * k, 1.5 + 2.5 * k);
    splat(x, y, 60, 1.2 + 3 * k, 0.7 + 1.6 * k, 0.3 + 0.6 * k);
  }
  collapse();
  // the wave reaches the ferns 1.3 s after the hit and bends them
  const gust =
    after > 1.3
      ? 0.6 * (1 - Math.exp(-(after - 1.3) / 0.3)) + 0.1 * Math.sin(after * 9)
      : 0;
  const groundTop = (x: number) =>
    hy +
    8 +
    22 * noise3(x / 200, 4.4, 0) +
    (x > BW * 0.4 ? 0 : 30 * Math.exp(-(((x - BW * 0.2) / 140) ** 2)));
  // two long-necked dinosaurs in the middle distance, looking at the sky
  const herd: [number, number, number][] = [
    [BW * 0.42, 1, 1],
    [BW * 0.52, -1, 0.75],
  ];
  for (const [bx, dir, sc] of herd) {
    const by = groundTop(bx) - 4;
    const look = after > 0 ? 0.5 : clamp((t - 105) / 2) * 0.35;
    const P = (dx: number, dy: number): [number, number] => [
      bx + dir * dx * sc,
      by - dy * sc,
    ];
    const leg = (dx: number) => {
      const [x0, y0] = P(dx, 46);
      const [x1, y1] = P(dx + 2, 0);
      line(x0, y0, x1, y1, 13 * sc, 11 * sc);
    };
    [-24, -10, 22, 34].forEach(leg);
    const [b0x, b0y] = P(-30, 58);
    const [b1x, b1y] = P(40, 62);
    line(b0x, b0y, b1x, b1y, 44 * sc, 40 * sc);
    // neck: a curve up and forward, raised further as it looks at the fireball
    let [nx0, ny0] = P(46, 66);
    for (let k = 1; k <= 8; k++) {
      const a = 0.5 + (k / 8) * (0.55 + look);
      const [nx1, ny1] = [
        nx0 + dir * Math.cos(a) * 15 * sc,
        ny0 - Math.sin(a) * 15 * sc,
      ];
      line(nx0, ny0, nx1, ny1, (18 - k * 1.3) * sc, (18 - (k + 1) * 1.3) * sc);
      [nx0, ny0] = [nx1, ny1];
    }
    line(nx0, ny0, nx0 + dir * 12 * sc, ny0 + 2 * sc, 10 * sc, 7 * sc);
    // tail: tapering, swinging low behind
    let [tx0, ty0] = P(-34, 60);
    for (let k = 1; k <= 8; k++) {
      const [tx1, ty1] = [tx0 - dir * 14 * sc, ty0 + (k < 4 ? 3 : 1) * sc];
      line(tx0, ty0, tx1, ty1, (22 - k * 2.4) * sc, (22 - (k + 1) * 2.4) * sc);
      [tx0, ty0] = [tx1, ty1];
    }
  }
  fillMask(0.05, 0.025, 0.03);
  // tree ferns in front: a trunk, and a crown of fronds that arch out and droop
  for (const f of FERNS) {
    const x0 = f.x;
    const y0 = groundTop(f.x) + 6;
    const topX = x0 + Math.sin(f.lean) * f.h * 0.6;
    const topY = y0 - f.h * 0.62;
    line(x0, y0, topX, topY, 16 * (f.h / 300) + 6, 10 * (f.h / 300) + 4);
    const fronds = 9;
    for (let k = 0; k < fronds; k++) {
      const out = (k / (fronds - 1)) * 2 - 1;
      const reach = f.h * (0.42 + 0.12 * (1 - Math.abs(out)));
      // the blast pushes every frond the same way
      const push = gust * (1 - f.x / BW + 0.3) * 0.8;
      let px = topX;
      let py = topY;
      const segs = 10;
      for (let j = 0; j < segs; j++) {
        const q = j / segs;
        const ang = out * (0.5 + 1.25 * q) + push * q;
        const len = reach / segs;
        const qx = px + Math.sin(ang) * len;
        const qy = py - Math.cos(ang) * len + q * q * 9;
        line(px, py, qx, qy, 6 * (1 - q) + 2, 6 * (1 - (j + 1) / segs) + 2);
        // little leaflets hanging off each frond
        const ll = 22 * Math.sin(Math.PI * (q + 0.1)) * (f.h / 300);
        for (const side of [-1, 1])
          line(
            qx,
            qy,
            qx + Math.sin(ang + side * 1.25 + push * 0.5) * ll,
            qy - Math.cos(ang + side * 1.25) * ll + ll * 0.55,
            3.5,
            1.2,
          );
        px = qx;
        py = qy;
      }
    }
  }
  ground(groundTop);
  fillMask(0.01, 0.005, 0.005);
  grade.exposure = 1.05;
  grade.bloom = 0.9;
  grade.streak = 0.5;
};
const s = (after: number) => (after > 0 ? after * 0.6 : 0);

// ================================================================ fire (112-120)
const FLAME = Array.from({ length: 3200 }, (_, i) => ({
  ph: rand(i * 6 + 1),
  x: gauss(i * 6 + 2),
  rate: 1.2 + rand(i * 6 + 3) * 1.3,
  w: rand(i * 6 + 4) * TAU,
  b: 0.5 + rand(i * 6 + 5),
}));
const SPARK = Array.from({ length: 320 }, (_, i) => ({
  ph: rand(i * 4 + 1),
  x: gauss(i * 4 + 2),
  w: rand(i * 4 + 3) * TAU,
  h: 0.5 + rand(i * 4 + 4),
}));
const fireShot = ({ t, u, grade }: Ctx) => {
  const ss = sec(u);
  const fx = BW * 0.5;
  const fy = BH * 0.84;
  shade(2, (x, y, out) => {
    const h = y / BH;
    // the Milky Way, across the sky
    const along = (x - BW * 0.1) * 0.87 + y * 0.5;
    const across = (y - BH * 0.05) * 0.87 - (x - BW * 0.1) * 0.5;
    const band = Math.exp(-((across / 120) ** 2));
    const n = fbm(along / 140, across / 70, 0.3, 5);
    const lane = 1 - 0.45 * Math.exp(-(((across - 12 - n * 30) / 26) ** 2));
    const k = band * (0.55 + n) * lane * 0.07;
    out[0] = k * 0.95 + 0.006;
    out[1] = k * 0.88 + 0.009 + (1 - h) * 0.004;
    out[2] = k * 0.85 + 0.022;
  });
  starfield(0.9, 1, 0, 0, 3000, t);
  collapse();
  ground(
    (x) =>
      fy +
      18 +
      40 * Math.exp(-(((x - BW * 0.15) / 220) ** 2)) * -1 +
      14 * noise3(x / 150, 7.7, 0),
  );
  // two people sitting by the fire, hunched forward, arms round their knees
  for (const [x0, dir, sc] of [
    [fx - 175, 1, 1],
    [fx + 190, -1, 0.92],
  ] as const) {
    const base = fy + 18;
    const P = (dx: number, dy: number): [number, number] => [
      x0 + dir * dx * sc,
      base - dy * sc,
    ];
    const [hipX, hipY] = P(0, 6);
    const [shX, shY] = P(22, 66);
    const [hdX, hdY] = P(36, 86);
    const [knX, knY] = P(54, 40);
    const [ftX, ftY] = P(62, 0);
    const [hnX, hnY] = P(50, 34);
    line(hipX, hipY, shX, shY, 34 * sc, 26 * sc);
    line(hdX, hdY, hdX, hdY, 26 * sc);
    line(shX, shY, hdX - dir * 4 * sc, hdY + 4 * sc, 14 * sc, 12 * sc);
    line(hipX, hipY, knX, knY, 20 * sc, 16 * sc);
    line(knX, knY, ftX, ftY, 14 * sc, 12 * sc);
    line(shX, shY, hnX, hnY, 11 * sc, 9 * sc);
    line(hipX - dir * 6 * sc, hipY, ftX + dir * 6 * sc, ftY + 4, 10 * sc);
  }
  fillMask(0.004, 0.003, 0.003);
  // the fire lights the ground around it
  splat(fx, fy + 10, 110, 4.5, 1.6, 0.45);
  splat(fx, fy - 30, 40, 5, 2, 0.5);
  const flicker = 1 + 0.15 * noise3(t * 2, 1, 1);
  // the body of the flame: a teardrop pushed about by turbulence
  shade(
    1,
    (x, y, out) => {
      const h = (fy - y) / 190;
      if (h < -0.08 || h > 1 || Math.abs(x - fx) > 120) return;
      const wob =
        28 * fbm(x / 40, y / 34 + ss * 3.2, ss * 1.3, 3) * Math.max(0, h);
      const width =
        42 * Math.pow(Math.max(0, 1 - h), 0.9) * (0.8 + 0.2 * flicker);
      const d = Math.abs(x - fx + wob) / Math.max(width, 1);
      const body = clamp(1 - d) * smooth(-0.08, 0.04, h);
      const tongues = clamp(0.55 + fbm(x / 22, y / 18 + ss * 4.5, ss, 3) * 1.4);
      const heat = body * (0.55 + 0.45 * tongues) * (1 - 0.55 * h);
      const k = Math.pow(heat, 1.5) * 3.2;
      out[0] = k * 1.6;
      out[1] = k * (0.22 + 0.75 * heat * heat);
      out[2] = k * 0.08 * heat * heat * heat;
    },
    fy - 240,
    fy + 30,
  );
  for (const p of FLAME) {
    const age = (p.ph + ss * p.rate) % 1;
    const sway = 18 * Math.sin(p.w + ss * 5 + age * 4);
    const x = fx + p.x * 38 * (1 - age * 0.7) + sway * age;
    const y = fy - age * 230 * (0.7 + 0.3 * p.b);
    const temp = 1 - age;
    const k =
      0.16 * p.b * flicker * Math.sin(Math.PI * Math.min(1, age * 1.4 + 0.05));
    splat(
      x,
      y,
      2 + age * 8,
      k * (1.4 + temp),
      k * (0.25 + 0.9 * temp * temp),
      k * 0.12 * temp * temp * temp,
    );
  }
  for (const p of SPARK) {
    const age = (p.ph + ss * 0.35) % 1;
    const pos = (a: number): [number, number] => [
      fx + p.x * 30 + Math.sin(p.w + a * 9) * 40 * a,
      fy - 40 - a * BH * 0.85 * p.h,
    ];
    const [x0, y0] = pos(age - 0.004);
    const [x1, y1] = pos(age + 0.004);
    const k = 0.5 * (1 - age) ** 2;
    streak(x0, y0, x1, y1, 0.6, k * 1.4, k * 0.6, k * 0.15);
  }
  grade.exposure = 1.15;
  grade.bloom = 0.85;
  grade.streak = 0.3;
  grade.shadows = [0.85, 0.95, 1.15];
  grade.highlights = [1.15, 1.0, 0.82];
};

// ================================================================ cities (120-128)
const citiesShot = ({ t, u, grade }: Ctx) => {
  const ss = sec(u);
  const R = BH * 1.7;
  const cx = BW * 0.5;
  const cy = BH * 0.32 + R;
  starfield(0.6, 1, 0, 0, 2000, t);
  collapse();
  const spread = clamp((u - 0.5) / 6.5);
  sphere(cx, cy, R, (nx, ny, nz, out) => {
    // turn the planet slowly under the camera
    const rot = 0.02 * ss;
    const X = nx * Math.cos(rot) + nz * Math.sin(rot);
    const Z = -nx * Math.sin(rot) + nz * Math.cos(rot);
    const land = fbm(X * 4, ny * 4, Z * 4, 5) + 0.08;
    const night = 0.006 + 0.01 * nz;
    if (land < 0) {
      out[0] = night * 0.3;
      out[1] = night * 0.5;
      out[2] = night * 1.6;
      return;
    }
    out[0] = night;
    out[1] = night;
    out[2] = night * 1.2;
    // cities: where people are, the lights come on, spreading out from a few places over 10,000 years
    const coast = Math.exp(-land * 14);
    const people = clamp(
      -0.45 + fbm(X * 9 + 3, ny * 9, Z * 9, 3) * 2.6 + coast * 0.9,
    );
    const when = 0.5 + 0.5 * fbm(X * 2.2 + 9, ny * 2.2, Z * 2.2, 2);
    const on = smooth(when - 0.12, when, spread * 1.3);
    const sparkle = Math.pow(
      clamp(0.5 + noise3(X * 520, ny * 520, Z * 520) * 1.3),
      10,
    );
    const k = on * people * (0.02 + 5 * sparkle);
    out[0] += k * 1.5;
    out[1] += k * 0.95;
    out[2] += k * 0.4;
  });
  // the air, lit from behind along the edge of the planet
  shade(1, (x, y, out) => {
    const d = Math.hypot(x - cx, y - cy) - R;
    if (d < -8 || d > 120) return;
    const glow =
      Math.exp(-Math.abs(d) / 10) + 0.3 * Math.exp(-Math.max(0, d) / 40);
    const dawn = Math.exp(-(((x - BW * 0.15) / 260) ** 2));
    out[0] = glow * (0.05 + 0.9 * dawn);
    out[1] = glow * (0.12 + 0.4 * dawn);
    out[2] = glow * (0.45 + 0.1 * dawn);
  });
  splat(BW * 0.13, BH * 0.3, 8, 3, 2.4, 1.6);
  grade.exposure = 1.25;
  grade.bloom = 0.7;
  grade.streak = 0.4;
};

// ================================================================ into space (128-136)
const ROCKET_SMOKE = 0.22;
const rocketShot = ({ t, u, grade }: Ctx) => {
  const ss = sec(u);
  // the rocket climbs and the camera tilts up with it
  const climb = Math.pow(ss / 3.2, 2) * BH * 2.2;
  const tilt = Math.min(climb * 0.85, BH * 3);
  const padY = BH * 0.82 + tilt;
  const rx = BW * 0.5 + 6 * Math.sin(ss * 1.3);
  const ry = BH * 0.66 - climb + tilt;
  const high = clamp(tilt / (BH * 1.6));
  shade(1, (x, y, out) => {
    const h = (y - tilt) / BH;
    const dusk = Math.exp(-Math.abs(h - 0.8) * 3);
    out[0] = (0.02 + dusk * 0.5) * (1 - high) + 0.002;
    out[1] = (0.03 + dusk * 0.22) * (1 - high) + 0.003;
    out[2] = (0.09 + dusk * 0.1) * (1 - high) + 0.012;
  });
  starfield(0.3 + 0.7 * high, 1, 0, tilt * 0.1, 2500, t);
  // the smoke at the pad, lit by the flame
  shade(
    1,
    (x, y, out) => {
      const dx = (x - BW * 0.5) / BW;
      const dy = (y - padY) / BH;
      const spread = 0.12 + 0.5 * (1 - Math.exp(-ss / 1.2));
      const body = Math.exp(
        -((dx / spread) ** 2) - ((dy + 0.04) / 0.12) ** 2 * (dy < 0 ? 1 : 4),
      );
      const n =
        0.5 +
        fbm(x / 70 - ss * 0.3 * Math.sign(dx), y / 60 + ss * 0.2, ss * 0.4, 5);
      const smoke = clamp(body * n * 1.8);
      const lit =
        Math.exp(-Math.hypot(x - rx, y - (ry + 120)) / 260) * 2 + 0.05;
      out[0] = smoke * lit * 1.1;
      out[1] = smoke * lit * 0.6;
      out[2] = smoke * lit * 0.35;
    },
    padY - BH * 0.5,
    BH,
  );
  void ROCKET_SMOKE;
  collapse();
  // the tower and the ground drop away
  line(BW * 0.36, padY + 20, BW * 0.36, padY - 330, 16);
  for (let k = 0; k < 9; k++)
    line(BW * 0.36, padY - k * 36, BW * 0.43, padY - k * 36 - 18, 4);
  ground(() => padY + 4);
  fillMask(0.004, 0.003, 0.003);
  // the rocket
  const body = 190;
  line(rx, ry, rx, ry - body, 26, 26);
  line(rx, ry - body, rx, ry - body - 46, 26, 2);
  line(rx - 12, ry - 10, rx - 30, ry + 6, 6, 4);
  line(rx + 12, ry - 10, rx + 30, ry + 6, 6, 4);
  fillMask(0.012, 0.01, 0.01);
  // the flame
  const fl = 1 + 0.12 * noise3(t * 3, 2, 2);
  for (let i = 0; i < 90; i++) {
    const b = i / 90;
    const k = (1 - b) ** 1.5 * 4 * fl;
    splat(
      rx + 3 * noise3(i, t * 4, 0),
      ry + 8 + b * 260,
      3 + 18 * b,
      k * 1.6,
      k * (0.9 - 0.5 * b),
      k * (0.5 - 0.45 * b),
    );
  }
  splat(rx, ry + 30, 40, 7, 4, 1.6);
  grade.exposure = 1.1;
  grade.streak = 0.8;
  grade.bloom = 0.9;
};

// ================================================================ home (136-144) and the end (144-150)
const earth = (
  nx: number,
  ny: number,
  nz: number,
  out: Float32Array,
  rot: number,
) => {
  const X = nx * Math.cos(rot) + nz * Math.sin(rot);
  const Z = -nx * Math.sin(rot) + nz * Math.cos(rot);
  const land = fbm(X * 2.6, ny * 2.6, Z * 2.6, 5) + 0.04;
  const cloud = clamp(fbm(X * 4 + 5, ny * 6, Z * 4, 5) * 2.2 + 0.1);
  const sun = clamp(nx * 0.3 - ny * 0.2 + nz * 0.93);
  const ice = smooth(
    0.8,
    0.9,
    Math.abs(ny) + 0.05 * fbm(X * 6, ny * 6, Z * 6, 2),
  );
  let r = 0.02;
  let g = 0.07;
  let b = 0.22;
  if (land > 0) {
    // green near the coast, browner inland
    const dry = clamp(land * 4);
    r = 0.07 + 0.2 * dry;
    g = 0.15 + 0.06 * dry;
    b = 0.06 + 0.03 * dry;
  }
  r += (0.8 - r) * ice;
  g += (0.8 - g) * ice;
  b += (0.8 - b) * ice;
  r = r + (0.95 - r) * cloud;
  g = g + (0.97 - g) * cloud;
  b = b + (1.0 - b) * cloud;
  const rim = Math.pow(1 - nz, 3);
  out[0] = (r * sun + rim * 0.15 * sun) * 2.2;
  out[1] = (g * sun + rim * 0.35 * sun) * 2.2;
  out[2] = (b * sun + rim * 0.8 * sun) * 2.2;
};
const homeShot = ({ t, u, grade }: Ctx) => {
  const end = t >= 144;
  // pulling back, faster and faster, until the planet is one point of light
  const k = end ? 1 : clamp(u / 7.5);
  const r = 260 * Math.pow(0.004, Math.pow(k, 1.4));
  const ss = sec(u);
  starfield(0.4 + 0.5 * k, 1 + 0.4 * (1 - k), 0, 0, 3000, t);
  collapse();
  if (r > 2) {
    sphere(CX, CY, r, (nx, ny, nz, out) => earth(nx, ny, nz, out, 0.08 * ss));
    shade(1, (x, y, out) => {
      const d = Math.hypot(x - CX, y - CY) - r;
      if (d < -4 || d > 60) return;
      const g =
        Math.exp(-Math.abs(d) / (2 + r * 0.03)) *
        (0.5 + 0.5 * clamp((x - CX) / r + 0.6));
      out[0] = g * 0.12;
      out[1] = g * 0.3;
      out[2] = g * 0.8;
    });
  }
  // the same point the film began with
  const dot = smooth(0.6, 1, k);
  splat(CX, CY, 1.2, 3 * dot, 3.6 * dot, 5.2 * dot);
  splat(CX, CY, 10, 0.5 * dot, 0.7 * dot, 1.2 * dot);
  grade.exposure = 1.15;
  grade.streak = 0.5;
  if (end) grade.fade = 0.55 * smooth(144, 145, t);
};

const SHOT_FNS = {
  void: voidShot,
  bang: bangShot,
  stars: starsShot,
  galaxy: galaxyShot,
  supernova: supernovaShot,
  sun: sunShot,
  impact: impactShot,
  ocean: oceanShot,
  life: lifeShot,
  forest: forestShot,
  asteroid: asteroidShot,
  fire: fireShot,
  cities: citiesShot,
  rocket: rocketShot,
  home: homeShot,
  end: homeShot,
};

/** Render one frame of the picture band into an RGBA buffer of BW x BH. */
export const renderCosmos = (frame: number, rgba: Uint8ClampedArray) => {
  const t = (frame + 0.5) / C_FPS / C_BEAT;
  const { shot, from } = shotAt(t);
  const grade: Grade = {
    ...GRADE,
    shadows: [...GRADE.shadows],
    highlights: [...GRADE.highlights],
  };
  clear();
  SHOT_FNS[shot.id]({ t, u: shot.id === "end" ? t - 136 : t - from, grade });
  collapse();
  grade.flash = Math.max(grade.flash, flashes(t));
  // the drums of the last third: every cut gets a short flash
  for (const b of [112, 120, 128, 136])
    if (t >= b && t - b < 1)
      grade.flash = Math.max(grade.flash, 0.45 * decay(sec(t - b), 0.07));
  develop(grade, frame, rgba);
};
