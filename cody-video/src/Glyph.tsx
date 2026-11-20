import React, { useId } from "react";
import type { Theme } from "./theme";

/**
 * The typeface. Eight letters, drawn here, built only from circles and straight
 * bars with one stroke weight. Because every letter is a stroke, the weight is a
 * live parameter (hairline -> ultra) and every letter can be drawn on.
 *
 * Unit: r = radius of the round letters' centre line. Cap height = 2r + weight.
 */
export type Char = "C" | "O" | "D" | "Y" | "P" | "I" | "R" | "E";
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
/** P and R: straight run of the bowl, bowl radius, where the stem sits. */
const P_B = 0.45;
const P_RB = 0.6;
const P_XS = -(P_B + P_RB) / 2;
const R_XS = -0.575;
/** R: the leg leaves the bowl here and reaches the baseline here (from the stem). */
const R_LEG_FROM = 0.25;
const R_LEG_TO = 0.8;
/** E: arm lengths. */
const E_ARM = 1.15;
const E_MID = 1.0;
const E_XS = -(E_ARM - BOLD / 2) / 2;

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

  if (char === "I") {
    const half = r + w / 2;
    return (
      <line
        x1={0}
        y1={-half}
        x2={0}
        y2={draw >= 1 ? half : -half + 2 * half * Math.max(0, draw)}
        {...stroke}
      />
    );
  }

  if (char === "P" || char === "R") {
    // A stem and a bowl in one stroke. R adds a leg, trimmed flat at the baseline.
    const xs = (char === "P" ? P_XS : R_XS) * r;
    const b = P_B * r;
    const rb = P_RB * r;
    const yb = -r + 2 * rb;
    const body =
      `M${xs} ${r + w / 2}L${xs} ${-r}L${xs + b} ${-r}` +
      `A${rb} ${rb} 0 0 1 ${xs + b} ${yb}L${xs} ${yb}`;
    const reach =
      draw >= 1 ? 1 + (w * 1.2) / (r - yb) : Math.max(0, draw * 2 - 1);
    const lx = xs + R_LEG_FROM * r;
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
          <path
            d={body}
            {...stroke}
            strokeLinejoin="miter"
            strokeDasharray={dash(2 * r + w / 2 + 2 * b + Math.PI * rb)}
          />
          {char === "R" && reach > 0 ? (
            <line
              x1={lx}
              y1={yb}
              x2={lx + (R_LEG_TO - R_LEG_FROM) * r * reach}
              y2={yb + (r - yb) * reach}
              {...stroke}
            />
          ) : null}
        </g>
      </>
    );
  }

  if (char === "E") {
    // A stem and three arms. The arms stop getting fatter before the gaps close.
    const xs = E_XS * r;
    const half = r + w / 2;
    const arm = Math.min(w, 0.84 * r);
    const d = Math.min(1, Math.max(0, draw));
    const armStroke = {
      fill: "none",
      stroke: color,
      strokeWidth: arm,
    } as const;
    return (
      <>
        <line x1={xs} y1={half} x2={xs} y2={half - 2 * half * d} {...stroke} />
        {[-(half - arm / 2), 0, half - arm / 2].map((y, k) => (
          <line
            key={k}
            x1={xs - w / 2}
            y1={y}
            x2={xs - w / 2 + ((k === 1 ? E_MID : E_ARM) * r + w / 2) * d}
            y2={y}
            {...armStroke}
          />
        ))}
      </>
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

/** A word: which letters, and where each one sits (centres in units of r). */
export type WordSpec = { chars: Char[]; x: number[]; width: number };

/** How far each letter reaches left and right of its own centre at BOLD. */
export const EXTENT: Record<Char, [number, number]> = {
  C: [1.39, 0.95],
  O: [1.39, 1.39],
  D: [1.14, 1.14],
  Y: [1.41, 1.41],
  P: [0.915, 0.915],
  I: [0.39, 0.39],
  R: [0.965, 0.965],
  E: [0.77, 0.77],
};

/** Set a word: letters side by side with a hand-picked gap between each pair. */
export const setWord = (chars: Char[], gaps: number[]): WordSpec => {
  let pen = 0;
  const centres: number[] = [];
  chars.forEach((c, i) => {
    if (i > 0) pen += gaps[i - 1];
    pen += EXTENT[c][0];
    centres.push(pen);
    pen += EXTENT[c][1];
  });
  return { chars, x: centres.map((c) => c - pen / 2), width: pen };
};

export const CODY_SPEC: WordSpec = {
  chars: WORD,
  x: LETTER_X,
  width: WORD_WIDTH,
};
export const POIRIER_SPEC = setWord(
  ["P", "O", "I", "R", "I", "E", "R"],
  [0.14, 0.26, 0.34, 0.24, 0.34, 0.24],
);

/** One printing of a word: the letters themselves (layer 0) or a plate behind them. */
export const Letters: React.FC<{
  spec: WordSpec;
  r: number;
  /** default weight in units of r */
  weight: number;
  color: string;
  letters: LetterState[] | null;
  /** which plate this copy is: 0 = the letters themselves, 1 and 2 sit behind */
  layer: number;
  plate: [number, number];
}> = ({ spec, r, weight, color, letters, layer, plate }) => {
  return (
    <>
      {spec.chars.map((char, i) => {
        const s = letters?.[i] ?? {};
        if (s.hidden) return null;
        const [px, py] = s.plate ?? plate;
        // a plate sitting exactly under its letter would only tint the edges
        if (layer > 0 && Math.abs(px) + Math.abs(py) < 0.5) return null;
        const pivot = s.pivot ?? 0;
        return (
          <g
            key={i}
            transform={
              `translate(${spec.x[i] * r + (s.x ?? 0) + px * layer} ${(s.y ?? 0) + py * layer}) ` +
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

/** A word with its two print plates behind it. */
export const PlatedLetters: React.FC<{
  spec: WordSpec;
  r: number;
  weight: number;
  theme: Theme;
  letters: LetterState[] | null;
  plate: [number, number];
  /** how many plates to print behind the letters: 0, 1 or 2 */
  plates: number;
}> = ({ spec, r, weight, theme, letters, plate, plates }) => {
  return (
    <>
      {plates >= 2 ? (
        <Letters
          spec={spec}
          r={r}
          weight={weight}
          color={theme.p2}
          letters={letters}
          layer={2}
          plate={plate}
        />
      ) : null}
      {plates >= 1 ? (
        <Letters
          spec={spec}
          r={r}
          weight={weight}
          color={theme.p1}
          letters={letters}
          layer={1}
          plate={plate}
        />
      ) : null}
      <Letters
        spec={spec}
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

/**
 * A word whose letters overlap. Each letter is printed as a whole (keyline,
 * plates, face) before the next one, in the order given, so a letter lying on
 * another covers it instead of merging with it. The keyline is a thin band of
 * background colour around the face that keeps same-coloured letters apart.
 */
export const StackedLetters: React.FC<{
  spec: WordSpec;
  r: number;
  weight: number;
  theme: Theme;
  letters: LetterState[];
  plate: [number, number];
  /** letter indices, back to front */
  order: number[];
  /** keyline width in px */
  keyline: number;
}> = ({ spec, r, weight, theme, letters, plate, order, keyline }) => {
  return (
    <>
      {order.map((i) => {
        const s = letters[i];
        if (s.hidden) return null;
        const [px, py] = s.plate ?? plate;
        const pivot = s.pivot ?? 0;
        const w = (s.weight ?? weight) * r;
        const at = (layer: number) =>
          `translate(${spec.x[i] * r + (s.x ?? 0) + px * layer} ${(s.y ?? 0) + py * layer}) ` +
          `rotate(${s.rot ?? 0}) translate(0 ${pivot}) scale(${s.sx ?? 1} ${s.sy ?? 1}) translate(0 ${-pivot})`;
        const plates = Math.abs(px) + Math.abs(py) >= 0.5;
        return (
          <g key={i}>
            {keyline > 0 ? (
              <g transform={at(0)}>
                <Glyph
                  char={spec.chars[i]}
                  r={r}
                  weight={w + 2 * keyline}
                  color={theme.bg}
                />
              </g>
            ) : null}
            {plates ? (
              <>
                <g transform={at(2)}>
                  <Glyph
                    char={spec.chars[i]}
                    r={r}
                    weight={w}
                    color={theme.p2}
                  />
                </g>
                <g transform={at(1)}>
                  <Glyph
                    char={spec.chars[i]}
                    r={r}
                    weight={w}
                    color={theme.p1}
                  />
                </g>
              </>
            ) : null}
            <g transform={at(0)}>
              <Glyph
                char={spec.chars[i]}
                r={r}
                weight={w}
                color={s.color ?? theme.fg}
              />
            </g>
          </g>
        );
      })}
    </>
  );
};

/** CODY, one printing. */
export const Word: React.FC<{
  r: number;
  /** default weight in units of r */
  weight: number;
  color: string;
  letters: LetterState[] | null;
  /** which plate this copy is: 0 = the letters themselves, 1 and 2 sit behind */
  layer: number;
  plate: [number, number];
}> = (props) => <Letters spec={CODY_SPEC} {...props} />;

/** CODY with its two print plates behind it. */
export const Plated: React.FC<{
  r: number;
  weight: number;
  theme: Theme;
  letters: LetterState[] | null;
  plate: [number, number];
  /** how many plates to print behind the letters: 0, 1 or 2 */
  plates: number;
}> = (props) => <PlatedLetters spec={CODY_SPEC} {...props} />;

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
