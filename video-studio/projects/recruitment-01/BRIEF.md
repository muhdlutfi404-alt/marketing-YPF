# Recruitment animation 01 — "Di Sebalik Perjalanan …"

Status: **collecting materials** (no editing yet). Character: Ayoh Mad (see `public/characters/ayoh-mad/`).

## Voice-over script (owner, from the ChatGPT screen recording 2026-11-26 — to be read in the owner's real voice)
Title on the script: **"Di Sebalik Perjalanan Ya Pakcik Frozen"** (owner's earlier brief: "Di Sebalik Perjalanan Seorang Usahawan" → owner to choose).

1. Orang nampak Ya Pakcik Frozen hari ini…
2. Tapi mungkin tak semua tahu betapa susahnya perjalanan untuk sampai ke tahap ini.
3. Ada masa, semuanya Ayoh Mad kena urus sendiri.
4. Urus pelanggan, sediakan barang, penghantaran, cari pelanggan baharu… dan dalam masa yang sama fikir macam mana nak besarkan lagi perniagaan ini.
5. Ayoh Mad sedar, kalau nak pergi lebih jauh, tak boleh selamanya bergerak seorang diri.
6. Ayoh Mad bukan sekadar mencari pekerja.
7. Ayoh Mad sedang mencari seseorang yang boleh dipercayai.
8. Seseorang yang sanggup sama-sama menjaga servis pelanggan, membantu meningkatkan jualan dan membina Ya Pakcik Frozen menjadi sebuah perniagaan yang lebih besar.
9. Mungkin orang itu adalah awak.
10. Kalau awak rasa awak orang yang kami cari, jom sertai perjalanan Ya Pakcik Frozen.
11. Kita bina sesuatu yang lebih besar, bersama-sama.

Section "2. Arahan Editing Untuk Claude" was cut off in the recording (only "Saya cadangkan jangan edit macam video…" visible) → owner to send the full text.

## Storyboard (draft — pose ↔ line)
| Line | Pose | Visual |
|---|---|---|
| 1 | P6 senyum yakin | warm open, title |
| 2 | P1 subuh buka gerai | quiet dawn, slow push-in |
| 3 | P2 angkat kotak | effort, small "SEORANG DIRI" type |
| 4 | P3 bungkus pesanan → P4 malam telefon | task icons pop: pelanggan · barang · penghantaran · pelanggan baharu |
| 5 | P5 termenung | dusk light, music lifts |
| 6–8 | P5 → kinetic type | "BOLEH DIPERCAYAI", three values: servis pelanggan · jualan · membina |
| 9 | P7 tunjuk | "MUNGKIN ORANG ITU… AWAK" |
| 10 | P8 hulur tangan | job cards appear |
| 11 | end card | official logo + how to apply |

## Job details — FROM THE OWNER'S POSTERS (CONFIRMED by owner 2026-11-26: "ada kan tu")
Posters are reference only: they show the AI-drawn cow logo (not official) and a different man (not Ayoh Mad) → not used as visuals.

**Pembantu Bahagian Operasi**
- Gaji basic RM50 – RM60 sehari · Waktu operasi 7:30 pagi – 2:30 petang
- Syarat: lelaki; umur 20–35; lesen memandu kereta dan/atau motosikal (aktif); boleh bekerja dalam pasukan; bertanggungjawab, jujur dan berdisiplin
- Tugas: bantu proses keluar/masuk stok (frozen); susun & urus stok di stor serta ruang jualan; jaga kebersihan stor & kawasan kerja; sediakan barang & buat delivery sekitar kawasan Tumpat
- Lokasi: Ya Pakcik Frozen (Tumpat, Kelantan)

**Team Sales (Berpengalaman)**
- Gaji basic (mengikut pengalaman) + komisen setiap bulan (berdasarkan prestasi jualan)
- Syarat: lelaki; umur 20–35; pengalaman jualan/sales minimum 2 tahun; lesen memandu kereta/motosikal; mahir berkomunikasi & berunding; boleh bekerja berdikari dan dalam pasukan; faham asas pemasaran digital (FB/TikTok Ads — kelebihan)
- Tugas: cari pelanggan baru (kedai makan, restoran, mee celup, nasi kerabu, kedai sup dll); jaga & kembangkan pelanggan sedia ada; follow-up order; capai sasaran jualan bulanan (KPI)
- Kelebihan: komisen menarik; portfolio pelanggan sedia ada; sokongan pemasaran (ads & konten); latihan & bimbingan berterusan; peluang naik pangkat & insentif tambahan

**Cara memohon:** posters say "Berminat? Hantar maklumat ringkas anda sekarang!" — channel not stated → owner to confirm (WhatsApp 016-723 7170?).

## Still needed
- [ ] 8 Ayoh Mad pose images (POSES.md) — none received yet
- [x] Voice-over recording — received 2026-11-26 (SVID_20261126_183014_1.mp4, speech 6.5–61.4 s, −15.5 LUFS, no clipping, room noise ≈ −37 dBFS). Timed lines: `vo-transcript.json`.
- [ ] Full "Arahan Editing Untuk Claude" text
- [ ] Official logo file
- [x] Job details confirmed (owner's two posters)
- [ ] Application channel (posters only say "Hantar maklumat ringkas anda sekarang!") + which title

## Editing reference (owner, 2026-11-26) — Drive folder 1IUj…, file SVID_20261126_170236_1.mp4
Screen recording of two TikTok creator videos (DausDK): (1) cartoon-avatar explainer, (2) talking head + fast B-roll.
Applied to the animatic:
- **Pacing**: a new picture every ~0.3–2 s (scene-detect on the reference). Animatic now has 30 short shots (avg ≈2 s) cut on spoken keywords.
- **Many shots from one pose**: wide / medium / face close-up / hands, hard cuts with a small punch-in, slow push-in inside every shot.
- **Sticker look**: white outline around the character, soft shadow.
- **Captions**: bold, UPPERCASE, thick dark stroke, active keyword in colour, 2–3 words per page.
- **Hook text** big at the top; kinetic keywords on screen.
Not copied: the creator's character, artwork, layout or brand.

## Owner decisions 2026-11-26 (final direction)
1. Character: **Option B** — regenerate all 8 poses from `master.png` only; slim average build, youthful, not muscular; no labels/captions/text/signboards/fake notifications; one PNG per pose. Prompts: `public/characters/ayoh-mad/POSES.md` (BASE v2).
2. Motion: **2.5D** (camera, parallax, light, cinematic moves, transitions, emotion-matched effects). No fake lip-sync / realistic body motion.
3. Voice: **Version 1 only** — owner's real voice + Kelantan accent. No AI clone, no ElevenLabs for now.
4. Title: **"DI SEBALIK PERJALANAN SEORANG USAHAWAN"**. Script 60–90 s, no invented facts → draft `SKRIP-v2-DRAF.md` for owner review before final recording.
5. Jobs (on-screen): Pembantu Operasi — RM50–60/hari, 7:30–2:30, lelaki 20–35, lesen kereta/motosikal, sediakan barang & penghantaran sekitar Tumpat. Team Sales — gaji basic (rate NOT stated), komisen bulanan, utamakan berpengalaman, fokus pelanggan baharu & jualan.
6. Workflow: poses → review each → fix → script → animatic + VO review → job info → final render only after approval.
