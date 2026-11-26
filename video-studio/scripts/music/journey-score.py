#!/usr/bin/env python3
"""Original score "Perjalanan" for recruitment-01 (synthesised, royalty-free, made here).
   Emotional build that follows the story sections. 76 BPM, D major (D–A–Bm–G).
   .venv/bin/python scripts/music/journey-score.py <out.wav> [duration_s]"""
import sys, wave
import numpy as np
SR = 44100
out = sys.argv[1]; DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 56.0
BPM = 76; BEAT = 60 / BPM; BAR = 4 * BEAT
N = int(DUR * SR); t = np.arange(N) / SR
mix = np.zeros((N, 2), np.float32)
def note_hz(m): return 440.0 * 2 ** ((m - 69) / 12)
CHORDS = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]]  # D, A, Bm, G
def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[: j - i] * gain
    mix[i:j, 0] += s * (1 - max(0, pan)); mix[i:j, 1] += s * (1 + min(0, pan))
def piano(m, dur=1.6, vel=0.5):
    n = int(dur * SR); x = np.arange(n) / SR; f = note_hz(m)
    env = np.exp(-x * 3.2) * (1 - np.exp(-x * 400))
    tone = sum(a * np.sin(2 * np.pi * f * k * x) for k, a in [(1, 1), (2, 0.35), (3, 0.12), (4, 0.06)])
    return (tone * env * vel).astype(np.float32)
def pad(ms, dur, vel=0.12):
    n = int(dur * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / 1.2) * np.minimum(1, (dur - x) / 1.0)
    s = sum(np.sin(2 * np.pi * note_hz(m) * x * (1 + d)) for m in ms for d in (-0.002, 0.002))
    return (s / (2 * len(ms)) * env * vel).astype(np.float32)
def kick(vel=0.6):
    n = int(0.35 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * (45 + 80 * np.exp(-x * 30)) * x) * np.exp(-x * 9) * vel).astype(np.float32)
def bass(m, dur, vel=0.18):
    n = int(dur * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * note_hz(m - 24) * x) * np.minimum(1, x * 30) * np.exp(-x * 1.2) * vel).astype(np.float32)
def shaker(vel=0.05):
    n = int(0.08 * SR); x = np.arange(n) / SR
    return (np.random.default_rng(3).standard_normal(n) * np.exp(-x * 60) * vel).astype(np.float32)
# sections (seconds) — aligned to the edit: intro, journey, realisation, invitation, job cards
S_PAD, S_PULSE, S_LIFT, S_JOBS = 8.0, 20.5, 36.0, 45.0
bar = 0
while bar * BAR < DUR:
    t0 = bar * BAR; ch = CHORDS[bar % 4]
    # piano arpeggio (always): 8 eighth notes per bar
    for k in range(8):
        m = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if t0 >= S_LIFT and k % 2 else 0)
        add(piano(m, vel=0.32 if t0 < S_LIFT else 0.38), t0 + k * BEAT / 2, pan=(-0.25 if k % 2 else 0.25))
    if t0 >= S_PAD: add(pad([c + 12 for c in ch], BAR + 0.6, vel=0.10 if t0 < S_LIFT else 0.14), t0)
    if t0 >= S_PULSE:
        add(bass(ch[0], BAR), t0)
        for k in range(4 if t0 >= S_JOBS else 2): add(kick(0.45 if t0 < S_JOBS else 0.6), t0 + k * (BEAT if t0 >= S_JOBS else 2 * BEAT))
    if t0 >= S_JOBS:
        for k in range(8): add(shaker(), t0 + k * BEAT / 2 + BEAT / 4)
    bar += 1
# simple room reverb (short exponential IR)
ir_n = int(1.4 * SR); ir = np.random.default_rng(7).standard_normal(ir_n).astype(np.float32) * np.exp(-np.arange(ir_n) / SR * 4.5)
ir /= np.abs(ir).sum() / 6
wet = np.stack([np.convolve(mix[:, c], ir)[:N] for c in range(2)], axis=1)
y = mix * 0.8 + wet * 0.35
fade = np.minimum(1, t / 1.0) * np.minimum(1, (DUR - t) / 2.5)
y *= fade[:, None]; y /= max(1e-6, np.abs(y).max()) / 0.8
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
print(f"✓ {out} {DUR:.1f}s")
