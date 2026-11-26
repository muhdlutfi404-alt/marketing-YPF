#!/usr/bin/env python3
"""Build the animatic props for recruitment-01 from the timed VO lines + storyboard.
   python3 projects/recruitment-01/make-animatic.py  →  out/.recruitment-01-animatic.props.json"""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
P = ROOT / "projects/recruitment-01"
vo = json.load(open(P / "vo-transcript.json"))["lines"]
WH = json.load(open(sys.argv[1] if len(sys.argv) > 1 else P / "vo-whisper.json"))   # whisper words (exact reveal times)
TRIM = 6.2      # vo.wav starts at 6.2 s of the original recording
VO_AT = 2.6     # voice-over starts at 2.6 s in the animatic (after the title)
T = lambda t: round(t - TRIM + VO_AT, 3)

# caption words: even split by length inside each timed line
words = []
for ln in vo:
    toks = ln["text"].split(); a, b = T(ln["start"]), T(ln["end"])
    tot = sum(len(t) for t in toks); cur = a
    for t in toks:
        d = (b - a) * len(t) / tot; words.append({"text": t, "start": round(cur, 3), "end": round(cur + d, 3)}); cur += d
# exact keyword times from Whisper word timings (fallback: caption words)
wh = [w for s in WH for w in s.get("words", [])]
def kw(text, after=0.0):
    t = text.lower()
    for w in wh:
        if T(w["start"]) >= after and re.sub(r"[^\w-]", "", w["text"].lower()).startswith(t): return T(w["start"])
    for w in words:
        if w["start"] >= after and re.sub(r"[^\w-]", "", w["text"].lower()).startswith(t): return w["start"]
    raise SystemExit(f"keyword {text} not found after {after}")
L = lambda i: (T(vo[i]["start"]), T(vo[i]["end"]))
REF = "characters/ayoh-mad/02-review/collage-2026-11-26/pose-{:02d}.png"
POSE_T = {1: "buka gerai, subuh", 2: "angkat kotak stok", 3: "bungkus pesanan", 4: "malam, telefon", 5: "termenung", 6: "senyum yakin", 7: "tunjuk penonton", 8: "hulur tangan"}
def S(id, a, b, pose, bg, push=0.04, character=True, frame="wide", cut=False):
    d = {"id": id, "from": round(a, 3), "to": round(b, 3), "pose": pose, "bg": bg, "push": push, "character": character, "frame": frame, "cut": cut}
    if pose: d.update(poseRef=REF.format(pose), poseTitle=POSE_T[pose])
    return d
def shots(prefix, a, b, pose, bg, frames, cuts_at):
    """split [a,b] into short shots (reference pacing): one framing per shot, hard cuts inside a scene"""
    pts = [a] + cuts_at + [b]
    return [S(f"{prefix}{k+1}", pts[k], pts[k + 1], pose, bg, 0.05, True, frames[k], k > 0) for k in range(len(frames))]
end_vo = L(14)[1]
JOBS_AT, END_AT = end_vo + 0.8, end_vo + 10.8
DUR = END_AT + 5.0
scenes = (
  shots("s1", 0, L(0)[1], 6, "day", ["wide", "medium", "face"], [2.6, kw("frozen", L(0)[0]) + 0.1])
  + shots("s2", L(1)[0], L(1)[1], 1, "dawn", ["wide", "face", "hands", "medium"], [kw("mungkin", L(1)[0]) + 0.2, kw("susahnya", L(1)[0]) - 0.1, kw("sampai", L(1)[0]) - 0.1])
  + shots("s3", L(2)[0], L(2)[1], 2, "morning", ["medium", "face"], [kw("kena", L(2)[0]) - 0.1])
  + shots("s4", L(3)[0], L(3)[1], 3, "day", ["medium", "hands", "face", "wide"], [kw("sediakan", L(3)[0]) - 0.1, kw("penghantaran", L(3)[0]) - 0.1, kw("cari", L(3)[0]) - 0.1])
  + shots("s5", L(4)[0], L(4)[1], 4, "night", ["medium", "hands", "face"], [kw("fikir", L(4)[0]) - 0.1, kw("besarkan", L(4)[0]) - 0.2])
  + shots("s6", L(5)[0], L(6)[1], 5, "dusk", ["wide", "face", "medium"], [kw("tak", L(5)[0] + 2.0) - 0.1, L(6)[0]])
  + shots("s7", L(7)[0], L(10)[1], 6, "day", ["face", "medium", "hands", "wide"], [kw("dipercayai", L(7)[0]) - 0.3, L(8)[0], L(10)[0]])
  + shots("s8", L(11)[0], L(11)[1], 7, "day", ["medium", "hands", "face"], [L(11)[0] + 0.9, kw("awak", L(11)[0]) - 0.05])
  + shots("s9", L(12)[0], JOBS_AT, 8, "day", ["medium", "face", "hands", "wide"], [kw("jom", L(13)[0] - 0.3) - 0.1, kw("perjalanan", L(13)[0] - 0.3), L(14)[0]])
  + [S("jobs", JOBS_AT, END_AT, None, "brand", 0, False), S("end", END_AT, DUR, None, "brand", 0, False)]
)
def hook(id, a, b, words_, rv, y=150, h=420):
    return {"id": id, "from": round(a, 3), "dur": round(b - a, 3), "kind": "hook", "rv": [round(x - a, 3) for x in rv], "props": {"y": y, "h": h, "words": words_}}
layers = [
  {"id": "title", "from": 0.0, "dur": 2.6, "kind": "title", "props": {"line2": "SEORANG USAHAWAN"}},
  hook("urus-sendiri", kw("kena", L(2)[0]) - 0.15, L(2)[1] + 0.3, [{"text": "kena urus", "size": "m"}, {"text": "sendiri", "size": "xl", "style": "gold"}], [kw("kena", L(2)[0]), kw("sendiri", L(2)[0])]),
  {"id": "tugas", "from": L(3)[0], "dur": round(L(3)[1] - L(3)[0] + 0.2, 3), "kind": "list", "split": True,
   "rv": [round(kw(k, L(3)[0]) - L(3)[0], 3) for k in ["urus", "sediakan", "penghantaran", "cari"]] if False else None,
   "props": {"kicker": "semua seorang diri", "items": ["Urus pelanggan", "Sediakan barang", "Penghantaran", "Cari pelanggan baru"], "icons": []}},
  hook("besarkan", kw("fikir", L(4)[0]) - 0.2, L(4)[1] + 0.2, [{"text": "fikir macam mana", "size": "s"}, {"text": "nak besarkan lagi", "size": "m", "style": "gold"}], [kw("fikir", L(4)[0]), kw("besarkan", L(4)[0])]),
  hook("seorang-diri", kw("tak", L(5)[0] + 2.0) - 0.2, L(5)[1] + 0.1, [{"text": "tak boleh selamanya", "size": "s"}, {"text": "seorang diri", "size": "l", "style": "gold"}], [kw("tak", L(5)[0] + 2.0), kw("seorang", L(5)[0])]),
  hook("bukan-sekadar", L(6)[0], L(6)[1] + 0.2, [{"text": "bukan sekadar", "size": "s"}, {"text": "mencari pekerja", "size": "m"}], [L(6)[0] + 0.1, kw("mencari", L(6)[0])]),
  hook("dipercayai", kw("seseorang", L(7)[0]) - 0.2, L(7)[1] + 0.3, [{"text": "seseorang yang", "size": "s"}, {"text": "boleh dipercayai", "size": "l", "style": "gold"}], [kw("seseorang", L(7)[0]), kw("dipercayai", L(7)[0])]),
  {"id": "nilai", "from": L(8)[0], "dur": round(L(10)[1] - L(8)[0] + 0.3, 3), "kind": "list", "split": True, "props": {"kicker": "sama-sama", "items": ["Menjaga servis pelanggan", "Meningkatkan jualan", "Membina Ya Pakcik Frozen"], "icons": []}},
  hook("awak", L(11)[0], L(11)[1] + 0.3, [{"text": "mungkin orang itu", "size": "s"}, {"text": "awak", "size": "xl", "style": "gold"}], [L(11)[0] + 0.1, kw("awak", L(11)[0])]),
  hook("jom", kw("jom", L(13)[0] - 0.3) - 0.1, L(13)[1] + 0.2, [{"text": "jom sertai", "size": "l", "style": "gold"}, {"text": "perjalanan Ya Pakcik Frozen", "size": "s"}], [kw("jom", L(13)[0] - 0.3), kw("perjalanan", L(13)[0] - 0.3)]),
  hook("bersama", kw("kita", L(14)[0] - 0.3), L(14)[1] + 0.6, [{"text": "kita bina sesuatu yang lebih besar", "size": "s"}, {"text": "bersama-sama", "size": "l", "style": "gold"}], [kw("kita", L(14)[0] - 0.3), kw("bersama", L(14)[0])]),
  {"id": "jobs", "from": JOBS_AT, "dur": round(END_AT - JOBS_AT, 3), "kind": "jobs", "props": {"confirmed": True, "at": [0.6, 3.6], "jobs": [
     {"title": "PEMBANTU OPERASI", "points": ["Gaji RM50 – RM60 sehari", "7:30 pagi – 2:30 petang", "Lelaki · umur 20–35", "Lesen kereta atau motosikal", "Sediakan barang & penghantaran sekitar Tumpat"]},
     {"title": "TEAM SALES", "points": ["Gaji basic", "Komisen setiap bulan", "Utamakan calon berpengalaman", "Fokus pelanggan baharu & tingkatkan jualan"]}]}},
  {"id": "end", "from": END_AT, "dur": 5.0, "kind": "endcard-placeholder", "props": {"headline": "JOM SERTAI KAMI", "apply": "CARA MEMOHON: MENUNGGU PENGESAHAN"}},
]
# list reveal times from the spoken words
for l in layers:
    if l["id"] == "tugas":
        a = l["from"]; l["rv"] = [round(kw(k, a - 0.1) - a, 3) for k in ["urus", "sediakan", "penghantaran", "cari"]]
    if l["id"] == "nilai":
        a = l["from"]; l["rv"] = [round(kw(k, a - 0.1) - a, 3) for k in ["menjaga", "meningkatkan", "membina"]]
props = {"title": "recruitment-01 animatic", "duration": round(DUR, 2), "master": "characters/ayoh-mad/00-master/master-cutout.png",
         "vo": {"src": "footage/ready/recruitment-01/vo.wav", "at": VO_AT}, "music": {"src": "music/story-documentary-bed.mp3", "volume": 0.4, "duckTo": 0.35},
         "words": words, "scenes": scenes, "layers": layers,
         "emphasis": {"susahnya": "script", "sendiri": "big", "dipercayai": "big", "awak": "big", "bersama-sama": "script", "seorang": "big", "besar": "script"}}
out = ROOT / "out/.recruitment-01-animatic.props.json"; out.parent.mkdir(exist_ok=True)
json.dump(props, open(out, "w"), ensure_ascii=False, indent=1)
print("✓", out, "duration", props["duration"], "s,", len(scenes), "scenes,", len(layers), "layers")
