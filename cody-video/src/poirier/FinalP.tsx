import React from "react";
import { Backdrop, Dust, Ring, Stage } from "../Backdrop";
import {
  BOLD,
  CAP_HALF,
  EXTENT,
  type LetterState,
  Plated,
  PlatedLetters,
} from "../Glyph";
import {
  clamp,
  decay,
  easeOutCubic,
  ring,
  since,
  spring,
  useBeat,
} from "../motion";
import { DOT_LANDINGS } from "../score-poirier";
import { WORD_R } from "../scenes/Build";
import { BONE, THEMES, VERMILION } from "../theme";
import {
  CODY_DX,
  DOT_GAP,
  DOT_R,
  LINE_Y,
  LOCK_DX,
  P_CAP,
  P_R,
  SPEC,
} from "./common";

/**
 * Bar 8. The final hit: the plates register and the letters are clean. The dot
 * drops in as the full stop. In the joined cut CODY comes down on the line
 * above with the same hit, and the film ends on the whole name.
 */
export const FinalP: React.FC<{ from: number; joined: boolean }> = ({
  from,
  joined,
}) => {
  const beat = useBeat(from);
  const theme = THEMES.ink;
  const r = P_R;
  const lineY = joined ? LINE_Y : 0;
  const t0 = since(beat, 29);
  const t30 = since(beat, 30);

  const pop = 1 + 0.08 * ring(t0, 3.6, 0.42);
  const q = 0.1 * ring(t0, 5, 0.4) + 0.022 * ring(t30, 6, 0.4);
  const plate = (9 + 50 * decay(t0, 0.07)) * (1 - spring(t0 - 0.08, 2, 0.75));
  const letters: LetterState[] = SPEC.chars.map(() => ({
    sx: 1 + q * 0.7,
    sy: 1 - q,
    pivot: P_CAP,
  }));

  // CODY arrives from above on the hit and squashes on its own baseline
  const codyDrop = clamp(t0 / 0.034);
  const codyQ = 0.26 * ring(t0 - 0.034, 5.2, 0.32);
  const codyCap = CAP_HALF * WORD_R;
  const cody: LetterState[] = [0, 1, 2, 3].map(() => ({
    y: -260 * (1 - codyDrop * codyDrop),
    sx: t0 < 0.034 ? 0.92 : 1 + codyQ * 0.75,
    sy: t0 < 0.034 ? 1.16 : 1 - codyQ,
    pivot: codyCap,
  }));

  // the dot: dropped in from above, two small bounces, and it is the full stop
  const restX = LOCK_DX + (SPEC.x[6] + EXTENT.R[1]) * r + DOT_GAP + DOT_R;
  const LAND_X = [restX + 64, restX + 20, restX];
  const HEIGHTS = [130, 40];
  const ENTER = 29.42;
  let dotX = restX;
  let lift = 0;
  if (beat < DOT_LANDINGS[0]) {
    const u = clamp((beat - ENTER) / (DOT_LANDINGS[0] - ENTER));
    dotX = LAND_X[0] + 120 * (1 - u);
    lift = 700 * (1 - u * u);
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
  const floor = P_CAP + lineY;

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
      {joined ? (
        <g transform={`translate(${CODY_DX} ${-LINE_Y})`}>
          <Plated
            r={WORD_R}
            weight={BOLD + 0.12 * ring(t0, 3.2, 0.45)}
            theme={theme}
            letters={cody}
            plate={[plate, plate]}
            plates={2}
          />
        </g>
      ) : null}
      <g transform={`translate(${LOCK_DX} ${lineY}) scale(${pop})`}>
        <PlatedLetters
          spec={SPEC}
          r={r}
          weight={BOLD + 0.12 * ring(t0, 3.2, 0.45)}
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
          cy={floor + 4}
        />
      ))}
      {beat > ENTER ? (
        <ellipse
          cx={dotX}
          cy={floor - DOT_R * dsy - lift}
          rx={DOT_R * dsx}
          ry={DOT_R * dsy}
          fill={VERMILION}
        />
      ) : null}
    </Stage>
  );
};
