import React from "react";
import { Backdrop, Iris, Ring, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, type LetterState, PlatedLetters } from "../Glyph";
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
import { DROP_SPELL_BEATS } from "../score-poirier";
import { BONE, INK, THEMES, VERMILION } from "../theme";
import { P_BIG, SPEC } from "./common";

const KICKS = [18, 19, 20];
const DEBRIS = [INK, BONE, VERMILION];

/**
 * Bar 5. The big moment, in the other colour. The dot detonates, the frame
 * turns cobalt, and the seven letters fly out sideways from the centre to fill
 * the width. The melody then spells the name: each note lights its letter.
 */
export const DropP: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.cobalt;
  const r = P_BIG;
  const cap = CAP_HALF * r;
  const t0 = since(beat, 17);

  const pump = 1 + 0.05 * sumHits(beat, KICKS, (t) => ring(t, 4.5, 0.45));
  const zoom = 1 + 0.03 * clamp((beat - 17) / 4);
  const tilt = 9 * (1 - spring(t0, 3.2, 0.5));
  const weight =
    BOLD +
    0.1 * ring(t0, 3, 0.45) +
    0.06 * sumHits(beat, KICKS, (t) => decay(t, 0.1));
  // the plates swing a quarter turn whenever a new syllable starts
  const angle =
    ((45 + 90 * sumHits(beat, [18.5, 19.5, 20.5], (t) => spring(t, 3.6, 0.5))) *
      Math.PI) /
    180;
  const mag =
    15 +
    125 * decay(t0, 0.09) +
    24 * sumHits(beat, KICKS, (t) => decay(t, 0.08));
  const squash = 0.06 * sumHits(beat, KICKS, (t) => ring(t, 5, 0.4));
  const grow = 0.35 + 0.65 * spring(t0, 4.4, 0.42);

  const letters: LetterState[] = SPEC.chars.map((_, i) => {
    // outer letters have further to go and arrive a touch later: the word whips open
    const open = 0.25 + 0.75 * spring(t0 - Math.abs(i - 3) * 0.009, 4.2, 0.5);
    const tn = since(beat, DROP_SPELL_BEATS[i]);
    const lit = i > 0 && tn >= 0 && tn < 0.15;
    const hop = sumHits(beat, [18, 20], (t) => wobble(t, 3.4, 0.4));
    return {
      x: SPEC.x[i] * r * (open - 1),
      y: (i > 0 ? -26 * wobble(tn, 3.6, 0.4) : 0) + (i % 2 ? 26 : -26) * hop,
      rot: (i - 3) * 5 * (1 - spring(t0, 3, 0.45)),
      sx: grow * (1 + squash * 0.7),
      sy: grow * (1 - squash),
      pivot: cap,
      color: lit ? VERMILION : undefined,
    };
  });

  const boneR = 300 + 42000 * Math.max(0, t0);
  const fillR = Math.max(0, 34000 * (t0 - 0.012));

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
      {Array.from({ length: 40 }, (_, i) => {
        const a = hash(i * 5 + 11) * Math.PI * 2;
        const dist = 520 + 1250 * hash(i * 5 + 12);
        const e = 1 - Math.exp(-Math.max(0, t0) / 0.3);
        const x = Math.cos(a) * dist * e;
        const y = Math.sin(a) * dist * e * 0.75 + 760 * t0 * t0 - 120 * t0;
        if (t0 <= 0 || y > 680) return null;
        const size = 14 + 58 * hash(i * 5 + 13) ** 2;
        const rot = (hash(i + 700) - 0.5) * 1300 * Math.pow(t0, 0.8);
        const color = DEBRIS[i % 3];
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
      {DEBRIS.map((color, j) => {
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
      {fillR < 1200 && boneR > fillR ? (
        <Ring
          r={(fillR + Math.min(boneR, 1300)) / 2}
          width={Math.min(boneR, 1300) - fillR}
          color={BONE}
          opacity={1}
          cx={0}
          cy={0}
        />
      ) : null}
      <Iris hole={boneR} color={INK} />
      <g transform={`rotate(${tilt}) scale(${pump * zoom})`}>
        <PlatedLetters
          spec={SPEC}
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
