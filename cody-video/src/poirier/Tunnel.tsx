import React from "react";
import { useCurrentFrame } from "remotion";
import { Backdrop, Ring, Stage } from "../Backdrop";
import { BOLD, type LetterState, PlatedLetters } from "../Glyph";
import {
  clamp,
  decay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  hash,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
} from "../motion";
import { ROLL } from "../score-poirier";
import { BONE, THEMES, VERMILION } from "../theme";
import { P_CAP, P_R, SPEC } from "./common";

/**
 * Bar 4. Second break. The kick shakes the letters out of line: up and down,
 * tilted, thinned out. Every chord flips them the other way. Then the build-up
 * pulls them back into line and the camera dives through the O. Inside the O
 * there is only black, and the dot. Half a beat of nothing. Then the drop.
 */
export const Tunnel: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const frame = useCurrentFrame();
  const theme = THEMES.ink;
  const r = P_R;
  const t13 = since(beat, 13);
  const silent = beat >= 16.5;

  const scatter = spring(t13, 3.2, 0.45);
  // each chord swings the pattern to the other side
  const flip = Math.cos(
    Math.PI * sumHits(beat, [13.75, 14.5], (t) => spring(t, 4.2, 0.5)),
  );
  const gather = easeInOutCubic((beat - 14.92) / 0.45);
  const out = scatter * (1 - gather);
  // the dive
  const u = clamp((beat - 15.3) / 1.2);
  const zoom = Math.pow(22, Math.pow(u, 2.2));

  const letters: LetterState[] = SPEC.chars.map((_, i) => {
    const dir = i % 2 ? 1 : -1;
    return {
      x: SPEC.x[i] * r * 0.17 * out,
      y: dir * 118 * out * flip,
      rot: dir * 13 * out * flip,
      weight:
        BOLD - 0.3 * out + 0.1 * sumHits(beat, [14], (t) => decay(t, 0.1)),
      pivot: P_CAP,
    };
  });
  const plate =
    (9 + 16 * out + 40 * decay(t13, 0.09) + 24 * decay(since(beat, 14), 0.09)) *
    (1 - gather);
  // slide the word so the O sits dead centre before the camera goes in
  const shift = -SPEC.x[1] * r * gather;

  const dot = silent
    ? 1 - 0.32 * easeInCubic((beat - 16.5) / 0.5)
    : easeOutCubic((u - 0.45) / 0.4);
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
        suck={easeInCubic(u)}
        gridOpacity={1 - clamp((beat - 15.9) / 0.6)}
      />
      {silent ? null : (
        <g transform={`scale(${zoom}) translate(${shift} 0)`}>
          <PlatedLetters
            spec={SPEC}
            r={r}
            weight={BOLD}
            theme={theme}
            letters={letters}
            plate={[plate, plate]}
            plates={2}
          />
        </g>
      )}
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
      <circle
        cx={(hash(frame) - 0.5) * jitter}
        cy={(hash(frame + 31) - 0.5) * jitter}
        r={24 * Math.max(0, dot) * (1 + 0.06 * ring(since(beat, 16.5), 5, 0.5))}
        fill={VERMILION}
      />
    </Stage>
  );
};
