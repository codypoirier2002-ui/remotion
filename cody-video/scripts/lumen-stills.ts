/**
 * Renders frames of LUMEN straight from the engine, without a browser, and
 * tiles them into labelled contact sheets. Same code as the video, so this is
 * the fast way to look at a change.
 *
 *   bun scripts/lumen-stills.ts <outdir> <frame,frame,...> [full]
 *
 * With `full`, every frame is also kept as a 1920x1080 PNG.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { H, W, renderLumen } from "../src/lumen/engine";
import { BEAT_SEC, FPS } from "../src/score";

const [outDir, frameList, mode] = process.argv.slice(2);
if (!outDir || !frameList)
  throw new Error("usage: lumen-stills.ts <outdir> <frame,frame,...> [full]");
const frames = frameList.split(",").map(Number);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const rgba = new Uint8ClampedArray(W * H * 4);
const rgb = Buffer.alloc(W * H * 3);
const header = Buffer.from(`P6\n${W} ${H}\n255\n`);
const tiles: string[] = [];
let spent = 0;
frames.forEach((frame, index) => {
  const started = performance.now();
  renderLumen(frame, rgba);
  spent += performance.now() - started;
  for (let p = 0, q = 0; p < W * H * 4; p += 4, q += 3) {
    rgb[q] = rgba[p];
    rgb[q + 1] = rgba[p + 1];
    rgb[q + 2] = rgba[p + 2];
  }
  const ppm = join(outDir, "frame.ppm");
  writeFileSync(ppm, Buffer.concat([header, rgb]));
  const label = ` f${frame}  ${(frame / FPS).toFixed(2)}s  beat ${(frame / FPS / BEAT_SEC).toFixed(2)} `;
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
