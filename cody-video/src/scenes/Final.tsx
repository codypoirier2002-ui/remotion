import React from "react";
import { Backdrop, Dust, Ring, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, LETTER_X, type LetterState, Plated } from "../Glyph";
import {
  clamp,
  decay,
  easeOutCubic,
  ring,
  since,
  spring,
  useBeat,
} from "../motion";
import { DOT_LANDINGS } from "../score";
import { BONE, THEMES, VERMILION } from "../theme";
import { WORD_R } from "./Build";

/**
 * Bar 8. The final hit. The print plates fly out one last time and register
 * perfectly: clean letters, nothing behind them. Then the dot from the very
 * first frame drops in as the full stop, bounces twice, and everything is still.
 */
export const Final: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.ink;
  const r = WORD_R;
  const cap = CAP_HALF * r;
  const t0 = since(beat, 29);
  const t30 = since(beat, 30);

  const pop = 1 + 0.1 * ring(t0, 3.6, 0.42);
  const q = 0.1 * ring(t0, 5, 0.4) + 0.022 * ring(t30, 6, 0.4);
  const plate = (9 + 50 * decay(t0, 0.07)) * (1 - spring(t0 - 0.08, 2, 0.75));
  const letters: LetterState[] = [0, 1, 2, 3].map(() => ({
    sx: 1 + q * 0.7,
    sy: 1 - q,
    pivot: cap,
  }));

  // The dot: thrown in from the right, three bounces along the baseline,
  // each landing on its own bell note, and it comes to rest as the full stop.
  const DOT_R = 0.42 * r;
  const restX = (LETTER_X[3] + BOLD / 2 + 0.36) * r + DOT_R;
  const LAND_X = [restX + 230, restX + 72, restX];
  const HEIGHTS = [150, 46];
  const ENTER = 29.42;
  let dotX = restX;
  let lift = 0;
  if (beat < DOT_LANDINGS[0]) {
    const u = clamp((beat - ENTER) / (DOT_LANDINGS[0] - ENTER));
    dotX = LAND_X[0] + 330 * (1 - u);
    lift = 560 * (1 - u * u);
  } else {
    for (let j = 0; j < HEIGHTS.length; j++) {
      const u =
        (beat - DOT_LANDINGS[j]) / (DOT_LANDINGS[j + 1] - DOT_LANDINGS[j]);
      if (u >= 0 && u < 1) {
        dotX = LAND_X[j] + (LAND_X[j + 1] - LAND_X[j]) * u;
        lift = HEIGHTS[j] * 4 * u * (1 - u);
      }
    }
  }
  const SQUASH = [0.48, 0.3, 0.16];
  let dq = 0;
  DOT_LANDINGS.forEach((b, j) => {
    dq += SQUASH[j] * ring(since(beat, b), 7, 0.42);
  });
  const falling = beat < DOT_LANDINGS[0];
  const dsy = falling ? 1.22 : 1 - dq;
  const dsx = falling ? 0.9 : 1 + dq * 0.8;
  const dotY = cap - DOT_R * dsy - lift;
  const dotVisible = beat > ENTER;

  const wave = clamp(t0 / 0.6);
  const wave2 = clamp((t0 - 0.06) / 0.6);

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[
          { beat: 29, strength: 1.4 },
          { beat: 30, strength: 0.45 },
          { beat: 30.5, strength: 0.25 },
        ]}
        suck={0}
        gridOpacity={1}
      />
      <Ring
        r={wave < 1 ? 220 + 1100 * easeOutCubic(wave) : 0}
        width={30 * (1 - wave)}
        color={BONE}
        opacity={1}
        cx={0}
        cy={0}
      />
      <Ring
        r={wave2 > 0 && wave2 < 1 ? 160 + 1000 * easeOutCubic(wave2) : 0}
        width={22 * (1 - wave2)}
        color={VERMILION}
        opacity={1}
        cx={0}
        cy={0}
      />
      <g transform={`scale(${pop})`}>
        <Plated
          r={r}
          weight={BOLD + 0.16 * ring(t0, 3.2, 0.45)}
          theme={theme}
          letters={letters}
          plate={[plate, plate]}
          plates={2}
        />
      </g>
      {DOT_LANDINGS.map((b, j) => (
        <Dust
          key={b}
          p={since(beat, b) / 0.3}
          size={[190, 120, 70][j]}
          color={BONE}
          cx={LAND_X[j]}
          cy={cap + 4}
        />
      ))}
      {dotVisible ? (
        <ellipse
          cx={dotX}
          cy={dotY}
          rx={DOT_R * dsx}
          ry={DOT_R * dsy}
          fill={VERMILION}
        />
      ) : null}
    </Stage>
  );
};
