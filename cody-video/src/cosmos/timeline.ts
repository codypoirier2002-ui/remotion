/**
 * COSMOS: 13.8 billion years in one minute.
 *
 * One beat grid for the picture and the soundtrack. At 150 BPM a beat is
 * 0.4 s, which is exactly 12 frames at 30 fps, so every cut and every hit
 * lands on a whole frame.
 */
export const C_FPS = 30;
export const C_BPM = 150;
export const C_BEAT = 60 / C_BPM;
export const C_SECONDS = 60;
export const C_FRAMES = C_FPS * C_SECONDS;
export const C_BEATS = C_SECONDS / C_BEAT;

export type ShotId =
  | "void"
  | "bang"
  | "stars"
  | "galaxy"
  | "supernova"
  | "sun"
  | "impact"
  | "ocean"
  | "life"
  | "forest"
  | "asteroid"
  | "fire"
  | "cities"
  | "rocket"
  | "home"
  | "end";

/** `when` and `what` are the two lines under the picture. */
export type Shot = { id: ShotId; from: number; when: string; what: string };

/** Every shot, in beats. A shot runs until the next one starts. */
export const SHOTS: Shot[] = [
  { id: "void", from: 0, when: "Before time", what: "One point" },
  {
    id: "bang",
    from: 12,
    when: "13.8 billion years ago",
    what: "The Big Bang",
  },
  {
    id: "stars",
    from: 24,
    when: "13.6 billion years ago",
    what: "The first stars",
  },
  {
    id: "galaxy",
    from: 32,
    when: "13.5 billion years ago",
    what: "Galaxies take shape",
  },
  {
    id: "supernova",
    from: 44,
    when: "Billions of years",
    what: "Stars die and forge the elements",
  },
  {
    id: "sun",
    from: 52,
    when: "4.6 billion years ago",
    what: "The Sun is born",
  },
  {
    id: "impact",
    from: 60,
    when: "4.5 billion years ago",
    what: "Earth is hit. The Moon forms",
  },
  {
    id: "ocean",
    from: 72,
    when: "4.4 billion years ago",
    what: "The first oceans",
  },
  { id: "life", from: 80, when: "3.5 billion years ago", what: "Life" },
  {
    id: "forest",
    from: 96,
    when: "385 million years ago",
    what: "The first forests",
  },
  {
    id: "asteroid",
    from: 104,
    when: "66 million years ago",
    what: "The asteroid",
  },
  { id: "fire", from: 112, when: "1 million years ago", what: "Fire" },
  {
    id: "cities",
    from: 120,
    when: "The last 10,000 years",
    what: "Cities",
  },
  { id: "rocket", from: 128, when: "1957", what: "Into space" },
  { id: "home", from: 136, when: "Today", what: "One pale blue dot" },
  { id: "end", from: 144, when: "", what: "" },
];

export const shotAt = (beat: number) => {
  let i = 0;
  while (i < SHOTS.length - 1 && beat >= SHOTS[i + 1].from) i++;
  const to = i < SHOTS.length - 1 ? SHOTS[i + 1].from : C_BEATS;
  return { shot: SHOTS[i], index: i, from: SHOTS[i].from, to };
};

// ---------------------------------------------------------------- the hits
/** The biggest moments: a white flash, a camera kick and a boom in the score. */
export const BIG_HITS = [12, 48, 68, 108, 144];
/** Each new star in the dark ages lights on one of these. */
export const STAR_BEATS = [25, 26, 27, 28, 29, 29.5, 30, 30.5, 31, 31.25, 31.5];
/** Lightning in the storm over the first ocean. */
export const LIGHTNING_BEATS = [73, 75, 76.5, 77.5, 78.5];
/** The first cell divides on each of these. */
export const DIVIDE_BEATS = [84, 88, 92];
/** The drums of the last third, one hit per beat: the cut lands on the first. */
export const TAIKO_FROM = 112;
