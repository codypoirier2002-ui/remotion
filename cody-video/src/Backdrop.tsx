import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { since } from "./motion";
import { frameToBeat } from "./score";
import type { Theme } from "./theme";

/** One SVG, origin in the middle of the frame. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <svg
    viewBox="-960 -540 1920 1080"
    width={1920}
    height={1080}
    style={{ position: "absolute", overflow: "visible" }}
  >
    {children}
  </svg>
);

export type Ripple = { beat: number; strength: number };

/**
 * Background colour plus a dot grid. Every hit sends a ring through the grid:
 * the dots get pushed outward and swell as the front passes.
 */
export const Backdrop: React.FC<{
  theme: Theme;
  beat: number;
  ripples: Ripple[];
  /** 0..1 pulls the grid toward the centre */
  suck: number;
  gridOpacity: number;
}> = ({ theme, beat, ripples, suck, gridOpacity }) => {
  const dots: React.ReactNode[] = [];
  if (gridOpacity > 0.01) {
    for (let j = 0; j <= 16; j++) {
      for (let i = 0; i <= 30; i++) {
        const x0 = (i - 15) * 64;
        const y0 = (j - 8) * 64;
        const d = Math.hypot(x0, y0) || 1;
        let a = 0;
        for (const rp of ripples) {
          const t = since(beat, rp.beat);
          if (t < 0 || t > 1.3) continue;
          const front = 1750 * t;
          a +=
            Math.exp(-(((d - front) / 150) ** 2)) *
            Math.exp(-t / 0.45) *
            rp.strength;
        }
        const k = 1 + (a * 34) / d - suck * 0.55 * Math.exp(-d / 650);
        dots.push(
          <circle key={j * 31 + i} cx={x0 * k} cy={y0 * k} r={2.6 + a * 6} />,
        );
      }
    }
  }
  return (
    <>
      <rect x={-1300} y={-900} width={2600} height={1800} fill={theme.bg} />
      <g fill={theme.dot} opacity={gridOpacity}>
        {dots}
      </g>
    </>
  );
};

/** An expanding ring. Used for shockwaves, rings converging on the dot, dust. */
export const Ring: React.FC<{
  r: number;
  width: number;
  color: string;
  opacity: number;
  cx: number;
  cy: number;
}> = ({ r, width, color, opacity, cx, cy }) =>
  r > 0 && width > 0.2 && opacity > 0.01 ? (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
    />
  ) : null;

/** A flat ripple on the floor where something lands. p runs 0..1. */
export const Dust: React.FC<{
  p: number;
  size: number;
  color: string;
  cx: number;
  cy: number;
}> = ({ p, size, color, cx, cy }) => {
  if (p <= 0 || p >= 1) return null;
  const e = 1 - Math.pow(1 - p, 3);
  const rx = size * (0.35 + 0.65 * e);
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={rx * 0.2}
      fill="none"
      stroke={color}
      strokeWidth={Math.max(0.5, size * 0.06 * (1 - p))}
      opacity={1 - p * p}
    />
  );
};

/** Hides everything outside a circle of radius `hole`. Used for iris wipes. */
export const Iris: React.FC<{ hole: number; color: string }> = ({
  hole,
  color,
}) =>
  hole < 1200 ? (
    <circle r={hole + 1500} fill="none" stroke={color} strokeWidth={3000} />
  ) : null;

/**
 * Vignette and paper grain on top of everything, so flat colour gets some tooth.
 * The grain is a fixed texture, like paper stock: it does not flicker, and it
 * costs the encoder almost nothing.
 */
export const Finish: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(960, 540);
    let s = 12345;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const v = s >>> 24;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.34) 100%)",
        }}
      />
      <canvas
        ref={ref}
        width={960}
        height={540}
        style={{
          position: "absolute",
          width: 1920,
          height: 1080,
          mixBlendMode: "overlay",
          opacity: 0.15,
        }}
      />
    </>
  );
};

/** Camera shake on the big hits. */
const SHAKES = [
  { beat: 1, amp: 16 },
  { beat: 2, amp: 10 },
  { beat: 3, amp: 10 },
  { beat: 4, amp: 10 },
  { beat: 13, amp: 12 },
  { beat: 17, amp: 34 },
  { beat: 18, amp: 5 },
  { beat: 19, amp: 5 },
  { beat: 20, amp: 5 },
  { beat: 28, amp: 5 },
  { beat: 28.25, amp: 5 },
  { beat: 28.5, amp: 5 },
  { beat: 28.75, amp: 6 },
  { beat: 29, amp: 20 },
];

export const Shake: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const beat = frameToBeat(frame + 0.5);
  let amp = 0;
  for (const s of SHAKES) {
    const t = since(beat, s.beat);
    if (t >= 0) amp += s.amp * Math.exp(-t / 0.15);
  }
  return (
    <AbsoluteFill
      style={{
        translate: `${amp * Math.sin(frame * 2.9)}px ${amp * Math.cos(frame * 3.7 + 1)}px`,
        rotate: `${amp * 0.018 * Math.sin(frame * 2.3 + 2)}deg`,
        scale: 1 + amp * 0.0007,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
