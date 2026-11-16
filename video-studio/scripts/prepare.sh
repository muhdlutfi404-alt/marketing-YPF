#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PREPARE FOOTAGE — converts raw camera/phone files into clean, editor-friendly
# MP4s that preview smoothly in Remotion Studio and render reliably.
#
#   public/footage/raw/*.mp4|mov  ──►  public/footage/ready/<name>.mp4
#
# What it fixes:
#   • HEVC/H.265, ProRes etc.  → H.264 (plays in every browser)
#   • Variable frame rate      → constant frame rate (no audio drift / stutter)
#   • 4K / huge files          → max 1920px on the long side (fast preview)
#   • Rotation metadata        → baked in correctly
#   • Moves metadata to the front of the file for fast seeking
# Originals in raw/ are NEVER modified. Already-prepared files are skipped.
#
# Options (environment variables):
#   FPS=25 npm run prepare-footage        target frame rate (default 30)
#   MAX=3840 npm run prepare-footage      keep up to 4K (default 1920)
#   CRF=16 npm run prepare-footage        quality, lower = better (default 18)
#   FORCE=1 npm run prepare-footage       re-convert even if already done
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
IN=public/footage/raw; OUT=public/footage/ready
FPS="${FPS:-30}"; MAX="${MAX:-1920}"; CRF="${CRF:-18}"; FORCE="${FORCE:-0}"
command -v ffmpeg >/dev/null || { echo "❌ ffmpeg not found. Install FFmpeg first (see README)."; exit 1; }
mkdir -p "$OUT"

shopt -s nullglob nocaseglob
files=("$IN"/*.{mp4,mov,m4v,mkv,avi})
shopt -u nocaseglob
[ ${#files[@]} -eq 0 ] && { echo "No videos in $IN — copy your raw MP4/MOV files there first."; exit 0; }

done_count=0; skip_count=0
for f in "${files[@]}"; do
  name="$(basename "${f%.*}")"
  # make file names safe: lowercase, spaces → dashes
  safe="$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9._-')"
  out="$OUT/$safe.mp4"
  if [ "$FORCE" != "1" ] && [ -f "$out" ] && [ "$out" -nt "$f" ]; then
    echo "⏭  $safe.mp4 already prepared"; skip_count=$((skip_count+1)); continue
  fi
  echo "🎞  Preparing $(basename "$f") → ready/$safe.mp4"
  ffmpeg -hide_banner -loglevel error -stats -y -i "$f" \
    -map "0:v:0" -map "0:a:0?" \
    -vf "scale='if(gte(iw,ih),min($MAX,iw),-2)':'if(gte(iw,ih),-2,min($MAX,ih))':flags=lanczos,fps=$FPS,format=yuv420p" \
    -c:v libx264 -preset medium -crf "$CRF" -profile:v high \
    -c:a aac -b:a 192k -ar 48000 -ac 2 \
    -movflags +faststart \
    "$out"
  done_count=$((done_count+1))
done
echo
echo "✅ Prepared: $done_count   Skipped (already done): $skip_count"
echo "Use them in a template as:  footage/ready/<name>.mp4"
