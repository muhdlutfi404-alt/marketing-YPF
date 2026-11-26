#!/usr/bin/env python3
"""
CUTOUT — remove the background of a still image (character art, product photo).

    .venv/bin/python scripts/story/cutout.py <in.png> <out.png>

MODNet (person) + BiRefNet (whole salient subject, e.g. a held bag) → max, refined with a guided
filter on the original image. The subject's pixels are copied exactly; only an alpha channel is added.
"""
import sys
from pathlib import Path
import cv2
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]


def guided(I, p, r=8, eps=1e-4):
    mean = lambda x: cv2.boxFilter(x, -1, (r, r))
    mI, mp = mean(I), mean(p)
    a = (mean(I * p) - mI * mp) / (mean(I * I) - mI * mI + eps)
    b = mp - a * mI
    return mean(a) * I + mean(b)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    bgr = cv2.imread(src, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    H, W = rgb.shape[:2]
    so = ort.SessionOptions(); so.enable_cpu_mem_arena = False
    modnet = ort.InferenceSession(str(ROOT / ".models/modnet/model.onnx"), so, providers=["CPUExecutionProvider"])
    biref = ort.InferenceSession(str(ROOT / ".models/birefnet/model.onnx"), so, providers=["CPUExecutionProvider"])
    mh = 512; mw = int(round(W * mh / H / 32) * 32)
    x = (cv2.resize(rgb, (mw, mh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5) / 0.5
    person = cv2.resize(modnet.run(None, {"input": x.transpose(2, 0, 1)[None]})[0][0, 0], (W, H))
    y = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    y = (y - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    o = biref.run(None, {"input_image": y.transpose(2, 0, 1)[None].astype(np.float32)})[-1][0, 0]
    o = 1 / (1 + np.exp(-o)) if o.min() < 0 else o
    sal = cv2.resize(o.astype(np.float32), (W, H))
    a = np.maximum(person, sal)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    a = np.clip(guided(gray, a.astype(np.float32)), 0, 1)
    a8 = (a * 255).astype(np.uint8)
    cv2.imwrite(dst, np.dstack([bgr, a8]))
    print(f"✓ {dst}  coverage {float((a8 > 128).mean()):.2f}")


if __name__ == "__main__":
    main()
