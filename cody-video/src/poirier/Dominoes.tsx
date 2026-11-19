import React from "react";
import { Backdrop, Stage } from "../Backdrop";
import { BOLD, EXTENT, type LetterState, StackedLetters } from "../Glyph";
import {
  clamp,
  decay,
  easeInOutCubic,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
  wobble,
} from "../motion";
import { BEAT_SEC } from "../score";
import {
  DOMINO_BEATS,
  UPRIGHT_BEAT,
  WAVE_BACK_BEATS,
  WAVE_BEATS,
} from "../score-poirier";
import { THEMES, VERMILION } from "../theme";
import { BALL_FLOOR, BALL_R } from "./Bounce";
import { P_CAP, P_R, SPEC } from "./common";

/** A letter needs one sixteenth to fall onto its neighbour. */
const FALL = 0.25 * BEAT_SEC;
/** How far each one tips before it rests on the next. The last has nothing to lean on. */
const REST = [50, 48, 54, 50, 54, 48, 86];
/** Back to front: right to left, so each letter lies on top of the one it fell onto. */
const ORDER = [6, 5, 4, 3, 2, 1, 0];

/** A hop that takes `beats` and lands with a squash. Returns [lift, squash]. */
const hop = (t: number, beats: number, height: number): [number, number] => {
  const dur = beats * BEAT_SEC;
  const u = t / dur;
  if (u > 0 && u < 1) return [height * 4 * u * (1 - u), -0.12];
  return [0, 0.22 * ring(t - dur, 6, 0.38)];
};

/**
 * Bar 3. First break. The ball comes down on the P and the whole name goes over
 * like dominoes, one letter per sixteenth. On the kick they all jump back up,
 * then a wave runs through them and back.
 */
export const Dominoes: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.ink;
  const r = P_R;
  const up = since(beat, UPRIGHT_BEAT);
  const crouch = 0.08 * easeInOutCubic((beat - 12.72) / 0.28);

  const letters: LetterState[] = SPEC.chars.map((char, i) => {
    const t = since(beat, DOMINO_BEATS[i]);
    let fall = 0;
    if (t > 0) {
      fall =
        t < FALL
          ? (t / FALL) ** 2
          : 1 -
            0.07 *
              Math.abs(Math.sin((t - FALL) * Math.PI * 9)) *
              Math.exp(-(t - FALL) / 0.08);
    }
    // on the kick everyone springs upright, the far end first
    const rise = spring(up - (6 - i) * 0.012, 3.4, 0.46);
    const angle = REST[i] * fall * (1 - rise);
    // tip over the corner the letter is standing on
    const a = (angle * Math.PI) / 180;
    const px = (angle >= 0 ? EXTENT[char][1] : -EXTENT[char][0]) * r;
    const py = P_CAP;
    const [lift1, q1] = hop(since(beat, WAVE_BEATS[i]), 0.3, 84);
    const [lift2, q2] = hop(since(beat, WAVE_BACK_BEATS[i]), 0.22, 60);
    const q = q1 + q2 + crouch + 0.05 * ring(up, 5, 0.4);
    return {
      x: px - (px * Math.cos(a) - py * Math.sin(a)),
      y:
        py -
        (px * Math.sin(a) + py * Math.cos(a)) -
        48 * wobble(up - (6 - i) * 0.012, 3.2, 0.45) -
        lift1 -
        lift2,
      rot: angle,
      sx: 1 + q * 0.7,
      sy: 1 - q,
      pivot: P_CAP,
    };
  });

  // the frame follows the fall, and comes back when they stand up
  const pan =
    -160 *
    easeInOutCubic((beat - 9.3) / 1.2) *
    (1 - easeInOutCubic(clamp(up / 0.22)));
  const pump = 1 + 0.02 * sumHits(beat, [10, 11, 12], (t) => ring(t, 5, 0.5));
  const plate = 9 + 26 * decay(since(beat, 9), 0.09) + 40 * decay(up, 0.09);

  // the ball lands on the P, and is gone
  const ub = (beat - 9) / 0.7;
  const ballQ = 0.45 * ring(since(beat, 9), 8, 0.45);

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[
          { beat: 9, strength: 0.8 },
          { beat: 10.5, strength: 0.6 },
          { beat: 11, strength: 1.2 },
          { beat: 12, strength: 0.6 },
        ]}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`translate(${pan} 0) scale(${pump})`}>
        <StackedLetters
          spec={SPEC}
          r={r}
          weight={BOLD + 0.08 * decay(up, 0.1)}
          theme={theme}
          letters={letters}
          plate={[plate, plate]}
          order={ORDER}
          keyline={7}
        />
        {ub < 1 ? (
          <ellipse
            cx={SPEC.x[0] * r - 70 - 520 * ub}
            cy={BALL_FLOOR - 760 * ub + 900 * ub * ub + BALL_R * ballQ}
            rx={BALL_R * (1 + ballQ * 0.8)}
            ry={BALL_R * (1 - ballQ)}
            fill={VERMILION}
          />
        ) : null}
      </g>
    </Stage>
  );
};
