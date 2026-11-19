import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop, Finish, Stage } from "./Backdrop";
import {
  BOLD,
  HAIR,
  PARTS,
  PartShape,
  Plated,
  ULTRA,
  WORD_WIDTH,
  LETTER_X,
} from "./Glyph";
import { BONE, COBALT, THEMES, VERMILION } from "./theme";

/** Type specimen: a still to check the letterforms at every weight. Not part of the video. */
export const Specimen: React.FC = () => {
  const theme = THEMES.ink;
  const r = 900 / WORD_WIDTH;
  const colors = [BONE, VERMILION, COBALT];
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Stage>
        <Backdrop
          theme={theme}
          beat={0}
          ripples={[]}
          suck={0}
          gridOpacity={1}
        />
        <g transform="translate(-460 -360)">
          <Plated
            r={r}
            weight={HAIR}
            theme={theme}
            letters={null}
            plate={[0, 0]}
            plates={0}
          />
        </g>
        <g transform="translate(-460 -120)">
          <Plated
            r={r}
            weight={0.4}
            theme={theme}
            letters={null}
            plate={[0, 0]}
            plates={0}
          />
        </g>
        <g transform="translate(-460 130)">
          <Plated
            r={r}
            weight={BOLD}
            theme={theme}
            letters={null}
            plate={[9, 9]}
            plates={2}
          />
        </g>
        <g transform="translate(-460 380)">
          <Plated
            r={r}
            weight={ULTRA}
            theme={theme}
            letters={null}
            plate={[0, 0]}
            plates={0}
          />
        </g>
        <g transform="translate(480 -240)">
          <Plated
            r={r}
            weight={BOLD}
            theme={theme}
            letters={[0.2, 0.45, 0.7, 0.6].map((draw) => ({
              draw,
              weight: HAIR * 2,
            }))}
            plate={[0, 0]}
            plates={0}
          />
        </g>
        <g transform="translate(480 180)">
          {PARTS.map((p, i) => {
            const spread = 1.35;
            return (
              <g
                key={i}
                transform={`translate(${(LETTER_X[p.letter] + p.cx * spread) * r} ${p.cy * spread * r}) translate(${-p.cx * r} ${-p.cy * r})`}
              >
                <PartShape
                  index={i}
                  r={r}
                  weight={BOLD * r}
                  color={colors[i % 3]}
                />
              </g>
            );
          })}
        </g>
      </Stage>
      <Finish />
    </AbsoluteFill>
  );
};
