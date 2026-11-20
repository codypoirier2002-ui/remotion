#!/usr/bin/env bash
# Render a set of frames and tile them into labelled contact sheets for review.
#   scripts/review.sh <composition> <label> <outdir> <frame,frame,...> [scale]
set -euo pipefail
COMP="$1"; LABEL="$2"; OUT="$3"; FRAMES="$4"; SCALE="${5:-0.5}"
DIR="$OUT/$LABEL"
rm -rf "$DIR"; mkdir -p "$DIR/frames"
bunx remotion render "$COMP" "$DIR/frames" --frames="$FRAMES" --image-format=png --scale="$SCALE" --log=error 2>&1 | grep -v -i -E "memory|docker" || true
cd "$DIR/frames"
i=0
for f in $(ls *.png | sort); do
  n=$(echo "$f" | grep -o -E '[0-9]+' | tail -1 | sed 's/^0*//'); n=${n:-0}
  t=$(python3 -c "print(f'{$n/60:.2f}s  beat {($n/60/(60/132))%33:.2f}')")
  convert "$f" -resize 480x270 -gravity SouthWest -fill white -undercolor '#000000B0' -pointsize 15 -annotate +4+3 " f$n  $t " "../t_$(printf %04d $i).png"
  i=$((i+1))
done
cd ..
montage t_*.png -tile 4x4 -geometry +2+2 -background '#333' "sheet_%d.png"
rm -f t_*.png
ls sheet_*.png
