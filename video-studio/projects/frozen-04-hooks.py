#!/usr/bin/env python3
"""frozen-04 (daging slice) — NEW VERSIONS with a strong hook, built from the approved edits.

  For each frozen-04-vN → frozen-04-vNb:
   1. HOOK: big on-screen hook line at 0 s + COLD OPEN (the most compelling real line moved to the front)
   2. TIGHTEN: every pause ≥ 0.35 s inside a shot is cut out → clean jump cuts (alternating framing), no speed change
   3. own original music per video (scripts/music/brand-score.py)
  The approved originals are not modified.
  python3 projects/frozen-04-hooks.py
"""
import json, re, copy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
C = "lv_0_20261123141154"
SIL = [(s["from"], s["to"]) for s in json.load(open(ROOT / "src/edits/frozen-04/footage.json"))["clips"][C]["analysis"]["silences"] if s["to"] - s["from"] >= 0.35]
TR = json.load(open(ROOT / "src/edits/frozen-04/transcripts" / f"{C}.json"))
SIL_ALL = [(s["from"], s["to"]) for s in json.load(open(ROOT / "src/edits/frozen-04/footage.json"))["clips"][C]["analysis"]["silences"]]

def realign(tr):
    """SRT word timings are spread evenly over each line, so words land inside pauses.
       Re-spread every line's words over its SPEECH parts only (line range minus detected silences)."""
    for seg in tr["segments"]:
        a, b = seg["start"], seg["end"]
        parts, cur = [], a
        for s0, e0 in SIL_ALL:
            if e0 <= a or s0 >= b: continue
            if s0 > cur: parts.append((cur, min(s0, b)))
            cur = max(cur, e0)
        if cur < b: parts.append((cur, b))
        parts = [(x, y) for x, y in parts if y - x > 0.05] or [(a, b)]
        total = sum(y - x for x, y in parts)
        ws = seg["words"]; L = sum(max(1, len(w["text"].strip())) for w in ws)
        def at(u):   # u in [0,total] → source time
            for x, y in parts:
                if u <= y - x: return x + u
                u -= y - x
            return parts[-1][1]
        u = 0.0
        for w in ws:
            d = total * max(1, len(w["text"].strip())) / L
            w["start"], w["end"] = round(at(u), 3), round(at(min(total, u + d * 0.92)), 3); u += d
    tr["wordTimingNote"] = "words re-spread over speech parts only (frozen-04-hooks.py)"
    return tr
TR = realign(TR)
WORDS = [w for s in TR["segments"] for w in s["words"]]
norm = lambda x: re.sub(r"[^\w-]", "", x.lower())

def quote_time(q, lo, hi):
    """source time of the first word of quote q inside [lo, hi]"""
    toks = [norm(t) for t in q.split()]
    for i, w in enumerate(WORDS):
        if not (lo - 0.05 <= w["start"] <= hi): continue
        if [norm(x["text"]) for x in WORDS[i:i + len(toks)]] == toks: return w["start"]
    return None

def tighten(shot, nosplit=()):
    a, b = shot["in"], shot["out"]
    # cut only true pauses: no (estimated) word may sit inside the removed part — subtitles and anchors stay intact
    cuts = [(s, e) for s, e in SIL if s > a + 0.15 and e < b - 0.15 and not any(ns <= s <= ne or ns <= e <= ne for ns, ne in nosplit)
            and not any(s + 0.06 < w["end"] and w["start"] < e - 0.06 for w in WORDS)]
    if not cuts: return [shot]
    PAD = 0.06
    bounds, cur = [], a
    for s, e in cuts:
        bounds.append((cur, s + PAD)); cur = e - PAD
    bounds.append((cur, b))
    bounds = [(round(x, 3), round(y, 3)) for x, y in bounds if y - x >= 0.3]
    base = next((z for z in shot.get("zooms", []) if z.get("at") == 0), {"at": 0, "type": "punch-in", "scale": 1.3, "duration": 0.01})
    quoted = [z for z in shot.get("zooms", []) if isinstance(z.get("at"), dict)]
    pieces = []
    for k, (x, y) in enumerate(bounds):
        p = copy.deepcopy(shot); p["id"] = f"{shot['id']}_{k + 1}"; p["in"], p["out"] = x, y
        b0 = dict(base); b0["scale"] = round(base.get("scale", 1.3) * (1.0 if k % 2 == 0 else 1.1), 3)   # jump cut: framing alternates
        zs = [b0]
        for z in quoted:
            qt = quote_time(z["at"]["quote"], x, y)
            if qt is not None and x <= qt <= y: zs.append(z)
        p["zooms"] = zs
        if k > 0: p.pop("transition", None)
        pieces.append(p)
    return pieces

def build(src, dst, cold, hook_layer, music, fix_layers, drop_layers=(), nosplit=(), title=None, shot_edits=None, drop_shots=(), layer_edits=None):
    e = json.load(open(ROOT / "src/edits" / src / "edit.json"))
    e["shots"] = [s for s in e["shots"] if s["id"] not in drop_shots]
    for s in e["shots"]:
        s.update((shot_edits or {}).get(s["id"], {}))
    for l in e["layers"]:
        l.update((layer_edits or {}).get(l["id"], {}))
    shots = []
    for s in e["shots"]:
        shots += tighten(s, nosplit)
    # cold open in front, then a punchy transition into the story
    cold_shots = [{"id": f"cold{k + 1}", "label": "COLD OPEN (hook)", "clip": C, "in": a, "out": b, "audio": "keep", "focus": f or {"x": 0.5, "y": 0.3},
                   "zooms": [{"at": 0, "type": "punch-in", "scale": sc, "duration": 0.01}]} for k, (a, b, sc, f) in enumerate(cold)]
    shots[0]["transition"] = {"type": "zoom-punch", "duration": 0.2}
    e["shots"] = cold_shots + shots
    e["layers"] = [hook_layer] + [l for l in e["layers"] if l["id"] not in drop_layers]
    for l in e["layers"]:
        if l["id"] in fix_layers: l["props"].update(fix_layers[l["id"]]); [l["props"].pop(k, None) for k in ("revealAt",) if "revealQuotes" in fix_layers[l["id"]]]
    e["audio"]["music"] = music; e["audio"]["musicVolume"] = 0.26; e["audio"]["duckTo"] = 0.12
    e["project"] = dst; e["title"] = (title or e.get("title", "")) + " — versi hook baru"
    e["_readme"] = f"NEW VERSION of {src} (approved original untouched): on-screen hook at 0 s + cold open, pauses ≥0.35 s cut as jump cuts, own music."
    d = ROOT / "src/edits" / dst; (d / "transcripts").mkdir(parents=True, exist_ok=True)
    for f in ("footage.json", "facts.json"):
        (d / f).write_text((ROOT / "src/edits" / src / f).read_text().replace(f'"project": "{src}"', f'"project": "{dst}"'))
    json.dump(TR, open(d / "transcripts" / f"{C}.json", "w"), ensure_ascii=False, indent=1)   # realigned word timing
    json.dump(e, open(d / "edit.json", "w"), indent=1, ensure_ascii=False)
    before = sum(s["out"] - s["in"] for s in json.load(open(ROOT / "src/edits" / src / "edit.json"))["shots"])
    after = sum(s["out"] - s["in"] for s in e["shots"])
    print(f"✓ {dst}: {len(e['shots'])} shots, footage {before:.1f}s → {after:.1f}s (incl. cold open)")

T = lambda q: {"quote": q}
# V1 — harga & kenapa naik: hook on the box price
build("frozen-04-v1", "frozen-04-v1b",
      cold=[(13.3, 16.3, 1.42, None)],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.0, "source": "facts", "evidence": {"fact": "priceList"},
                  "props": {"kind": "hook", "y": 110, "h": 440, "words": [{"text": "daging slice", "size": "s"}, {"text": "RM18.50", "size": "xl", "style": "gold"}, {"text": "kalau ambil kotak", "size": "s"}], "revealAt": [0, 0.12, 0.5]}},
      music="music/ypf-harga.mp3",
      fix_layers={"tiers": {"revealQuotes": ["runcit 20", "kita tolak 19", "wigo 18.50#2"]}})
# V2 — tips: hook on "stok lama"
build("frozen-04-v2", "frozen-04-v2b",
      cold=[(152.88, 157.12, 1.4, {"x": 0.6, "y": 0.35})],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.2, "source": "transcript", "evidence": T("tu maksudnya hok stok lamalah kemungkinan bau hamis"),
                  "props": {"kind": "hook", "y": 110, "h": 440, "words": [{"text": "daging slice ni", "size": "s"}, {"text": "stok lama?", "size": "xl", "style": "gold"}, {"text": "tengok tanda ni", "size": "s"}], "revealAt": [0, 0.12, 0.6]}},
      music="music/ypf-tips.mp3",
      fix_layers={"hook": {"revealQuotes": ["Bau kuat", "bau hamis#2"]},
                  "belakang": {"revealQuotes": ["belakang gini jadi gelap", "hok stok lamalah#2"]},
                  "meat": {"revealQuotes": ["hok bau ni biasanya", "dia jadi hitam", "dia jadi hitam#2"]}},
      nosplit=[(97.6, 99.9)],
      # remove repetition: "bau… biasanya stok lama" (said again in the cold open) and the first "tengok kat belakang… barang lamalah"
      # (the close-up of the real pack later explains the same thing better)
      drop_shots=("t2",), shot_edits={"t3": {"out": 103.95}}, layer_edits={"meat": {"duration": 5.1, "evidence": {"quote": "hok bau ni biasanya dia jadi hitam dia jadi hitam"}}})
# V3 — penghantaran: hook on free delivery (owner-confirmed terms)
build("frozen-04-v3", "frozen-04-v3b",
      cold=[],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.4, "source": "facts", "evidence": {"fact": "delivery"},
                  "props": {"kind": "hook", "y": 110, "h": 440, "words": [{"text": "warga Tumpat", "size": "s"}, {"text": "penghantaran", "size": "m"}, {"text": "PERCUMA", "size": "xl", "style": "gold"}], "revealAt": [0, 0.15, 0.9]}},
      music="music/ypf-hantar.mp3",
      fix_layers={"delivery": {"revealQuotes": ["Ada perkhidmatan", "percuma#2", "kuantiti yang kita", "kuantiti yang kita nak", "pembelian 1,000"]}},
      drop_layers=("hook",))
