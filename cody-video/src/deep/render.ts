/**
 * COSMOS, remade deep: which shot draws a frame. Shots that are not made yet
 * render black.
 */
import { renderBang } from "./bang";
import { D_BEAT, D_FPS, READY_SHOTS, SHOT_BEATS } from "./timeline";

/** Render frame `frame` of the film into an RGBA buffer of 1920 x 1080. */
export const renderDeep = (frame: number, rgba: Uint8ClampedArray) => {
  const shot = Math.floor(frame / (SHOT_BEATS * D_BEAT * D_FPS) + 1e-9);
  if (shot >= READY_SHOTS) {
    for (let q = 0; q < rgba.length; q += 4) {
      rgba[q] = 0;
      rgba[q + 1] = 0;
      rgba[q + 2] = 0;
      rgba[q + 3] = 255;
    }
    return;
  }
  renderBang(frame, rgba);
};
