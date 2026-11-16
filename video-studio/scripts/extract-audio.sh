#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EXTRACT AUDIO — pulls the sound out of a clip as a WAV file.
# Useful for: voice-over clean-up, sending to a transcription tool for
# subtitles, or reusing natural sound (wind, river) as an ambience track.
#
# Usage:  npm run extract-audio -- public/footage/raw/interview.mp4
# Output: out/audio/interview.wav
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -lt 1 ] && { echo "Usage: npm run extract-audio -- <video file>"; exit 1; }
mkdir -p out/audio
for f in "$@"; do
  name="$(basename "${f%.*}")"
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 2 -ar 48000 -c:a pcm_s16le "out/audio/$name.wav"
  echo "🎧 out/audio/$name.wav"
done
