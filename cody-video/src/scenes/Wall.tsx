import React from "react";
import { Backdrop, Dust, Stage } from "../Backdrop";
import {
  BOLD,
  CAP_HALF,
  LETTER_X,
  type LetterState,
  Plated,
  Word,
  WORD_WIDTH,
} from "../Glyph";
import {
  clamp,
  decay,
  easeInCubic,
  lerp,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
  wobble,
} from "../motion";
import { FILL_BEATS } from "../score";
import { THEMES } from "../theme";
import { WORD_R } from "./Build";

const ROWS = 5;
const ROW_PITCH = 216;
const ROW_R = 150 / (2 * CAP_HALF);
const WORD_PITCH = WORD_WIDTH * ROW_R + 130;
const THIN = 0.11;

/**
 * Bar 7. Third break: the name multiplies into a wall of rows that lurch on the
 * kick and trade weights, then folds shut. On the fill the four letters drop
 * back in, one per tom, one per note of the motif.
 */
export const Wall: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme =
    beat < 26 ? THEMES.cobalt : beat < 27 ? THEMES.bone : THEMES.ink;
  const t25 = since(beat, 25);
  const t26 = since(beat, 26);
  const t27 = since(beat, 27);

  const rows =
    beat < 27.9
      ? Array.from({ length: ROWS }, (_, k) => {
          const dir = k % 2 ? 1 : -1;
          const enter = spring(t25 - k * 0.012, 3.6, 0.55);
          const scroll =
            dir *
            (110 * Math.max(0, t25) +
              520 * (1 - enter) +
              176 * spring(t26, 4, 0.5) +
              176 * spring(t27, 4, 0.5) +
              70 * sumHits(beat, [25.75, 26.5], (t) => spring(t, 5, 0.5)));
          const swap = spring(t26, 4.5, 0.42);
          const bold = k % 2 === 0 ? 1 - swap : swap;
          const unfold = 0.25 + 0.75 * spring(t25 - k * 0.012, 4.6, 0.4);
          // fold shut from the outside in, then the leftover line retracts
          const foldAt = [27.75, 27.5, 27][Math.abs(k - 2)];
          const fold = easeInCubic((beat - foldAt) / 0.14);
          const retract = easeInCubic((beat - foldAt - 0.12) / 0.13);
          const base =
            (((scroll + k * 176) % WORD_PITCH) + WORD_PITCH) % WORD_PITCH;
          const color = k === 2 ? theme.p1 : theme.fg;
          return (
            <g key={k} transform={`translate(0 ${(k - 2) * ROW_PITCH})`}>
              {fold < 1 ? (
                <g transform={`scale(1 ${unfold * (1 - fold)})`}>
                  {[-3, -2, -1, 0, 1, 2].map((n) => (
                    <g
                      key={n}
                      transform={`translate(${base + n * WORD_PITCH} 0)`}
                    >
                      <Word
                        r={ROW_R}
                        weight={lerp(THIN, BOLD, clamp(bold, -0.05, 1.15))}
                        color={color}
                        letters={null}
                        layer={0}
                        plate={[0, 0]}
                      />
                    </g>
                  ))}
                </g>
              ) : (
                <line
                  x1={-960 * (1 - retract)}
                  x2={960 * (1 - retract)}
                  y1={0}
                  y2={0}
                  stroke={color}
                  strokeWidth={4}
                  opacity={retract < 1 ? 1 : 0}
                />
              )}
            </g>
          );
        })
      : null;

  // the landing
  const r = WORD_R;
  const cap = CAP_HALF * r;
  const FALL = 0.085;
  const letters: LetterState[] = FILL_BEATS.map((b, i) => {
    const t = since(beat, b);
    if (t < -FALL) return { hidden: true };
    const air = t < 0;
    const q = 0.32 * ring(t, 5.5, 0.3);
    // the floor shakes when the next ones land
    const shake = sumHits(beat, FILL_BEATS.slice(i + 1), (tt) =>
      wobble(tt, 5, 0.4),
    );
    const plate = 9 + 34 * decay(t, 0.08);
    return {
      y: air ? -900 * Math.pow(-t / FALL, 1.6) : -16 * shake,
      sx: air ? 0.9 : 1 + q * 0.75,
      sy: air ? 1.22 : 1 - q,
      pivot: cap,
      plate: [plate, plate],
    };
  });

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[25, 26, 27, ...FILL_BEATS].map((b) => ({
          beat: b,
          strength: b >= 28 ? 0.6 : 0.9,
        }))}
        suck={0}
        gridOpacity={1}
      />
      {rows}
      {beat >= 28 - 0.2 ? (
        <>
          {FILL_BEATS.map((b, i) => {
            return (
              <Dust
                key={b}
                p={since(beat, b) / 0.3}
                size={230}
                color={theme.fg}
                cx={LETTER_X[i] * r}
                cy={cap + 6}
              />
            );
          })}
          <Plated
            r={r}
            weight={BOLD}
            theme={theme}
            letters={letters}
            plate={[9, 9]}
            plates={2}
          />
        </>
      ) : null}
    </Stage>
  );
};
