import React from "react";
import { Backdrop, Iris, Ring, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, type LetterState, Plated, WORD_WIDTH } from "../Glyph";
import {
  clamp,
  decay,
  easeOutCubic,
  hash,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
  wobble,
} from "../motion";
import { BONE, COBALT, INK, THEMES } from "../theme";

export const BIG_R = 1560 / WORD_WIDTH;
const KICKS = [18, 19, 20];
/** The melody after the downbeat: each note lights the next letter. */
const NOTES = [17.75, 18.5, 19, 19.75, 20.5];
const CONFETTI = [INK, BONE, COBALT];

/**
 * Bar 5. The one big moment. The dot detonates: white flash, the frame turns
 * vermilion, the name bursts out to fill it, shockwaves and debris fly.
 */
export const Drop: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.vermilion;
  const r = BIG_R;
  const cap = CAP_HALF * r;
  const t0 = since(beat, 17);

  const burst = 0.35 + 0.65 * spring(t0, 4.2, 0.42);
  const pump = 1 + 0.05 * sumHits(beat, KICKS, (t) => ring(t, 4.5, 0.45));
  const zoom = 1 + 0.03 * clamp((beat - 17) / 4);
  const tilt = -12 * (1 - spring(t0, 3.2, 0.5));
  const weight =
    BOLD +
    0.16 * ring(t0, 3, 0.45) +
    0.08 * sumHits(beat, KICKS, (t) => decay(t, 0.1));

  // the plates swing a quarter turn around the word on every chord
  const angle =
    ((45 + 90 * sumHits(beat, NOTES, (t) => spring(t, 3.6, 0.5))) * Math.PI) /
    180;
  const mag =
    15 +
    125 * decay(t0, 0.09) +
    24 * sumHits(beat, KICKS, (t) => decay(t, 0.08));
  const squash = 0.06 * sumHits(beat, KICKS, (t) => ring(t, 5, 0.4));

  const letters: LetterState[] = [0, 1, 2, 3].map((i) => {
    let lift = 0;
    let lit = false;
    NOTES.forEach((n, j) => {
      if (j % 4 !== i) return;
      const t = since(beat, n);
      lift += wobble(t, 3.6, 0.4);
      if (t >= 0 && t < 0.15) lit = true;
    });
    const hop = sumHits(beat, [18, 20], (t) => wobble(t, 3.4, 0.4));
    return {
      y: -26 * lift + (i % 2 ? 30 : -30) * hop,
      rot: (i - 1.5) * 8 * (1 - spring(t0, 3, 0.45)),
      sx: 1 + squash * 0.7,
      sy: 1 - squash,
      pivot: cap,
      color: lit ? INK : undefined,
    };
  });

  const boneR = 300 + 42000 * Math.max(0, t0);
  const vermR = Math.max(0, 34000 * (t0 - 0.012));

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[17, 18, 19, 20].map((b) => ({
          beat: b,
          strength: b === 17 ? 1.6 : 0.8,
        }))}
        suck={0}
        gridOpacity={1}
      />
      {/* debris: the same primitives the letters are made of */}
      {Array.from({ length: 40 }, (_, i) => {
        const a = hash(i * 3 + 1) * Math.PI * 2;
        const dist = 520 + 1250 * hash(i * 3 + 2);
        const e = 1 - Math.exp(-Math.max(0, t0) / 0.3);
        const x = Math.cos(a) * dist * e;
        const y = Math.sin(a) * dist * e * 0.75 + 760 * t0 * t0 - 120 * t0;
        if (t0 <= 0 || y > 680) return null;
        const size = 14 + 58 * hash(i * 3 + 3) ** 2;
        const rot = (hash(i + 400) - 0.5) * 1300 * Math.pow(t0, 0.8);
        const color = CONFETTI[i % 3];
        const kind = i % 4;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            {kind === 0 ? (
              <circle
                r={size}
                fill="none"
                stroke={color}
                strokeWidth={size * 0.55}
              />
            ) : kind === 1 ? (
              <rect
                x={-size * 1.3}
                y={-size * 0.35}
                width={size * 2.6}
                height={size * 0.7}
                fill={color}
              />
            ) : kind === 2 ? (
              <circle r={size * 0.55} fill={color} />
            ) : (
              <path
                d={`M${-size} 0A${size} ${size} 0 0 1 ${size} 0`}
                fill="none"
                stroke={color}
                strokeWidth={size * 0.55}
              />
            )}
          </g>
        );
      })}
      {/* shockwaves */}
      {[INK, BONE, COBALT].map((color, j) => {
        const p = clamp((t0 - 0.04 - 0.05 * j) / 0.62);
        return (
          <Ring
            key={j}
            r={p > 0 && p < 1 ? 150 + (1250 + 200 * j) * easeOutCubic(p) : 0}
            width={(74 - 18 * j) * (1 - p)}
            color={color}
            opacity={1}
            cx={0}
            cy={0}
          />
        );
      })}
      {KICKS.map((k) => {
        const p = since(beat, k) / 0.5;
        return (
          <Ring
            key={k}
            r={p > 0 && p < 1 ? 430 + 800 * easeOutCubic(p) : 0}
            width={18 * (1 - p)}
            color={BONE}
            opacity={1}
            cx={0}
            cy={0}
          />
        );
      })}
      {/* the flash: a bone disc outruns the vermilion, ink is pushed off the frame */}
      {vermR < 1200 && boneR > vermR ? (
        <Ring
          r={(vermR + Math.min(boneR, 1300)) / 2}
          width={Math.min(boneR, 1300) - vermR}
          color={BONE}
          opacity={1}
          cx={0}
          cy={0}
        />
      ) : null}
      <Iris hole={boneR} color={INK} />
      <g transform={`rotate(${tilt}) scale(${burst * pump * zoom})`}>
        <Plated
          r={r}
          weight={weight}
          theme={theme}
          letters={letters}
          plate={[mag * Math.cos(angle), mag * Math.sin(angle)]}
          plates={2}
        />
      </g>
    </Stage>
  );
};
