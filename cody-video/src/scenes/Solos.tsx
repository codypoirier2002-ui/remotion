import React from "react";
import { Backdrop, Dust, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, LETTER_X, type LetterState, Plated } from "../Glyph";
import {
  clamp,
  decay,
  easeInOutCubic,
  ring,
  since,
  spring,
  useBeat,
  wobble,
} from "../motion";
import { BEAT_SEC } from "../score";
import { INK, THEMES, VERMILION } from "../theme";
import { BIG_R } from "./Drop";

const SEQUENCE = [THEMES.cobalt, THEMES.bone, THEMES.ink, THEMES.vermilion];
const FEATURE = [VERMILION, VERMILION, VERMILION, INK];
const HOP = 0.5 * BEAT_SEC;

/** A hop that leaves on the beat and lands on the next off-beat. */
const hop = (t: number, height: number) => {
  const u = t / HOP;
  return u > 0 && u < 1 ? -height * 4 * u * (1 - u) : 0;
};

/**
 * Bar 6. The motif again, one chord per beat, so each letter takes a solo:
 * C spins, O jumps, D flips, Y spins and jumps. The palette flips on every kick.
 */
export const Solos: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const i = clamp(Math.floor(beat - 21), 0, 3);
  const theme = SEQUENCE[i];
  const r = BIG_R;
  const cap = CAP_HALF * r;
  const tk = since(beat, 21 + i);
  const crouch = 0.12 * easeInOutCubic((beat - 24.72) / 0.28);

  const letters: LetterState[] = [0, 1, 2, 3].map((k) => {
    const t = since(beat, 21 + k);
    const q = 0.07 * ring(tk, 5, 0.42) + crouch;
    const s: Required<Pick<LetterState, "x" | "y" | "rot" | "sx" | "sy">> &
      LetterState = {
      x: 0,
      y: 0,
      rot: 0,
      sx: 1 + q * 0.7,
      sy: 1 - q,
      pivot: cap,
    };
    if (k === i) s.color = FEATURE[i];
    else {
      // the others lean away from whoever is soloing
      const dir = Math.sign(k - i) / Math.abs(k - i);
      s.rot += dir * 6 * wobble(tk, 3, 0.4);
      s.x += dir * 18 * wobble(tk, 3, 0.4);
    }
    if (k === 0) {
      s.rot += -360 * spring(t, 2.7, 0.55);
      s.pivot = 0;
      const pop = 1 + 0.14 * ring(t, 3.4, 0.4);
      s.sx *= pop;
      s.sy *= pop;
    }
    if (k === 1 || k === 3) {
      const height = k === 1 ? 190 : 150;
      const air = t > 0 && t < HOP;
      const land = 0.3 * ring(t - HOP, 5.5, 0.32);
      s.y += hop(t, height);
      s.sy *= air ? 1.14 : 1 - land;
      s.sx *= air ? 0.93 : 1 + land * 0.75;
      if (k === 3) s.rot += 360 * spring(t, 2.9, 0.6);
    }
    if (k === 2) {
      s.sx *= Math.cos(2 * Math.PI * spring(t, 2.5, 0.6));
      s.y += -40 * wobble(t, 2.6, 0.45);
    }
    return s;
  });

  const angle = ((45 + 90 * i) * Math.PI) / 180;
  const mag = 15 + 34 * decay(tk, 0.08);
  const zoom = 1.03 + 0.02 * clamp((beat - 21) / 4);
  const landings = [
    { beat: 22.5, letter: 1 },
    { beat: 24.5, letter: 3 },
  ];

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[21, 22, 22.5, 23, 24, 24.5].map((b) => ({
          beat: b,
          strength: b % 1 ? 0.5 : 0.9,
        }))}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`scale(${zoom})`}>
        {landings.map((l) => (
          <Dust
            key={l.beat}
            p={since(beat, l.beat) / 0.34}
            size={330}
            color={theme.fg}
            cx={LETTER_X[l.letter] * r}
            cy={cap + 8}
          />
        ))}
        <Plated
          r={r}
          weight={BOLD + 0.07 * decay(tk, 0.1)}
          theme={theme}
          letters={letters}
          plate={[mag * Math.cos(angle), mag * Math.sin(angle)]}
          plates={2}
        />
      </g>
    </Stage>
  );
};
