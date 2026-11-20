import React, { useId } from "react";
import { Backdrop, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, type LetterState, Plated, Word } from "../Glyph";
import {
  decay,
  easeInOutCubic,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
} from "../motion";
import { BEAT_SEC } from "../score";
import { BONE, THEMES } from "../theme";
import { WORD_R } from "./Build";

const BANDS = 6;
/** Horizontal cuts: where each band goes on every chord of the bar. */
const H_STEPS = [
  // thirds: top one way, bottom the other
  { beat: 9, to: [-88, -88, 30, 30, 88, 88] },
  // and swing through to the opposite side
  { beat: 9.75, to: [88, 88, -30, -30, -88, -88] },
  // six bands, sheared like a deck of cards
  { beat: 10.5, to: [-160, -96, -32, 32, 96, 160] },
  { beat: 11, to: [0, 0, 0, 0, 0, 0] },
];
/** Then the letters themselves split up and down. */
const V_STEPS = [
  { beat: 11.75, to: [-100, 100, -100, 100] },
  { beat: 12.5, to: [0, 0, 0, 0] },
];
/** The plates trail the letters by this much, so fast moves smear into colour. */
const LAG = 0.034 / BEAT_SEC;

const track = (
  steps: { beat: number; to: number[] }[],
  k: number,
  beat: number,
) => {
  let pos = 0;
  let prev = 0;
  for (const s of steps) {
    pos +=
      (s.to[k] - prev) * spring(since(beat, s.beat) - k * 0.007, 5.5, 0.42);
    prev = s.to[k];
  }
  return pos;
};

/**
 * Bar 3. First break. The word is cut into bands that shear apart on every
 * chord, snap back together, then split letter by letter and snap back again.
 */
export const Slice: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const id = "s" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const theme = THEMES.ink;
  const r = WORD_R;
  const cap = CAP_HALF * r;
  const bandH = (cap * 2) / BANDS;
  const horizontal = beat < 11.6;

  const pump =
    (1 + 0.022 * sumHits(beat, [9, 10, 11, 12], (t) => ring(t, 5, 0.5))) *
    (1 - 0.07 * easeInOutCubic((beat - 12.72) / 0.28));
  const base =
    9 + 34 * decay(since(beat, 11), 0.09) + 26 * decay(since(beat, 12.5), 0.09);
  // the blade: a line flashes along every cut the latest hit made
  const lastCut = [...H_STEPS]
    .reverse()
    .find((st) => beat >= st.beat && st.beat < 11);
  const blade = lastCut ? decay(since(beat, lastCut.beat), 0.1) : 0;

  const split: LetterState[] = [0, 1, 2, 3].map((i) => {
    const y = track(V_STEPS, i, beat);
    return { y, plate: [base, base + (track(V_STEPS, i, beat - LAG) - y)] };
  });

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[9, 10, 11, 12].map((b) => ({
          beat: b,
          strength: b === 11 ? 1 : 0.6,
        }))}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`scale(${pump})`}>
        {horizontal ? (
          <>
            <defs>
              {Array.from({ length: BANDS }, (_, k) => {
                const top = k === 0 ? -700 : -cap + k * bandH;
                const bottom = k === BANDS - 1 ? 700 : -cap + (k + 1) * bandH;
                return (
                  <clipPath key={k} id={`${id}${k}`}>
                    <rect
                      x={-1500}
                      y={top}
                      width={3000}
                      height={bottom - top + 0.7}
                    />
                  </clipPath>
                );
              })}
            </defs>
            {Array.from({ length: BANDS }, (_, k) => (
              <g key={k} clipPath={`url(#${id}${k})`}>
                <g
                  transform={`translate(${track(H_STEPS, k, beat - 2 * LAG) + 2 * base} ${2 * base})`}
                >
                  <Word
                    r={r}
                    weight={BOLD}
                    color={theme.p2}
                    letters={null}
                    layer={0}
                    plate={[0, 0]}
                  />
                </g>
                <g
                  transform={`translate(${track(H_STEPS, k, beat - LAG) + base} ${base})`}
                >
                  <Word
                    r={r}
                    weight={BOLD}
                    color={theme.p1}
                    letters={null}
                    layer={0}
                    plate={[0, 0]}
                  />
                </g>
                <g transform={`translate(${track(H_STEPS, k, beat)} 0)`}>
                  <Word
                    r={r}
                    weight={BOLD}
                    color={theme.fg}
                    letters={null}
                    layer={0}
                    plate={[0, 0]}
                  />
                </g>
              </g>
            ))}
            <g stroke={BONE} strokeWidth={2.5} opacity={blade * 0.8}>
              {Array.from({ length: BANDS - 1 }, (_, k) =>
                lastCut && lastCut.to[k] !== lastCut.to[k + 1] ? (
                  <line
                    key={k}
                    x1={-960}
                    x2={960}
                    y1={-cap + (k + 1) * bandH}
                    y2={-cap + (k + 1) * bandH}
                  />
                ) : null,
              )}
            </g>
          </>
        ) : (
          <Plated
            r={r}
            weight={BOLD}
            theme={theme}
            letters={split}
            plate={[base, base]}
            plates={2}
          />
        )}
      </g>
    </Stage>
  );
};
