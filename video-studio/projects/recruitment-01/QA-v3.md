# QA — recruitment-01 preview v3 (self-review before hand-off)

## Weaknesses found in v2 (by me, before the owner had to point them out)
| # | v2 weakness | v3 fix |
|---|---|---|
| 1 | Flat gradient backgrounds with simple silhouettes → looked cheap | 5 painted background plates generated here (dawn market, morning stall, day market, night stall, dusk market), blurred like a real lens, moving slower than the character (parallax depth) |
| 2 | The same whip transition ~7 times | Transitions chosen per beat: speed-ramp zoom (×3), white flash (×2), whip (×3), one deliberate slow fade at the emotional turn, iris reveal on "AWAK", hard/jump cuts everywhere else |
| 3 | Every icon beat had the same layout | Label position alternates (top / bottom); different motion per icon (bubbles pop, boxes drop, van drives through, magnifier scans, chart draws, spotlight, team joins, heart beats) |
| 4 | Same "documentary bed" music as every earlier video | New original score "Perjalanan" (76 BPM, D–A–Bm–G): piano alone → strings → pulse at the realisation → lift at "awak" → rhythmic bed under the job cards |
| 5 | No colour storytelling | Grade by time: PRESENT (vivid) for the hook and the invitation, FLASHBACK (warm, slightly desaturated) for the journey, NIGHT (cool) for the late nights, MONO punch for the "tapi…" interrupt |
| 6 | Weak hook interrupt | "Orang nampak Ya Pakcik Frozen hari ni…" → on "tapi" a mono speed-ramp punch-in, then a flash into the dawn memory |
| 7 | "Dalam masa yang sama" shown as one shot | Split-screen SIANG / MALAM (dawn above, night below) — literally "at the same time" |

## Kept from v2 (worked)
Tightened VO (56 → 45 s, no speed change), 28–29 word-synced shots, motion-graphic beats instead of repeating the character, struck-through "pekerja", big readable job cards, WhatsApp CTA, bold UPPERCASE captions that step aside when a graphic shows the same words.

## Known limits (honest)
- **Character poses**: still the owner's 7 poses (muscular version). The owner chose Option B (regenerate from master); my local generator cannot keep Ayoh Mad's identity (tested and rejected, see REVIEW-LOG). These shots will be swapped when new poses exist; timing stays.
- **Pose 3** (packing orders) does not exist yet → that line is told with motion graphics.
- **Stock footage / licensed music libraries**: network access to Pexels/Mixkit was declined, so all visuals and music here are generated in this system (plates: Stable Diffusion 1.5, CreativeML OpenRAIL-M; music & SFX: synthesised).
- **Logo**: text wordmark until the official file is supplied.
- Plates are 512×896 upscaled; they are shown out of focus on purpose, so the softness reads as depth of field, not blur.
