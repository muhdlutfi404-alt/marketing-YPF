#!/usr/bin/env python3
"""Tighten the voice-over: shorten every pause to a natural gap (no speed change, no pitch change).
   .venv/bin/python projects/recruitment-01/tighten-vo.py  → public/footage/ready/recruitment-01/vo-tight.wav + projects/recruitment-01/vo-tight-map.json"""
import json, subprocess, wave
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/footage/ready/recruitment-01/vo.wav"
DST = ROOT / "public/footage/ready/recruitment-01/vo-tight.wav"
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(SRC), "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
import re
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
w = wave.open(str(SRC)); sr = w.getframerate(); ch = w.getnchannels()
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
dur = len(a) / sr
sil = [(s, e) for s, e in zip(st, en) if e - s >= 0.12]
# content cuts (vo.wav time): phrases removed because they repeat an idea said later
#   "dan membina Ya Pakcik Frozen menjadi sebuah perniagaan yang lebih besar" (the closing line already says "kita bina sesuatu yang lebih besar")
CUTS = [(40.60, 45.55)]
merged = []
for s0, e0 in sorted(sil + CUTS):
    if merged and s0 <= merged[-1][1] + 0.05: merged[-1] = (merged[-1][0], max(merged[-1][1], e0))
    else: merged.append((s0, e0))
sil = merged
# speech regions = complement of silences (+ small padding so consonants are never clipped)
PAD = 0.035
regions, cur = [], 0.0
for s, e in sil:
    regions.append((max(0, cur - PAD), min(dur, s + PAD))); cur = e
regions.append((max(0, cur - PAD), dur))
regions = [(round(s, 3), round(e, 3)) for s, e in regions if e - s > 0.05]
out, mp, t_new = [], [], 0.0
fade = int(0.008 * sr)
for i, (s, e) in enumerate(regions):
    seg = a[int(s * sr):int(e * sr)].copy()
    if len(seg) > 2 * fade:
        ramp = np.linspace(0, 1, fade)[:, None]; seg[:fade] *= ramp; seg[-fade:] *= ramp[::-1]
    if i > 0:
        prev_gap = regions[i][0] - regions[i - 1][1] + 2 * PAD   # original pause length
        gap = 0.14 if prev_gap > 0.45 else 0.07                    # sentence end vs breath
        out.append(np.zeros((int(gap * sr), ch), np.float32)); t_new += gap
    mp.append({"old": [s, e], "new": [round(t_new, 3), round(t_new + (e - s), 3)]})
    out.append(seg); t_new += e - s
y = np.clip(np.concatenate(out), -32768, 32767).astype(np.int16)
wo = wave.open(str(DST), "wb"); wo.setnchannels(ch); wo.setsampwidth(2); wo.setframerate(sr); wo.writeframes(y.tobytes()); wo.close()
json.dump({"source": "vo.wav", "regions": mp, "old_dur": round(dur, 3), "new_dur": round(t_new, 3)}, open(ROOT / "projects/recruitment-01/vo-tight-map.json", "w"), indent=1)
print(f"✓ {DST.name}: {dur:.2f}s → {t_new:.2f}s ({len(regions)} speech regions)")
