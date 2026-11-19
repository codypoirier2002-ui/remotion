#!/usr/bin/env bash
# Pull exact frames out of a rendered MP4 and tile them, to review the encoded file itself.
#   scripts/strip.sh <video> <outfile.png> <cols> <frame> <frame> ...
set -euo pipefail
VIDEO="$1"; OUT="$2"; COLS="$3"; shift 3
TMP=$(mktemp -d)
i=0
for n in "$@"; do
  ffmpeg -v error -y -i "$VIDEO" -vf "select=eq(n\,$n),scale=480:270" -frames:v 1 "$TMP/raw.png"
  t=$(python3 -c "print(f'{$n/60:.2f}s  beat {$n/60/(60/132):.2f}')")
  convert "$TMP/raw.png" -gravity SouthWest -fill white -undercolor '#000000B0' -pointsize 15 -annotate +4+3 " f$n  $t " "$TMP/t_$(printf %04d $i).png"
  i=$((i+1))
done
montage "$TMP"/t_*.png -tile "${COLS}x" -geometry +2+2 -background '#333' "$OUT"
rm -rf "$TMP"
