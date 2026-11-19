import React from "react";
import { useCurrentFrame } from "remotion";
import { Backdrop, Ring, Stage } from "../Backdrop";
import { BOLD, LETTER_X, PARTS, PartShape } from "../Glyph";
import {
  clamp,
  decay,
  easeInCubic,
  easeOutCubic,
  hash,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
} from "../motion";
import { SNARES } from "../score";
import { BONE, COBALT, THEMES, VERMILION } from "../theme";
import { WORD_R } from "./Build";

/** Where each of the nine parts is thrown, and how far it turns. */
const THROW: [number, number, number][] = [
  [-170, -200, -80],
  [-230, 180, 60],
  [-130, -245, -125],
  [-50, 245, 100],
  [30, -235, 90],
  [105, 225, -110],
  [150, -225, 130],
  [290, -70, -60],
  [250, 205, 75],
];
const FRONT = [BONE, VERMILION, COBALT];
const BACK = [VERMILION, COBALT, BONE];
const START_COLOR = [0, 1, 2, 0, 1, 0, 2, 0, 1];
const ROLL = SNARES.filter((s) => s.beat >= 13);

/**
 * Bar 4. Second break. The kick knocks the word into the nine primitives it is
 * made of. They hang, turn on the beat, then the build-up drags everything into
 * a single dot. Half a beat of nothing. Then the drop.
 */
export const Burst: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const frame = useCurrentFrame();
  const theme = THEMES.ink;
  const r = WORD_R;
  const t13 = since(beat, 13);
  const t14 = since(beat, 14);

  const out = spring(t13, 2.6, 0.48);
  const more = spring(t14, 3.2, 0.45);
  const stab = sumHits(beat, [13.75, 14.5], (t) => ring(t, 5, 0.4));
  // the vortex
  const u = clamp((beat - 15) / 1.5);
  const pull = easeInCubic(u);
  const shift = beat >= 14 ? 1 : 0;
  const plateOff = 9 + 40 * decay(t13, 0.09) + 22 * decay(t14, 0.09);
  const silent = beat >= 16.5;

  const placed = PARTS.map((p, i) => {
    const [dx, dy, turn] = THROW[i];
    const bob = 12 * Math.sin(2 * Math.PI * 0.7 * t13 + i * 1.7) * out;
    let x = (LETTER_X[p.letter] + p.cx) * r + dx * out * (1 + 0.16 * more);
    let y = p.cy * r + dy * out * (1 + 0.16 * more) + bob;
    const rho = Math.hypot(x, y) * (1 - pull);
    const th = Math.atan2(y, x) + 2.6 * Math.PI * u * u;
    x = rho * Math.cos(th);
    y = rho * Math.sin(th);
    const rot =
      turn * out +
      90 * more * (i % 2 ? -1 : 1) +
      14 * t13 * (i % 2 ? 1 : -1) +
      620 * u * u;
    const scale = (1 + 0.09 * stab) * (1 - 0.92 * Math.pow(u, 3.2));
    const c = (START_COLOR[i] + shift) % 3;
    return { p, i, x, y, rot, scale, c };
  });

  const dot = silent
    ? 1 - 0.32 * easeInCubic((beat - 16.5) / 0.5)
    : easeOutCubic((u - 0.7) / 0.3);
  const jitter = silent ? 0 : 5 * clamp((u - 0.6) / 0.4);

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[
          { beat: 13, strength: 1.2 },
          { beat: 14, strength: 0.7 },
        ]}
        suck={pull}
        gridOpacity={1 - clamp((beat - 15.9) / 0.6)}
      />
      {/* every snare of the roll sends a ring inward */}
      {silent
        ? null
        : ROLL.map((s) => {
            const p = (beat - s.beat) / 0.6;
            return (
              <Ring
                key={s.beat}
                r={p > 0 && p < 1 ? 1050 * Math.pow(1 - p, 1.4) + 30 : 0}
                width={2 + 4 * p}
                color={BONE}
                opacity={p * s.vel * 0.9}
                cx={0}
                cy={0}
              />
            );
          })}
      {silent
        ? null
        : placed.map(({ p, i, x, y, rot, scale, c }) => (
            <g
              key={`b${i}`}
              transform={`translate(${x + plateOff * scale} ${y + plateOff * scale}) rotate(${rot}) scale(${scale}) translate(${-p.cx * r} ${-p.cy * r})`}
            >
              <PartShape index={i} r={r} weight={BOLD * r} color={BACK[c]} />
            </g>
          ))}
      {silent
        ? null
        : placed.map(({ p, i, x, y, rot, scale, c }) => (
            <g
              key={`f${i}`}
              transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale}) translate(${-p.cx * r} ${-p.cy * r})`}
            >
              <PartShape index={i} r={r} weight={BOLD * r} color={FRONT[c]} />
            </g>
          ))}
      <circle
        cx={(hash(frame) - 0.5) * jitter}
        cy={(hash(frame + 31) - 0.5) * jitter}
        r={24 * Math.max(0, dot)}
        fill={VERMILION}
      />
    </Stage>
  );
};
