#!/usr/bin/env bash
# Full pipeline: synthesize the track, render the picture, mux, verify.
#   scripts/render.sh cody           ->  out/cody.mp4           (15 s)
#   scripts/render.sh poirier        ->  out/poirier.mp4        (15 s)
#   scripts/render.sh cody-poirier   ->  out/cody-poirier.mp4   (30 s, the two joined)
#   scripts/render.sh lumen          ->  out/lumen.mp4          (15 s, no letters)
#   scripts/render.sh splash         ->  out/splash.mp4         (15 s, no letters, loud)
#   scripts/render.sh cosmos         ->  out/cosmos.mp4         (60 s, vertical 1080x1920, 30 fps)
#   scripts/render.sh cosmos-wide    ->  out/cosmos-wide.mp4    (60 s, landscape 1920x1080, 30 fps, same track)
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-cody}"
ENCODE=()
TRACK="$NAME"
case "$NAME" in
  cody)         COMP=Cody;        SECONDS_LONG=15 ;;
  poirier)      COMP=Poirier;     SECONDS_LONG=15 ;;
  cody-poirier) COMP=CodyPoirier; SECONDS_LONG=30 ;;
  # 170,000 moving points are far harder to compress than flat shapes: at the
  # CRF 16 the others use, this one comes out at 53 MB.
  lumen)        COMP=Lumen;       SECONDS_LONG=15; ENCODE=(--crf=20 --x264-preset=slow) ;;
  splash)       COMP=Splash;      SECONDS_LONG=15 ;;
  cosmos)       COMP=Cosmos;      SECONDS_LONG=60; ENCODE=(--crf=20 --x264-preset=slow) ;;
  cosmos-wide)  COMP=CosmosWide;  SECONDS_LONG=60; ENCODE=(--crf=20 --x264-preset=slow); TRACK=cosmos ;;
  *) echo "unknown piece: $NAME" >&2; exit 1 ;;
esac
mkdir -p out

echo "1/4  synthesizing the track"
bun scripts/make-music.ts "$TRACK"

echo "2/4  rendering $COMP"
bunx remotion render "$COMP" "out/$NAME-picture.mp4" "${ENCODE[@]}" --log=error 2>&1 | grep -v -i -E "memory|docker" || true

# Remotion pads the AAC stream to a whole number of audio frames (+19 ms).
# Muxing the original WAV again and cutting at the exact length gives a file
# whose video stream, audio stream and container all agree to the microsecond.
# -aac_pns 0: ffmpeg's noise substitution threw full-scale spikes on the claps.
echo "3/4  muxing picture + track"
ffmpeg -y -v error -i "out/$NAME-picture.mp4" -i "public/$TRACK-track.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -aac_pns 0 -b:a 320k -ar 48000 -t "$SECONDS_LONG" \
  -movflags +faststart "out/$NAME.mp4"
rm -f "out/$NAME-picture.mp4"

echo "4/4  verifying"
ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,nb_frames,sample_rate,channels \
  -of default=nw=1 "out/$NAME.mp4"
