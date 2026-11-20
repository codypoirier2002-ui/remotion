import React from "react";
import { Backdrop, Stage } from "../Backdrop";
import {
  BOLD,
  CAP_HALF,
  HAIR,
  LETTER_X,
  type LetterState,
  Plated,
  WORD_WIDTH,
} from "../Glyph";
import {
  decay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  ring,
  since,
  spring,
  sumHits,
  useBeat,
  wobble,
} from "../motion";
import { THEMES } from "../theme";

export const WORD_R = 1240 / WORD_WIDTH;
const GUIDE = "#4A4A58";

/**
 * Bar 2. The name builds. Hairlines draw the skeleton like a type drawing,
 * then each letter inflates to full weight on its own note of the motif.
 */
export const Build: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const theme = THEMES.ink;
  const r = WORD_R;
  const t8 = since(beat, 8);
  const crouch = 0.09 * easeInOutCubic((beat - 8.55) / 0.4);

  const letters: LetterState[] = [0, 1, 2, 3].map((i) => {
    const t = since(beat, 6 + i * 0.5);
    const inflate = spring(t, 5, 0.34);
    const pop = ring(t, 4.6, 0.38);
    const plate =
      10 * spring(t, 3, 0.5) +
      26 * decay(t, 0.09) * (t > 0 ? 1 : 0) +
      30 * decay(t8, 0.1);
    return {
      draw: easeOutCubic((beat - 5 - i * 0.1) / 0.6),
      weight: HAIR + (BOLD - HAIR) * inflate + 0.12 * ring(t8, 4.2, 0.4),
      sx: (1 + 0.13 * pop) * (1 + crouch * 0.6),
      sy: (1 + 0.13 * pop) * (1 - crouch),
      y: -30 * wobble(t, 3.4, 0.42),
      pivot: CAP_HALF * r,
      plate: [plate, plate],
    };
  });

  const guide =
    easeOutCubic((beat - 4.98) / 0.32) * (1 - easeInCubic((beat - 8) / 0.35));
  const pump =
    1 +
    0.016 * sumHits(beat, [5, 6, 7], (t) => ring(t, 5, 0.5)) +
    0.07 * ring(t8, 3.8, 0.4);
  const cap = CAP_HALF * r;

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[5, 6, 6.5, 7, 7.5, 8].map((b) => ({
          beat: b,
          strength: b === 8 ? 1 : 0.55,
        }))}
        suck={0}
        gridOpacity={1}
      />
      {/* construction lines: cap height, baseline, circle centres */}
      <g stroke={GUIDE} strokeWidth={2} opacity={guide > 0.01 ? 1 : 0}>
        <line x1={-900 * guide} y1={-cap} x2={900 * guide} y2={-cap} />
        <line x1={-900 * guide} y1={cap} x2={900 * guide} y2={cap} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${LETTER_X[i] * r} 0)`}>
            <line x1={-12 * guide} y1={0} x2={12 * guide} y2={0} />
            <line x1={0} y1={-12 * guide} x2={0} y2={12 * guide} />
            <line x1={0} y1={-cap - 26 * guide} x2={0} y2={-cap - 6} />
            <line x1={0} y1={cap + 6} x2={0} y2={cap + 26 * guide} />
          </g>
        ))}
      </g>
      <g transform={`scale(${pump})`}>
        <Plated
          r={r}
          weight={BOLD}
          theme={theme}
          letters={letters}
          plate={[0, 0]}
          plates={2}
        />
      </g>
    </Stage>
  );
};
