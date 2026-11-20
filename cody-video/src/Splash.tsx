import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { H, W } from "./splash/engine";
import { renderSplash } from "./splash/scene";

/**
 * The fourth piece: thick glossy paint in five loud colours. Like LUMEN it is
 * one canvas whose pixels are all computed from the frame number
 * (src/splash/scene.ts decides where the paint is, src/splash/engine.ts
 * renders it), so it does not play in real time in the Studio.
 */
export const Splash: React.FC = () => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  // a layout effect runs before the browser paints, so the screenshot always has this frame
  useLayoutEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(W, H);
    renderSplash(frame, image.data);
    context.putImageData(image, 0, 0);
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffd60a" }}>
      <Audio src={staticFile("splash-track.wav")} />
      <canvas ref={canvas} width={W} height={H} />
    </AbsoluteFill>
  );
};
