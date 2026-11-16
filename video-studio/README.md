# 🎬 Ya PakCik Video Studio

A code-based video editing studio built with **Remotion + React + TypeScript + FFmpeg**.
It ships with two professional, reusable templates. Each one exports in **landscape 16:9** and **vertical 9:16**:

| Brand | Style | What's inside |
|---|---|---|
| **PROJECT A.M** | Cinematic outdoor documentary | Cold-open hook, tracked-in title, chapter titles, GPS location tags, animated map route, elevation profile, journey stats, narration quote, end card, letterbox, film grain, colour grades |
| **YAPAKCIK FROZEN** | Commercial product storytelling | Kinetic "slam" hook with camera shake, 3D product reveal with frost burst, feature cards, lifestyle B-roll, thermometer infographic, comparison bars, 1-2-3 cooking steps, price burst, CTA with logo sting |

Both include **sound design**: whooshes synced to every transition, impacts, risers, pops, ticks on counters, ice sparkles, and background music with automatic fade in/out. All sounds are original and royalty-free.

---

## 1. One-time setup (on your computer)

You need:
1. **Node.js 20 or newer**: download from <https://nodejs.org> (choose "LTS").
2. **FFmpeg**: only for preparing raw footage.
   - Windows: `winget install ffmpeg`
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
3. **Git**, to download this repository.

Then open a terminal:

```bash
git clone https://github.com/muhdlutfi404-alt/marketing-YPF.git
cd marketing-YPF
git checkout claude/yapakcik-video-studio-setup-hgz2ss   # until it's merged into main
cd video-studio
npm install            # downloads the tools (takes 1–2 minutes, only once)
```

> The first time you preview or render, Remotion downloads a small headless browser by itself. That's normal.

---

## 2. Preview the videos (Remotion Studio)

```bash
npm run studio
```

A browser tab opens (usually <http://localhost:3000>). In it you can:

- Pick a video in the **left sidebar**: `Project-AM`, `YaPakCik-Frozen` or `Projects`. Each comes in a `-Landscape` and a `-Vertical` version.
- Press **Space** to play, and drag the timeline to scrub frame by frame.
- **Edit text, colours, durations and transition style live** in the **right sidebar** ("Props"). Changing a scene's duration updates the video's length automatically.
- Click 💾 **Save** in the props panel to write your changes back into the code.

Everything works **before** you add footage: the templates show animated placeholders (procedural mountains, warm bokeh, a 3D product pack) so you can design first.

---

## 3. Render (export) finished MP4s

| Command | Output |
|---|---|
| `npm run render:am` | `out/project-am-landscape.mp4` (16:9) |
| `npm run render:am:vertical` | `out/project-am-vertical.mp4` (9:16) |
| `npm run render:frozen` | `out/yapakcik-frozen-landscape.mp4` (16:9) |
| `npm run render:frozen:vertical` | `out/yapakcik-frozen-vertical.mp4` (9:16) |
| `npm run render:all` | All four of the above |

Render any composition by its ID:

```bash
npx remotion render Sample-Frozen-Reel-BM-Vertical out/reel.mp4
npx remotion render ProjectAM-Documentary-Landscape out/draft.mp4 --scale=0.5   # quick half-size draft
npx remotion still  YaPakCikFrozen-Commercial-Vertical out/thumbnail.jpg --frame=120   # thumbnail image
```

You can also render from the Studio with the **Render** button (top right).
Output settings live in `remotion.config.ts`: H.264, CRF 18 (visually lossless), playable everywhere: YouTube, TikTok, Instagram, WhatsApp.

---

## 4. Editing your own raw MP4s: the workflow

```
 📱 Raw MP4  →  🔍 Inspect  →  🔧 Prepare  →  ✍️ Describe the edit  →  👀 Preview  →  🎬 Render
```

**Step 1: add footage.** Copy your videos into `public/footage/raw/`.
*These files are never uploaded to GitHub* (see `.gitignore`). Keep backups on your drive.

**Step 2: inspect.**
```bash
npm run inspect
```
This shows each clip's size, frame rate, codec, length and audio, and flags problems such as HEVC/H.265, variable frame rate, 4K or 60fps.

**Step 3: prepare.**
```bash
npm run prepare-footage
```
This creates clean copies in `public/footage/ready/` (H.264, constant 30 fps, max 1920px, fast-seeking). Your originals are never touched, and files that were already prepared are skipped.
Options: `FPS=25 npm run prepare-footage`, `MAX=3840 …` (keep 4K), `CRF=16 …` (higher quality), `FORCE=1 …` (redo all).

**Step 4: describe the edit.** Copy an example from `src/projects/`, for example `am-sample-episode.ts`, and set:
```ts
clip: { src: "footage/ready/summit-sunrise.mp4", trimBeforeSec: 12, placeholder: "dawn-mountains" }
```
- `src` is the clip, given as its path inside `public/`.
- `trimBeforeSec` is where the good part starts (your "in point").
- `durationSec` on the scene sets how long the shot plays.

Then register your project in `src/Root.tsx`. Copy one of the `<Composition>` blocks in the `Projects` folder and give it a new `id`.

**Step 5: preview** with `npm run studio`. **Step 6: render** with `npx remotion render <your-id> out/my-video.mp4`.

**Want to try the workflow now without your own footage?**
```bash
npm run samples           # makes 3 demo "raw" clips (60fps GoPro-style, HEVC vertical phone, B-roll)
npm run inspect           # see the problems it detects
npm run prepare-footage   # fix them
npm run studio            # open Projects → Sample-AM-Episode-Landscape / Sample-Frozen-Reel-BM-Vertical
```

Other helpers:
- `npm run extract-audio -- public/footage/raw/interview.mp4` saves `out/audio/interview.wav` (for voice-overs or transcription).

---

## 5. Adding your brand assets

| What | Where | Then |
|---|---|---|
| Logo (PNG with transparency) | `public/brand/<brand>/logo.png` | Set `logoSrc: "brand/yapakcik-frozen/logo.png"` (or `outro.logoSrc` for Project A.M) |
| Product photo (transparent PNG) | `public/brand/yapakcik-frozen/product.png` | Set `product.imageSrc` (replaces the drawn 3D pack) |
| Music | `public/music/*.mp3` | Set `audio.music: "music/your-track.mp3"`. Make sure you have the rights. |
| Sound effects | `public/sfx/*.mp3` | Add to `src/shared/audio/library.ts` |
| Colours & fonts | `src/brands/<brand>/theme.ts` | Every template of that brand updates |

---

## 6. Project structure

```
video-studio/
├── public/
│   ├── footage/raw/        ← your original clips (NOT in Git)
│   ├── footage/ready/      ← prepared clips (NOT in Git)
│   ├── music/  sfx/        ← original royalty-free sound library
│   ├── fonts/              ← bundled brand fonts (SIL Open Font License)
│   └── brand/              ← logos, product photos
├── src/
│   ├── Root.tsx            ← the list of videos shown in the Studio
│   ├── shared/             ← reusable building blocks for ANY brand
│   │   ├── components/     ← AnimatedText, CinematicZoom, Footage, CinematicLook (grade/grain/letterbox),
│   │   │                     LowerThird, Subtitles, ProceduralLandscape, BokehPlaceholder
│   │   ├── infographics/   ← AnimatedCounter, BarChart, ProgressRing, LineChart
│   │   ├── transitions/    ← fade, slide, wipe, iris, clock-wipe + custom flash, zoom-punch,
│   │   │                     light-leak, frost-dissolve
│   │   ├── audio/          ← SoundEffect / SfxTrack, MusicBed (fades + ducking), sound library
│   │   ├── hooks/useLayout ← makes every component adapt to 16:9 or 9:16 automatically
│   │   └── utils/          ← timing, timeline maths, smooth paths
│   ├── brands/
│   │   ├── project-am/       theme.ts · components/ · templates/ProjectAMDocumentary.tsx
│   │   └── yapakcik-frozen/  theme.ts · components/ · templates/FrozenCommercial.tsx
│   └── projects/           ← one file per real video (your edits)
├── scripts/                ← FFmpeg helpers + automated test
└── out/                    ← rendered videos (NOT in Git)
```

### Animation toolkit at a glance
- **Animated typography** (`AnimatedText`): `rise`, `fade`, `blur`, `slam`, `tracking`, `typewriter`, `pop`.
- **Cinematic zoom** (`CinematicZoom`): Ken Burns zoom in/out with pan, plus `punchAt` beat hits.
- **Transitions**: change `transition.style` in the Studio sidebar. Frozen also has `"mixed"`, a hand-picked commercial rhythm.
- **Infographics**: counters, bar charts, rings, self-drawing line charts, an animated map route, a thermometer.
- **Sound design**: transition whooshes and per-scene SFX are placed automatically. Volumes are in `audio.*`.

---

## 7. Testing

```bash
npm test                                   # typecheck + load every video + render preview stills
node scripts/smoke-test.mjs --full         # also render every video to out/test/*.mp4
node scripts/smoke-test.mjs --full --scale=0.5 --only=Frozen   # faster, filtered
```
Preview stills land in `out/test/stills/<video>/`. Open them to eyeball every scene.

---

## 8. Good to know

- **Licence:** Remotion is free for individuals and companies with up to 3 employees. Larger companies need a company licence: <https://remotion.dev/license>.
- **Fonts** (Bebas Neue, Inter, Playfair Display, Montserrat, Anton) are bundled under the SIL Open Font License, so renders work offline. See `public/fonts/OFL-*.txt` and `scripts/download-fonts.sh`.
- **Sounds and music** were synthesised by `scripts/generate-sound-library.sh`. They're original and free to use commercially. Swap in your own licensed music for final campaigns.
- **Placeholder copy:** WhatsApp numbers, social handles, prices and product names are examples. Replace them before publishing, and proof-read the Bahasa Malaysia sample.
- **Big files never go to GitHub:** `.gitignore` blocks `*.mp4`, `*.mov` and the footage and `out/` folders.
