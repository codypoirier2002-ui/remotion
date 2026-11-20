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
  drums: [8, 10, 12, 13.5, 14, 16, 16.5, 17, 18, 19, 19.5],
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
    { beat: 18.75, side: -1, lift: 0.25 },
  ],
  /**
   * The first light: the fog clears and the sky floods with light, all on
   * this beat. Nine tenths fire, one tenth light: 14 beats from the bang to
   * here, 1.5 from here to the dark.
   */
  cool: 20,
  /** the light has gone: the dark ages */
  dark: 21.5,
  /** the first star lights up, where the point was */
  firstStar: 23,
};

export const DEEP_SHOTS: DeepShot[] = [
  {
    id: "bang",
    from: 0,
    captions: [
      {
        from: BANG.engulf + 0.5,
        to: BANG.cool,
        when: "13.8 billion years ago",
        what: "The Big Bang",
      },
      // comes in on the frame the light does, and goes when the light does
      {
        from: BANG.cool,
        to: BANG.dark + 0.5,
        when: "380,000 years later",
        what: "First light",
      },
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
