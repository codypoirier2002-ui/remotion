import React from "react";
import { Backdrop, Iris, Stage } from "../Backdrop";
import {
  BOLD,
  CAP_HALF,
  type LetterState,
  PlatedLetters,
  setWord,
} from "../Glyph";
import { clamp, decay, ring, since, spring, useBeat } from "../motion";
import { SPELL_BEATS, SYLLABLES } from "../score-poirier";
import { INK, THEMES } from "../theme";

const R = 259;
/** POI - RI - ER: each syllable set on its own, filling the frame. */
const GROUPS = [
  setWord(["P", "O", "I"], [0.14, 0.26]),
  setWord(["R", "I"], [0.24]),
  setWord(["E", "R"], [0.24]),
];
const SEQUENCE = [THEMES.cobalt, THEMES.bone, THEMES.vermilion];
const SYLLABLE_STARTS = [1, 2.5, 3.5];

/**
 * Bar 1. Seven letters do not fit one per beat, so the name is spelled the way
 * it is said. Each syllable gets the frame and a colour, and builds one letter
 * per eighth note: P, PO, POI. R, RI. E, ER.
 */
export const Syllables: React.FC<{
  from: number;
  /** where the dot was when it blew open */
  irisX: number;
  irisY: number;
}> = ({ from, irisX, irisY }) => {
  const beat = useBeat(from);
  const syl = beat < 2.5 ? 0 : beat < 3.5 ? 1 : 2;
  const theme = beat >= 4.75 ? THEMES.cobalt : SEQUENCE[syl];
  const cap = CAP_HALF * R;
  const members = SYLLABLES[syl];
  const snares =
    0.13 * ring(since(beat, 4.5), 7, 0.35) +
    0.2 * ring(since(beat, 4.75), 7, 0.35);

  let kick = 0;
  const letters: LetterState[] = members.map((index, j) => {
    const t = since(beat, SPELL_BEATS[index]);
    if (t < 0) return { hidden: true };
    kick = Math.max(kick, decay(t, 0.07));
    const arrive = spring(t, 5.5, 0.48);
    // letters slam in from above and below in turn
    const dir = j % 2 ? 1 : -1;
    // and whoever is already there gets bumped by the next arrival
    let bump = 0;
    for (const later of members.slice(j + 1))
      bump += 0.07 * ring(since(beat, SPELL_BEATS[later]), 6, 0.4);
    const land = 0.16 * ring(t - 0.05, 5.5, 0.34);
    const q = (dir < 0 ? land : -land * 0.6) + bump + snares;
    return {
      y: dir * 250 * (1 - arrive),
      rot: dir * 9 * (1 - spring(t, 4, 0.5)),
      sx: (1 + 0.28 * (1 - arrive)) * (1 + q * 0.75),
      sy: (1 + 0.28 * (1 - arrive)) * (1 - q),
      pivot: cap,
    };
  });

  const off =
    28 +
    60 * kick +
    30 * decay(since(beat, 4.5), 0.06) +
    44 * decay(since(beat, 4.75), 0.06);
  const drift =
    1 + 0.03 * clamp((beat - SYLLABLE_STARTS[syl]) / (syl === 0 ? 1.5 : 1));

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[...SPELL_BEATS, 4.5, 4.75].map((b) => ({
          beat: b,
          strength: SYLLABLE_STARTS.includes(b) ? 1 : 0.5,
        }))}
        suck={0}
        gridOpacity={1}
      />
      <g transform={`scale(${drift})`}>
        <PlatedLetters
          spec={GROUPS[syl]}
          r={R}
          weight={BOLD}
          theme={theme}
          letters={letters}
          plate={[off, off]}
          plates={1}
        />
      </g>
      {syl === 0 ? (
        <g transform={`translate(${irisX} ${irisY})`}>
          <Iris hole={30 + 30000 * Math.max(0, since(beat, 1))} color={INK} />
        </g>
      ) : null}
    </Stage>
  );
};
