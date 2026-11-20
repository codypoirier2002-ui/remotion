import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { BH, BW } from "./cosmos/engine";
import { camera, renderCosmos } from "./cosmos/shots";
import { C_BEAT, C_FPS, C_FRAMES, shotAt } from "./cosmos/timeline";
import { clamp, spring } from "./motion";

/**
 * COSMOS: a vertical film. A header at the top, the picture in a 16:9 band in
 * the middle, and the era it shows underneath. The picture is one canvas that
 * src/cosmos/shots.ts fills pixel by pixel from the frame number.
 */
const TOP = 657;
const SIDE = 54;
const FONT = '"Inter Display", "Inter", system-ui, sans-serif';
const INK = "#f2efe8";
const MUTED = "#8d8f96";

const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

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
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  // a layout effect runs before the browser paints, so the screenshot always has this frame
  useLayoutEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(BW, BH);
    renderCosmos(frame, image.data);
    context.putImageData(image, 0, 0);
  }, [frame]);

  const t = (frame + 0.5) / C_FPS / C_BEAT;
  const { shot, from, to } = shotAt(t);
  const u = t - from;
  const out = 1 - smooth(to - 0.8, to - 0.15, t);
  const whenIn = smooth(0.1, 0.7, u) * out;
  const whatIn = spring((u - 0.3) * C_BEAT, 2.2, 0.75);
  const cam = camera(frame);
  const ending = smooth(144.6, 146, t);
  const progress = clamp(frame / (C_FRAMES - 1));

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
        {ending > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: ending,
              transform: `translateY(${(1 - ending) * 14}px)`,
            }}
          >
            <div
              style={{
                color: INK,
                fontSize: 76,
                fontWeight: 700,
                letterSpacing: 22,
                marginRight: -22,
              }}
            >
              COSMOS
            </div>
            <div
              style={{
                color: "#c9cbd2",
                fontSize: 25,
                marginTop: 18,
                letterSpacing: 1.5,
              }}
            >
              13.8 billion years · 60 seconds · no images
            </div>
          </div>
        ) : null}
      </div>

      {/* which era, under the picture */}
      {shot.what ? (
        <div
          style={{
            position: "absolute",
            left: SIDE,
            right: SIDE,
            top: TOP + BH + 46,
          }}
        >
          <div
            style={{
              color: "#a9b3c6",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: whenIn,
            }}
          >
            {shot.when}
          </div>
          <div
            style={{
              color: INK,
              fontSize: 50,
              fontWeight: 650,
              marginTop: 10,
              opacity: clamp(whatIn) * out,
              transform: `translateY(${(1 - whatIn) * 18}px)`,
            }}
          >
            {shot.what}
          </div>
        </div>
      ) : null}

      {/* how far through the 13.8 billion years we are */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          right: SIDE,
          top: TOP + BH + 200,
          height: 2,
          background: "#24262c",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: 2,
            background: "#d9d4c7",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${progress * 100}%`,
            top: -4,
            width: 10,
            height: 10,
            marginLeft: -5,
            borderRadius: 5,
            background: INK,
            boxShadow: "0 0 12px 3px rgba(150,190,255,0.55)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
