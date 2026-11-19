#!/usr/bin/env bash
# Full pipeline: synthesize the track, render the picture, mux, verify.
#   scripts/render.sh            ->  out/cody.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

echo "1/4  synthesizing the track"
bun scripts/make-music.ts

echo "2/4  rendering 900 frames"
bunx remotion render Cody out/cody-picture.mp4 --log=error 2>&1 | grep -v -i -E "memory|docker" || true

# Remotion pads the AAC stream to a whole number of audio frames (15.019 s).
# Muxing the original WAV again and cutting at 15 s gives a file that is exactly
# 15.000 s in the video stream, the audio stream and the container.
echo "3/4  muxing picture + track"
ffmpeg -y -v error -i out/cody-picture.mp4 -i public/cody-track.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 15 \
  -movflags +faststart out/cody.mp4
rm -f out/cody-picture.mp4

echo "4/4  verifying"
ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,nb_frames,sample_rate,channels \
  -of default=nw=1 out/cody.mp4
