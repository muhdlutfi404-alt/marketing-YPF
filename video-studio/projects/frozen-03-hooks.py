#!/usr/bin/env python3
"""frozen-03 (isi ayam fillet / chicken chop) — NEW VERSIONS with a strong hook, built from the approved edits.
  frozen-03-vN → frozen-03-vNb  (approved originals untouched). See projects/hooklib.py for what a build does.
  python3 projects/frozen-03-hooks.py
"""
from hooklib import HookKit, T

K = HookKit(base="frozen-03", clip="lv_0_20261119124959")
# measured from the audio energy (SRT estimate was ~0.3 s early here): the v2 cold open starts cleanly on "sepaket"
for w in K.WORDS:
    if abs(w["start"] - 102.2) < 0.01: w["start"], w["end"] = 102.33, 102.62      # Ada
    elif abs(w["start"] - 102.453) < 0.01: w["start"], w["end"] = 102.75, 102.93  # sepaket

# V1 — chicken chop guna ayam apa? Cold open on the punchline "…isi dada sahaja… Rugi." → then the question and the story
K.build("frozen-03-v1", "frozen-03-v1b",
        cold=[(25.55, 29.4, 1.42, None)],
        hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 4.4, "source": "transcript",
                    "evidence": T("Kalau ayam seekor gini ada isi dada sahaja nak buat chicken chop rugi"),
                    "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "ayam seekor", "size": "s"}, {"text": "buat chicken chop?", "size": "m"}, {"text": "RUGI", "size": "xl", "style": "gold"}],
                              "revealAt": [0, 0.4, 3.15]}},
        music="music/ypf-ayam.mp3",
        drop_layers=("hook",),   # the old hook graphic would repeat the question right after the new one
        layer_edits={"chicken": {"at": {"quote": "Kalau ayam seekor gini", "occurrence": 2, "offset": -0.15}}},
        fix_layers={"chicken": {"revealQuotes": ["ayam seekor gini#2", "isi dada sahaja#2", "Rugi#2", "nak untung", "Ambillah isi ayam"]}})

# V2 — chicken chop bajet: cold open on the value line "sepaket 2 kilo, RM26" → straight into "20 pinggan ataupun 15"
K.build("frozen-03-v2", "frozen-03-v2b",
        cold=[(102.7, 105.3, 1.3, {"x": 0.5, "y": 0.42})],  # he is already holding the pack up; "sepaket ni 2 kilo, RM26 sahaja sepaket"
        hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.0, "source": "facts", "evidence": {"fact": "priceList"},
                    "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "sepaket 2 kilo", "size": "s"}, {"text": "RM26", "size": "xl", "style": "gold"}, {"text": "berapa pinggan chicken chop?", "size": "s"}],
                              "revealAt": [0, 0.9, 1.7]}},
        music="music/ypf-bajet.mp3",
        fix_layers={"harga": {"revealQuotes": ["jimat bajet", "RM26 sahaja#2", "sepaket ni 2 kilo#2"]}})

# V3 — harga & borong: cold open on the teaser "5 kotak ke atas, kita wi murah lagi" → "harga berapa?" → the tiers
K.build("frozen-03-v3", "frozen-03-v3b",
        cold=[(190.65, 193.8, 1.42, None)],
        hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.15, "source": "facts", "evidence": {"fact": "priceList"},
                    "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "isi ayam fillet", "size": "s"}, {"text": "5 kotak ke atas", "size": "m"}, {"text": "LAGI MURAH", "size": "xl", "style": "gold"}],
                              "revealAt": [0, 0.5, 1.9]}},
        music="music/ypf-borong.mp3",
        # the price board now enters right on "RM26" (no empty header for 1.5 s); same end point as before
        layer_edits={"tiers": {"at": {"quote": "RM26 sahaja sepaket ni", "offset": -0.35}, "duration": 17.48},
                     "hook": {"evidence": {"quote": "harga berapalah ni"}}},   # "Aa" now sits in the piece before a cut pause
        fix_layers={"tiers": {"revealQuotes": ["RM26 sahaja sepaket ni", "orang kata 149", "5 kotak ke atas#2"]}})
