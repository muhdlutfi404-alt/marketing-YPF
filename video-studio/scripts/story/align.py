#!/usr/bin/env python3
"""
ALIGN A REPLACEMENT CLIP — swap in a better copy of the same recording (e.g. the clean
original without burned-in captions) and keep the whole edit in sync.

    npm run story:align -- <project> <old-clip-id> <new-clip-id> [--apply]

How it works: both soundtracks are compared (audio cross-correlation) to find the exact
time offset. It then checks every 8 s window to make sure the new file is ONE continuous
match (if the old file was cut up in an app, it reports where instead of guessing).
With --apply (only when the match is continuous) it:
  • copies the transcript (incl. all your word corrections) to the new clip, shifted
  • moves every shot's in/out, quote-anchored zooms stay valid automatically
  • moves captions.hide ranges, removes cover bands that were only for the old clip
Nothing is changed without --apply. A backup edit.before-align.json is written.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SR = 8000
HOP = 80  # 10 ms envelope resolution


def envelope(path: Path) -> np.ndarray:
    pcm = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    a = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    n = len(a) // HOP
    e = np.sqrt((a[: n * HOP].reshape(n, HOP) ** 2).mean(axis=1) + 1e-6)
    e = np.log(e)
    return (e - e.mean()) / (e.std() + 1e-9)


def xcorr_offset(ref: np.ndarray, target: np.ndarray) -> tuple[float, float]:
    """Best lag (seconds) such that ref[t] ≈ target[t + lag]. Returns (lag, normalised score)."""
    n = len(ref) + len(target)
    size = 1 << (n - 1).bit_length()
    c = np.fft.irfft(np.fft.rfft(target, size) * np.conj(np.fft.rfft(ref, size)), size)
    c = np.concatenate([c[-(len(ref) - 1):], c[: len(target)]])
    i = int(np.argmax(c))
    lag = i - (len(ref) - 1)
    return lag * HOP / SR, float(c[i] / len(ref))


def main() -> None:
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    project, old_id, new_id = sys.argv[1:4]
    apply = "--apply" in sys.argv
    edit_dir = ROOT / "src" / "edits" / project
    footage = json.loads((edit_dir / "footage.json").read_text())
    clips = footage["clips"]
    for c in (old_id, new_id):
        if c not in clips:
            sys.exit(f"❌ clip '{c}' not in footage.json — run story:ingest first. Known: {', '.join(clips)}")
    old = envelope(ROOT / "public" / clips[old_id]["src"])
    new = envelope(ROOT / "public" / clips[new_id]["src"])

    lag, score = xcorr_offset(old, new)
    print(f"Global match: old clip starts at {lag:+.2f}s inside the new clip (score {score:.2f})")

    # continuity check — every 8 s window of the old clip must land at the same offset
    win = int(8 * SR / HOP)
    issues, offsets = [], []
    for s in range(0, len(old) - win, win):
        seg = old[s: s + win]
        lo = max(0, s + int(lag * SR / HOP) - int(3 * SR / HOP))
        hi = min(len(new), s + int(lag * SR / HOP) + win + int(3 * SR / HOP))
        if hi - lo < win:
            issues.append((s * HOP / SR, None))
            continue
        l2, sc = xcorr_offset(seg, new[lo:hi])
        off = (lo * HOP / SR + l2) - s * HOP / SR
        offsets.append(off)
        if abs(off - lag) > 0.08 or sc < 0.3:
            issues.append((s * HOP / SR, round(off, 2)))
    spread = (max(offsets) - min(offsets)) if offsets else 0
    print(f"Continuity: {len(offsets)} windows checked, offset spread {spread * 1000:.0f} ms")
    if issues:
        print("⚠️  NOT one continuous match — the old file was probably edited (cuts) in an app:")
        for t, o in issues:
            print(f"   at old {t:6.1f}s → {'no match' if o is None else f'offset {o:+.2f}s'}")
        print("Nothing changed. Claude will realign section by section instead.")
        sys.exit(2)
    print(f"✓ One continuous match. Shift = {lag:+.3f}s")
    if not apply:
        print("(dry run — add --apply to update the edit)")
        return

    edit_path = edit_dir / "edit.json"
    edit = json.loads(edit_path.read_text())
    (edit_dir / "edit.before-align.json").write_text(json.dumps(edit, indent=1, ensure_ascii=False))
    dur_new = clips[new_id]["duration"]
    for s in edit["shots"]:
        if s["clip"] == old_id:
            s["clip"] = new_id
            s["in"] = round(max(0, s["in"] + lag), 3)
            s["out"] = round(min(dur_new, s["out"] + lag), 3)
    for h in edit.get("captions", {}).get("hide", []) or []:
        if h["clip"] == old_id:
            h.update(clip=new_id, **{"from": round(h["from"] + lag, 3), "to": round(h["to"] + lag, 3)})
    bands = edit.get("look", {}).get("coverBands")
    if bands:
        edit["look"]["coverBands"] = [b for b in bands if old_id not in (b.get("clips") or [])]
    for l in edit.get("layers", []):
        if l.get("props", {}).get("clip") == old_id:
            l["props"]["clip"] = new_id
            l["props"]["in"] = round(l["props"].get("in", 0) + lag, 3)
    edit_path.write_text(json.dumps(edit, indent=1, ensure_ascii=False) + "\n")

    tdir = edit_dir / "transcripts"
    tr = json.loads((tdir / f"{old_id}.json").read_text())
    tr["clip"] = new_id
    tr["alignedFrom"] = {"clip": old_id, "shift": round(lag, 3)}
    for seg in tr["segments"]:
        seg["start"] = round(seg["start"] + lag, 3)
        seg["end"] = round(seg["end"] + lag, 3)
        for w in seg["words"]:
            w["start"] = round(w["start"] + lag, 3)
            w["end"] = round(w["end"] + lag, 3)
    (tdir / f"{new_id}.json").write_text(json.dumps(tr, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ edit.json updated (backup: edit.before-align.json) and transcript moved to '{new_id}' with all corrections")


if __name__ == "__main__":
    main()
