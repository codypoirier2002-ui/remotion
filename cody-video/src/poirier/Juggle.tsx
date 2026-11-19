import React from "react";
import { Backdrop, Dust, Stage } from "../Backdrop";
import { BOLD, type LetterState, setWord, StackedLetters } from "../Glyph";
import {
  clamp,
  decay,
  lerp,
  ring,
  since,
  sumHits,
  useBeat,
  wobble,
} from "../motion";
import { FILL7_BEATS } from "../score-poirier";
import { THEMES } from "../theme";
import { LINE_Y, LOCK_DX, P_CAP, P_R, SPEC } from "./common";

/**
 * First throw: everyone moves one place to the right, and the last R goes all
 * the way round over the top to the front. The name lands as RPOIRIE.
 */
const ROUND = setWord(
  ["R", "P", "O", "I", "R", "I", "E"],
  [0.24, 0.14, 0.26, 0.34, 0.24, 0.34],
);
const SLOT = [1, 2, 3, 4, 5, 6, 0];
/** How high each letter goes on the two juggling throws, and how far it turns. */
const HEIGHT_1 = [250, 290, 240, 290, 250, 280, 640];
const HEIGHT_2 = [300, 260, 310, 270, 300, 260, 660];
const TURN = [0, 0, 0, 0, 0, 0, -360];
/** A one-beat throw peaks at this height: sets gravity for the last throw. */
const PEAK_PER_BEAT = 380;

/**
 * Bar 7. Third break: the letters are juggled. The first throw passes every
 * letter along one place, the second passes them back. The third throw is the
 * trick: each
 * letter is thrown exactly high enough to come down on its own tom of the
 * fill, so they land P, O, I, R, I, E, R, one per sixteenth, under one gravity.
 */
export const Juggle: React.FC<{ from: number; joined: boolean }> = ({
  from,
  joined,
}) => {
  const beat = useBeat(from);
  const theme =
    beat < 26 ? THEMES.bone : beat < 27 ? THEMES.vermilion : THEMES.ink;
  const r = P_R;
  const xs = SPEC.x.map((x) => x * r);
  // how far each letter travels to its place in the passed-along word
  const away = xs.map((x, i) => ROUND.x[SLOT[i]] * r - x);
  const lineY = joined ? LINE_Y : 0;

  const letters: LetterState[] = SPEC.chars.map((_, i) => {
    const land26 = 0.26 * ring(since(beat, 26), 5.5, 0.34);
    const land27 = 0.22 * ring(since(beat, 27), 5.5, 0.34);
    let x = 0;
    let y = 0;
    let rot = 0;
    let q = 0.3 * ring(since(beat, 25), 5, 0.4) * 0.3;
    let dx = 0;
    let dy = 0;

    if (beat < 26) {
      // throw 1: out to someone else's place
      const u = clamp(beat - 25);
      x = lerp(0, away[i], u);
      y = -HEIGHT_1[i] * 4 * u * (1 - u);
      rot = TURN[i] * u;
      q += u > 0 && u < 1 ? -0.1 : 0;
    } else if (beat < 27) {
      // throw 2: and home again
      const u = clamp(beat - 26);
      x = lerp(away[i], 0, u);
      y = -HEIGHT_2[i] * 4 * u * (1 - u);
      rot = -TURN[i] * u;
      q += land26 + (u > 0.08 && u < 1 ? -0.1 : 0);
    } else {
      // throw 3: as high as it takes to land on your own tom
      const flight = FILL7_BEATS[i] - 27;
      const u = (beat - 27) / flight;
      const t = since(beat, FILL7_BEATS[i]);
      const turns = flight > 1.2 ? 2 : flight > 0.6 ? 1 : 0;
      if (u < 1) {
        y = -PEAK_PER_BEAT * flight * flight * 4 * u * (1 - u);
        rot = 360 * turns * u * (i % 2 ? -1 : 1);
        q += land27 * (1 - u) - 0.1;
      } else {
        // down: squash, and get shaken by everyone who lands after you
        q += 0.32 * ring(t, 5.5, 0.3);
        y =
          -16 *
          sumHits(beat, FILL7_BEATS.slice(i + 1), (tt) => wobble(tt, 5, 0.4));
      }
      // during the last throw the word drifts to where the lockup will sit
      const drift = clamp(u);
      dx = LOCK_DX * drift;
      dy = lineY * drift;
    }
    const plate = 9 + 34 * decay(since(beat, FILL7_BEATS[i]), 0.08);
    return {
      x: x + dx,
      y: y + dy,
      rot,
      sx: 1 + q * 0.75,
      sy: 1 - q,
      pivot: P_CAP,
      plate: [plate, plate],
    };
  });

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[25, 26, 27, ...FILL7_BEATS].map((b) => ({
          beat: b,
          strength: b > 27 ? 0.5 : 0.9,
        }))}
        suck={0}
        gridOpacity={1}
      />
      {FILL7_BEATS.map((b, i) => (
        <Dust
          key={b}
          p={since(beat, b) / 0.3}
          size={210}
          color={theme.fg}
          cx={xs[i] + LOCK_DX}
          cy={P_CAP + 6 + lineY}
        />
      ))}
      <StackedLetters
        spec={SPEC}
        r={r}
        weight={BOLD}
        theme={theme}
        letters={letters}
        plate={[9, 9]}
        order={[6, 0, 1, 2, 3, 4, 5]}
        keyline={6}
      />
    </Stage>
  );
};
