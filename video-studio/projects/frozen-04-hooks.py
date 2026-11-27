#!/usr/bin/env python3
"""frozen-04 (daging slice) — NEW VERSIONS with a strong hook, built from the approved edits.
  frozen-04-vN → frozen-04-vNb (approved originals untouched). See projects/hooklib.py for what a build does.
  python3 projects/frozen-04-hooks.py
"""
from hooklib import HookKit, T

K = HookKit(base="frozen-04", clip="lv_0_20261123141154")
# V1 — harga & kenapa naik: hook on the box price
K.build("frozen-04-v1", "frozen-04-v1b",
      cold=[(13.3, 16.3, 1.42, None)],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.0, "source": "facts", "evidence": {"fact": "priceList"},
                  "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "daging slice", "size": "s"}, {"text": "RM18.50", "size": "xl", "style": "gold"}, {"text": "kalau ambil kotak", "size": "s"}], "revealAt": [0, 0.12, 0.5]}},
      music="music/ypf-harga.mp3",
      fix_layers={"tiers": {"revealQuotes": ["runcit 20", "kita tolak 19", "wigo 18.50#2"]}})
# V2 — tips: hook on "stok lama"
K.build("frozen-04-v2", "frozen-04-v2b",
      cold=[(152.88, 157.12, 1.4, {"x": 0.6, "y": 0.35})],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.2, "source": "transcript", "evidence": T("tu maksudnya hok stok lamalah kemungkinan bau hamis"),
                  "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "daging slice ni", "size": "s"}, {"text": "stok lama?", "size": "xl", "style": "gold"}, {"text": "tengok tanda ni", "size": "s"}], "revealAt": [0, 0.12, 0.6]}},
      music="music/ypf-tips.mp3",
      fix_layers={"hook": {"revealQuotes": ["Bau kuat", "bau hamis#2"]},
                  "belakang": {"revealQuotes": ["belakang gini jadi gelap", "hok stok lamalah#2"]},
                  "meat": {"revealQuotes": ["hok bau ni biasanya", "dia jadi hitam", "dia jadi hitam#2"]}},
      nosplit=[(97.6, 99.9)],
      # remove repetition: "bau… biasanya stok lama" (said again in the cold open) and the first "tengok kat belakang… barang lamalah"
      # (the close-up of the real pack later explains the same thing better)
      drop_shots=("t2",), shot_edits={"t3": {"out": 103.95}}, layer_edits={"meat": {"duration": 5.1, "evidence": {"quote": "hok bau ni biasanya dia jadi hitam dia jadi hitam"}}})
# V3 — penghantaran: hook on free delivery (owner-confirmed terms)
K.build("frozen-04-v3", "frozen-04-v3b",
      cold=[],
      hook_layer={"id": "hook0", "type": "scene", "at": 0, "duration": 3.4, "source": "facts", "evidence": {"fact": "delivery"},
                  "props": {"kind": "hook", "y": 70, "h": 560, "scale": 1.3, "backdrop": True, "words": [{"text": "warga Tumpat", "size": "s"}, {"text": "penghantaran", "size": "m"}, {"text": "PERCUMA", "size": "xl", "style": "gold"}], "revealAt": [0, 0.15, 0.9]}},
      music="music/ypf-hantar.mp3",
      fix_layers={"delivery": {"revealQuotes": ["Ada perkhidmatan", "percuma#2", "kuantiti yang kita", "kuantiti yang kita nak", "pembelian 1,000"]}},
      drop_layers=("hook",))
