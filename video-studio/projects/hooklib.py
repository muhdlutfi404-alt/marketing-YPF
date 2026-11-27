"""Shared tools for NEW hook versions of approved footage edits (the approved originals are never modified).

  ctx = HookKit(base="frozen-04", clip="lv_0_...")
  ctx.build(src="frozen-04-v1", dst="frozen-04-v1b", cold=[(in, out, scale, focus)], hook_layer={...}, music="music/...")

  What a build does:
   1. HOOK: big on-screen hook line at 0 s + optional COLD OPEN (the most compelling real line moved to the front)
   2. TIGHTEN: every pause ≥ 0.35 s inside a shot is cut out → clean jump cuts (framing alternates), no speed change
   3. own music per video; transcript word timings re-spread over speech only, so subtitles stay on the words
"""
import json, re, copy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
norm = lambda x: re.sub(r"[^\w-]", "", x.lower())
T = lambda q: {"quote": q}


class HookKit:
    def __init__(self, base, clip, min_pause=0.35):
        self.C = clip
        sil = json.load(open(ROOT / "src/edits" / base / "footage.json"))["clips"][clip]["analysis"]["silences"]
        self.SIL_ALL = [(s["from"], s["to"]) for s in sil]
        self.SIL = [(a, b) for a, b in self.SIL_ALL if b - a >= min_pause]
        self.TR = self.realign(json.load(open(ROOT / "src/edits" / base / "transcripts" / f"{clip}.json")))
        self.WORDS = [w for s in self.TR["segments"] for w in s["words"]]

    def realign(self, tr):
        """SRT word timings are spread evenly over each line, so words land inside pauses.
           Re-spread every line's words over its SPEECH parts only (line range minus detected silences)."""
        for seg in tr["segments"]:
            a, b = seg["start"], seg["end"]
            parts, cur = [], a
            for s0, e0 in self.SIL_ALL:
                if e0 <= a or s0 >= b: continue
                if s0 > cur: parts.append((cur, min(s0, b)))
                cur = max(cur, e0)
            if cur < b: parts.append((cur, b))
            parts = [(x, y) for x, y in parts if y - x > 0.05] or [(a, b)]
            total = sum(y - x for x, y in parts)
            ws = seg["words"]; L = sum(max(1, len(w["text"].strip())) for w in ws)
            def at(u):   # u in [0,total] → (source time, part index)
                for k, (x, y) in enumerate(parts):
                    if u <= y - x: return x + u, k
                    u -= y - x
                return parts[-1][1], len(parts) - 1
            u = 0.0
            for w in ws:
                d = total * max(1, len(w["text"].strip())) / L
                (s0, k0), (s1, k1) = at(u), at(min(total, u + d * 0.92))
                if k1 != k0:   # a word never straddles a pause: keep it in the part that holds most of it
                    if parts[k0][1] - s0 >= s1 - parts[k1][0]: s1 = parts[k0][1]
                    else: s0 = parts[k1][0]
                w["start"], w["end"] = round(s0, 3), round(s1, 3); u += d
        tr["wordTimingNote"] = "words re-spread over speech parts only (projects/hooklib.py)"
        return tr

    def quote_time(self, q, lo, hi):
        """source time of the first word of quote q inside [lo, hi]"""
        toks = [norm(t) for t in q.split()]
        W = self.WORDS
        for i, w in enumerate(W):
            if not (lo - 0.05 <= w["start"] <= hi): continue
            if [norm(x["text"]) for x in W[i:i + len(toks)]] == toks: return w["start"]
        return None

    def fit_quote(self, q, lo, hi):
        """the longest leading part of quote q whose words all sit inside [lo, hi] (a cut may split a quote)"""
        toks = q.split()
        W = self.WORDS
        for i, w in enumerate(W):
            if not (lo - 0.05 <= w["start"] <= hi): continue
            if [norm(x["text"]) for x in W[i:i + len(toks)]] != [norm(t) for t in toks]: continue
            n = len(toks)
            while n > 0 and W[i + n - 1]["end"] > hi + 0.05: n -= 1
            return " ".join(toks[:n]) if n >= min(2, len(toks)) else None
        return None

    def tighten(self, shot, nosplit=()):
        a, b = shot["in"], shot["out"]
        # cut only true pauses: no (estimated) word may sit inside the removed part — subtitles and anchors stay intact
        cuts = [(s, e) for s, e in self.SIL if s > a + 0.15 and e < b - 0.15 and not any(ns <= s <= ne or ns <= e <= ne for ns, ne in nosplit)
                and not any(s + 0.06 < w["end"] and w["start"] < e - 0.06 for w in self.WORDS)]
        if not cuts: return [shot]
        PAD = 0.06
        # never create a piece shorter than 0.4 s (it would flash): skip the cut instead — nothing is ever dropped
        kept, cur = [], a
        for s, e in cuts:
            if s + PAD - cur < 0.4: continue
            kept.append((s, e)); cur = e - PAD
        while kept and b - (kept[-1][1] - PAD) < 0.4: kept.pop()
        cuts = kept
        if not cuts: return [shot]
        self.cuts += [(s + PAD, e - PAD) for s, e in cuts]
        bounds, cur = [], a
        for s, e in cuts:
            bounds.append((cur, s + PAD)); cur = e - PAD
        bounds.append((cur, b))
        bounds = [(round(x, 3), round(y, 3)) for x, y in bounds]
        base = next((z for z in shot.get("zooms", []) if z.get("at") == 0), {"at": 0, "type": "punch-in", "scale": 1.3, "duration": 0.01})
        quoted = [z for z in shot.get("zooms", []) if isinstance(z.get("at"), dict)]
        pieces = []
        for k, (x, y) in enumerate(bounds):
            p = copy.deepcopy(shot); p["id"] = f"{shot['id']}_{k + 1}"; p["in"], p["out"] = x, y
            b0 = dict(base); sc = base.get("scale", 1.3)
            b0["scale"] = round(sc * (1.0 if k % 2 == 0 else (0.9 if sc >= 1.45 else 1.1)), 3)   # jump cut: framing alternates (never past ~1.6×)
            zs = [b0]
            for z in quoted:
                q = self.fit_quote(z["at"]["quote"], x, y)
                if q: zs.append({**z, "at": {**z["at"], "quote": q}})
            p["zooms"] = zs
            if k > 0: p.pop("transition", None)
            pieces.append(p)
        return pieces

    def build(self, src, dst, cold, hook_layer, music, fix_layers=None, drop_layers=(), nosplit=(), title=None,
              shot_edits=None, drop_shots=(), layer_edits=None, readme_extra="", fit_layers=True):
        C = self.C
        fix_layers = fix_layers or {}
        e = json.load(open(ROOT / "src/edits" / src / "edit.json"))
        e["shots"] = [s for s in e["shots"] if s["id"] not in drop_shots]
        for s in e["shots"]:
            s.update((shot_edits or {}).get(s["id"], {}))
        for l in e["layers"]:
            l.update((layer_edits or {}).get(l["id"], {}))
        shots = []; self.cuts = []
        for s in e["shots"]:
            shots += self.tighten(s, nosplit)
        # cold open in front, then a punchy transition into the story
        cold_shots = [{"id": f"cold{k + 1}", "label": "COLD OPEN (hook)", "clip": C, "in": a, "out": b, "audio": "keep", "focus": f or {"x": 0.5, "y": 0.3},
                       "zooms": [{"at": 0, "type": "punch-in", "scale": sc, "duration": 0.01}]} for k, (a, b, sc, f) in enumerate(cold)]
        shots[0]["transition"] = {"type": "zoom-punch", "duration": 0.2}
        e["shots"] = cold_shots + shots
        e["layers"] = [hook_layer] + [l for l in e["layers"] if l["id"] not in drop_layers]
        for l in e["layers"]:
            if l["id"] in fix_layers:
                l["props"].update(fix_layers[l["id"]])
                if "revealQuotes" in fix_layers[l["id"]]: l["props"].pop("revealAt", None)
        if fit_layers:
            # a layer timed over a stretch of speech gets shorter by exactly the pauses cut out of that stretch
            for l in e["layers"]:
                at = l.get("at")
                if not isinstance(at, dict) or "quote" not in at or not l.get("duration"): continue
                s0 = self.quote_time(at["quote"], 0, 1e9)
                if s0 is None: continue
                s0 += at.get("offset", 0); s1 = s0 + l["duration"]
                removed = sum(max(0, min(b, s1) - max(a, s0)) for a, b in self.cuts)
                if removed > 0.05:
                    print(f"   · {l['id']}: duration {l['duration']:.2f} → {l['duration'] - removed:.2f} s (pauses cut inside it)")
                    l["duration"] = round(l["duration"] - removed, 2)
        e["audio"]["music"] = music; e["audio"]["musicVolume"] = 0.26; e["audio"]["duckTo"] = 0.12
        e["project"] = dst; e["title"] = (title or e.get("title", "")) + " — versi hook baru"
        e["_readme"] = (f"NEW VERSION of {src} (approved original untouched): on-screen hook at 0 s"
                        + (" + cold open" if cold else "") + ", pauses ≥0.35 s cut as jump cuts, own music." + readme_extra)
        d = ROOT / "src/edits" / dst; (d / "transcripts").mkdir(parents=True, exist_ok=True)
        for f in ("footage.json", "facts.json"):
            (d / f).write_text((ROOT / "src/edits" / src / f).read_text().replace(f'"project": "{src}"', f'"project": "{dst}"'))
        json.dump(self.TR, open(d / "transcripts" / f"{C}.json", "w"), ensure_ascii=False, indent=1)   # realigned word timing
        json.dump(e, open(d / "edit.json", "w"), indent=1, ensure_ascii=False)
        before = sum(s["out"] - s["in"] for s in json.load(open(ROOT / "src/edits" / src / "edit.json"))["shots"])
        after = sum(s["out"] - s["in"] for s in e["shots"])
        print(f"✓ {dst}: {len(e['shots'])} shots, footage {before:.1f}s → {after:.1f}s (incl. cold open)")
        return e
