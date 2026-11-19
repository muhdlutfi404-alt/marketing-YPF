#!/usr/bin/env bash
# Generates ORIGINAL, royalty-free food & UI sound effects with FFmpeg (synthesised from
# sine waves + noise — no samples, no copyright issues). Re-run any time:
#   bash scripts/generate-food-sfx.sh
# Output: public/sfx/*.mp3 (adds new files; the starter library is left untouched)
set -euo pipefail
cd "$(dirname "$0")/.."
SFX=public/sfx
mkdir -p "$SFX"
FF="ffmpeg -hide_banner -loglevel error -y"
ENC="-ac 2 -ar 44100 -c:a libmp3lame -b:a 160k"

echo "→ click (subtle UI tick for labels/cards)"
$FF -f lavfi -i "aevalsrc='0.55*sin(2*PI*1800*t)*exp(-t*160)+0.35*sin(2*PI*3600*t)*exp(-t*220)':d=0.08:s=44100" $ENC "$SFX/click.mp3"

echo "→ slice (knife swish + light metallic ring)"
$FF -f lavfi -i "anoisesrc=d=0.5:c=white:a=1" \
  -f lavfi -i "aevalsrc='0.12*sin(2*PI*3150*t)*exp(-t*9)*gte(t,0.16)+0.08*sin(2*PI*4720*t)*exp(-t*11)*gte(t,0.16)':d=0.5:s=44100" \
  -filter_complex "[0]highpass=f=2500,lowpass=f=9000,volume='1.4*exp(-pow((t-0.14)/0.06,2))':eval=frame[s];[s][1]amix=inputs=2:normalize=0,alimiter=limit=0.9" $ENC "$SFX/slice.mp3"

echo "→ thud (tenderiser on meat — katok)"
$FF -f lavfi -i "aevalsrc='0.9*sin(2*PI*(70+90*exp(-t*40))*t)*exp(-t*18)':d=0.35:s=44100" \
  -f lavfi -i "anoisesrc=d=0.35:c=pink:a=1" \
  -filter_complex "[1]lowpass=f=1200,asetnsamples=32,volume='0.6*exp(-t*45)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95" $ENC "$SFX/thud.mp3"

echo "→ crumble (breadcrumbs sprinkle)"
$FF -f lavfi -i "anoisesrc=d=1.1:c=white:a=1" \
  -af "highpass=f=1800,lowpass=f=8000,asetnsamples=64,volume='0.9*(0.5+0.5*sin(2*PI*37*t)*sin(2*PI*23*t))*(1-exp(-t*20))*exp(-t*2.2)':eval=frame,afade=t=out:st=0.9:d=0.2,alimiter=limit=0.9" $ENC "$SFX/crumble.mp3"

echo "→ sizzle (frying ambience, 6s loopable)"
$FF -f lavfi -i "anoisesrc=d=6:c=white:a=1" \
  -f lavfi -i "anoisesrc=d=6:c=white:a=1:seed=7" \
  -filter_complex "[0]highpass=f=3000,lowpass=f=10000,volume=0.25[h];[1]highpass=f=2000,asetnsamples=16,volume='pow(abs(sin(2*PI*13*t)*sin(2*PI*7.3*t)*sin(2*PI*3.1*t)),6)*1.6':eval=frame[c];[h][c]amix=inputs=2:normalize=0,afade=t=in:d=0.4,afade=t=out:st=5.4:d=0.6,alimiter=limit=0.9" $ENC "$SFX/sizzle.mp3"

echo "→ box (cardboard box landing — bulk order)"
$FF -f lavfi -i "aevalsrc='0.8*sin(2*PI*(110+60*exp(-t*30))*t)*exp(-t*14)':d=0.4:s=44100" \
  -f lavfi -i "anoisesrc=d=0.4:c=brown:a=1" \
  -filter_complex "[1]lowpass=f=900,volume='0.7*exp(-t*20)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95" $ENC "$SFX/box.mp3"

echo "→ ding (soft price chime)"
$FF -f lavfi -i "aevalsrc='0.35*(sin(2*PI*1318.5*t)+0.6*sin(2*PI*1975.5*t))*exp(-t*5)':d=1.2:s=44100" \
  -af "aecho=0.8:0.5:90:0.25,volume=4,alimiter=limit=0.9" $ENC "$SFX/ding.mp3"

echo "→ shimmer (shine sweep on headline words)"
$FF -f lavfi -i "aevalsrc='0.18*sin(2*PI*(2400+1800*t)*t)*sin(PI*t/0.6)':d=0.6:s=44100" \
  -af "aecho=0.7:0.5:60:0.3,highpass=f=1200,volume=8,alimiter=limit=0.9" $ENC "$SFX/shimmer.mp3"

echo "✓ food & UI SFX ready:"; ls -lh "$SFX"
