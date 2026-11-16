# frozen-01-cinematic — EXPERIMENTAL visual treatment (awaiting approval)

Base: the approved frozen-01 cut (55.6s) — same shots, voice, subtitles, prices. Only visuals change.
Approved project `src/edits/frozen-01` and its MP4 are never modified.

Concept: "from the cold dark to the real shop" — problem scenes in a cold, frosty generated environment,
proof/price in a warm studio, then a reveal back to the REAL YaPakCik Frozen premises for the call to action.

Proven in this environment (16 Nov 2026):
- Cut-out: BiRefNet (MIT) for person+product, MODNet (Apache-2.0) per frame for the person; real pixels copied exactly.
- Backgrounds: Stable Diffusion 1.5 (CreativeML OpenRAIL-M) on CPU, ~3 min per plate; used as soft-focus plates.
Rules: generated images never contain people, food or products; never photoreal stand-ins for real places;
subject only gets global exposure/white-balance matching; CTA uses the real background.
