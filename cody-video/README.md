# CODY · POIRIER · LUMEN

Two 15-second title pieces, one per name; a 30-second cut where the first
flows into the second and ends on the whole name; and LUMEN, a third 15-second
piece in a different style with no letters at all. 1920×1080, 60 fps, each
with a soundtrack synthesized from scratch. Everything is code: no fonts, no
images, no samples.

| File | What it is |
| --- | --- |
| [`cody.mp4`](./cody.mp4) | CODY, 15 s |
| [`poirier.mp4`](./poirier.mp4) | POIRIER, 15 s. Stands on its own. |
| [`cody-poirier.mp4`](./cody-poirier.mp4) | Both, joined, 30 s. Ends on `CODY POIRIER.` |
| [`lumen.mp4`](./lumen.mp4) | LUMEN, 15 s. No words: 170,000 points of light, one continuous shot. |
| [`DECISIONES.md`](./DECISIONES.md) | What was decided and why (Spanish) |

## Run it

```console
bun install
bun run dev                      # Remotion Studio: Cody, Poirier, CodyPoirier, Lumen
scripts/render.sh cody           # synth + render + mux + verify -> out/cody.mp4
scripts/render.sh poirier        #                               -> out/poirier.mp4
scripts/render.sh cody-poirier   #                               -> out/cody-poirier.mp4
scripts/render.sh lumen          #                               -> out/lumen.mp4
```

`scripts/render.sh` needs `ffmpeg` and `ffprobe` on the path.

LUMEN computes every pixel on the CPU, about a third of a second per frame, so
it does not play in real time in the Studio. Render it to see it move, or look
at stills without a browser:

```console
bun scripts/lumen-stills.ts /tmp/lumen 0,27,300,470,880   # contact sheet
```

## How it fits together

| File | What it is |
| --- | --- |
| `src/score.ts`, `src/score-poirier.ts`, `src/score-lumen.ts` | The scores: tempo, every note, every drum hit. Read by both the synth and the visuals. |
| `scripts/make-music.ts` | The synthesizer. Oscillators, noise, filters, reverb, delay. Plays one score, or two back to back in a single pass. |
| `src/Glyph.tsx` | The typeface: eight letters drawn as strokes, so weight is a live parameter. |
| `src/motion.ts` | Springs, pops, wobbles. All timing is in beats. |
| `src/Backdrop.tsx` | Background, dot grid that ripples on hits, paper grain, camera shake. |
| `src/scenes/*.tsx` | CODY: one scene per bar of the track. |
| `src/poirier/*.tsx` | POIRIER: one scene per bar, plus the join. |
| `src/Cody.tsx`, `src/Poirier.tsx`, `src/CodyPoirier.tsx` | Put the scenes on the bar lines. |
| `src/lumen/engine.ts` | LUMEN: the points, the forms they fold into, the choreography, and a small software renderer (depth of field, motion blur, bloom, film response). |
| `src/Lumen.tsx` | One canvas that the engine fills, plus the track. |
| `scripts/review.sh`, `scripts/strip.sh`, `scripts/lumen-stills.ts` | Contact sheets of stills, used for the review passes. |
| `scripts/analyze-audio.py` | Spectral balance per section of a track. |
