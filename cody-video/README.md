# CODY

A 15-second title piece built around four letters. 1920×1080, 60 fps, with a
soundtrack synthesized from scratch. Everything is code: no fonts, no images,
no samples.

- **The video:** [`cody.mp4`](./cody.mp4)
- **What was decided and why (Spanish):** [`DECISIONES.md`](./DECISIONES.md)

## Run it

```console
bun install
bun run dev            # Remotion Studio, composition "Cody"
scripts/render.sh      # synth + render + mux + verify  ->  out/cody.mp4
```

`scripts/render.sh` needs `ffmpeg` and `ffprobe` on the path.

## How it fits together

| File | What it is |
| --- | --- |
| `src/score.ts` | The score: tempo, every note, every drum hit. Read by both the synth and the visuals. |
| `scripts/make-music.ts` | The synthesizer. Oscillators, noise, filters, reverb, delay. Writes `public/cody-track.wav`. |
| `src/Glyph.tsx` | The typeface: C, O, D and Y drawn as strokes, so weight is a live parameter. |
| `src/motion.ts` | Springs, pops, wobbles. All timing is in beats. |
| `src/Backdrop.tsx` | Background, dot grid that ripples on hits, paper grain, camera shake. |
| `src/scenes/*.tsx` | One scene per bar of the track. |
| `src/Cody.tsx` | Puts the scenes on the bar lines. |
| `scripts/review.sh`, `scripts/strip.sh` | Contact sheets of stills, used for the review passes. |
| `scripts/analyze-audio.py` | Spectral balance per section of the track. |
