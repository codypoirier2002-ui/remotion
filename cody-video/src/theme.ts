/** Four colours, nothing else. */
export const INK = "#101014";
export const BONE = "#F3EDE2";
export const VERMILION = "#FF4A1C";
export const COBALT = "#2A3CFF";

export type Theme = {
  bg: string;
  /** the letters */
  fg: string;
  /** first print plate behind the letters */
  p1: string;
  /** second print plate */
  p2: string;
  /** dot grid, a hair off the background */
  dot: string;
};

export const THEMES = {
  ink: { bg: INK, fg: BONE, p1: VERMILION, p2: COBALT, dot: "#30303B" },
  vermilion: { bg: VERMILION, fg: BONE, p1: INK, p2: COBALT, dot: "#E23A0E" },
  bone: { bg: BONE, fg: INK, p1: VERMILION, p2: COBALT, dot: "#D9D0BF" },
  cobalt: { bg: COBALT, fg: BONE, p1: INK, p2: VERMILION, dot: "#1C2CDD" },
} satisfies Record<string, Theme>;
