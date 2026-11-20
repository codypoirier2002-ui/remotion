import React from "react";
import { Backdrop, Stage } from "../Backdrop";
import { BOLD, HAIR, type LetterState, PlatedLetters } from "../Glyph";
import {
  clamp,
  decay,
  easeInCubic,
  easeOutCubic,
  lerp,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
} from "../motion";
import { BOUNCE_BEATS } from "../score-poirier";
import { THEMES, VERMILION } from "../theme";
import { P_CAP, P_R, SPEC } from "./common";

export const BALL_R = 26;
const GUIDE = "#4A4A58";
/** The ball touches down on the hairline, before the letter has fattened under it. */
export const BALL_FLOOR = -P_R * (1 + HAIR / 2) - BALL_R;

/**
 * Bar 2. The name builds. The skeleton is drawn in hairline, then the dot comes
 * back as a ball and bounces along the tops of the letters, one per eighth
 * note. Every letter it lands on is squashed and fattens to full weight.
 */
export const Bounce: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.ink;
  const r = P_R;

  const letters: LetterState[] = SPEC.chars.map((_, i) => {
    const t = since(beat, BOUNCE_BEATS[i]);
    const q = 0.22 * ring(t, 5.5, 0.32);
    const plate = 10 * spring(t, 3, 0.5) + 26 * decay(t, 0.09);
    return {
      draw: easeOutCubic((beat - 5 - i * 0.04) / 0.42),
      weight: HAIR + (BOLD - HAIR) * spring(t, 5, 0.34),
      sx: 1 + q * 0.7,
      sy: 1 - q,
      pivot: P_CAP,
      plate: [plate, plate],
    };
  });

  // the ball
  const xs = SPEC.x.map((x) => x * r);
  const last = BOUNCE_BEATS.length - 1;
  let bx = xs[0];
  let lift = 0;
  if (beat < BOUNCE_BEATS[0]) {
    const u = clamp((beat - 5) / (BOUNCE_BEATS[0] - 5));
    bx = xs[0] - 330 * (1 - u);
    lift = 520 * (1 - u * u);
  } else if (beat >= BOUNCE_BEATS[last]) {
    // last letter done: lob all the way back to the first one
    const u = (beat - BOUNCE_BEATS[last]) / 0.5;
    bx = lerp(xs[last], xs[0] - 70, u);
    lift = 1700 * 4 * u * (1 - u);
  } else {
    for (let i = 0; i < last; i++) {
      const u =
        (beat - BOUNCE_BEATS[i]) / (BOUNCE_BEATS[i + 1] - BOUNCE_BEATS[i]);
      if (u >= 0 && u < 1) {
        bx = lerp(xs[i], xs[i + 1], u);
        lift = 150 * 4 * u * (1 - u);
      }
    }
  }
  const bq = 0.42 * sumHits(beat, BOUNCE_BEATS, (t) => ring(t, 8, 0.45));

  const guide =
    easeOutCubic((beat - 4.98) / 0.32) * (1 - easeInCubic((beat - 8.5) / 0.3));
  const pump = 1 + 0.016 * sumHits(beat, [5, 6, 7, 8], (t) => ring(t, 5, 0.5));

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[5, ...BOUNCE_BEATS].map((b) => ({ beat: b, strength: 0.55 }))}
        suck={0}
        gridOpacity={1}
      />
      <g stroke={GUIDE} strokeWidth={2} opacity={guide > 0.01 ? 1 : 0}>
        <line x1={-920 * guide} y1={-P_CAP} x2={920 * guide} y2={-P_CAP} />
        <line x1={-920 * guide} y1={P_CAP} x2={920 * guide} y2={P_CAP} />
        {xs.map((x, i) => (
          <g key={i} transform={`translate(${x} 0)`}>
            <line x1={0} y1={-P_CAP - 26 * guide} x2={0} y2={-P_CAP - 6} />
            <line x1={0} y1={P_CAP + 6} x2={0} y2={P_CAP + 26 * guide} />
          </g>
        ))}
      </g>
      <g transform={`scale(${pump})`}>
        <PlatedLetters
          spec={SPEC}
          r={r}
          weight={BOLD}
          theme={theme}
          letters={letters}
          plate={[0, 0]}
          plates={2}
        />
        <ellipse
          cx={bx}
          cy={BALL_FLOOR - lift + BALL_R * bq}
          rx={BALL_R * (1 + bq * 0.8)}
          ry={BALL_R * (1 - bq)}
          fill={VERMILION}
        />
      </g>
    </Stage>
  );
};
