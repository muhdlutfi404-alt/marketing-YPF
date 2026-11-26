#!/usr/bin/env python3
"""recruitment-01 — EDIT v2 (owner feedback: 50–55 s, dynamic TikTok storytelling, no slideshow).
   Tightened VO (tighten-vo.py), cuts on spoken words, motion-graphic beats instead of repeating the character.
   python3 projects/recruitment-01/make-edit-v2.py  →  out/.recruitment-01-v2.props.json"""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
P = ROOT / "projects/recruitment-01"
MAP = json.load(open(P / "vo-tight-map.json"))["regions"]
WH = [w for s in json.load(open(P / "vo-whisper.json")) for w in s["words"]]
LINES = json.load(open(P / "vo-transcript.json"))["lines"]
TRIM = 6.2
def mapt(t):
    for r in MAP:
        a, b = r["old"]
        if a - 0.001 <= t <= b + 0.001: return r["new"][0] + (t - a)
    for r in MAP:
        if r["old"][0] > t: return r["new"][0]
    return MAP[-1]["new"][1]
def removed(t):  # inside a content cut?
    return not any(r["old"][0] - 0.02 <= t <= r["old"][1] + 0.02 for r in MAP)
# caption words: correct text from the transcript lines, timing from Whisper words (mapped), even split as fallback
words = []
for i, ln in enumerate(LINES):
    if i == 10: continue  # "dan membina … lebih besar" removed (repeats the closing line)
    toks = ln["text"].split()
    if i == 9: toks[-1] = toks[-1].rstrip(",") + "."
    a, b = mapt(ln["start"] - TRIM), mapt(ln["end"] - TRIM)
    seg = [w for w in WH if ln["start"] - 0.05 <= w["start"] < ln["end"] - 0.02 and not removed(w["start"] - TRIM)]
    if len(seg) == len(toks):
        for t, w in zip(toks, seg): words.append({"text": t, "start": round(mapt(w["start"] - TRIM), 3), "end": round(mapt(w["end"] - TRIM), 3)})
    else:
        tot = sum(len(t) for t in toks); cur = a
        for t in toks:
            d = (b - a) * len(t) / tot; words.append({"text": t, "start": round(cur, 3), "end": round(cur + d, 3)}); cur += d
def kw(text, after=0.0):
    t = text.lower()
    for w in words:
        if w["start"] >= after - 0.01 and re.sub(r"[^\w-]", "", w["text"].lower()).startswith(t): return w["start"]
    raise SystemExit(f"keyword {text} not found after {after}")
L = lambda i: (mapt(LINES[i]["start"] - TRIM), mapt(LINES[i]["end"] - TRIM))
VO_END = words[-1]["end"]

CUT = "characters/ayoh-mad/02-review/set-2026-11-26/cutout/"
ART = {1: ("pose-01-buka-gerai-cut.png", 1199 / 971, (0.37, 0.25), (0.80, 0.40)), 2: ("pose-02-angkat-kotak-cut.png", 1199 / 971, (0.43, 0.20), (0.55, 0.70)),
       4: ("pose-04-malam-telefon-cut.png", 1199 / 971, (0.44, 0.30), (0.58, 0.64)), 5: ("pose-05-termenung-cut.png", 1254 / 928, (0.34, 0.25), (0.29, 0.43)),
       6: ("pose-06-senyum-yakin-cut.png", 1254 / 928, (0.49, 0.20), (0.60, 0.82)), 7: ("pose-07-tunjuk-cut.png", 1254 / 928, (0.52, 0.23), (0.36, 0.64)),
       8: ("pose-08-hulur-tangan-cut.png", 1254 / 928, (0.53, 0.20), (0.31, 0.77))}
scenes, layers = [], []
def shot(a, b, pose, frame, bg, trans="cut", punch=None):
    d = {"id": f"v{len(scenes)+1}", "from": round(a, 3), "to": round(b, 3), "pose": pose, "bg": bg, "frame": frame, "cut": True, "trans": trans, "push": 0.018, "character": pose is not None}
    if punch is not None: d["punch"] = punch
    if pose:
        img, asp, face, hands = ART[pose]
        d.update(image=CUT + img, aspect=round(asp, 4), focus={"face": list(face), "hands": list(hands)})
    scenes.append(d)
def graphic(a, b, trans="cut"): shot(a, b, None, "wide", "brand", trans)
def icon(a, b, ic, label, sub=None, trans="cut"):
    graphic(a, b, trans); layers.append({"id": f"i{len(layers)}", "from": round(a, 3), "dur": round(b - a, 3), "kind": "icon", "props": {"icon": ic, "label": label, **({"sub": sub} if sub else {})}})
def text(a, b, ws, rv, y=150, h=420, hide=False):
    layers.append({"id": f"t{len(layers)}", "from": round(a, 3), "dur": round(b - a, 3), "kind": "hook", "rv": [round(x - a, 3) for x in rv], "props": {"y": y, "h": h, "words": ws, **({"hideCaptions": True} if hide else {})}})

# 1 · HOOK — "Orang nampak Ya Pakcik Frozen hari ni,"
l1 = L(1)[0]
shot(0, kw("frozen") - 0.05, 6, "face", "day", punch=0.05)
shot(kw("frozen") - 0.05, l1, 6, "medium", "day")
text(0.05, l1 - 0.05, [{"text": "di sebalik perjalanan", "size": "s"}, {"text": "seorang usahawan", "size": "m", "style": "gold"}], [0.05, 0.35])
# 2 · PERJALANAN — "tapi mungkin tak semua tahu betapa susahnya perjalanan …"
shot(l1, kw("susahnya", l1) - 0.1, 1, "wide", "dawn", "flash")
shot(kw("susahnya", l1) - 0.1, kw("perjalanan", l1) - 0.05, 1, "face", "dawn")
shot(kw("perjalanan", l1) - 0.05, L(2)[0], 1, "hands", "dawn")
text(kw("betapa", l1) - 0.1, L(2)[0] - 0.05, [{"text": "betapa", "size": "s"}, {"text": "susahnya", "size": "xl", "style": "gold"}], [kw("betapa", l1), kw("susahnya", l1)])
# 3 · CABARAN — "Ada masa, semua Ayoh Mad kena urus sendiri."
l2 = L(2)[0]
shot(l2, kw("kena", l2) - 0.1, 2, "medium", "morning", "whip")
shot(kw("kena", l2) - 0.1, L(3)[0], 2, "face", "morning", punch=0.04)
text(kw("kena", l2) - 0.1, L(3)[0] - 0.05, [{"text": "kena urus", "size": "m"}, {"text": "sendiri", "size": "xl", "style": "gold"}], [kw("kena", l2), kw("sendiri", l2)])
#   "Urus pelanggan, sediakan barang, penghantaran, cari pelanggan baru," — four motion-graphic beats
l3 = L(3)[0]
b1, b2, b3 = kw("sediakan", l3) - 0.08, kw("penghantaran", l3) - 0.08, kw("cari", l3) - 0.08
icon(l3, b1, "chat", "Urus pelanggan", trans="whip"); icon(b1, b2, "box", "Sediakan barang"); icon(b2, b3, "van", "Penghantaran"); icon(b3, L(4)[0], "search", "Cari pelanggan baru")
# 4 · MALAM — "dan dalam masa yang sama, fikir macam mana nak besarkan lagi perniagaan ni."
l4 = L(4)[0]
shot(l4, kw("fikir", l4) - 0.1, 4, "medium", "night", "whip")
shot(kw("fikir", l4) - 0.1, kw("besarkan", l4) - 0.12, 4, "face", "night")
icon(kw("besarkan", l4) - 0.12, L(5)[0], "growth", "Nak besarkan lagi")
# 5 · SEDAR — "Ayoh Mad sedar, kalau nak pergi lebih jauh, tak boleh selamanya bergerak seorang diri."
l5 = L(5)[0]
shot(l5, kw("kalau", l5) - 0.1, 5, "wide", "dusk", "flash")
shot(kw("kalau", l5) - 0.1, kw("seorang", l5) - 0.35, 5, "face", "dusk")
icon(kw("seorang", l5) - 0.35, L(6)[0], "solo", "Seorang diri")
# 6 · YANG DICARI — "Ayoh Mad bukan sekadar mencari pekerja." / "… seseorang yang boleh dipercayai."
l6, l7 = L(6)[0], L(7)[0]
graphic(l6, l7, "whip")
text(l6, l7, [{"text": "bukan sekadar", "size": "m"}, {"text": "mencari pekerja", "size": "l", "style": "strike"}], [kw("bukan", l6), kw("pekerja", l6)], y=560, h=640, hide=True)
icon(l7, L(8)[0], "team", "Boleh dipercayai")
#   "Seseorang yang sanggup sama-sama menjaga servis pelanggan, membantu meningkatkan jualan."
l8 = L(8)[0]
icon(l8, kw("membantu", l8) - 0.1, "heart", "Servis pelanggan", "sama-sama menjaga")
shot(kw("membantu", l8) - 0.1, L(11)[0], 6, "wide", "day", "whip")
text(kw("membantu", l8) - 0.1, L(11)[0] - 0.05, [{"text": "tingkatkan", "size": "m"}, {"text": "jualan", "size": "xl", "style": "gold"}], [kw("meningkatkan", l8), kw("jualan", l8)])
# 7 · JEMPUTAN — "Mungkin orang itu adalah awak."
l11 = L(11)[0]
shot(l11, kw("awak", l11) - 0.05, 7, "medium", "day", "whip")
shot(kw("awak", l11) - 0.05, L(12)[0], 7, "face", "day", punch=0.09)
text(kw("mungkin", l11), L(12)[0] - 0.05, [{"text": "mungkin orang itu", "size": "s"}, {"text": "awak", "size": "xl", "style": "gold"}], [kw("mungkin", l11), kw("awak", l11)], y=100, h=360)
#   "Kalau awak rasa awak orang yang kami cari, jom sertai perjalanan Ya Pakcik Frozen."
l12 = L(12)[0]
shot(l12, kw("jom", l12) - 0.1, 8, "medium", "day")
shot(kw("jom", l12) - 0.1, L(14)[0], 8, "face", "day", punch=0.04)
text(kw("jom", l12) - 0.1, L(14)[0] - 0.05, [{"text": "jom sertai", "size": "l", "style": "gold"}, {"text": "perjalanan Ya Pakcik Frozen", "size": "s"}], [kw("jom", l12), kw("perjalanan", l12)])
#   "Kita bina sesuatu yang lebih besar, bersama-sama."
l14 = L(14)[0]
shot(l14, VO_END + 0.25, 8, "wide", "day", "whip")
text(l14, VO_END + 0.2, [{"text": "kita bina sesuatu yang lebih besar", "size": "s"}, {"text": "bersama-sama", "size": "l", "style": "gold"}], [kw("kita", l14), kw("bersama", l14)])
# 8 · KAD JAWATAN + WHATSAPP
JOBS, END = VO_END + 0.25, VO_END + 5.4
graphic(JOBS, END, "whip"); graphic(END, END + 2.8)
layers.append({"id": "jobs", "from": round(JOBS, 3), "dur": round(END - JOBS, 3), "kind": "jobs", "props": {"confirmed": True, "big": True, "at": [0.15, 0.9], "jobs": [
  {"title": "PEMBANTU OPERASI", "points": ["Gaji RM50 – RM60 sehari", "7:30 pagi – 2:30 petang", "Lelaki · umur 20–35", "Lesen kereta atau motosikal", "Sediakan barang & penghantaran sekitar Tumpat"]},
  {"title": "TEAM SALES", "points": ["Gaji basic + komisen setiap bulan", "Utamakan calon berpengalaman", "Cari pelanggan baharu & tingkatkan jualan"]}]}})
layers.append({"id": "end", "from": round(END, 3), "dur": 2.8, "kind": "endcard-placeholder", "props": {"wordmark": True, "headline": "JOM SERTAI KAMI", "apply": "WhatsApp 016-723 7170"}})
DUR = round(END + 2.8, 2)
props = {"title": "recruitment-01 v2", "duration": DUR, "master": "characters/ayoh-mad/00-master/master-cutout.png", "labels": False, "tag": "PREVIEW v2 · BUKAN FINAL",
         "vo": {"src": "footage/ready/recruitment-01/vo-tight.wav", "at": 0.0}, "music": {"src": "music/story-documentary-bed.mp3", "volume": 0.42, "duckTo": 0.3},
         "words": words, "scenes": scenes, "layers": layers,
         "cues": [{"sfx": "riser", "at": round(JOBS - 1.6, 2), "volume": 0.25}, {"sfx": "ding", "at": round(END + 0.4, 2), "volume": 0.35}],
         "emphasis": {"susahnya": "script", "sendiri": "big", "dipercayai": "big", "awak": "big", "bersama-sama": "script", "seorang": "big"}}
out = ROOT / "out/.recruitment-01-v2.props.json"
json.dump(props, open(out, "w"), ensure_ascii=False, indent=1)
d = [s["to"] - s["from"] for s in scenes if s["from"] < VO_END]
print(f"✓ {out.name}: {DUR}s, VO {VO_END:.1f}s, {len(scenes)} shots (avg {sum(d)/len(d):.2f}s, max {max(d):.2f}s), {len(layers)} layers, {len(words)} words")
