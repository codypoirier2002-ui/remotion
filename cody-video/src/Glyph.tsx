import React, { useId } from "react";
import type { Theme } from "./theme";

/**
 * The typeface. Four letters, drawn here, built only from circles and straight
 * bars with one stroke weight. Because every letter is a stroke, the weight is a
 * live parameter (hairline -> ultra) and every letter can be drawn on.
 *
 * Unit: r = radius of the round letters' centre line. Cap height = 2r + weight.
 */
export type Char = "C" | "O" | "D" | "Y";
export const WORD: Char[] = ["C", "O", "D", "Y"];

/** Stroke weights, in units of r. */
export const HAIR = 0.045;
export const BOLD = 0.78;
export const ULTRA = 0.98;

/** Letter centres relative to the centre of the word, in units of r. */
export const LETTER_X = [-4.02, -1.5, 1.33, 4.0];
/** Width of the word at BOLD, in units of r. */
export const WORD_WIDTH = 10.82;
/** Half the cap height at BOLD, in units of r. Baseline sits at +CAP_HALF. */
export const CAP_HALF = 1 + BOLD / 2;

const C_ANGLE = (40 * Math.PI) / 180;
const D_A = 0.5;
const D_X0 = -(1 - D_A) / 2;
const Y_AX = 0.7;
const Y_JY = 0.1;

const useSafeId = () => "g" + useId().replace(/[^a-zA-Z0-9]/g, "");

export const Glyph: React.FC<{
  char: Char;
  /** centre-line radius in px */
  r: number;
  /** stroke weight in px */
  weight: number;
  color: string;
  /** 0..1 draws the letter on, 1 = complete */
  draw?: number;
  /** Y only: draw a single stroke (0 left arm, 1 right arm, 2 stem) */
  only?: number | null;
}> = ({ char, r, weight: w, color, draw = 1, only = null }) => {
  const id = useSafeId();
  const stroke = { fill: "none", stroke: color, strokeWidth: w } as const;
  const dash = (len: number) =>
    draw >= 1 ? undefined : `${Math.max(0, draw) * len} ${len * 3}`;

  if (char === "O") {
    return (
      <path
        d={`M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`}
        {...stroke}
        strokeDasharray={dash(2 * Math.PI * r)}
      />
    );
  }

  if (char === "C") {
    // An arc with butt ends: the terminals point at the centre of the letter.
    const x0 = r * Math.cos(C_ANGLE);
    const y0 = r * Math.sin(C_ANGLE);
    return (
      <path
        d={`M${x0} ${-y0}A${r} ${r} 0 1 0 ${x0} ${y0}`}
        {...stroke}
        strokeDasharray={dash(r * (2 * Math.PI - 2 * C_ANGLE))}
      />
    );
  }

  if (char === "D") {
    const a = D_A * r;
    const x0 = D_X0 * r;
    return (
      <path
        d={`M${x0 - a} ${r}L${x0 - a} ${-r}L${x0} ${-r}A${r} ${r} 0 0 1 ${x0} ${r}Z`}
        {...stroke}
        strokeLinejoin="miter"
        strokeDasharray={dash(2 * r + 2 * a + Math.PI * r)}
      />
    );
  }

  // Y: three bars from one junction, trimmed flat at cap height and baseline.
  const jy = Y_JY * r;
  const reach = draw >= 1 ? 1 + (w * 1.2) / (r + jy) : Math.max(0, draw);
  const tx = Y_AX * r * reach;
  const ty = jy - (r + jy) * reach;
  const stemEnd = draw >= 1 ? r + w : jy + (r - jy) * Math.max(0, draw);
  return (
    <>
      <clipPath id={id}>
        <rect
          x={-3 * r - w}
          y={-(r + w / 2)}
          width={6 * r + 2 * w}
          height={2 * r + w}
        />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {only === null || only === 0 ? (
          <line x1={0} y1={jy} x2={-tx} y2={ty} {...stroke} />
        ) : null}
        {only === null || only === 1 ? (
          <line x1={0} y1={jy} x2={tx} y2={ty} {...stroke} />
        ) : null}
        {only === null || only === 2 ? (
          <line x1={0} y1={jy} x2={0} y2={stemEnd} {...stroke} />
        ) : null}
      </g>
    </>
  );
};

// ---------------------------------------------------------------- the word

export type LetterState = {
  /** px, added to the letter's home position */
  x?: number;
  y?: number;
  /** degrees */
  rot?: number;
  sx?: number;
  sy?: number;
  /** y of the scale pivot in px relative to the letter centre (baseline = squash on the floor) */
  pivot?: number;
  /** stroke weight in units of r */
  weight?: number;
  draw?: number;
  color?: string;
  /** offset of the print plates behind this letter, px */
  plate?: [number, number];
  hidden?: boolean;
};

export const Word: React.FC<{
  r: number;
  /** default weight in units of r */
  weight: number;
  color: string;
  letters: LetterState[] | null;
  /** which plate this copy is: 0 = the letters themselves, 1 and 2 sit behind */
  layer: number;
  plate: [number, number];
}> = ({ r, weight, color, letters, layer, plate }) => {
  return (
    <>
      {WORD.map((char, i) => {
        const s = letters?.[i] ?? {};
        if (s.hidden) return null;
        const [px, py] = s.plate ?? plate;
        // a plate sitting exactly under its letter would only tint the edges
        if (layer > 0 && Math.abs(px) + Math.abs(py) < 0.5) return null;
        const pivot = s.pivot ?? 0;
        return (
          <g
            key={char}
            transform={
              `translate(${LETTER_X[i] * r + (s.x ?? 0) + px * layer} ${(s.y ?? 0) + py * layer}) ` +
              `rotate(${s.rot ?? 0}) translate(0 ${pivot}) scale(${s.sx ?? 1} ${s.sy ?? 1}) translate(0 ${-pivot})`
            }
          >
            <Glyph
              char={char}
              r={r}
              weight={(s.weight ?? weight) * r}
              color={layer === 0 ? (s.color ?? color) : color}
              draw={s.draw ?? 1}
            />
          </g>
        );
      })}
    </>
  );
};

/** The word with its two print plates behind it. */
export const Plated: React.FC<{
  r: number;
  weight: number;
  theme: Theme;
  letters: LetterState[] | null;
  plate: [number, number];
  /** how many plates to print behind the letters: 0, 1 or 2 */
  plates: number;
}> = ({ r, weight, theme, letters, plate, plates }) => {
  return (
    <>
      {plates >= 2 ? (
        <Word
          r={r}
          weight={weight}
          color={theme.p2}
          letters={letters}
          layer={2}
          plate={plate}
        />
      ) : null}
      {plates >= 1 ? (
        <Word
          r={r}
          weight={weight}
          color={theme.p1}
          letters={letters}
          layer={1}
          plate={plate}
        />
      ) : null}
      <Word
        r={r}
        weight={weight}
        color={theme.fg}
        letters={letters}
        layer={0}
        plate={plate}
      />
    </>
  );
};

// ---------------------------------------------------------------- the parts

/**
 * The nine primitives the word is made of: two arcs, two half rings, a bar,
 * a bowl and three more bars. At home, unrotated, they are exactly the letters.
 */
export const PARTS: {
  letter: number;
  /** rotation centre relative to the letter centre, units of r */
  cx: number;
  cy: number;
  /** which side of the letter this part keeps */
  keep: "top" | "bottom" | "left" | "right" | "stem" | "bowl" | "all";
  only: number | null;
}[] = [
  { letter: 0, cx: -0.25, cy: -0.6, keep: "top", only: null },
  { letter: 0, cx: -0.25, cy: 0.6, keep: "bottom", only: null },
  { letter: 1, cx: -0.6, cy: 0, keep: "left", only: null },
  { letter: 1, cx: 0.6, cy: 0, keep: "right", only: null },
  { letter: 2, cx: D_X0 - D_A, cy: 0, keep: "stem", only: null },
  { letter: 2, cx: 0.35, cy: 0, keep: "bowl", only: null },
  { letter: 3, cx: -0.35, cy: -0.45, keep: "all", only: 0 },
  { letter: 3, cx: 0.35, cy: -0.45, keep: "all", only: 1 },
  { letter: 3, cx: 0, cy: 0.55, keep: "all", only: 2 },
];

/** One part, drawn in its letter's coordinate system (origin = letter centre). */
export const PartShape: React.FC<{
  index: number;
  r: number;
  weight: number;
  color: string;
}> = ({ index, r, weight: w, color }) => {
  const id = useSafeId();
  const part = PARTS[index];
  const big = 4 * r + 2 * w;
  const split = (D_X0 - D_A) * r + w / 2;
  const rect =
    part.keep === "top"
      ? { x: -big, y: -big, width: big * 2, height: big + 0.5 }
      : part.keep === "bottom"
        ? { x: -big, y: -0.5, width: big * 2, height: big + 0.5 }
        : part.keep === "left"
          ? { x: -big, y: -big, width: big + 0.5, height: big * 2 }
          : part.keep === "right"
            ? { x: -0.5, y: -big, width: big + 0.5, height: big * 2 }
            : part.keep === "stem"
              ? { x: -big, y: -big, width: big + split + 1, height: big * 2 }
              : part.keep === "bowl"
                ? { x: split + 0.75, y: -big, width: big, height: big * 2 }
                : { x: -big, y: -big, width: big * 2, height: big * 2 };
  return (
    <>
      <clipPath id={id}>
        <rect {...rect} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <Glyph
          char={WORD[part.letter]}
          r={r}
          weight={w}
          color={color}
          only={part.only}
        />
      </g>
    </>
  );
};
