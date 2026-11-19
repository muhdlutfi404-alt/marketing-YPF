#!/usr/bin/env python3
"""
TRACK — follow a real object (e.g. the chicken pack) in a clip, for callouts that move with it.

    .venv/bin/python scripts/story/track.py <project> <clip> --from 33.5 --to 35.5 [--hsv 0,60,170,14,170,255] [--fps 10]

Colour tracking: pixels inside the HSV range, minus everything above the shirt collar (face/neck) and minus
small blobs; the biggest remaining blob is the object. Positions are smoothed (median + moving
average). Prints JSON [[t, cx, cy, w, h], …] (t from --from, SOURCE pixels) and saves a check
image (<scratch>/track-check.jpg if --check is given). Nothing in the footage is modified.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def main():
    project, clip = sys.argv[1], sys.argv[2]
    t0, t1 = arg("--from", 0.0), arg("--to", 1.0)
    step = 1.0 / arg("--fps", 10.0)
    h = [int(x) for x in arg("--hsv", "0,60,170,14,170,255").split(",")]
    check = arg("--check", "")
    footage = json.loads((ROOT / "src/edits" / project / "footage.json").read_text())
    src = ROOT / "public" / footage["clips"][clip]["src"]
    cap = cv2.VideoCapture(str(src))
    rows, frames = [], []
    t = t0
    last_face = None
    while t <= t1 + 1e-6:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, f = cap.read()
        if not ok:
            break
        small = cv2.resize(f, (f.shape[1] // 2, f.shape[0] // 2))
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        m = cv2.inRange(hsv, tuple(h[:3]), tuple(h[3:]))
        # the presenter's face/neck sit just above the (blue) shirt: ignore everything above the collar
        shirt = cv2.inRange(hsv, (100, 120, 60), (125, 255, 255))
        rows_on = np.where(shirt.sum(axis=1) > 255 * 40)[0]
        if len(rows_on):
            last_face = int(rows_on[0]) + 25
        if last_face is not None:
            m[: last_face] = 0
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
        n, lab, stats, cent = cv2.connectedComponentsWithStats(m)
        if n > 1:
            i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            x, y, w, hh, a = stats[i]
            rows.append([round(t - t0, 3), (x + w / 2) * 2, (y + hh / 2) * 2, w * 2, hh * 2])
        frames.append((t, f))
        t += step
    if not rows:
        print("[]")
        return
    arr = np.array(rows, dtype=float)
    for j in range(1, 5):  # median 3 + moving average 3
        col = arr[:, j].copy()
        med = np.array([np.median(col[max(0, k - 1): k + 2]) for k in range(len(col))])
        arr[:, j] = np.convolve(np.pad(med, 1, mode="edge"), np.ones(3) / 3, mode="valid")
    out = [[round(r[0], 2)] + [round(v) for v in r[1:]] for r in arr.tolist()]
    if check:
        picks = np.linspace(0, len(frames) - 1, min(6, len(frames))).astype(int)
        tiles = []
        for k in picks:
            tt, f = frames[k]
            r = min(out, key=lambda q: abs(q[0] - (tt - t0)))
            cv2.circle(f, (int(r[1]), int(r[2])), int(max(r[3], r[4]) * 0.62), (49, 197, 255), 10)
            tiles.append(cv2.resize(f, (216, 384)))
        cv2.imwrite(check, np.hstack(tiles))
    print(json.dumps(out))


if __name__ == "__main__":
    main()
