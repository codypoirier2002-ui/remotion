import { useCurrentFrame } from "remotion";
import { BEAT_SEC, frameToBeat } from "./score";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The absolute beat for a scene that starts at frame `from`.
 * Half a frame of lead, so a hit lands on the frame nearest to the sound
 * instead of on the first frame after it.
 */
export const useBeat = (from: number) =>
  frameToBeat(useCurrentFrame() + from + 0.5);

/** Seconds since a beat. Negative before it. */
export const since = (beat: number, hit: number) => (beat - hit) * BEAT_SEC;

/**
 * Step response of a damped spring: goes 0 -> 1 and overshoots when z < 1.
 * f = natural frequency in Hz, z = damping ratio. t in seconds.
 */
export const spring = (t: number, f = 3, z = 0.45) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return (
    1 -
    Math.exp(-z * w * t) *
      (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
  );
};

/** Starts at 1 on the hit and rings down to 0. For pops. */
export const ring = (t: number, f = 4, z = 0.35) => {
  if (t < 0) return 0;
  const w = 2 * Math.PI * f;
  return Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t);
};

/** Starts at 0, swings out and rings down to 0. For squash after contact. */
export const wobble = (t: number, f = 4, z = 0.3) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  return Math.exp(-z * w * t) * Math.sin(w * Math.sqrt(1 - z * z) * t);
};

export const decay = (t: number, tau = 0.12) =>
  t < 0 ? 0 : Math.exp(-t / tau);

export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInCubic = (x: number) => Math.pow(clamp(x), 3);
export const easeInOutCubic = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const easeOutExpo = (x: number) =>
  x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x));

/** Deterministic 0..1 from an integer. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Sum fn(seconds since hit) over every hit that has already happened. */
export const sumHits = (
  beat: number,
  list: number[],
  fn: (t: number) => number,
) => {
  let acc = 0;
  for (const h of list) if (beat >= h) acc += fn(since(beat, h));
  return acc;
};
