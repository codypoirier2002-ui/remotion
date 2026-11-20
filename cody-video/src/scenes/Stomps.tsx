import React from "react";
import { Backdrop, Iris, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, Glyph, WORD } from "../Glyph";
import { clamp, decay, ring, since, spring, useBeat } from "../motion";
import { INK, THEMES } from "../theme";

const SEQUENCE = [THEMES.vermilion, THEMES.ink, THEMES.cobalt, THEMES.bone];
const R = 268;
/** The Y is in the air for two frames after the cut, so the squash sits right on the kick. */
const LAND = 0.034;

/**
 * Bar 1. Four stomps, four chords, four letters. One letter fills the frame per
 * beat and the palette flips with every hit. Each letter arrives its own way.
 */
export const Stomps: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const i = clamp(Math.floor(beat - 1), 0, 3);
  const t = since(beat, 1 + i);
  // last sixteenth: the snare flips the palette once more
  const theme = beat >= 4.75 ? THEMES.vermilion : SEQUENCE[i];

  let x = 0;
  let y = 0;
  let rot = 0;
  let s = 1 + 0.03 * clamp(t / 0.45);
  let sx = 1;
  let sy = 1;
  let r = R;
  let weight = BOLD * R;

  if (i === 0) {
    // C: punched in from in front of the lens, swinging into place
    s *= 1 + 0.55 * (1 - spring(t, 4.6, 0.42));
    rot = -34 * (1 - spring(t, 3.4, 0.45));
    x = -0.16 * R;
  } else if (i === 1) {
    // O: the dot again. A disc pops and its hole opens.
    const outer = (1 + BOLD / 2) * (0.25 + 0.75 * spring(t, 4.2, 0.34));
    const inner = (1 - BOLD / 2) * spring(t - 0.02, 3.6, 0.45);
    r = (R * (outer + inner)) / 2;
    weight = R * (outer - inner);
  } else if (i === 2) {
    // D: thrown in from the left, stretched, then it settles
    const arrive = spring(t, 5, 0.42);
    x = -460 * (1 - arrive);
    const stretch = 0.4 * decay(t, 0.045) - 0.16 * ring(t - 0.07, 5, 0.32);
    sx = 1 + stretch;
    sy = 1 - stretch * 0.5;
  } else {
    // Y: dropped from above, squashes on the floor
    const drop = clamp(t / LAND);
    y = -330 * (1 - drop * drop);
    const q =
      0.24 * ring(t - LAND, 5.2, 0.3) +
      0.13 * ring(since(beat, 4.5), 7, 0.35) +
      0.2 * ring(since(beat, 4.75), 7, 0.35);
    sy = t < LAND ? 1.2 : 1 - q;
    sx = t < LAND ? 0.9 : 1 + q * 0.8;
  }

  // the print plate jumps away on the hit and settles back
  const kick =
    decay(t, 0.07) +
    0.5 * decay(since(beat, 4.5), 0.06) +
    0.7 * decay(since(beat, 4.75), 0.06);
  const off = 28 + 64 * kick;
  const pivot = CAP_HALF * R;
  const transform =
    `translate(${x} ${y}) rotate(${rot}) scale(${s}) ` +
    `translate(0 ${pivot}) scale(${sx} ${sy}) translate(0 ${-pivot})`;

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[1, 2, 3, 4, 4.5, 4.75].map((b) => ({
          beat: b,
          strength: b % 1 ? 0.5 : 1,
        }))}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`translate(${off} ${off}) ${transform}`}>
        <Glyph char={WORD[i]} r={r} weight={weight} color={theme.p1} />
      </g>
      <g transform={transform}>
        <Glyph char={WORD[i]} r={r} weight={weight} color={theme.fg} />
      </g>
      {/* the dot from the pickup blows open into the first colour */}
      {i === 0 ? <Iris hole={30 + 30000 * Math.max(0, t)} color={INK} /> : null}
    </Stage>
  );
};
