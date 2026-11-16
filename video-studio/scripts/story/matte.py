#!/usr/bin/env python3
"""
MATTE — cut the REAL presenter + REAL product out of a clip for compositing.

    npm run story:matte -- <project> <clip> [--from 0] [--to 80.4] [--key-every 15]

The subject's pixels are copied EXACTLY from the source frame; only an alpha (transparency)
channel is added. Nothing about the face, body or product is generated or altered.

  • MODNet (Apache-2.0) on every frame → the person (incl. objects held in the hands)
  • BiRefNet-lite (MIT) every N frames → whole salient subject; the part MODNet misses
    (the product box on the table) is kept as the "product" mask until the next keyframe
  • guided filter at full resolution → crisp hair / finger edges from the real frame
  • 3-frame temporal median → no edge flicker

Output (public/footage/matte/<project>/):
  <clip>.fg.webm     VP9 with alpha: original pixels + transparency, same timing as the clip
  <clip>.matte.json  per-frame stats (area, bottom of subject, jumps) used by the safety check
  <clip>.review.jpg  contact sheet over magenta, for checking edges
"""
import json, subprocess, sys, time
from pathlib import Path
import numpy as np, cv2, onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def guided(I, p, r=8, eps=1e-4):
    """He et al. guided filter (grayscale guide), all float32 0..1."""
    mean = lambda x: cv2.boxFilter(x, -1, (r, r))
    mI, mp = mean(I), mean(p)
    a = (mean(I * p) - mI * mp) / (mean(I * I) - mI * mI + eps)
    b = mp - a * mI
    return mean(a) * I + mean(b)


def main():
    project, clip = sys.argv[1], sys.argv[2]
    t_from, t_to, K = arg("--from", 0.0), arg("--to", 1e9), arg("--key-every", 15)
    fp = json.loads((ROOT / "src/edits" / project / "footage.json").read_text())["clips"][clip]
    src = ROOT / "public" / fp["src"]
    W, H, fps = fp["width"], fp["height"], fp["fps"]
    t_to = min(t_to, fp["duration"])
    n = int(round((t_to - t_from) * fps))
    out_dir = ROOT / "public/footage/matte" / project
    out_dir.mkdir(parents=True, exist_ok=True)

    so = ort.SessionOptions(); so.intra_op_num_threads = 4
    modnet = ort.InferenceSession(str(ROOT / ".models/modnet/model.onnx"), so, providers=["CPUExecutionProvider"])
    biref = ort.InferenceSession(str(ROOT / ".models/birefnet/model.onnx"), so, providers=["CPUExecutionProvider"])
    mh = 512; mw = int(round(W * mh / H / 32) * 32)

    def run_modnet(rgb):
        x = (cv2.resize(rgb, (mw, mh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255 - 0.5) / 0.5
        a = modnet.run(None, {"input": x.transpose(2, 0, 1)[None]})[0][0, 0]
        return cv2.resize(a, (W, H), interpolation=cv2.INTER_LINEAR)

    def run_biref(rgb):
        x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        o = biref.run(None, {"input_image": x.transpose(2, 0, 1)[None].astype(np.float32)})[-1][0, 0]
        o = 1 / (1 + np.exp(-o)) if o.min() < 0 else o
        return cv2.resize(o.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)

    dec = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{t_from:.3f}", "-i", str(src),
                            "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    fg_path = out_dir / f"{clip}.fg.webm"
    enc = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
                            "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                            "-crf", "16", "-b:v", "0", "-row-mt", "1", "-cpu-used", "4", "-deadline", "good",
                            "-auto-alt-ref", "0", str(fg_path)], stdin=subprocess.PIPE)

    product = np.zeros((H, W), np.float32)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
    buf = []  # (rgb, alpha) for the 3-frame median
    stats, review = [], []
    t0 = time.time()

    def emit(rgb, a, idx):
        a8 = (np.clip(a, 0, 1) * 255).astype(np.uint8)
        enc.stdin.write(np.dstack([rgb, a8]).tobytes())   # RGB untouched + alpha
        m = a8 > 128
        ys, xs = np.nonzero(m)
        area = float(m.mean())
        st = {"t": round(t_from + idx / fps, 3), "area": round(area, 4)}
        if len(ys):
            st.update(bottom=round(float(ys.max()) / H, 4), top=round(float(ys.min()) / H, 4),
                      left=round(float(xs.min()) / W, 4), right=round(float(xs.max()) / W, 4))
        stats.append(st)
        if idx % int(fps * 2) == 0:
            mag = np.zeros_like(rgb); mag[:] = (255, 0, 255)
            comp = (rgb * (a[..., None]) + mag * (1 - a[..., None])).astype(np.uint8)
            review.append(cv2.resize(comp, (216, int(216 * H / W))))

    for i in range(n):
        raw = dec.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            n = i; break
        rgb = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        person = run_modnet(rgb)
        if i % K == 0:
            full = run_biref(rgb)
            # what BiRefNet sees beyond the (dilated) person = the product on the table / in hand
            extra = np.clip(full - cv2.dilate(person, kernel), 0, 1)
            extra = cv2.morphologyEx((extra > 0.5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
            num, lab, st, _ = cv2.connectedComponentsWithStats(extra)
            keep = np.zeros((H, W), np.float32)
            for c in range(1, num):
                if st[c, cv2.CC_STAT_AREA] > W * H * 0.004:   # ignore specks
                    keep[lab == c] = 1
            product = np.maximum(keep * full, 0)
            product = cv2.GaussianBlur(product, (0, 0), 1.2)
        a = np.maximum(person, product)
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
        a = np.clip(guided(gray, a.astype(np.float32)), 0, 1)
        buf.append((rgb, a))
        if len(buf) == 3:
            med = np.median(np.stack([b[1] for b in buf]), axis=0)
            emit(buf[1][0], med, i - 1)
            buf.pop(0)
        elif i == 0:
            emit(rgb, a, 0)
        if i % 60 == 0:
            el = time.time() - t0
            print(f"  frame {i}/{n}  {el:.0f}s elapsed, ~{el / (i + 1) * (n - i - 1):.0f}s left", flush=True)
    if len(buf) >= 2:
        emit(buf[-1][0], buf[-1][1], n - 1)
    dec.stdout.close(); enc.stdin.close(); enc.wait(); dec.wait()

    # jumps in subject area between frames = likely mask errors
    jumps = [s["t"] for a, s in zip(stats, stats[1:]) if a["area"] > 0 and abs(s["area"] - a["area"]) / a["area"] > 0.12]
    meta = {"clip": clip, "from": t_from, "to": t_from + n / fps, "fps": fps, "frames": n, "keyEvery": K,
            "fg": f"footage/matte/{project}/{clip}.fg.webm", "suspectJumps": jumps, "stats": stats,
            "models": {"person": "MODNet (Apache-2.0)", "product": "BiRefNet_lite (MIT)"}}
    (out_dir / f"{clip}.matte.json").write_text(json.dumps(meta))
    if review:
        rows = [np.hstack(review[i:i + 8] + [np.zeros_like(review[0])] * (8 - len(review[i:i + 8]))) for i in range(0, len(review), 8)]
        cv2.imwrite(str(out_dir / f"{clip}.review.jpg"), cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR))
    print(f"✓ {n} frames in {time.time() - t0:.0f}s → {fg_path.relative_to(ROOT)} | suspicious jumps: {len(jumps)}")


if __name__ == "__main__":
    main()
