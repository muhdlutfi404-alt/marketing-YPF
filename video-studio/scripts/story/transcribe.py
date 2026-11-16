#!/usr/bin/env python3
"""
TRANSCRIBE — word-level subtitles with Whisper (faster-whisper), runs on CPU in the cloud.

    npm run story:transcribe -- <project> [--model large-v3] [--clip <id>] [--hotwords "YaPakCik, nugget"]
                                          [--no-dialect-prompt] [--lang ms]

Built to PRESERVE what was actually said:
  • task = "transcribe" (never "translate")
  • language = Malay ("ms") by default — English words inside Malay speech are kept as spoken
  • a short Kelantanese prompt nudges Whisper to keep dialect spellings
    (ambo, demo, kito, nok, gapo, jah…) instead of "correcting" them to formal Malay
  • no text normalisation or rewriting afterwards — the words are saved exactly as recognised
  • word timestamps + voice-activity filtering for accurate subtitle timing

Output per clip, in src/edits/<project>/transcripts/:
  <clip>.json  — word timings (used for subtitles + quote anchors)
  <clip>.srt   — for reading / correcting on a phone
  <clip>.txt   — plain text with timestamps and ⚠ marks on low-confidence words

Whisper is very good but NOT perfect with Kelantanese — always review the .txt/.srt.
Corrections: tell Claude the right words, or import a corrected SRT with story:srt.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Natural Kelantanese sentence used as context (not inserted into the transcript).
DIALECT_PROMPT = (
    "Assalamualaikum. Ambo nok kecek sikit pasal produk ambo. "
    "Demo gapo khabar? Kito make samo-samo. Sedak sungguh, rangup jah. "
    "Bakpo demo tok cuba? Ambo sokmo pesan, jange lupe order."
)


def fmt_srt(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main() -> None:
    global np
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "large-v3"))
    ap.add_argument("--clip", default=None)
    ap.add_argument("--lang", default="ms")
    ap.add_argument("--hotwords", default=None, help="comma separated names/brands to spell correctly")
    ap.add_argument("--no-dialect-prompt", action="store_true")
    ap.add_argument("--beam", type=int, default=5)
    ap.add_argument("--threads", type=int, default=os.cpu_count() or 4)
    a = ap.parse_args()

    edit_dir = ROOT / "src" / "edits" / a.project
    footage = json.loads((edit_dir / "footage.json").read_text())
    out_dir = edit_dir / "transcripts"
    out_dir.mkdir(parents=True, exist_ok=True)

    import numpy as np
    from faster_whisper import WhisperModel  # imported late so --help is fast

    t0 = time.time()
    print(f"→ loading Whisper '{a.model}' (int8, CPU, {a.threads} threads)…", flush=True)
    model = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=a.threads, download_root=str(ROOT / ".models"))
    print(f"  loaded in {time.time() - t0:.0f}s", flush=True)

    for cid, clip in footage["clips"].items():
        if a.clip and cid != a.clip:
            continue
        if not clip.get("hasAudio"):
            print(f"  {cid}: no audio — skipped")
            continue
        src = ROOT / "public" / clip["src"]
        # decode with ffmpeg → 16 kHz mono float samples (robust with any phone audio format)
        pcm = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
            check=True, capture_output=True,
        ).stdout
        audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
        print(f"━━ {cid} ({clip['duration']:.1f}s) transcribing…", flush=True)
        t1 = time.time()
        segments, info = model.transcribe(
            audio,
            language=a.lang,
            task="transcribe",
            beam_size=a.beam,
            temperature=0.0,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 300, "speech_pad_ms": 150},
            condition_on_previous_text=False,
            initial_prompt=None if a.no_dialect_prompt else DIALECT_PROMPT,
            hotwords=a.hotwords,
        )
        segs = []
        for s in segments:
            words = [
                {"text": w.word, "start": round(w.start, 3), "end": round(w.end, 3), "prob": round(w.probability, 3)}
                for w in (s.words or [])
            ]
            if not words:
                continue
            segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(), "words": words})
            print(f"   [{s.start:6.2f} → {s.end:6.2f}] {s.text.strip()}", flush=True)

        data = {
            "clip": cid,
            "source": "whisper",
            "language": info.language,
            "model": a.model,
            "dialectPrompt": not a.no_dialect_prompt,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "segments": segs,
        }
        (out_dir / f"{cid}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
        # SRT + review text
        srt_lines, txt_lines = [], []
        for i, s in enumerate(segs, 1):
            srt_lines += [str(i), f"{fmt_srt(s['start'])} --> {fmt_srt(s['end'])}", s["text"], ""]
            marked = "".join((f"⚠{w['text'].strip()}" if w["prob"] < 0.5 else w["text"].strip()) + " " for w in s["words"]).strip()
            txt_lines.append(f"[{s['start']:6.2f}] {marked}")
        (out_dir / f"{cid}.srt").write_text("\n".join(srt_lines))
        (out_dir / f"{cid}.txt").write_text("\n".join(txt_lines) + "\n")
        low = sum(1 for s in segs for w in s["words"] if w["prob"] < 0.5)
        n = sum(len(s["words"]) for s in segs)
        print(f"   ✓ {n} words, {low} low-confidence (⚠), {time.time() - t1:.0f}s → transcripts/{cid}.json/.srt/.txt", flush=True)

    print("\nReview the .txt files (⚠ = Whisper unsure). Words are kept exactly as spoken — nothing is translated or formalised.")


if __name__ == "__main__":
    sys.exit(main())
