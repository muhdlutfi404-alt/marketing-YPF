# 🎞️ Raw-Footage Story Editing — Ya PakCik Video Studio

Edit **your real MP4 footage** (your face, your voice, your product) into a documentary-style
vertical video with professional motion graphics — entirely from an Android phone.

```
📱 Upload MP4 → 1 IMPORT → 2 INGEST (analyse) → 3 TRANSCRIBE → 4 EDIT (story timeline) → 5 CHECK → 6 RENDER → 📱 Download MP4
```

## The rules this system enforces

| Rule | How it's enforced |
|---|---|
| Never replace the presenter with an AI avatar | There is no avatar or face generation anywhere. Shots only show your real clips. |
| Never generate fictional product footage | Product visuals come only from your clips. Graphics are text, shapes and charts. No drawn products are used in story edits. |
| Never invent prices, specs, certifications or claims | **Safety check.** Any graphic containing a number, price, "halal", certification, spec or superlative needs proof: either the **exact spoken words** (and every number on screen must be in those words), or a **confirmed entry in `facts.json`**. Otherwise the export is blocked. |
| Graphics support what was actually said | Graphics are anchored to the moment the words are spoken (`"at": {"quote": "lapan minit"}`). |
| Preserve original footage and voice | Originals are never modified. Prepared copies only change the format and set the overall volume (one linear gain, no voice effects). Zooms only crop. Grades are gentle and skin-safe. |
| Placeholders only when clearly identified | They're shown with a yellow **PLACEHOLDER** ribbon, and the final export is blocked until they're replaced. |
| Subtitles keep your exact words | Malay mode, never translated, with a Kelantanese prompt. Corrections only change the words you name. |

---

## 📱 The phone workflow (no computer needed)

You work in the **Claude app** (a Claude Code session on the `marketing-YPF` repository). ChatGPT writes the creative direction, and Claude runs every command for you.

### 1. Upload your footage
- **Small clips (attachment works):** attach the MP4 to your message in the Claude app.
- **Large clips (recommended for 1–2 min phone videos, often 150–400 MB):**
  1. Open **Google Drive** → **+** → **Upload** → choose the video.
  2. Long-press the file → **Share** → **General access: "Anyone with the link" (Viewer)** → **Copy link**.
  3. Paste the link to Claude.

Then say: *"Import this as project `frozen-nugget-01`."*

### 2. Claude analyses and transcribes
Claude runs ingest and transcription, then sends you:
- the **footage report**: length, resolution, recording date, speech regions
- the **contact sheet**: thumbnails of your clip with timestamps
- the **transcript** with ⚠ on words Whisper wasn't sure about

### 3. Correct the subtitles (optional, recommended)
Reply with fixes, for example: *"paci → Pak Cik, lembot talam → lembut dalam"*.
Only those words change, and their timing is kept. You can also send an `.srt` file you corrected in CapCut.

### 4. Get the creative direction from ChatGPT
Paste the transcript and the template below into ChatGPT, then paste ChatGPT's direction back to Claude.

### 5. Preview the draft
Claude renders a **draft** (540×960, fast) and sends it to you with a contact sheet. Reply with changes,
for example *"make the chart appear earlier"* or *"stronger punch-in on 'siap'"*.

### 6. Final export and download
Confirm any facts you want shown (price, halal, contact). Claude then renders the **final 1080×1920 MP4**
and sends it to the chat → tap **Download**.

---

## 🧠 Brief template for ChatGPT (copy and paste)

```text
You are the creative director for a documentary-style commercial edit.
Footage: REAL presenter (talking head) + REAL product demo, vertical 1080x1920.
Brand: YaPakCik Frozen. Language: Bahasa Melayu (Kelantan dialect) — keep the spoken words exactly.

STRICT RULES
- Do not add any price, certification (halal etc.), spec, statistic or "best/paling" claim
  unless the presenter SAYS it in the transcript, or I list it as a confirmed fact below.
- Every on-screen number must be one the presenter actually says.
- No AI avatars, no invented product shots. Only my footage + text/graphics.

CONFIRMED FACTS (only these may appear): <e.g. none yet>

Using the transcript below, give me an edit direction as a TABLE with columns:
# | When (EXACT spoken words from the transcript) | Picture (cut / punch-in / zoom-in / zoom-out /
b-roll from demo clip at mm:ss) | Graphic (keyword / full-screen statement / chapter card / counter /
chart / steps / callout / lower third / CTA) + its exact text | Transition (cut / flash / zoom-punch /
frost-dissolve / fade / slide) | Sound (whoosh / pop / impact / riser / ticks / music mood)

Also give: overall pacing (which pauses or retakes to cut), colour mood, and the opening hook.

TRANSCRIPT:
<paste the transcript Claude sent>
```

See `docs/examples/sample-frozen-direction.md` for a filled-in example and `src/edits/sample-frozen/edit.json` for how Claude implements it.

---

## Commands (Claude runs these for you)

| Step | Command | What it does |
|---|---|---|
| Import | `npm run story:import -- <project> --uploads` | Copies the videos you attached in the app |
| | `npm run story:import -- <project> --url "<Drive link>"` | Downloads a shared Google Drive video |
| Ingest | `npm run story:ingest -- <project> [--brand project-am] [--clean-voice] [--max 2560]` | Reads metadata, levels voice volume to -16 LUFS (linear), makes the prepared copy, detects speech, silence and scenes, builds the contact sheet, and creates draft `edit.json` and `facts.json` |
| Transcribe | `npm run story:transcribe -- <project> [--hotwords "YaPakCik, nugget"]` | Whisper large-v3 on CPU, word timings (~0.8× real time) |
| SRT instead | `npm run story:srt -- <project> <clip> file.srt` | Uses your own subtitles, text kept exactly |
| Fix words | `npm run story:fix -- <project> <clip> "wrong => right"` | Corrects words and keeps timing |
| Draft cut | `npm run story:suggest -- <project> --write` | Removes pauses (jump cuts) and alternates framing |
| Check | `npm run story:check -- <project> [--final]` | Safety check: claims, quotes, cut points, placeholders, zoom sharpness |
| Draft | `npm run story:render -- <project> --draft --stills` | Fast 540×960 preview plus a contact sheet |
| Final | `npm run story:render -- <project> --stills` | 1080×1920 H.264 BT.709, peak-limited audio, verified, copied to the outputs folder |
| Tests | `npm run story:test` | Proves the guardrails block invented content |
| Sample | `npm run story:sample` | Makes the labelled test footage and runs ingest |

Files per project: `src/edits/<project>/`
`edit.json` (the edit) · `facts.json` (confirmed facts) · `transcripts/<clip>.json|.srt|.txt` · `footage.json` (generated; kept local because it can contain GPS)

---

## `edit.json` reference

Times are in **seconds**. Anywhere a time is accepted you can also write a **spoken quote**:
`{"quote": "lapan minit", "edge": "start"|"end", "offset": 0.2, "occurrence": 1, "shot": "s6"}`

### Shots: the main story timeline (your real footage, original voice)
```json
{ "id": "s3", "clip": "talking-01", "in": 12.4, "out": 18.9, "audio": "keep",
  "focus": { "x": 0.5, "y": 0.4 },
  "transition": { "type": "flash", "duration": 0.2 },
  "zooms": [ { "at": { "quote": "siap" }, "type": "punch-in", "scale": 1.25 } ],
  "gainDb": 0 }
```
- `focus` is where your face is (0–1). Zooms push towards it, and landscape clips are cropped around it.
- Zoom types:
  - `punch-in` / `punch-out`: a fast cinematic cut-zoom
  - `zoom-in` / `zoom-out`: a smooth move over `duration`
  - `push`: a slow continuous move
  - `reset`
- Transitions: `cut` (default), `fade`, `slide`, `wipe`, `flash`, `zoom-punch`, `light-leak`, `frost-dissolve`, `iris`.

### Layers: graphics and B-roll on top
Every layer has `id`, `type`, `at`, `duration` (seconds, or `"quote"` to last as long as the words), `source` and `props`.

| `source` | Use for | Needs |
|---|---|---|
| `"transcript"` | Anything based on what was said | `evidence.quote`: the exact words. Every number shown must be in them. |
| `"facts"` | Price, halal, contact, names | `evidence.fact`: a key in `facts.json` with `confirmed: true`. The numbers must match. |
| `"design"` | Pure labels, B-roll | Must not contain claims (numbers, prices, certifications, superlatives) |
| `"placeholder"` | Not ready yet | Shows a PLACEHOLDER ribbon. Final export is blocked. |

| `type` | `props` |
|---|---|
| `broll` | `clip`, `in`, `focus`, `zooms`, `volume` (0 = muted, e.g. 0.2 keeps ambience), `transition` |
| `keyword` | `text`, `highlight[]`, `animation`: slam / pop / rise / tracking, `position`: top / upper / center |
| `statement` | Full screen: `lines[]`, `kicker`, `highlight[]`, `plate`: blur / brand / dark |
| `chapter` | Full screen: `kicker`, `title`, `plate` |
| `counter` | `value`, `prefix`, `suffix`, `label`, `decimals`, `fullscreen`, `plate` |
| `chart` | Full screen: `title`, `unit`, `items[{label, value, highlight}]`, `plate` |
| `steps` | `title`, `items[]`, `revealQuotes[]` (each step ticks when spoken), `fullscreen` |
| `callout` | `text`, `x`, `y` (the point in the frame to point at), `side` |
| `badge` | `text`, `icon` (shield / snowflake / star / clock / flame / leaf / heart / truck), `position` |
| `lowerThird` | `name`, `role` |
| `cta` | `headline`, `button`, `lines[]`, `fullscreen`, `plate` |
| `progress` | `label` |

The `blur` plate uses **your real footage** behind the graphic, blurred, so the story's context stays on screen.

### Captions, look and audio
```json
"captions": { "enabled": true, "style": "bold" | "documentary" | "minimal", "uppercase": false, "position": 0.72 },
"look":     { "grade": "warm-commercial", "gradeIntensity": 0.8, "grain": true, "vignette": true, "breathing": 0.03 },
"audio":    { "music": "music/story-documentary-bed.mp3", "musicVolume": 0.5, "duckTo": 0.22, "sfx": "auto", "sfxVolume": 0.8 }
```
- Grades: `natural`, `warm-commercial`, `cinematic-teal-orange`, `documentary-matte`, `fresh-cool`. All are skin-safe.
- Music is automatically ducked whenever someone speaks.
- With `sfx: "auto"`, sound effects are placed on transitions, punch-ins, B-roll, keywords, counters, charts, steps and the CTA.

---

## Technical notes
- **Speed (this cloud environment, 4 CPU cores):**
  - transcription takes about 0.8× the clip length (large-v3)
  - a final render takes about 9 seconds per second of video, so a 90-second edit takes about 15 minutes
  - a draft takes about a third of that
- **Your audio:** mono phone audio is copied to both channels, and the voice is levelled to -16 LUFS with a single linear gain. The final mix gets a transparent peak limiter at -1 dBFS (audio only).
- **Zoom sharpness:** at 1080×1920 source, keep punch-ins at 1.3× or less. Ingest with `--max 3840` keeps 4K detail for bigger zooms, but renders are slower.
- **Whisper and Kelantanese:** dialect words are kept, but some words will be misheard. Always review the ⚠ words.
