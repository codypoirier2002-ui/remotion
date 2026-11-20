/**
 * COSMOS, remade deep: six moments of ten seconds each, from one point of
 * light to one point of light.
 *
 * 24 fps, like film. At 144 BPM a beat lasts 0.41667 s, which is exactly
 * 10 frames, and a ten-second shot is exactly 24 beats (6 bars). The
 * picture and the soundtrack both read these times.
 */
export const D_FPS = 24;
export const D_BPM = 144;
export const D_BEAT = 60 / D_BPM;
export const D_SECONDS = 60;
export const D_FRAMES = D_FPS * D_SECONDS;
export const SHOT_BEATS = 24;

export type Caption = { from: number; to: number; when: string; what: string };
export type DeepShot = {
  id: "bang" | "galaxy" | "supernova" | "theia" | "asteroid" | "dot";
  /** first beat of the shot */
  from: number;
  /** what the bottom of the frame says, in beats from the start of the film */
  captions: Caption[];
};

export const DEEP_SHOTS: DeepShot[] = [
  {
    id: "bang",
    from: 0,
    captions: [
      {
        from: 8.5,
        to: 18,
        when: "13.8 billion years ago",
        what: "The Big Bang",
      },
      // gone before the dark ages, so it never names the first star
      { from: 18.5, to: 22, when: "380,000 years later", what: "First light" },
    ],
  },
  { id: "galaxy", from: 24, captions: [] },
  { id: "supernova", from: 48, captions: [] },
  { id: "theia", from: 72, captions: [] },
  { id: "asteroid", from: 96, captions: [] },
  { id: "dot", from: 120, captions: [] },
];

/** Which shots are made so far. The others render black. */
export const READY_SHOTS = 1;

// ---------------------------------------------------------------- shot 1: the Big Bang
/** Every moment of the first shot, in beats. The picture and the score both read these. */
export const BANG = {
  /** the point breathes on these */
  heartbeats: [0, 2, 4],
  /** it starts pulling everything in */
  inhale: 4.75,
  /** nothing: no light, no sound */
  silence: 5.5,
  bang: 6,
  /** the fireball reaches the camera */
  engulf: 8,
  /** the drums inside the blast; the core flares on each */
  drums: [8, 10, 12, 13.5, 14, 16, 16.5, 17],
  /**
   * Great tongues of fire that pass right by the camera, each with its own
   * whoosh. `side` is where it passes: -1 left, 1 right; `lift` above or below.
   */
  tongues: [
    { beat: 9.5, side: -1, lift: 0.3 },
    { beat: 11, side: 1, lift: -0.2 },
    { beat: 12.75, side: -1, lift: -0.5 },
    { beat: 14.5, side: 1, lift: 0.45 },
    { beat: 15.75, side: -1, lift: 0.1 },
    { beat: 17.25, side: 1, lift: -0.35 },
  ],
  /** the fire cools and clears: the first light */
  cool: 18,
  /** the light has faded: the dark ages */
  dark: 22,
  /** the first star lights up, where the point was */
  firstStar: 23,
};
