import React from "react";
import { Backdrop, Stage } from "../Backdrop";
import { BOLD, CAP_HALF, type LetterState, PlatedLetters } from "../Glyph";
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
import { SOLO_BEATS, SOLO_WAVE_BEATS, SYLLABLES } from "../score-poirier";
import { INK, THEMES, VERMILION } from "../theme";
import { P_BIG, SPEC } from "./common";

const SEQUENCE = [THEMES.bone, THEMES.ink, THEMES.vermilion, THEMES.cobalt];
const FEATURE = [VERMILION, VERMILION, INK, VERMILION];

/** Leave the ground, come down `beats` later with a squash. Returns [lift, squash]. */
const hop = (t: number, beats: number, height: number): [number, number] => {
  const dur = beats * BEAT_SEC;
  const u = t / dur;
  if (u > 0 && u < 1) return [height * 4 * u * (1 - u), -0.13];
  return [0, 0.26 * ring(t - dur, 5.5, 0.34)];
};

/**
 * Bar 6. A solo per syllable, one chord each. POI: the P spins, the O jumps,
 * the I twirls like a baton. RI: the R flips, the I twirls. ER: the E flips
 * head over heels, the R spins. Then a wave through all seven.
 */
export const SolosP: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const b = clamp(Math.floor(beat - 21), 0, 3);
  const theme = SEQUENCE[b];
  const r = P_BIG;
  const cap = CAP_HALF * r;
  const tk = since(beat, 21 + b);
  const crouch = 0.12 * easeInOutCubic((beat - 24.78) / 0.22);

  const letters: LetterState[] = SPEC.chars.map((char, i) => {
    const t = since(beat, SOLO_BEATS[i]);
    const tw = since(beat, SOLO_WAVE_BEATS[i]);
    let q = 0.07 * ring(tk, 5, 0.42) + crouch;
    let y = 0;
    let rot = 0;
    let sx = 1;
    let sy = 1;
    let pivot = cap;

    if (i === 0 || i === 6) {
      // P and the last R: a full turn in the air
      const [lift, sq] = hop(t, 0.45, 150);
      y -= lift;
      q += sq;
      rot += (i === 0 ? 360 : -360) * spring(t, 2.9, 0.6);
    } else if (char === "O") {
      const [lift, sq] = hop(t, 0.45, 190);
      y -= lift;
      q += sq * 1.2;
    } else if (char === "I") {
      // a bar looks the same upside down: one and a half turns
      rot += 540 * spring(t, 3, 0.62);
      const pop = 1 + 0.14 * ring(t, 3.4, 0.4);
      sx *= pop;
      sy *= pop;
      pivot = 0;
    } else if (char === "R") {
      sx *= Math.cos(2 * Math.PI * spring(t, 2.6, 0.6));
      y -= 40 * wobble(t, 2.6, 0.45);
    } else if (char === "E") {
      sy *= Math.cos(2 * Math.PI * spring(t, 2.6, 0.6));
      y -= 40 * wobble(t, 2.6, 0.45);
      pivot = 0;
    }
    // beat 24: the wave
    const [lift, sq] = hop(tw, 0.32, 120);
    y -= lift;
    q += sq;

    const featured =
      b < 3 ? SYLLABLES[b].includes(i) : tw >= 0 && tw < 0.32 * BEAT_SEC;
    return {
      y,
      rot,
      sx: sx * (1 + q * 0.7),
      sy: sy * (1 - q),
      pivot,
      color: featured ? FEATURE[b] : undefined,
    };
  });

  const angle = ((45 + 90 * b) * Math.PI) / 180;
  const mag = 15 + 34 * decay(tk, 0.08);
  const zoom = 1.03 + 0.02 * clamp((beat - 21) / 4);

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[21, 22, 23, 24].map((x) => ({ beat: x, strength: 0.9 }))}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`scale(${zoom})`}>
        <PlatedLetters
          spec={SPEC}
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
