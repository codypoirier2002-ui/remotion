# CODY · POIRIER · LUMEN · SPLASH

Two 15-second title pieces, one per name; a 30-second cut where the first
flows into the second and ends on the whole name; and two 15-second pieces
with no letters at all, each in its own style: LUMEN (points of light in the
dark) and SPLASH (thick glossy paint in loud colours). 1920×1080, 60 fps, each
with a soundtrack synthesized from scratch. Everything is code: no fonts, no
images, no samples.

| File | What it is |
| --- | --- |
| [`cody.mp4`](./cody.mp4) | CODY, 15 s |
| [`poirier.mp4`](./poirier.mp4) | POIRIER, 15 s. Stands on its own. |
| [`cody-poirier.mp4`](./cody-poirier.mp4) | Both, joined, 30 s. Ends on `CODY POIRIER.` |
| [`lumen.mp4`](./lumen.mp4) | LUMEN, 15 s. No words: 170,000 points of light, one continuous shot. |
| [`splash.mp4`](./splash.mp4) | SPLASH, 15 s. No words: liquid paint that floods the screen in a new colour on the beat. |
| [`DECISIONES.md`](./DECISIONES.md) | What was decided and why (Spanish) |

## Run it

```console
bun install
bun run dev                      # Remotion Studio: Cody, Poirier, CodyPoirier, Lumen, Splash
scripts/render.sh cody           # synth + render + mux + verify -> out/cody.mp4
scripts/render.sh poirier        #                               -> out/poirier.mp4
scripts/render.sh cody-poirier   #                               -> out/cody-poirier.mp4
scripts/render.sh lumen          #                               -> out/lumen.mp4
scripts/render.sh splash         #                               -> out/splash.mp4
```

`scripts/render.sh` needs `ffmpeg` and `ffprobe` on the path.

LUMEN and SPLASH compute every pixel on the CPU, a fraction of a second per
frame, so they do not play in real time in the Studio. Render them to see them
move, or look at stills without a browser:

```console
bun scripts/stills.ts lumen /tmp/lumen 0,27,300,470,880     # contact sheet
bun scripts/stills.ts splash /tmp/splash 0,27,300,470,880
```

## How it fits together

| File | What it is |
| --- | --- |
| `src/score.ts`, `src/score-poirier.ts`, `src/score-lumen.ts`, `src/score-splash.ts` | The scores: tempo, every note, every drum hit. Read by both the synth and the visuals. |
| `scripts/make-music.ts` | The synthesizer. Oscillators, noise, filters, reverb, delay. Plays one score, or two back to back in a single pass. |
| `src/Glyph.tsx` | The typeface: eight letters drawn as strokes, so weight is a live parameter. |
| `src/motion.ts` | Springs, pops, wobbles. All timing is in beats. |
| `src/Backdrop.tsx` | Background, dot grid that ripples on hits, paper grain, camera shake. |
| `src/scenes/*.tsx` | CODY: one scene per bar of the track. |
| `src/poirier/*.tsx` | POIRIER: one scene per bar, plus the join. |
| `src/Cody.tsx`, `src/Poirier.tsx`, `src/CodyPoirier.tsx` | Put the scenes on the bar lines. |
| `src/lumen/engine.ts` | LUMEN: the points, the forms they fold into, the choreography, and a small software renderer (depth of field, motion blur, bloom, film response). |
| `src/splash/engine.ts` | SPLASH: a metaball renderer. Blobs add to a field, paint is where the field is high, and the edge is bevelled and lit so it looks wet. |
| `src/splash/scene.ts` | SPLASH: where every blob of paint is at a given beat. |
| `src/Lumen.tsx`, `src/Splash.tsx` | One canvas each, which its engine fills, plus the track. |
| `scripts/review.sh`, `scripts/strip.sh`, `scripts/stills.ts` | Contact sheets of stills, used for the review passes. |
| `scripts/analyze-audio.py` | Spectral balance per section of a track. |
