import React from "react";
import { useCurrentFrame } from "remotion";
import { Backdrop, Ring, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, LETTER_X, type LetterState, Plated } from "../Glyph";
import { clamp, hash, ring, since, useBeat } from "../motion";
import { WORD_R } from "../scenes/Build";
import { BONE, THEMES, VERMILION } from "../theme";

/** Where CODY's full stop came to rest. The joined cut picks up from there. */
export const CODY_DOT_R = 0.42 * WORD_R;
export const CODY_DOT_X = (LETTER_X[3] + BOLD / 2 + 0.36) * WORD_R + CODY_DOT_R;
export const CODY_DOT_Y = CAP_HALF * WORD_R - CODY_DOT_R;

/**
 * The join. It opens on the exact frame CODY ended on. The full stop swallows
 * the four letters, Y first, then charges up exactly like the dot that opened
 * the film. POIRIER comes out of the same dot CODY went into.
 */
export const PickupJoined: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const frame = useCurrentFrame();
  const theme = THEMES.ink;
  const r = WORD_R;
  const TRAVEL = 0.24;

  let gulp = 0;
  const letters: LetterState[] = [0, 1, 2, 3].map((i) => {
    const start = (3 - i) * 0.09;
    const u = clamp((beat - start) / TRAVEL);
    const e = u * u * u;
    gulp += ring(since(beat, start + TRAVEL), 6, 0.4);
    return {
      x: (CODY_DOT_X - LETTER_X[i] * r) * e,
      y: CODY_DOT_Y * e,
      sx: 1 - e,
      sy: 1 - e,
      rot: 80 * e * (i % 2 ? 1 : -1),
      hidden: u >= 1,
    };
  });

  const charge = clamp((beat - 0.58) / 0.42);
  const size = (1 + 0.2 * gulp) * (1 - 0.38 * charge * charge);
  const jx = (hash(frame) - 0.5) * 12 * charge;
  const jy = (hash(frame + 77) - 0.5) * 12 * charge;

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[{ beat: 0.5, strength: 0.7 }]}
        suck={0}
        gridOpacity={1}
      />
      {[0, 1, 2, 3].map((k) => {
        const p = clamp((beat - 0.55 - k * 0.09) / 0.28);
        return (
          <Ring
            key={k}
            r={p > 0 && p < 1 ? 820 * Math.pow(1 - p, 1.5) + 54 : 0}
            width={2 + 7 * p}
            color={BONE}
            opacity={p}
            cx={CODY_DOT_X}
            cy={CODY_DOT_Y}
          />
        );
      })}
      <Plated
        r={r}
        weight={BOLD}
        theme={theme}
        letters={letters}
        plate={[0, 0]}
        plates={0}
      />
      <circle
        cx={CODY_DOT_X + jx}
        cy={CODY_DOT_Y + jy}
        r={CODY_DOT_R * size}
        fill={VERMILION}
      />
    </Stage>
  );
};
