# CODY · POIRIER · LUMEN · SPLASH · COSMOS

Two 15-second title pieces, one per name; a 30-second cut where the first
flows into the second and ends on the whole name; and two 15-second pieces
with no letters at all, each in its own style: LUMEN (points of light in the
dark) and SPLASH (thick glossy paint in loud colours). 1920×1080, 60 fps. And
COSMOS, a one-minute vertical film (1080×1920, 30 fps) that tells the history
of the universe, made after a reference video. Each has a soundtrack
synthesized from scratch. Everything is code: no images, no samples.

| File | What it is |
| --- | --- |
| [`cody.mp4`](./cody.mp4) | CODY, 15 s |
| [`poirier.mp4`](./poirier.mp4) | POIRIER, 15 s. Stands on its own. |
| [`cody-poirier.mp4`](./cody-poirier.mp4) | Both, joined, 30 s. Ends on `CODY POIRIER.` |
| [`lumen.mp4`](./lumen.mp4) | LUMEN, 15 s. No words: 170,000 points of light, one continuous shot. |
| [`splash.mp4`](./splash.mp4) | SPLASH, 15 s. No words: liquid paint that floods the screen in a new colour on the beat. |
| [`cosmos.mp4`](./cosmos.mp4) | COSMOS, 60 s, vertical. 13.8 billion years in sixteen shots, from one point of light to the Earth seen as one. |
| [`cosmos-wide.mp4`](./cosmos-wide.mp4) | COSMOS, 60 s, landscape 1920×1080: the picture full frame, the era and the timeline along the bottom. |
| [`DECISIONES.md`](./DECISIONES.md) | What was decided and why (Spanish) |

## Run it

```console
bun install
bun run dev                      # Remotion Studio: Cody, Poirier, CodyPoirier, Lumen, Splash, Cosmos, CosmosWide
scripts/render.sh cody           # synth + render + mux + verify -> out/cody.mp4
scripts/render.sh poirier        #                               -> out/poirier.mp4
scripts/render.sh cody-poirier   #                               -> out/cody-poirier.mp4
scripts/render.sh lumen          #                               -> out/lumen.mp4
scripts/render.sh splash         #                               -> out/splash.mp4
scripts/render.sh cosmos         #                               -> out/cosmos.mp4
scripts/render.sh cosmos-wide    #                               -> out/cosmos-wide.mp4
```

`scripts/render.sh` needs `ffmpeg` and `ffprobe` on the path.

LUMEN, SPLASH and COSMOS compute every pixel on the CPU, a fraction of a
second per frame, so they do not play in real time in the Studio. Render them
to see them move, or look at stills without a browser:

```console
bun scripts/stills.ts lumen /tmp/lumen 0,27,300,470,880     # contact sheet
bun scripts/stills.ts splash /tmp/splash 0,27,300,470,880
bun scripts/stills.ts cosmos /tmp/cosmos 150,500,1300,1700        # picture band only
bun scripts/stills.ts cosmos-wide /tmp/wide 150,500,1300,1700    # the same, at 1920 wide
```

COSMOS's captions use the Inter typeface if the machine has it installed, and
the system sans-serif otherwise.

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
| `src/cosmos/timeline.ts` | COSMOS: the sixteen shots and every hit, in beats. Read by the picture and the score. |
| `src/cosmos/engine.ts` | COSMOS: a small renderer. Light added up in a pyramid of images, fractal noise, lit spheres, silhouettes, and a film look (bloom, lens streak, film curve, grade, grain). Renders at any scale of the band: the landscape version is computed at 1920 wide, not stretched. |
| `src/cosmos/shots.ts` | COSMOS: what each shot shows at a given beat, and the camera. |
| `src/cosmos/score.ts` | COSMOS: the trailer score. |
| `src/Lumen.tsx`, `src/Splash.tsx`, `src/Cosmos.tsx` | One canvas each, which its engine fills, plus the track. `Cosmos.tsx` lays out both versions of COSMOS: vertical (header, picture band, captions) and `CosmosWide` (picture full frame, captions and timeline along the bottom). |
| `scripts/review.sh`, `scripts/strip.sh`, `scripts/stills.ts` | Contact sheets of stills, used for the review passes. |
| `scripts/analyze-audio.py` | Spectral balance per section of a track. |
