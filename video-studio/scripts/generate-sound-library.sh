#!/usr/bin/env bash
# Generates the ORIGINAL, royalty-free starter sound library with FFmpeg.
# Everything is synthesised from maths (sine waves + noise), so there are
# no copyright issues. Re-run any time:  bash scripts/generate-sound-library.sh
# Output: public/sfx/*.mp3 and public/music/*.mp3
set -euo pipefail
cd "$(dirname "$0")/.."
SFX=public/sfx; MUSIC=public/music
mkdir -p "$SFX" "$MUSIC"
FF="ffmpeg -hide_banner -loglevel error -y"
ENC="-ac 2 -ar 44100 -c:a libmp3lame -b:a 128k"

echo "→ whoosh (transition swish)"
$FF -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.9" \
  -af "highpass=f=300,lowpass=f=5000,volume='0.2+1.6*sin(PI*t/0.9)':eval=frame,afade=t=in:d=0.35,afade=t=out:st=0.45:d=0.45" $ENC "$SFX/whoosh.mp3"

echo "→ impact (deep cinematic hit)"
$FF -f lavfi -i "aevalsrc='0.9*sin(2*PI*(42+60*exp(-t*8))*t)*exp(-t*2.2)':d=2.2:s=44100" \
  -f lavfi -i "anoisesrc=d=2.2:c=pink:a=1" \
  -filter_complex "[1]asetnsamples=64,volume='0.5*exp(-t*25)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,lowpass=f=1800,alimiter=limit=0.95" $ENC "$SFX/impact.mp3"

echo "→ riser (tension build)"
$FF -f lavfi -i "aevalsrc='0.35*sin(2*PI*(180*t+260*t*t))*(t/2)+0':d=2:s=44100" \
  -f lavfi -i "anoisesrc=d=2:c=white:a=1" \
  -filter_complex "[1]volume='0.25*(t/2)^2':eval=frame[n];[0][n]amix=inputs=2:normalize=0,highpass=f=120,afade=t=out:st=1.9:d=0.1" $ENC "$SFX/riser.mp3"

echo "→ pop (UI / text pop)"
$FF -f lavfi -i "aevalsrc='0.8*sin(2*PI*(600+900*exp(-t*30))*t)*exp(-t*28)':d=0.25:s=44100" $ENC "$SFX/pop.mp3"

echo "→ tick (counter tick)"
$FF -f lavfi -i "aevalsrc='0.6*sin(2*PI*2400*t)*exp(-t*90)':d=0.06:s=44100" $ENC "$SFX/tick.mp3"

echo "→ ice-sparkle (frost shimmer)"
$FF -f lavfi -i "aevalsrc='0.25*(sin(2*PI*2093*t)*exp(-t*5)+sin(2*PI*2637*(t-0.08))*exp(-abs(t-0.08)*5)*gte(t,0.08)+sin(2*PI*3136*(t-0.16))*exp(-abs(t-0.16)*5)*gte(t,0.16)+sin(2*PI*4186*(t-0.24))*exp(-abs(t-0.24)*4)*gte(t,0.24))':d=1.4:s=44100" \
  -af "aecho=0.8:0.6:120:0.35,volume=2.5,alimiter=limit=0.9" $ENC "$SFX/ice-sparkle.mp3"

echo "→ shutter (camera click)"
$FF -f lavfi -i "anoisesrc=d=0.2:c=white:a=1" \
  -af "asetnsamples=64,volume='exp(-t*60)+0.7*exp(-abs(t-0.07)*80)*gte(t,0.07)':eval=frame,highpass=f=1500,volume=2,alimiter=limit=0.9" $ENC "$SFX/shutter.mp3"

echo "→ wind ambience (outdoor bed, 12s loop)"
$FF -f lavfi -i "anoisesrc=d=12:c=brown:a=0.6" \
  -af "lowpass=f=700,volume='0.6+0.4*sin(2*PI*t/6)':eval=frame,afade=t=in:d=1,afade=t=out:st=11:d=1" $ENC "$SFX/wind-ambience.mp3"

echo "→ music: cinematic drone (Project A.M, 40s)"
# A-minor pad with slow swells + low pulse
$FF -f lavfi -i "aevalsrc='(0.16*sin(2*PI*110*t)+0.12*sin(2*PI*164.81*t)+0.10*sin(2*PI*220*t)+0.07*sin(2*PI*261.63*t)+0.05*sin(2*PI*329.63*t*1.002))*(0.65+0.35*sin(2*PI*t/8))+0.22*sin(2*PI*55*t)*exp(-mod(t,2)*2.5)':d=40:s=44100" \
  -af "lowpass=f=2500,aecho=0.8:0.7:400|700:0.3|0.2,afade=t=in:d=3,afade=t=out:st=36:d=4,alimiter=limit=0.9" $ENC "$MUSIC/am-cinematic-drone.mp3"

echo "→ music: upbeat commercial groove (YaPakCik Frozen, 32s @ 120bpm)"
# kick on every beat, hat on off-beats, bass + chord stabs
$FF -f lavfi -i "aevalsrc='0.9*sin(2*PI*(48+90*exp(-mod(t,0.5)*30))*mod(t,0.5))*exp(-mod(t,0.5)*9)+0.22*sin(2*PI*(55*(1+0.5*gte(mod(t,4),2)))*t)*exp(-mod(t,0.25)*6)+0.10*(sin(2*PI*440*t)+sin(2*PI*554.37*t)+sin(2*PI*659.25*t))*exp(-mod(t,1)*7)':d=32:s=44100" \
  -f lavfi -i "anoisesrc=d=32:c=white:a=1" \
  -filter_complex "[1]highpass=f=7000,asetnsamples=64,volume='0.35*exp(-mod(t+0.25,0.5)*60)':eval=frame[hat];[0][hat]amix=inputs=2:normalize=0,highpass=f=30,afade=t=in:d=0.5,afade=t=out:st=30:d=2,alimiter=limit=0.9" $ENC "$MUSIC/frozen-upbeat-groove.mp3"

echo "✓ Sound library ready:"; ls -lh "$SFX" "$MUSIC"
