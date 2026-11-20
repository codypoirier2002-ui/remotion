import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { H, W } from "./deep/engine";
import { renderDeep } from "./deep/render";
import { D_BEAT, D_FPS, D_FRAMES, DEEP_SHOTS } from "./deep/timeline";
import { clamp, spring } from "./motion";

/**
 * COSMOS, remade deep: six moments of ten seconds, landscape. The picture is
 * one canvas that src/deep/ fills pixel by pixel from the frame number; along
 * the bottom, what the moment is and how far through the film we are.
 */
const FONT = '"Inter Display", "Inter", system-ui, sans-serif';
const INK = "#f2efe8";
const SHADOW = "0 2px 20px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.45)";
const MARGIN = 110;

const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

export const CosmosDeep: React.FC = () => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  // a layout effect runs before the browser paints, so the screenshot always has this frame
  useLayoutEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(W, H);
    renderDeep(frame, image.data);
    context.putImageData(image, 0, 0);
  }, [frame]);

  // the caption showing now, if any
  const b = (frame + 0.5) / D_FPS / D_BEAT;
  const caption =
    DEEP_SHOTS.flatMap((s) => s.captions).find(
      (c) => b >= c.from && b < c.to,
    ) ?? null;
  const u = caption ? b - caption.from : 0;
  const out = caption ? 1 - smooth(caption.to - 0.8, caption.to - 0.15, b) : 0;
  const whenIn = smooth(0.1, 0.7, u) * out;
  const whatIn = spring((u - 0.3) * D_BEAT, 2.2, 0.75);
  const progress = clamp(frame / (D_FRAMES - 1));
  const unit = 1.3;

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#000", fontFamily: FONT, overflow: "hidden" }}
    >
      <Audio src={staticFile("deep-track.wav")} />
      <canvas
        ref={canvas}
        width={W}
        height={H}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
      {/* a soft shade along the bottom, so the words read over a bright picture */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 360,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: MARGIN,
            right: MARGIN,
            bottom: 138,
          }}
        >
          <div
            style={{
              color: "#c3c8d2",
              fontSize: 24 * 1.2,
              fontWeight: 600,
              letterSpacing: 4 * 1.2,
              textTransform: "uppercase",
              opacity: whenIn,
              textShadow: SHADOW,
            }}
          >
            {caption.when}
          </div>
          <div
            style={{
              color: INK,
              fontSize: 50 * 1.2,
              fontWeight: 650,
              marginTop: 10 * 1.2,
              opacity: clamp(whatIn) * out,
              transform: `translateY(${(1 - whatIn) * 18 * 1.2}px)`,
              textShadow: SHADOW,
            }}
          >
            {caption.what}
          </div>
        </div>
      ) : null}
      {/* how far through the 13.8 billion years we are */}
      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          bottom: 86,
          height: 2 * unit,
          background: "rgba(255,255,255,0.14)",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: 2 * unit,
            background: "#d9d4c7",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${progress * 100}%`,
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
    </AbsoluteFill>
  );
};
