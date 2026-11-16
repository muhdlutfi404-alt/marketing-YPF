#!/usr/bin/env node
/**
 * FIX TRANSCRIPT WORDS — correct what Whisper misheard, keeping the timing.
 *
 *   npm run story:fix -- <project> <clip> "wrong words => right words" ["…" …]
 *   npm run story:fix -- sample-frozen talking-sample "paci => Pak Cik" "lembot talam => lembut dalam"
 *
 * The wrong words must appear in order in the transcript (case/punctuation ignored).
 * Their time span is shared across the corrected words. Only what you list is changed —
 * nothing is formalised or translated. Every fix is logged in the transcript (fixes[]).
 */
import path from "node:path";
import { tokens } from "../../src/story/engine.ts";
import { projectPaths, readJson, writeJson } from "./lib.mjs";

const [project, clip, ...rules] = process.argv.slice(2);
const p = projectPaths(project);
const file = path.join(p.transcripts, `${clip}.json`);
const tr = readJson(file, null);
if (!tr) {
  console.error(`❌ No transcript for clip "${clip}" (${file})`);
  process.exit(1);
}
tr.fixes = tr.fixes ?? [];
let changed = 0;
for (const rule of rules) {
  const [from, to] = rule.split(/\s*=>\s*/);
  if (!from || to === undefined) {
    console.error(`❌ Rule must look like "wrong => right": ${rule}`);
    process.exit(1);
  }
  const want = tokens(from);
  let applied = false;
  for (const seg of tr.segments) {
    const norm = seg.words.map((w) => tokens(w.text).join(" "));
    for (let i = 0; i + want.length <= seg.words.length; i++) {
      if (want.every((t, j) => norm[i + j] === t)) {
        const old = seg.words.slice(i, i + want.length);
        const start = old[0].start;
        const end = old[old.length - 1].end;
        const trailing = (old[old.length - 1].text.match(/[.,!?]+$/) ?? [""])[0];
        const newWords = to.split(/\s+/).filter(Boolean);
        const total = newWords.reduce((a, w) => a + w.length, 0) || 1;
        let t = start;
        const repl = newWords.map((w, k) => {
          const d = ((end - start) * w.length) / total;
          const word = { text: " " + w + (k === newWords.length - 1 && !/[.,!?]$/.test(w) ? trailing : ""), start: Math.round(t * 1000) / 1000, end: Math.round((t + d) * 1000) / 1000, prob: 1, fixed: true };
          t += d;
          return word;
        });
        seg.words.splice(i, want.length, ...repl);
        seg.text = seg.words.map((w) => w.text).join("").trim();
        tr.fixes.push({ from, to, at: start, date: new Date().toISOString() });
        console.log(`✓ ${start.toFixed(2)}s  "${from}" → "${to}"`);
        applied = changed = changed + 1;
        break;
      }
    }
    if (applied) break;
  }
  if (!applied) console.log(`⚠ not found: "${from}"`);
}
if (changed) {
  writeJson(file, tr);
  // refresh the readable files
  const fmt = (t) => new Date(t * 1000).toISOString().slice(11, 23).replace(".", ",");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(path.join(p.transcripts, `${clip}.srt`), tr.segments.map((s, i) => `${i + 1}\n${fmt(s.start)} --> ${fmt(s.end)}\n${s.text}\n`).join("\n"));
  writeFileSync(path.join(p.transcripts, `${clip}.txt`), tr.segments.map((s) => `[${s.start.toFixed(2).padStart(6)}] ` + s.words.map((w) => ((w.prob ?? 1) < 0.5 ? "⚠" : "") + w.text.trim()).join(" ")).join("\n") + "\n");
}
console.log(`${changed} fix(es) applied.`);
