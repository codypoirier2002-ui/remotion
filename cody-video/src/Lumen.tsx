import { Audio } from "@remotion/media";
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { H, W, renderLumen } from "./lumen/engine";

/**
 * The third piece: no letters. One canvas; src/lumen/engine.ts computes every
 * pixel of it from the frame number. A frame takes about a third of a second,
 * so the Studio preview does not play in real time: render it to see it move.
 */
export const Lumen: React.FC = () => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  // a layout effect runs before the browser paints, so the screenshot always has this frame
  useLayoutEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(W, H);
    renderLumen(frame, image.data);
    context.putImageData(image, 0, 0);
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#02030a" }}>
      <Audio src={staticFile("lumen-track.wav")} />
      <canvas ref={canvas} width={W} height={H} />
    </AbsoluteFill>
  );
};
