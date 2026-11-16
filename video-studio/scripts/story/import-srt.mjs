#!/usr/bin/env node
/**
 * IMPORT AN SRT SUBTITLE FILE as the transcript of a clip (e.g. exported from CapCut,
 * or a Whisper .srt you corrected). The text is kept EXACTLY as written.
 *
 *   npm run story:srt -- <project> <clip> <file.srt> [--offset 0.0]
 *
 * SRT has line timing only, so word timing is estimated inside each line
 * (proportional to word length) — good for captions; quote anchors work too.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ensureDir, projectPaths, writeJson } from "./lib.mjs";

const [project, clip, file, ...rest] = process.argv.slice(2);
const p = projectPaths(project);
const offset = rest.includes("--offset") ? Number(rest[rest.indexOf("--offset") + 1]) : 0;
if (!clip || !file) {
  console.error("Usage: npm run story:srt -- <project> <clip> <file.srt>");
  process.exit(1);
}
const toSec = (t) => {
  const m = t.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, "0").slice(0, 3)) / 1000 : NaN;
};
const blocks = readFileSync(file, "utf8").replace(/\r/g, "").split(/\n\s*\n/);
const segments = [];
for (const b of blocks) {
  const lines = b.split("\n").filter((l) => l.trim() !== "");
  const ti = lines.findIndex((l) => l.includes("-->"));
  if (ti < 0) continue;
  const [a, z] = lines[ti].split("-->");
  const start = toSec(a) + offset;
  const end = toSec(z) + offset;
  const text = lines.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "").trim();
  if (!text || !(end > start)) continue;
  const ws = text.split(/\s+/);
  const total = ws.reduce((s, w) => s + w.length, 0);
  let t = start;
  const words = ws.map((w) => {
    const d = ((end - start) * w.length) / total;
    const o = { text: " " + w, start: Math.round(t * 1000) / 1000, end: Math.round((t + d) * 1000) / 1000, prob: 1 };
    t += d;
    return o;
  });
  segments.push({ start, end, text, words });
}
ensureDir(p.transcripts);
writeJson(path.join(p.transcripts, `${clip}.json`), { clip, source: "srt", estimatedWordTiming: true, srtFile: path.basename(file), segments });
console.log(`✓ ${segments.length} subtitle lines imported for clip "${clip}" (text kept exactly as written)`);
