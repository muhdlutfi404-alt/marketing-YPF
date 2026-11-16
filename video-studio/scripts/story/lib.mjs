/** Shared helpers for the raw-footage pipeline scripts. */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const VIDEO_EXT = /\.(mp4|mov|m4v|mkv|3gp|webm)$/i;

export const projectPaths = (project) => {
  if (!project || !/^[a-z0-9][a-z0-9-]*$/.test(project)) {
    console.error(`❌ Project name must be lowercase letters, numbers and dashes, e.g. "frozen-nugget-01" (got "${project ?? ""}")`);
    process.exit(1);
  }
  return {
    project,
    raw: path.join(ROOT, "public/footage/raw", project),
    ready: path.join(ROOT, "public/footage/ready", project),
    readyRel: `footage/ready/${project}`,
    audio: path.join(ROOT, "public/footage/audio", project),
    edit: path.join(ROOT, "src/edits", project),
    transcripts: path.join(ROOT, "src/edits", project, "transcripts"),
    out: path.join(ROOT, "out"),
  };
};

export const ensureDir = (d) => (mkdirSync(d, { recursive: true }), d);
export const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : fallback);
export const writeJson = (f, data) => writeFileSync(f, JSON.stringify(data, null, 2) + "\n");

export const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, ...opts });
/** Runs a command and returns stderr (ffmpeg writes analysis to stderr) */
export const shErr = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0 && r.status !== null && !r.stderr) throw new Error(`${cmd} failed`);
  return r.stderr ?? "";
};

/** Clip id = safe file name without extension */
export const clipId = (file) =>
  path
    .basename(file)
    .replace(VIDEO_EXT, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const listVideos = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => VIDEO_EXT.test(f)).sort() : []);

export const loadBundle = (p) => {
  const edit = readJson(path.join(p.edit, "edit.json"), null);
  const footage = readJson(path.join(p.edit, "footage.json"), { clips: {} });
  const facts = readJson(path.join(p.edit, "facts.json"), {});
  const transcripts = {};
  if (existsSync(p.transcripts)) {
    for (const f of readdirSync(p.transcripts).filter((x) => x.endsWith(".json"))) {
      const t = readJson(path.join(p.transcripts, f));
      transcripts[t.clip] = t;
    }
  }
  // strip documentation keys that start with "_"
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")));
  return { edit, clips: footage.clips, transcripts, facts: clean(facts) };
};

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
};
