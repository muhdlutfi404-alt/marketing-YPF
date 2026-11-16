#!/usr/bin/env node
/**
 * SUGGEST A FIRST CUT — tightens pauses in talking clips (jump-cut pacing).
 *
 *   npm run story:suggest -- <project> [--pause 0.5] [--write]
 *
 * Uses word timings from the transcript when available (most accurate), otherwise the
 * speech/silence analysis from ingest. Alternates framing (wide ↔ punched-in) between
 * cuts so jump cuts look intentional. Writes edit.json if none exists, otherwise
 * edit.suggested.json so your current edit is never overwritten.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fmtTime, loadBundle, projectPaths, writeJson } from "./lib.mjs";

const args = process.argv.slice(2);
const project = args[0];
const opt = (n, d) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const p = projectPaths(project);
const PAUSE = Number(opt("--pause", 0.5));
const BRAND = opt("--brand", "yapakcik-frozen");
const PAD_IN = 0.12;
const PAD_OUT = 0.2;

const b = loadBundle(p);
const clips = Object.values(b.clips ?? {});
if (!clips.length) {
  console.error("❌ No clips — run story:ingest first");
  process.exit(1);
}
// story order: recording time, then name
clips.sort((x, y) => String(x.createdAt ?? "").localeCompare(String(y.createdAt ?? "")) || x.id.localeCompare(y.id));

const shots = [];
for (const c of clips) {
  const tr = b.transcripts[c.id];
  let regions;
  if (tr) {
    const words = tr.segments.flatMap((s) => s.words);
    regions = [];
    for (const w of words) {
      const last = regions[regions.length - 1];
      if (last && w.start - last.to <= PAUSE) last.to = w.end;
      else regions.push({ from: w.start, to: w.end });
    }
  } else {
    regions = (c.analysis?.speech ?? []).map((r) => ({ ...r }));
  }
  const speechSec = regions.reduce((a, r) => a + (r.to - r.from), 0);
  const isTalking = c.hasAudio && speechSec > c.duration * 0.25;
  if (!isTalking) {
    console.log(`  ${c.id}: little or no speech → treated as B-ROLL (use it in "layers" as type "broll")`);
    continue;
  }
  // merge regions separated by short pauses, pad edges
  const merged = [];
  for (const r of regions) {
    const last = merged[merged.length - 1];
    if (last && r.from - last.to <= PAUSE) last.to = r.to;
    else merged.push({ ...r });
  }
  for (const r of merged) {
    const inn = Math.max(0, r.from - PAD_IN);
    const out = Math.min(c.duration, r.to + PAD_OUT);
    if (out - inn < 0.4) continue;
    const i = shots.length;
    shots.push({
      id: `s${i + 1}`,
      clip: c.id,
      in: Math.round(inn * 100) / 100,
      out: Math.round(out * 100) / 100,
      audio: "keep",
      focus: { x: 0.5, y: 0.38 },
      // alternate framing so consecutive jump cuts read as deliberate camera changes
      zooms: i % 2 === 1 ? [{ at: 0, type: "punch-in", scale: 1.14, duration: 0.01 }] : [],
    });
  }
  const kept = shots.filter((s) => s.clip === c.id).reduce((a, s) => a + s.out - s.in, 0);
  console.log(`  ${c.id}: ${fmtTime(c.duration)} → ${fmtTime(kept)} after removing pauses > ${PAUSE}s (${shots.filter((s) => s.clip === c.id).length} shots)`);
}

const draft = {
  _readme: "Edit decision list. Times in seconds. See video-studio/docs/STORY-EDITING.md for every option.",
  project,
  brand: BRAND,
  title: project,
  shots,
  layers: [],
  captions: { enabled: true, style: BRAND === "project-am" ? "documentary" : "bold", combineMs: 1200, uppercase: false, position: 0.7 },
  look: { grade: BRAND === "project-am" ? "documentary-matte" : "warm-commercial", gradeIntensity: 0.8, grain: true, vignette: true, breathing: 0.03 },
  audio: { music: null, musicVolume: 0.35, duckTo: 0.25, sfx: "auto", sfxVolume: 0.8, voiceTargetLufs: -16 },
};
const target = path.join(p.edit, existsSync(path.join(p.edit, "edit.json")) ? "edit.suggested.json" : "edit.json");
if (args.includes("--write")) {
  writeJson(target, draft);
  console.log(`✓ ${path.relative(p.edit, target)} written with ${shots.length} shot(s)`);
} else {
  console.log(JSON.stringify(shots, null, 1));
  console.log("(add --write to save)");
}
