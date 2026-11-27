#!/usr/bin/env python3
"""Original short-form scores for YaPakCik Frozen videos (synthesised here, royalty-free).
   Each preset has its own tempo, key, instrument and groove so videos never share the same track.
   .venv/bin/python scripts/music/brand-score.py <preset> <out.wav> <duration_s>
   presets: harga (punchy pluck, 100 BPM, Em) · tips (curious pizzicato, 88 BPM, Am) · hantar (bright upbeat, 112 BPM, C)
            ayam (playful marimba, 104 BPM, G) · bajet (warm bell + half-time, 92 BPM, D) · borong (driving pluck, 120 BPM, F#m)"""
import sys, wave
import numpy as np
SR = 44100
PRESETS = {
  "harga":  {"bpm": 100, "chords": [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]], "inst": "pluck", "groove": "four", "clap": True},
  "tips":   {"bpm": 88,  "chords": [[57, 60, 64], [62, 65, 69], [64, 68, 71], [57, 60, 64]], "inst": "pizz", "groove": "half", "clap": False},
  "hantar": {"bpm": 112, "chords": [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], "inst": "keys", "groove": "four", "clap": True},
  "ayam":   {"bpm": 104, "chords": [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]], "inst": "marimba", "groove": "four", "clap": False},
  "bajet":  {"bpm": 92,  "chords": [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], "inst": "bell", "groove": "half", "clap": True},
  "borong": {"bpm": 120, "chords": [[66, 69, 73], [62, 66, 69], [57, 61, 64], [64, 68, 71]], "inst": "pluck", "groove": "four", "clap": True},
}
preset, out, DUR = sys.argv[1], sys.argv[2], float(sys.argv[3])
P = PRESETS[preset]; BEAT = 60 / P["bpm"]; BAR = 4 * BEAT
N = int(DUR * SR); t = np.arange(N) / SR
mix = np.zeros((N, 2), np.float32); rng = np.random.default_rng(5)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def add(sig, start, pan=0.0, g=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[: j - i] * g; mix[i:j, 0] += s * (1 - max(0, pan)); mix[i:j, 1] += s * (1 + min(0, pan))
def tone(m, dur, kind, vel):
    n = int(dur * SR); x = np.arange(n) / SR; f = hz(m)
    if kind == "pluck":   # Karplus-ish bright pluck
        env = np.exp(-x * 7); s = np.sin(2*np.pi*f*x) + 0.5*np.sin(2*np.pi*2*f*x) + 0.25*np.sign(np.sin(2*np.pi*f*x))*np.exp(-x*20)
    elif kind == "pizz":
        env = np.exp(-x * 11); s = np.sin(2*np.pi*f*x) + 0.3*np.sin(2*np.pi*3*f*x)
    elif kind == "marimba":   # wooden mallet: fundamental + 4th partial, fast decay
        env = np.exp(-x * 9); s = np.sin(2*np.pi*f*x) + 0.35*np.sin(2*np.pi*4*f*x)*np.exp(-x*30)
    elif kind == "bell":      # soft FM bell
        env = np.exp(-x * 4); s = np.sin(2*np.pi*f*x + 1.2*np.exp(-x*5)*np.sin(2*np.pi*3.5*f*x))
    else:                 # soft electric keys
        env = np.exp(-x * 3.5); s = np.sin(2*np.pi*f*x) + 0.4*np.sin(2*np.pi*2*f*x)*np.exp(-x*6)
    return (s * env * (1 - np.exp(-x * 500)) * vel).astype(np.float32)
def kick(v=0.7):
    n = int(0.3*SR); x = np.arange(n)/SR; return (np.sin(2*np.pi*(50+90*np.exp(-x*35))*x)*np.exp(-x*10)*v).astype(np.float32)
def hat(v=0.06):
    n = int(0.05*SR); x = np.arange(n)/SR; return (rng.standard_normal(n)*np.exp(-x*90)*v).astype(np.float32)
def clap(v=0.18):
    n = int(0.2*SR); x = np.arange(n)/SR; e = np.exp(-x*25) + 0.6*np.exp(-np.abs(x-0.012)*120) + 0.5*np.exp(-np.abs(x-0.024)*120)
    return (rng.standard_normal(n)*e*v).astype(np.float32)
def bass(m, dur, v=0.22):
    n = int(dur*SR); x = np.arange(n)/SR; return (np.sin(2*np.pi*hz(m-24)*x)*np.minimum(1, x*40)*np.exp(-x*2)*v).astype(np.float32)
bar = 0
while bar * BAR < DUR:
    t0 = bar * BAR; ch = P["chords"][bar % 4]; intro = t0 < 2 * BAR
    steps = 8 if P["inst"] != "pizz" else 6
    for k in range(steps):
        m = ch[[0, 2, 1, 2, 0, 1, 2, 1][k % 8]] + (12 if (k % 4 == 3 and not intro) else 0)
        add(tone(m, 0.6, P["inst"], 0.22), t0 + k * BAR / steps, pan=(-0.3 if k % 2 else 0.3))
    add(bass(ch[0], BAR * 0.9), t0)
    if not intro:
        hits = range(4) if P["groove"] == "four" else (0, 2)
        for k in hits: add(kick(), t0 + k * BEAT)
        for k in range(8): add(hat(0.05 if k % 2 else 0.035), t0 + k * BEAT / 2)
        if P["clap"]:
            for k in (1, 3): add(clap(), t0 + k * BEAT)
    bar += 1
ir_n = int(0.9*SR); ir = rng.standard_normal(ir_n).astype(np.float32)*np.exp(-np.arange(ir_n)/SR*6); ir /= np.abs(ir).sum()/5
wet = np.stack([np.convolve(mix[:, c], ir)[:N] for c in range(2)], axis=1)
y = mix*0.85 + wet*0.25
y *= (np.minimum(1, t/0.4)*np.minimum(1, (DUR-t)/1.8))[:, None]; y /= max(1e-6, np.abs(y).max())/0.8
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()
print(f"✓ {preset} → {out} ({DUR:.0f}s, {P['bpm']} BPM)")
