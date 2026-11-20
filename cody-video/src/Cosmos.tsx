import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { BH, BW, WIDE, renderSize } from "./cosmos/engine";
import { camera, renderCosmos } from "./cosmos/shots";
import { C_BEAT, C_FPS, C_FRAMES, shotAt } from "./cosmos/timeline";
import { clamp, spring } from "./motion";

/**
 * COSMOS, in two layouts:
 *   Cosmos      vertical: a header at the top, the picture in a 16:9 band in
 *               the middle, and the era it shows underneath
 *   CosmosWide  landscape: the picture fills the frame, the era and the
 *               timeline along the bottom
 * The picture is one canvas that src/cosmos/shots.ts fills pixel by pixel
 * from the frame number; the landscape one is rendered at 1920 wide, not
 * stretched.
 */
const TOP = 657;
const SIDE = 54;
const FONT = '"Inter Display", "Inter", system-ui, sans-serif';
const INK = "#f2efe8";
const MUTED = "#8d8f96";
const SHADOW = "0 2px 20px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.45)";

const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/** The canvas the picture is drawn into, at a scale of the band. */
const useCosmosCanvas = (scale: number) => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  // a layout effect runs before the browser paints, so the screenshot always has this frame
  useLayoutEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const { w, h } = renderSize(scale);
    const image = context.createImageData(w, h);
    renderCosmos(frame, image.data, scale);
    context.putImageData(image, 0, 0);
  }, [frame, scale]);
  return canvas;
};

/** Everything besides the picture that moves with the beat: the caption, the camera, the ending. */
const useCosmosTiming = () => {
  const frame = useCurrentFrame();
  const t = (frame + 0.5) / C_FPS / C_BEAT;
  const { shot, from, to } = shotAt(t);
  const u = t - from;
  const out = 1 - smooth(to - 0.8, to - 0.15, t);
  return {
    shot,
    out,
    whenIn: smooth(0.1, 0.7, u) * out,
    whatIn: spring((u - 0.3) * C_BEAT, 2.2, 0.75),
    cam: camera(frame),
    ending: smooth(144.6, 146, t),
    progress: clamp(frame / (C_FRAMES - 1)),
  };
};
type Timing = ReturnType<typeof useCosmosTiming>;

/** The title at the end, over the picture. `unit` scales every size. */
const EndCard: React.FC<{ timing: Timing; unit: number }> = ({
  timing,
  unit,
}) =>
  timing.ending > 0 ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: timing.ending,
        transform: `translateY(${(1 - timing.ending) * 14 * unit}px)`,
      }}
    >
      <div
        style={{
          color: INK,
          fontSize: 76 * unit,
          fontWeight: 700,
          letterSpacing: 22 * unit,
          marginRight: -22 * unit,
        }}
      >
        COSMOS
      </div>
      <div
        style={{
          color: "#c9cbd2",
          fontSize: 25 * unit,
          marginTop: 18 * unit,
          letterSpacing: 1.5 * unit,
        }}
      >
        13.8 billion years · 60 seconds · no images
      </div>
    </div>
  ) : null;

/** Which era the picture shows: when, then what. */
const Era: React.FC<{
  timing: Timing;
  unit: number;
  shadow: string | null;
  place: React.CSSProperties;
}> = ({ timing, unit, shadow, place }) =>
  timing.shot.what ? (
    <div style={{ position: "absolute", ...place }}>
      <div
        style={{
          color: "#a9b3c6",
          fontSize: 24 * unit,
          fontWeight: 600,
          letterSpacing: 4 * unit,
          textTransform: "uppercase",
          opacity: timing.whenIn,
          textShadow: shadow ?? undefined,
        }}
      >
        {timing.shot.when}
      </div>
      <div
        style={{
          color: INK,
          fontSize: 50 * unit,
          fontWeight: 650,
          marginTop: 10 * unit,
          opacity: clamp(timing.whatIn) * timing.out,
          transform: `translateY(${(1 - timing.whatIn) * 18 * unit}px)`,
          textShadow: shadow ?? undefined,
        }}
      >
        {timing.shot.what}
      </div>
    </div>
  ) : null;

/** How far through the 13.8 billion years we are. */
const Progress: React.FC<{
  timing: Timing;
  unit: number;
  place: React.CSSProperties;
}> = ({ timing, unit, place }) => (
  <div
    style={{
      position: "absolute",
      ...place,
      height: 2 * unit,
      background: "#24262c",
    }}
  >
    <div
      style={{
        width: `${timing.progress * 100}%`,
        height: 2 * unit,
        background: "#d9d4c7",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: `${timing.progress * 100}%`,
        top: -4 * unit,
        width: 10 * unit,
        height: 10 * unit,
        marginLeft: -5 * unit,
        borderRadius: 5 * unit,
        background: INK,
        boxShadow: `0 0 ${12 * unit}px ${3 * unit}px rgba(150,190,255,0.55)`,
      }}
    />
  </div>
);

/** A small mark: the point the film begins and ends with, and an orbit. */
const Emblem: React.FC = () => (
  <svg width={66} height={66} viewBox="0 0 66 66">
    <circle
      cx={33}
      cy={33}
      r={31}
      fill="#111317"
      stroke="#3a3d45"
      strokeWidth={2}
    />
    <ellipse
      cx={33}
      cy={33}
      rx={21}
      ry={8}
      fill="none"
      stroke={INK}
      strokeWidth={1.6}
      transform="rotate(-24 33 33)"
      opacity={0.75}
    />
    <circle cx={33} cy={33} r={4.2} fill={INK} />
    <circle cx={51.5} cy={25} r={2.6} fill="#7fb6ff" />
  </svg>
);

export const Cosmos: React.FC = () => {
  const canvas = useCosmosCanvas(1);
  const timing = useCosmosTiming();
  const { cam, ending } = timing;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      <Audio src={staticFile("cosmos-track.wav")} />

      {/* header */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          top: 348,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Emblem />
        <div>
          <div
            style={{
              color: INK,
              fontSize: 30,
              fontWeight: 650,
              letterSpacing: 0.2,
            }}
          >
            Cody Poirier
          </div>
          <div style={{ color: MUTED, fontSize: 24, marginTop: 2 }}>
            a film made entirely in code
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: SIDE,
          right: SIDE,
          top: 486,
          color: INK,
          fontSize: 33,
          lineHeight: 1.36,
          fontWeight: 450,
        }}
      >
        13.8 billion years of cosmic history
        <br />
        turned into one minute of pure code
      </div>

      {/* the picture */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: TOP,
          width: BW,
          height: BH,
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvas}
          width={BW}
          height={BH}
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${1.05 * cam.zoom})`,
            opacity: 1 - 0.55 * ending,
          }}
        />
        <EndCard timing={timing} unit={1} />
      </div>

      <Era
        timing={timing}
        unit={1}
        shadow={null}
        place={{ left: SIDE, right: SIDE, top: TOP + BH + 46 }}
      />
      <Progress
        timing={timing}
        unit={1}
        place={{ left: SIDE, right: SIDE, top: TOP + BH + 200 }}
      />
    </AbsoluteFill>
  );
};

/** The landscape version: the picture fills 1920 x 1080, the era and the timeline along the bottom. */
export const CosmosWide: React.FC = () => {
  const canvas = useCosmosCanvas(WIDE);
  const timing = useCosmosTiming();
  const { cam, ending } = timing;
  const { w, h } = renderSize(WIDE);
  const margin = 110;

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#000", fontFamily: FONT, overflow: "hidden" }}
    >
      <Audio src={staticFile("cosmos-track.wav")} />
      <canvas
        ref={canvas}
        width={w}
        height={h}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${cam.x * WIDE}px, ${cam.y * WIDE}px) scale(${1.05 * cam.zoom})`,
          opacity: 1 - 0.55 * ending,
        }}
      />
      {/* a soft shade along the bottom, so the words read over a bright picture */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 400,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.68) 100%)",
        }}
      />
      <EndCard timing={timing} unit={1.6} />
      <Era
        timing={timing}
        unit={1.2}
        shadow={SHADOW}
        place={{ left: margin, right: margin, bottom: 138 }}
      />
      <Progress
        timing={timing}
        unit={1.3}
        place={{ left: margin, right: margin, bottom: 86 }}
      />
    </AbsoluteFill>
  );
};
