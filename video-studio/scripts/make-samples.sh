#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MAKE SAMPLE FOOTAGE — creates 3 small synthetic "raw" clips so you can try
# the whole workflow (inspect → prepare → preview → render) before you have
# your own footage. They deliberately mimic real-world problems:
#   • sample-landscape-60fps.mp4  1080p at 60 fps (like a GoPro / drone)
#   • sample-vertical-phone.mp4   vertical 1080x1920 in HEVC (like an iPhone)
#   • sample-kitchen.mp4          warm abstract B-roll
# Output goes to public/footage/raw (ignored by Git).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=public/footage/raw; mkdir -p "$RAW"
FF="ffmpeg -hide_banner -loglevel error -y"
FILTERS="$(ffmpeg -hide_banner -filters 2>/dev/null || true)"
ENCODERS="$(ffmpeg -hide_banner -encoders 2>/dev/null || true)"
label() { # drawtext if available, otherwise no label
  if grep -q " drawtext " <<<"$FILTERS"; then
    echo ",drawtext=text='$1':fontcolor=white@0.8:fontsize=h/18:x=(w-text_w)/2:y=h-h/8:box=1:boxcolor=black@0.35:boxborderw=20"
  fi
}
if grep -q libx265 <<<"$ENCODERS"; then HEVC="libx265"; TAG="-tag:v hvc1"; X265="-x265-params log-level=error"; else HEVC="libx264"; TAG=""; X265=""; fi

echo "→ sample-landscape-60fps.mp4"
$FF -f lavfi -i "gradients=s=1920x1080:r=60:d=10:c0=0x0b1d33:c1=0x2f6d8c:c2=0xe8833a:c3=0x1b2a19:speed=0.015:type=radial" \
  -f lavfi -i "anoisesrc=d=10:c=brown:a=0.2" \
  -vf "noise=alls=8:allf=t$(label 'SAMPLE · LANDSCAPE 60FPS')" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$RAW/sample-landscape-60fps.mp4"

echo "→ sample-vertical-phone.mp4 ($HEVC)"
$FF -f lavfi -i "gradients=s=1080x1920:r=30:d=8:c0=0x6f8f73:c1=0x8cc0d6:c2=0x1b2f21:speed=0.02" \
  -vf "noise=alls=6:allf=t$(label 'SAMPLE · VERTICAL PHONE')" -c:v "$HEVC" -pix_fmt yuv420p $TAG $X265 "$RAW/sample-vertical-phone.mp4"

echo "→ sample-kitchen.mp4"
$FF -f lavfi -i "mandelbrot=s=1280x720:r=30:start_scale=2.5:end_scale=0.6:inner=convergence" -t 8 \
  -vf "hue=h=25:s=1.4,eq=brightness=0.05:saturation=1.3,gblur=sigma=6$(label 'SAMPLE · B-ROLL')" -c:v libx264 -pix_fmt yuv420p "$RAW/sample-kitchen.mp4"

echo "✓ Sample raw clips created in $RAW"
echo "Next: npm run inspect   then   npm run prepare-footage"
