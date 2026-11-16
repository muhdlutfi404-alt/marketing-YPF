#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# INSPECT FOOTAGE — shows what's inside each video file and warns about
# anything that should be fixed with `npm run prepare-footage`.
#
# Usage:  npm run inspect                       (checks public/footage/raw)
#         npm run inspect -- path/to/folder     (checks another folder)
#         npm run inspect -- path/to/clip.mp4   (checks one file)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="${1:-public/footage/raw}"
command -v ffprobe >/dev/null || { echo "❌ ffprobe not found. Install FFmpeg first (see README)."; exit 1; }

shopt -s nullglob nocaseglob
if [ -d "$TARGET" ]; then files=("$TARGET"/*.{mp4,mov,m4v,mkv,avi}); else files=("$TARGET"); fi
shopt -u nocaseglob
[ ${#files[@]} -eq 0 ] && { echo "No videos found in $TARGET — copy your MP4s there first."; exit 0; }

printf "\n%-34s %-11s %-8s %-7s %-8s %-6s %-8s %s\n" "FILE" "SIZE(WxH)" "FPS" "CODEC" "LENGTH" "AUDIO" "MB" "NOTES"
printf '%.0s─' {1..110}; echo
for f in "${files[@]}"; do
  if ! ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" >/dev/null 2>&1; then
    printf "%-34s %s\n" "$(basename "$f" | cut -c1-33)" "❌ unreadable / damaged file — re-copy it from the camera"; continue
  fi
  v=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,r_frame_rate,avg_frame_rate:stream_side_data=rotation -of default=nw=1 "$f" 2>/dev/null || true)
  w=$(echo "$v" | sed -n 's/^width=//p' | head -1); h=$(echo "$v" | sed -n 's/^height=//p' | head -1)
  codec=$(echo "$v" | sed -n 's/^codec_name=//p' | head -1)
  r=$(echo "$v" | sed -n 's/^r_frame_rate=//p' | head -1); a=$(echo "$v" | sed -n 's/^avg_frame_rate=//p' | head -1)
  rot=$(echo "$v" | sed -n 's/^rotation=//p' | head -1)
  fps=$(awk -F/ '{ if ($2>0) printf "%.2f", $1/$2; else print "?" }' <<<"${a:-0/0}")
  rfps=$(awk -F/ '{ if ($2>0) printf "%.2f", $1/$2; else print "?" }' <<<"${r:-0/0}")
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | awk '{printf "%.1fs", $1}')
  hasaudio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f" | head -1)
  mb=$(du -m "$f" | cut -f1)
  notes=()
  [[ "$codec" =~ ^(hevc|h265|prores|dnxhd|vp9|av1)$ ]] && notes+=("$codec→prepare")
  [ "$fps" != "$rfps" ] && notes+=("variable-fps→prepare")
  awk -v f="$fps" 'BEGIN{exit !(f>31)}' && notes+=("high-fps(${fps})")
  { [ "${w:-0}" -gt 1920 ] || [ "${h:-0}" -gt 1920 ]; } && notes+=("4K→prepare")
  [ -n "$rot" ] && [ "$rot" != "0" ] && notes+=("rotated(${rot}°)")
  [ "${h:-0}" -gt "${w:-0}" ] && notes+=("vertical")
  printf "%-34s %-11s %-8s %-7s %-8s %-6s %-8s %s\n" "$(basename "$f" | cut -c1-33)" "${w}x${h}" "$fps" "$codec" "$dur" "$([ -n "$hasaudio" ] && echo yes || echo no)" "$mb" "${notes[*]:-✓ ok}"
done
echo
echo "Tip: run 'npm run prepare-footage' to convert everything into smooth, editor-friendly copies."
