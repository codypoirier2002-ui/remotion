/**
 * Renders frames of LUMEN, SPLASH or COSMOS (vertical band, or wide) straight from their engines,
 * without a browser, and tiles them into labelled contact sheets. Same code as
 * the video, so this is the fast way to look at a change. (For COSMOS this is
 * the picture band only, without the vertical frame around it.)
 *
 *   bun scripts/stills.ts <lumen|splash|cosmos|cosmos-wide|deep> <outdir> <frame,frame,...> [full]
 *
 * With `full`, every frame is also kept as a full-size PNG.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WIDE, renderSize } from "../src/cosmos/engine";
import { renderDeep } from "../src/deep/render";
import { D_BEAT, D_FPS } from "../src/deep/timeline";
import { renderCosmos } from "../src/cosmos/shots";
import { C_BEAT, C_FPS } from "../src/cosmos/timeline";
import { H, W, renderLumen } from "../src/lumen/engine";
import { BEAT_SEC, FPS } from "../src/score";
import { renderSplash } from "../src/splash/scene";

const [piece, outDir, frameList, mode] = process.argv.slice(2);
const PIECES = {
  lumen: { render: renderLumen, w: W, h: H, fps: FPS, beat: BEAT_SEC },
  splash: { render: renderSplash, w: W, h: H, fps: FPS, beat: BEAT_SEC },
  cosmos: {
    render: (frame: number, rgba: Uint8ClampedArray) =>
      renderCosmos(frame, rgba, 1),
    w: renderSize(1).w,
    h: renderSize(1).h,
    fps: C_FPS,
    beat: C_BEAT,
  },
  deep: { render: renderDeep, w: W, h: H, fps: D_FPS, beat: D_BEAT },
  "cosmos-wide": {
    render: (frame: number, rgba: Uint8ClampedArray) =>
      renderCosmos(frame, rgba, WIDE),
    w: renderSize(WIDE).w,
    h: renderSize(WIDE).h,
    fps: C_FPS,
    beat: C_BEAT,
  },
};
const chosen = PIECES[piece as keyof typeof PIECES];
if (!chosen || !outDir || !frameList)
  throw new Error(
    "usage: stills.ts <lumen|splash|cosmos|cosmos-wide|deep> <outdir> <frame,frame,...> [full]",
  );
const { render, w: WW, h: HH } = chosen;
const frames = frameList.split(",").map(Number);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const rgba = new Uint8ClampedArray(WW * HH * 4);
const rgb = Buffer.alloc(WW * HH * 3);
const header = Buffer.from(`P6\n${WW} ${HH}\n255\n`);
const tiles: string[] = [];
let spent = 0;
frames.forEach((frame, index) => {
  const started = performance.now();
  render(frame, rgba);
  spent += performance.now() - started;
  for (let p = 0, q = 0; p < WW * HH * 4; p += 4, q += 3) {
    rgb[q] = rgba[p];
    rgb[q + 1] = rgba[p + 1];
    rgb[q + 2] = rgba[p + 2];
  }
  const ppm = join(outDir, "frame.ppm");
  writeFileSync(ppm, Buffer.concat([header, rgb]));
  const label = ` f${frame}  ${(frame / chosen.fps).toFixed(2)}s  beat ${(frame / chosen.fps / chosen.beat).toFixed(2)} `;
  const tile = join(outDir, `t_${String(index).padStart(4, "0")}.png`);
  if (mode === "full")
    execFileSync("convert", [
      ppm,
      join(outDir, `f${String(frame).padStart(4, "0")}.png`),
    ]);
  execFileSync("convert", [
    ppm,
    "-resize",
    "640x360",
    "-gravity",
    "SouthWest",
    "-fill",
    "white",
    "-undercolor",
    "#000000B0",
    "-pointsize",
    "15",
    "-annotate",
    "+4+3",
    label,
    tile,
  ]);
  tiles.push(tile);
  rmSync(ppm);
});
execFileSync("montage", [
  ...tiles,
  "-tile",
  "3x3",
  "-geometry",
  "+2+2",
  "-background",
  "#333",
  join(outDir, "sheet_%d.png"),
]);
for (const t of tiles) rmSync(t);
console.log(
  `${frames.length} frames, ${(spent / frames.length).toFixed(0)} ms each -> ${outDir}`,
);
