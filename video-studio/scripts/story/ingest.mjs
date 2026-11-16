#!/usr/bin/env node
/**
 * INGEST — analyse raw footage and prepare editor-friendly copies.
 *
 *   npm run story:ingest -- <project> [--brand yapakcik-frozen|project-am] [--clean-voice] [--max 1920|2560|3840] [--force]
 *
 * For every video in public/footage/raw/<project>/ it:
 *   1. reads metadata (duration, resolution, rotation, fps, codec, audio, recording date, GPS, device)
 *   2. measures voice loudness (EBU R128)
 *   3. makes a prepared copy in public/footage/ready/<project>/<clip>.mp4
 *        – H.264, constant 30 fps, rotation baked in, original resolution kept (up to --max)
 *        – ORIGINAL audio kept; only its overall volume is levelled (linear gain, no compression,
 *          no effects). --clean-voice adds a gentle rumble filter below 70 Hz. Nothing else.
 *   4. detects speech/silence and scene changes (suggested cut points)
 *   5. renders a contact sheet (thumbnails with timestamps)
 * and writes src/edits/<project>/footage.json. A draft edit.json and facts.json are created if missing.
 * Originals are never modified.
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { clipId, ensureDir, fmtTime, listVideos, projectPaths, readJson, sh, shErr, writeJson } from "./lib.mjs";

const args = process.argv.slice(2);
const project = args[0];
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const p = projectPaths(project);
const MAX = Number(opt("--max", process.env.MAX ?? 1920));
const BRAND = opt("--brand", "yapakcik-frozen");
const TARGET_LUFS = Number(opt("--lufs", -16));
const FORCE = flag("--force");
const CLEAN = flag("--clean-voice");

const files = listVideos(p.raw);
if (!files.length) {
  console.error(`❌ No videos in public/footage/raw/${project}/ — run: npm run story:import -- ${project} --uploads`);
  process.exit(1);
}
ensureDir(p.ready);
ensureDir(p.edit);
const footagePath = path.join(p.edit, "footage.json");
const footage = readJson(footagePath, { project, clips: {} });
footage.project = project;

const num = (v) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const frac = (s) => {
  const [a, b] = String(s ?? "0/0").split("/").map(Number);
  return b ? a / b : null;
};
const parseIso6709 = (s) => {
  const m = String(s ?? "").match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?/);
  return m ? { lat: Number(m[1]), lon: Number(m[2]), ...(m[3] ? { alt: Number(m[3]) } : {}) } : null;
};

for (const file of files) {
  const src = path.join(p.raw, file);
  const id = clipId(file);
  const out = path.join(p.ready, `${id}.mp4`);
  console.log(`\n━━ ${file}  →  clip "${id}"`);

  // 1. METADATA ─────────────────────────────────────────────
  const probe = JSON.parse(sh("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", src]));
  const v = probe.streams.find((s) => s.codec_type === "video");
  const a = probe.streams.find((s) => s.codec_type === "audio");
  if (!v) {
    console.log("  ⚠ no video stream — skipped");
    continue;
  }
  const tags = { ...(probe.format.tags ?? {}), ...(v.tags ?? {}) };
  const rotation = Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? tags.rotate ?? 0);
  const swap = Math.abs(rotation) % 180 === 90;
  const dispW = swap ? v.height : v.width;
  const dispH = swap ? v.width : v.height;
  const avg = frac(v.avg_frame_rate);
  const rf = frac(v.r_frame_rate);
  const locTag = Object.entries(tags).find(([k]) => /location/i.test(k) && !/lang/i.test(k))?.[1];
  const device = [tags["com.android.manufacturer"] ?? tags["com.apple.quicktime.make"] ?? tags.make, tags["com.android.model"] ?? tags["com.apple.quicktime.model"] ?? tags.model]
    .filter(Boolean)
    .join(" ") || null;
  const meta = {
    originalCodec: v.codec_name,
    originalSize: `${dispW}x${dispH}`,
    rotation,
    fps: avg ? Math.round(avg * 100) / 100 : null,
    variableFrameRate: !!(avg && rf && Math.abs(avg - rf) > 0.5),
    audio: a ? { codec: a.codec_name, channels: a.channels, sampleRate: num(a.sample_rate) } : null,
    fileSizeMB: Math.round((statSync(src).size / 1e6) * 10) / 10,
  };
  const duration = num(probe.format.duration) ?? num(v.duration) ?? 0;
  console.log(`  ${dispW}x${dispH} ${meta.fps}fps ${v.codec_name}${meta.variableFrameRate ? " (variable fps)" : ""}  ${fmtTime(duration)}  audio:${a ? a.codec_name : "none"}`);
  if (tags.creation_time) console.log(`  recorded: ${tags.creation_time}`);
  if (locTag) console.log(`  GPS: ${locTag}`);
  if (device) console.log(`  device: ${device}`);

  // 2. LOUDNESS (first pass) ──────────────────────────────────
  let loud = null;
  // mono phone audio → the same voice on both channels (no level change), measured & levelled as stereo
  const upmix = a && a.channels === 1 ? "pan=stereo|c0=c0|c1=c0," : "";
  if (a) {
    const err = shErr("ffmpeg", ["-hide_banner", "-nostats", "-i", src, "-map", "0:a:0", "-af", `${upmix}loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"]);
    const j = err.slice(err.lastIndexOf("{"), err.lastIndexOf("}") + 1);
    try {
      loud = JSON.parse(j);
      console.log(`  voice loudness: ${loud.input_i} LUFS (target ${TARGET_LUFS}), peak ${loud.input_tp} dBTP`);
    } catch {
      console.log("  ⚠ could not measure loudness");
    }
  }

  // 3. PREPARED COPY ─────────────────────────────────────────
  const fresh = existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs && !FORCE;
  if (fresh) console.log("  ⏭  prepared copy up to date");
  else {
    const vf = `scale='if(gte(iw,ih),min(${MAX},iw),-2)':'if(gte(iw,ih),-2,min(${MAX},ih))':flags=lanczos,fps=30,format=yuv420p`;
    const af = [];
    if (upmix) af.push(upmix.slice(0, -1));
    if (CLEAN) af.push("highpass=f=70");
    if (loud && Number.isFinite(Number(loud.input_i)) && Number(loud.input_i) > -70) {
      // linear=true → a single overall volume change; the voice itself is not processed
      af.push(`loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:measured_I=${loud.input_i}:measured_TP=${loud.input_tp}:measured_LRA=${loud.input_lra}:measured_thresh=${loud.input_thresh}:offset=${loud.target_offset}:linear=true`);
    }
    const audioArgs = a ? ["-map", "0:a:0", ...(af.length ? ["-af", af.join(",")] : []), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2"] : [];
    console.log(`  🎞  preparing ${path.relative(p.ready, out)} …`);
    sh("ffmpeg", ["-hide_banner", "-loglevel", "error", "-stats", "-y", "-i", src, "-map", "0:v:0", ...audioArgs, "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-profile:v", "high", "-movflags", "+faststart", out], { stdio: ["ignore", "ignore", "inherit"] });
  }
  const pv = JSON.parse(sh("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-show_entries", "format=duration", "-of", "json", out]));

  // 4. SPEECH / SILENCE + SCENES ─────────────────────────────
  let silences = [];
  let speech = [];
  if (a) {
    const err = shErr("ffmpeg", ["-hide_banner", "-nostats", "-i", out, "-map", "0:a:0", "-af", "silencedetect=n=-32dB:d=0.35", "-f", "null", "-"]);
    let s0 = null;
    for (const line of err.split("\n")) {
      const st = line.match(/silence_start: ([\d.]+)/);
      const en = line.match(/silence_end: ([\d.]+)/);
      if (st) s0 = Number(st[1]);
      if (en && s0 !== null) {
        silences.push({ from: Math.round(s0 * 100) / 100, to: Math.round(Number(en[1]) * 100) / 100 });
        s0 = null;
      }
    }
    if (s0 !== null) silences.push({ from: s0, to: duration });
    let cursor = 0;
    for (const s of silences) {
      if (s.from - cursor > 0.15) speech.push({ from: Math.round(cursor * 100) / 100, to: s.from });
      cursor = s.to;
    }
    if (duration - cursor > 0.15) speech.push({ from: Math.round(cursor * 100) / 100, to: Math.round(duration * 100) / 100 });
    console.log(`  speech: ${speech.length} region(s), ${silences.length} pause(s) ≥0.35s`);
  }
  const sceneErr = shErr("ffmpeg", ["-hide_banner", "-nostats", "-i", out, "-vf", "scale=320:-2,select='gt(scene,0.32)',showinfo", "-an", "-f", "null", "-"]);
  const scenes = [...sceneErr.matchAll(/pts_time:([\d.]+)/g)].map((m) => Math.round(Number(m[1]) * 100) / 100);
  console.log(`  scene changes: ${scenes.length ? scenes.map((s) => s.toFixed(1) + "s").join(", ") : "none (continuous shot)"}`);

  // 5. CONTACT SHEET ─────────────────────────────────────────
  const sheet = path.join(p.ready, `${id}.sheet.jpg`);
  const step = Math.max(1, duration / 20);
  sh("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", out, "-vf", `fps=1/${step.toFixed(3)},scale=216:-2,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=5x4:padding=4:color=white`, "-frames:v", "1", sheet]);

  footage.clips[id] = {
    id,
    src: `${p.readyRel}/${id}.mp4`,
    original: `footage/raw/${project}/${file}`,
    duration: Math.round((num(pv.format.duration) ?? duration) * 1000) / 1000,
    width: pv.streams[0].width,
    height: pv.streams[0].height,
    fps: 30,
    hasAudio: !!a,
    loudnessLufs: loud ? num(loud.input_i) : null,
    createdAt: tags.creation_time ?? null,
    location: locTag ? parseIso6709(locTag) : null,
    device,
    meta,
    analysis: { speech, silences, scenes, contactSheet: `${p.readyRel}/${id}.sheet.jpg` },
  };
}

writeJson(footagePath, footage);
console.log(`\n✓ footage.json written (${Object.keys(footage.clips).length} clip(s))`);

// facts.json template — every entry starts UNCONFIRMED
const factsPath = path.join(p.edit, "facts.json");
if (!existsSync(factsPath)) {
  writeJson(factsPath, {
    _readme:
      "Only facts confirmed by the business owner. Graphics with source 'facts' may ONLY show these values, and only when confirmed is true. Never guess.",
    brandName: { value: BRAND === "project-am" ? "Project A.M" : "YaPakCik Frozen", label: "Brand", confirmed: true },
    presenterName: { value: "", label: "Presenter name", confirmed: false },
    productName: { value: "", label: "Product name", confirmed: false },
    price: { value: "", label: "Price", confirmed: false },
    halal: { value: "", label: "Halal certification", confirmed: false },
    contact: { value: "", label: "WhatsApp / order contact", confirmed: false },
  });
  console.log("✓ facts.json template created (all business facts start UNCONFIRMED)");
}

// draft edit.json
const editPath = path.join(p.edit, "edit.json");
if (!existsSync(editPath)) {
  sh("node", [path.join(path.dirname(new URL(import.meta.url).pathname), "suggest.mjs"), project, "--brand", BRAND, "--write"], { stdio: "inherit" });
}
console.log(`\nNext: npm run story:transcribe -- ${project}`);
