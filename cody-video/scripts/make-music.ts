/**
 * Synthesizes the soundtrack from nothing but math: oscillators, noise, filters,
 * envelopes, a reverb and a delay. No samples, no audio files read.
 *
 *   bun scripts/make-music.ts   ->   public/cody-track.wav
 *
 * Every note comes from src/score.ts, the same file the visuals read.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as S from "../src/score";

const SR = 48000;
const N = Math.round(SR * S.DURATION_SEC);
const TAU = Math.PI * 2;

type Bus = { l: Float32Array; r: Float32Array };
const makeBus = (): Bus => ({ l: new Float32Array(N), r: new Float32Array(N) });
const sec = (beat: number) => beat * S.BEAT_SEC;
const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// Deterministic noise, so every run produces the identical file.
let seed = 0x1234abcd;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const rnd01 = () => (rnd() + 1) / 2;

/** Zero-delay-feedback state variable filter. */
class SVF {
  ic1 = 0;
  ic2 = 0;
  lp = 0;
  bp = 0;
  hp = 0;
  tick(x: number, fc: number, q: number) {
    const g = Math.tan((Math.PI * Math.min(Math.max(fc, 20), SR * 0.45)) / SR);
    const kk = 1 / q;
    const a1 = 1 / (1 + g * (g + kk));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - kk * v1 - v2;
  }
}

const polyblep = (t: number, dt: number) => {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
};
const saw = (ph: number, dt: number) => 2 * ph - 1 - polyblep(ph, dt);
const square = (ph: number, dt: number) =>
  (ph < 0.5 ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 0.5) % 1, dt);

/** Equal-power pan, -1..1 */
const pan = (p: number): [number, number] => {
  const a = ((p + 1) / 2) * (Math.PI / 2);
  return [Math.cos(a), Math.sin(a)];
};

// ================================================================ buses
const kickBus = makeBus();
const drumBus = makeBus();
const bassBus = makeBus();
const musicBus = makeBus();
const fxBus = makeBus();
const revSend = makeBus();
const dlySend = makeBus();

// ================================================================ drums
function kick(t0: number, vel: number, heavy: boolean) {
  const len = Math.floor(SR * (heavy ? 0.75 : 0.4));
  const i0 = Math.floor(t0 * SR);
  const hp = new SVF();
  let ph = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    const f =
      (heavy ? 43 : 49) +
      150 * Math.exp(-t / 0.05) +
      520 * Math.exp(-t / 0.006);
    ph += (TAU * f) / SR;
    const dec = heavy ? 0.17 : 0.11;
    const amp =
      Math.min(1, t / 0.0008) * (t < 0.05 ? 1 : Math.exp(-(t - 0.05) / dec));
    const body = Math.tanh(Math.sin(ph) * 2.4 * amp);
    hp.tick(rnd(), 3200, 0.7);
    const click = hp.hp * Math.exp(-t / 0.003) * 0.7;
    const v = (body * 0.95 + click) * vel;
    kickBus.l[i0 + i] += v;
    kickBus.r[i0 + i] += v;
  }
}

function boom(t0: number, size: number) {
  const len = Math.floor(SR * 1.8);
  const i0 = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    const f = 33 + 55 * Math.exp(-t / 0.22);
    ph += (TAU * f) / SR;
    const v = Math.tanh(Math.sin(ph) * 1.5) * Math.exp(-t / 0.42) * size * 0.5;
    fxBus.l[i0 + i] += v;
    fxBus.r[i0 + i] += v;
  }
}

const METAL = [3310, 4155, 5403, 6370, 7523, 8871];
function cymbal(
  t0: number,
  vel: number,
  decay: number,
  cutoff: number,
  out: Bus,
  rev = 0,
) {
  const len = Math.floor(SR * Math.min(decay * 7, 2.6));
  const i0 = Math.floor(t0 * SR);
  const hpL = new SVF();
  const hpR = new SVF();
  const phases = METAL.map(() => rnd01());
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    let metal = 0;
    for (let j = 0; j < METAL.length; j++) {
      phases[j] = (phases[j] + METAL[j] / SR) % 1;
      metal += phases[j] < 0.5 ? 1 : -1;
    }
    metal /= METAL.length;
    const amp = Math.min(1, t / 0.0006) * Math.exp(-t / decay) * vel;
    hpL.tick(rnd() * 0.75 + metal * 0.55, cutoff, 0.8);
    hpR.tick(rnd() * 0.75 + metal * 0.55, cutoff, 0.8);
    out.l[i0 + i] += hpL.hp * amp;
    out.r[i0 + i] += hpR.hp * amp;
    if (rev > 0) {
      revSend.l[i0 + i] += hpL.hp * amp * rev;
      revSend.r[i0 + i] += hpR.hp * amp * rev;
    }
  }
}

function clap(t0: number, vel: number) {
  const len = Math.floor(SR * 0.4);
  const i0 = Math.floor(t0 * SR);
  const bpL = new SVF();
  const bpR = new SVF();
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    let env = 0;
    for (let b = 0; b < 3; b++) {
      const tb = t - b * 0.0105;
      if (tb >= 0) env += Math.exp(-tb / 0.0035) * 0.75;
    }
    const tt = t - 0.03;
    if (tt >= 0) env += Math.exp(-tt / 0.075);
    bpL.tick(rnd(), 1450, 1.6);
    bpR.tick(rnd(), 1650, 1.6);
    const l = (bpL.bp + bpL.hp * 0.25) * env * vel * 1.4;
    const r = (bpR.bp + bpR.hp * 0.25) * env * vel * 1.4;
    drumBus.l[i0 + i] += l;
    drumBus.r[i0 + i] += r;
    revSend.l[i0 + i] += l * 0.35;
    revSend.r[i0 + i] += r * 0.35;
  }
}

function snare(t0: number, vel: number, pitch: number) {
  const len = Math.floor(SR * 0.3);
  const i0 = Math.floor(t0 * SR);
  const bp = new SVF();
  let ph = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    ph += (TAU * 188 * pitch * (1 + 0.6 * Math.exp(-t / 0.012))) / SR;
    const tone = Math.sin(ph) * Math.exp(-t / 0.055) * 0.7;
    bp.tick(rnd(), 2400 * Math.sqrt(pitch), 0.9);
    const noise = (bp.bp + bp.hp * 0.5) * Math.exp(-t / 0.085) * 0.8;
    const v = (tone + noise) * Math.min(1, t / 0.0006) * vel * 0.8;
    drumBus.l[i0 + i] += v;
    drumBus.r[i0 + i] += v;
    revSend.l[i0 + i] += v * 0.3;
    revSend.r[i0 + i] += v * 0.3;
  }
}

function tom(t0: number, midi: number, vel: number, p = 0) {
  const len = Math.floor(SR * 0.6);
  const i0 = Math.floor(t0 * SR);
  const [gl, gr] = pan(p);
  const f0 = mtof(midi);
  const hp = new SVF();
  let ph = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    ph += (TAU * f0 * (1 + 0.9 * Math.exp(-t / 0.028))) / SR;
    hp.tick(rnd(), 2500, 0.7);
    const v =
      (Math.tanh(Math.sin(ph) * 2) * Math.exp(-t / 0.17) +
        hp.hp * Math.exp(-t / 0.004) * 0.4) *
      Math.min(1, t / 0.0008) *
      vel;
    drumBus.l[i0 + i] += v * gl * 0.9;
    drumBus.r[i0 + i] += v * gr * 0.9;
    revSend.l[i0 + i] += v * 0.25;
    revSend.r[i0 + i] += v * 0.25;
  }
}

// ================================================================ pitched
function bassNote(
  t0: number,
  dur: number,
  midi: number,
  vel: number,
  bright: number,
) {
  const len = Math.floor(SR * (dur + 0.06));
  const i0 = Math.floor(t0 * SR);
  const f = mtof(midi);
  const dt = f / SR;
  const lp = new SVF();
  let ph = rnd01();
  let subPh = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    ph = (ph + dt) % 1;
    subPh += (TAU * f * 0.5) / SR;
    // subtract: a saw and a square of the same phase cancel each other's odd harmonics when added
    const osc = saw(ph, dt) * 0.7 - square(ph, dt) * 0.35;
    const fc = 110 + bright * (350 + 2400 * Math.exp(-t / 0.08));
    lp.tick(osc, fc, 1.9);
    const gate =
      Math.min(1, t / 0.003) *
      (t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1);
    const body = Math.tanh(lp.lp * 1.9) * 0.85;
    const sub = Math.sin(subPh) * 0.5;
    const v = (body + sub) * gate * vel * 0.8;
    bassBus.l[i0 + i] += v;
    bassBus.r[i0 + i] += v;
  }
}

function stab(s: S.Stab) {
  const t0 = sec(s.beat);
  const dur = s.dur * S.BEAT_SEC;
  const len = Math.floor(SR * (dur + 0.25));
  const i0 = Math.floor(t0 * SR);
  const voices: { dt: number; ph: number; gl: number; gr: number }[] = [];
  for (const midi of s.notes) {
    [-0.13, 0, 0.13].forEach((det, j) => {
      const [gl, gr] = pan([-0.75, 0, 0.75][j]);
      voices.push({ dt: mtof(midi + det) / SR, ph: rnd01(), gl, gr });
    });
  }
  const lpL = new SVF();
  const lpR = new SVF();
  const norm = 1 / Math.sqrt(voices.length);
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (const v of voices) {
      v.ph = (v.ph + v.dt) % 1;
      const o = saw(v.ph, v.dt);
      l += o * v.gl;
      r += o * v.gr;
    }
    const fc = 420 + s.bright * (700 + 7500 * Math.exp(-t / (s.decay * 0.7)));
    lpL.tick(l * norm, fc, 1.3);
    lpR.tick(r * norm, fc, 1.3);
    const amp =
      Math.min(1, t / 0.002) *
      (0.25 + 0.75 * Math.exp(-t / s.decay)) *
      (t > dur ? Math.exp(-(t - dur) / 0.05) : 1) *
      s.vel *
      0.5;
    const ol = lpL.lp * amp;
    const or = lpR.lp * amp;
    musicBus.l[i0 + i] += ol;
    musicBus.r[i0 + i] += or;
    revSend.l[i0 + i] += ol * 0.4;
    revSend.r[i0 + i] += or * 0.4;
  }
}

function pluck(
  t0: number,
  midi: number,
  vel: number,
  bright: number,
  p: number,
) {
  const len = Math.floor(SR * 0.45);
  const i0 = Math.floor(t0 * SR);
  const f = mtof(midi);
  const dt = f / SR;
  const [gl, gr] = pan(p);
  const lp = new SVF();
  let ph = rnd01();
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    ph = (ph + dt) % 1;
    const osc = square(ph, dt) * 0.55 + saw(ph, dt) * 0.5;
    lp.tick(osc, 260 + bright * (500 + 6500 * Math.exp(-t / 0.05)), 2.6);
    const v =
      lp.lp * Math.min(1, t / 0.0015) * Math.exp(-t / 0.11) * vel * 0.34;
    musicBus.l[i0 + i] += v * gl;
    musicBus.r[i0 + i] += v * gr;
    dlySend.l[i0 + i] += v * gl * 0.45 * bright;
    dlySend.r[i0 + i] += v * gr * 0.45 * bright;
    revSend.l[i0 + i] += v * 0.2;
    revSend.r[i0 + i] += v * 0.2;
  }
}

function lead(n: S.LeadNote) {
  const t0 = sec(n.beat);
  const dur = n.dur * S.BEAT_SEC;
  const len = Math.floor(SR * (dur + 0.3));
  const i0 = Math.floor(t0 * SR);
  const dets = [-0.17, -0.08, 0, 0.08, 0.17];
  const voices = dets.map((d, j) => {
    const [gl, gr] = pan((j - 2) / 2.5);
    return { dt: mtof(n.midi + d) / SR, ph: rnd01(), gl, gr };
  });
  const dtUp = mtof(n.midi + 12) / SR;
  let phUp = 0;
  const lpL = new SVF();
  const lpR = new SVF();
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (const v of voices) {
      v.ph = (v.ph + v.dt) % 1;
      const o = saw(v.ph, v.dt);
      l += o * v.gl;
      r += o * v.gr;
    }
    phUp = (phUp + dtUp) % 1;
    const up = square(phUp, dtUp) * 0.3;
    const fc = 1300 + 6500 * Math.exp(-t / 0.16);
    lpL.tick(l * 0.45 + up, fc, 1.5);
    lpR.tick(r * 0.45 + up, fc, 1.5);
    const amp =
      Math.min(1, t / 0.003) *
      (0.55 + 0.45 * Math.exp(-t / 0.09)) *
      (t > dur ? Math.exp(-(t - dur) / 0.06) : 1) *
      n.vel *
      0.33;
    const ol = lpL.lp * amp;
    const or = lpR.lp * amp;
    musicBus.l[i0 + i] += ol;
    musicBus.r[i0 + i] += or;
    dlySend.l[i0 + i] += ol * 0.3;
    dlySend.r[i0 + i] += or * 0.3;
    revSend.l[i0 + i] += ol * 0.3;
    revSend.r[i0 + i] += or * 0.3;
  }
}

/** Two-operator FM bell. */
function bell(t0: number, midi: number, vel: number, p = 0) {
  const len = Math.floor(SR * 1.6);
  const i0 = Math.floor(t0 * SR);
  const f = mtof(midi);
  const [gl, gr] = pan(p);
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    const mod =
      Math.sin(TAU * f * 3.51 * t) * (2.2 * Math.exp(-t / 0.09) + 0.25);
    const car = Math.sin(TAU * f * t + mod) + 0.35 * Math.sin(TAU * f * 2 * t);
    const v = car * Math.min(1, t / 0.001) * Math.exp(-t / 0.3) * vel * 0.32;
    // not side-chained: the bells must cut through
    fxBus.l[i0 + i] += v * gl;
    fxBus.r[i0 + i] += v * gr;
    dlySend.l[i0 + i] += v * 0.35;
    dlySend.r[i0 + i] += v * 0.35;
    revSend.l[i0 + i] += v * 0.5;
    revSend.r[i0 + i] += v * 0.5;
  }
}

// ================================================================ fx
function noiseRiser(
  tA: number,
  tB: number,
  vol: number,
  fA: number,
  fB: number,
  curve = 2,
) {
  const i0 = Math.floor(tA * SR);
  const len = Math.floor((tB - tA) * SR);
  const bpL = new SVF();
  const bpR = new SVF();
  for (let i = 0; i < len && i0 + i < N; i++) {
    const x = i / len;
    const fc = fA * Math.pow(fB / fA, x);
    bpL.tick(rnd(), fc, 2.2);
    bpR.tick(rnd(), fc * 1.07, 2.2);
    const amp =
      Math.pow(x, curve) * vol * Math.min(1, (len - i) / (SR * 0.004));
    fxBus.l[i0 + i] += (bpL.bp + bpL.hp * 0.3) * amp;
    fxBus.r[i0 + i] += (bpR.bp + bpR.hp * 0.3) * amp;
    revSend.l[i0 + i] += bpL.bp * amp * 0.25;
    revSend.r[i0 + i] += bpR.bp * amp * 0.25;
  }
}

function toneRiser(
  tA: number,
  tB: number,
  vol: number,
  fA: number,
  fB: number,
  tremHz: number,
) {
  const i0 = Math.floor(tA * SR);
  const len = Math.floor((tB - tA) * SR);
  const lp = new SVF();
  let ph = 0;
  let ph2 = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const x = i / len;
    const t = i / SR;
    const f = fA * Math.pow(fB / fA, x * x);
    ph = (ph + f / SR) % 1;
    ph2 = (ph2 + (f * 1.007) / SR) % 1;
    const osc = saw(ph, f / SR) + saw(ph2, f / SR);
    lp.tick(osc, 500 + 9000 * x * x, 1.8);
    const trem =
      tremHz > 0 ? 1 - x * 0.6 * (0.5 + 0.5 * Math.cos(TAU * tremHz * t)) : 1;
    const amp =
      Math.pow(x, 1.6) * vol * trem * Math.min(1, (len - i) / (SR * 0.004));
    const v = lp.lp * amp * 0.5;
    fxBus.l[i0 + i] += v;
    fxBus.r[i0 + i] += v;
    revSend.l[i0 + i] += v * 0.3;
    revSend.r[i0 + i] += v * 0.3;
  }
}

/** The dot falling in at the very start. */
function whistle(tA: number, dur: number, fA: number, fB: number, vol: number) {
  const i0 = Math.floor(tA * SR);
  const len = Math.floor(dur * SR);
  let ph = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const x = i / len;
    ph += (TAU * fA * Math.pow(fB / fA, x)) / SR;
    const amp = Math.sin(Math.PI * Math.pow(x, 0.6)) * vol;
    const v = (Math.sin(ph) + 0.3 * Math.sin(ph * 2)) * amp;
    fxBus.l[i0 + i] += v * (1 - x * 0.3);
    fxBus.r[i0 + i] += v * (0.7 + x * 0.3);
    revSend.l[i0 + i] += v * 0.5;
    revSend.r[i0 + i] += v * 0.5;
  }
}

// ================================================================ play the score
for (const kk of S.KICKS) kick(sec(kk.beat), kk.vel, kk.heavy);
for (const c of S.CLAPS) clap(sec(c.beat), c.vel);
for (const s of S.SNARES) snare(sec(s.beat), s.vel, s.pitch);
S.HATS.forEach((h) =>
  cymbal(
    sec(h.beat),
    h.vel * (h.open ? 0.5 : 0.55),
    h.open ? 0.085 : 0.022,
    h.open ? 6500 : 8200,
    drumBus,
    h.open ? 0.1 : 0,
  ),
);
S.TOMS.forEach((t, i) => {
  tom(sec(t.beat), t.midi, t.vel, -0.45 + i * 0.3);
  snare(sec(t.beat), 0.35 + i * 0.08, 1 + i * 0.06);
});
for (const b of S.BASS)
  bassNote(sec(b.beat), b.dur * S.BEAT_SEC, b.midi, b.vel, b.bright);
for (const s of S.STABS) stab(s);
S.ARP.forEach((a, i) =>
  pluck(sec(a.beat), a.midi, a.vel, a.bright, i % 2 === 0 ? -0.35 : 0.35),
);
for (const n of S.LEAD) lead(n);
S.BELLS.forEach((b, i) =>
  bell(sec(b.beat), b.midi, b.vel, i % 2 === 0 ? -0.2 : 0.2),
);
for (const im of S.IMPACTS) {
  boom(sec(im.beat), im.size);
  cymbal(sec(im.beat), 0.85 * im.size, 0.42, 4200, fxBus, 0.5);
}

// Pickup: the dot whistles down, thuds, charges up.
whistle(0, 0.21, 2900, 520, 0.2);
tom(sec(0.5), 36, 0.85);
toneRiser(sec(0.5), sec(1), 0.5, 90, 1900, 0);
noiseRiser(sec(0.4), sec(1), 0.5, 600, 9000, 2.5);
// Build-up into the drop.
noiseRiser(sec(13), sec(16.5), 0.62, 350, 10000, 2.2);
toneRiser(sec(13), sec(16.5), 0.4, 174.6, 1396.9, 1 / (S.BEAT_SEC / 4));
// Swell into the final hit.
noiseRiser(sec(27), sec(29), 0.4, 500, 9000, 3);

// ================================================================ mix
// Side-chain: everything musical ducks under the kick, which gives the pump.
const duck = new Float32Array(N).fill(1);
for (const kk of S.KICKS) {
  const i0 = Math.floor(sec(kk.beat) * SR);
  const len = Math.floor(SR * 0.4);
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR;
    const g = 1 - kk.vel * Math.min(1, t / 0.003) * Math.exp(-t / 0.1);
    duck[i0 + i] = Math.min(duck[i0 + i], g);
  }
}

function freeverb(input: Bus, room: number, damp: number): Bus {
  const out = makeBus();
  const scale = SR / 44100;
  const combTunings = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apTunings = [556, 441, 341, 225];
  for (let ch = 0; ch < 2; ch++) {
    const spread = ch === 0 ? 0 : 23;
    const combs = combTunings.map((t) => ({
      buf: new Float32Array(Math.round((t + spread) * scale)),
      idx: 0,
      store: 0,
    }));
    const aps = apTunings.map((t) => ({
      buf: new Float32Array(Math.round((t + spread) * scale)),
      idx: 0,
    }));
    const dst = ch === 0 ? out.l : out.r;
    for (let i = 0; i < N; i++) {
      const x = (input.l[i] + input.r[i]) * 0.015;
      let acc = 0;
      for (const c of combs) {
        const y = c.buf[c.idx];
        c.store = y * (1 - damp) + c.store * damp;
        c.buf[c.idx] = x + c.store * room;
        c.idx = (c.idx + 1) % c.buf.length;
        acc += y;
      }
      for (const a of aps) {
        const bufOut = a.buf[a.idx];
        const y = -acc + bufOut;
        a.buf[a.idx] = acc + bufOut * 0.5;
        a.idx = (a.idx + 1) % a.buf.length;
        acc = y;
      }
      dst[i] = acc;
    }
  }
  return out;
}

function pingPong(input: Bus, time: number, feedback: number): Bus {
  const out = makeBus();
  const d = Math.round(time * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  let idx = 0;
  let lpl = 0;
  let lpr = 0;
  for (let i = 0; i < N; i++) {
    const dl = bl[idx];
    const dr = br[idx];
    lpl += (dr - lpl) * 0.45;
    lpr += (dl - lpr) * 0.45;
    bl[idx] = (input.l[i] + input.r[i]) * 0.5 + lpl * feedback;
    br[idx] = lpr * feedback;
    idx = (idx + 1) % d;
    out.l[i] = dl;
    out.r[i] = dr;
  }
  return out;
}

const stats = (name: string, b: Bus) => {
  let pk = 0;
  let sq = 0;
  for (let i = 0; i < N; i++) {
    pk = Math.max(pk, Math.abs(b.l[i]), Math.abs(b.r[i]));
    sq += b.l[i] * b.l[i] + b.r[i] * b.r[i];
  }
  console.log(
    `  ${name.padEnd(8)} peak ${pk.toFixed(3)}  rms ${Math.sqrt(sq / (2 * N)).toFixed(4)}`,
  );
};
const delay = pingPong(dlySend, S.BEAT_SEC * 0.75, 0.42);
for (let i = 0; i < N; i++) {
  revSend.l[i] += delay.l[i] * 0.25;
  revSend.r[i] += delay.r[i] * 0.25;
}
const reverb = freeverb(revSend, 0.86, 0.32);

const windowRms = (b: Bus, beatA: number, beatB: number) => {
  let sq = 0;
  const a = Math.floor(sec(beatA) * SR);
  const z = Math.min(N, Math.floor(sec(beatB) * SR));
  for (let i = a; i < z; i++) sq += b.l[i] * b.l[i] + b.r[i] * b.r[i];
  return 20 * Math.log10(Math.sqrt(sq / (2 * (z - a))) + 1e-9);
};
if (process.env.STATS) {
  const mixGains: [string, Bus, number][] = [
    ["kick", kickBus, 0.44],
    ["drums", drumBus, 0.8],
    ["bass", bassBus, 0.33],
    ["music", musicBus, 1.05],
    ["fx", fxBus, 0.42],
    ["delay", delay, 0.65],
    ["reverb", reverb, 1.0],
  ];
  for (const [a, z, label] of [
    [1, 5, "stomps"],
    [5, 13, "build"],
    [17, 28, "drop"],
    [29, 33, "final"],
  ] as const) {
    console.log(
      `  ${label.padEnd(7)}` +
        mixGains
          .map(
            ([n, b, g]) =>
              ` ${n} ${(windowRms(b, a, z) + 20 * Math.log10(g)).toFixed(1)}`,
          )
          .join(""),
    );
  }
  stats("kick", kickBus);
  stats("drums", drumBus);
  stats("bass", bassBus);
  stats("music", musicBus);
  stats("fx", fxBus);
  stats("delay", delay);
  stats("reverb", reverb);
}
const outL = new Float32Array(N);
const outR = new Float32Array(N);
const silA = sec(S.SILENCE.from);
const silB = sec(S.SILENCE.to);
const SHELF_K = 1 - Math.exp((-2 * Math.PI * 3800) / SR);
let shelfL = 0;
let shelfR = 0;
const dcL = new SVF();
const dcR = new SVF();
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const d = duck[i];
  const dSoft = 0.45 + 0.55 * d;
  let l =
    kickBus.l[i] * 0.44 +
    drumBus.l[i] * 0.8 +
    bassBus.l[i] * 0.33 * d +
    musicBus.l[i] * 1.05 * dSoft +
    delay.l[i] * 0.65 * dSoft +
    fxBus.l[i] * 0.42 +
    reverb.l[i] * 1.0 * dSoft;
  let r =
    kickBus.r[i] * 0.44 +
    drumBus.r[i] * 0.8 +
    bassBus.r[i] * 0.33 * d +
    musicBus.r[i] * 1.05 * dSoft +
    delay.r[i] * 0.65 * dSoft +
    fxBus.r[i] * 0.42 +
    reverb.r[i] * 1.0 * dSoft;

  // Arrangement dynamics: the build sits under the stomps and under the drop,
  // so the drop has somewhere to go.
  const beat = t / S.BEAT_SEC;
  let section = 1;
  if (beat >= 5 && beat < 13) section = 0.7;
  else if (beat >= 13 && beat < 17)
    section = 0.7 + 0.25 * Math.min(1, (beat - 13) / 3.5);
  else if (beat < 5 && beat > 4.97) section = 0.7 + 0.3 * ((5 - beat) / 0.03);
  l *= section;
  r *= section;

  // The hole before the drop: everything, tails included, gets pulled out.
  if (t > silA - 0.012 && t < silB) {
    const g = t < silA ? (silA - t) / 0.012 : 0;
    const floor = 0.015;
    l *= floor + (1 - floor) * g;
    r *= floor + (1 - floor) * g;
  }
  // Fade the tail so the file ends on true silence.
  const tail = S.DURATION_SEC - t;
  if (tail < 0.35) {
    const g = Math.max(0, tail / 0.35);
    l *= g * g;
    r *= g * g;
  }
  dcL.tick(l, 24, 0.7);
  dcR.tick(r, 24, 0.7);
  // gentle high shelf (+3 dB above ~4 kHz) so the track keeps its air on small speakers
  shelfL += (dcL.hp - shelfL) * SHELF_K;
  shelfR += (dcR.hp - shelfR) * SHELF_K;
  outL[i] = dcL.hp + 0.42 * (dcL.hp - shelfL);
  outR[i] = dcR.hp + 0.42 * (dcR.hp - shelfR);
}

// Master: soft clip for glue and loudness, then normalize to -1 dBFS.
const DRIVE = 1.1;
let peak = 0;
for (let i = 0; i < N; i++) {
  outL[i] = Math.tanh(outL[i] * DRIVE);
  outR[i] = Math.tanh(outR[i] * DRIVE);
  peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
}
// -2.9 dBFS sample peak. The soft clipper flattens the loudest hits, and the AAC
// encoder overshoots on flat tops: at -1.5 dBFS the encoded file measured +0.4 dBTP.
const gain = 0.72 / peak;

const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(36 + N * 4, 4);
pcm.write("WAVE", 8);
pcm.write("fmt ", 12);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  // TPDF dither
  const dl = (rnd01() - rnd01()) / 32768;
  const dr = (rnd01() - rnd01()) / 32768;
  pcm.writeInt16LE(
    Math.max(
      -32768,
      Math.min(32767, Math.round((outL[i] * gain + dl) * 32767)),
    ),
    44 + i * 4,
  );
  pcm.writeInt16LE(
    Math.max(
      -32768,
      Math.min(32767, Math.round((outR[i] * gain + dr) * 32767)),
    ),
    46 + i * 4,
  );
}

const target = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "public",
  "cody-track.wav",
);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, pcm);
console.log(
  `wrote ${target}  ${(N / SR).toFixed(3)}s  ${SR}Hz stereo  pre-normalize peak ${peak.toFixed(3)}`,
);
