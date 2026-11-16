#!/usr/bin/env node
/**
 * RENDER a raw-footage edit to a vertical 1080×1920 MP4.
 *
 *   npm run story:render -- <project>            FINAL: strict safety check, full quality
 *   npm run story:render -- <project> --draft    quick 540×960 preview, placeholders allowed
 *   … --stills                                   also save a contact sheet of frames to review on a phone
 *
 * Output: out/<project>-1080x1920.mp4 (or out/<project>-draft.mp4), also copied to
 * /mnt/user-data/outputs/ when that folder exists (cloud sessions).
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runCheck } from "./check.mjs";
import { ROOT, ensureDir, projectPaths, sh, shErr } from "./lib.mjs";
import { resolveStory } from "../../src/story/engine.ts";

const [project, ...rest] = process.argv.slice(2);
const DRAFT = rest.includes("--draft");
const STILLS = rest.includes("--stills");
const p = projectPaths(project);

const { ok, bundle } = runCheck(project, !DRAFT);
if (!ok) {
  console.error(DRAFT ? "Fix the errors above, then render again." : "Final export blocked. Fix the errors above (or render a --draft to preview).");
  process.exit(1);
}
ensureDir(p.out);
const propsFile = path.join(p.out, `.${project}.props.json`);
writeFileSync(propsFile, JSON.stringify(bundle));
const out = path.join(p.out, DRAFT ? `${project}-draft.mp4` : `${project}-1080x1920.mp4`);
// Cloud sessions can't download Remotion's browser; reuse the pre-installed one when present.
const findBrowser = () => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) return process.env.REMOTION_BROWSER_EXECUTABLE;
  try {
    const base = "/opt/pw-browsers";
    const dir = sh("ls", [base]).split("\n").filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop();
    const exe = dir && path.join(base, dir, "chrome-headless-shell-linux64", "chrome-headless-shell");
    return exe && existsSync(exe) ? exe : null;
  } catch {
    return null;
  }
};
const exe = findBrowser();
const browser = exe ? [`--browser-executable=${exe}`] : [];
const concurrency = [`--concurrency=${Math.max(1, (os.availableParallelism?.() ?? os.cpus().length))}`];
console.log(`🎬 Rendering ${DRAFT ? "DRAFT (540×960)" : "FINAL (1080×1920)"} → ${path.relative(ROOT, out)}`);
const t0 = Date.now();
sh("npx", ["remotion", "render", "StoryEdit", out, `--props=${propsFile}`, ...(DRAFT ? ["--scale=0.5", "--crf=26"] : []), "--log=error", ...concurrency, ...browser], { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });

// SAFETY LIMITER: voice + music + SFX can peak near 0 dBFS. Only if a peak exceeds -1 dBFS,
// re-encode the AUDIO through a transparent limiter (video stream copied untouched).
const peak = Number((shErr("ffmpeg", ["-hide_banner", "-i", out, "-vn", "-af", "volumedetect", "-f", "null", "-"]).match(/max_volume: ([-\d.]+)/) ?? [0, -99])[1]);
if (peak > -1) {
  const tmp = out.replace(/\.mp4$/, ".limiting.mp4");
  sh("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", out, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", "alimiter=limit=0.891:attack=3:release=60:level=disabled", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", tmp]);
  sh("mv", [tmp, out]);
  console.log(`  🔊 peak ${peak} dBFS → limited to -1 dBFS (audio only, video untouched)`);
}

// verify the file really is a valid, playable video
const probe = JSON.parse(sh("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate", "-show_entries", "format=duration,size", "-of", "json", out]));
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
const decodeErrors = shErr("ffmpeg", ["-v", "error", "-i", out, "-f", "null", "-"]).trim().split("\n").filter(Boolean).length;
const expected = resolveStory(bundle).total;
const dur = Number(probe.format.duration);
console.log(`\n✓ ${path.basename(out)}  ${(Number(probe.format.size) / 1e6).toFixed(1)} MB · ${v.width}x${v.height} ${v.codec_name} ${v.pix_fmt} · audio ${a ? a.codec_name : "NONE"} · ${dur.toFixed(2)}s (timeline ${expected.toFixed(2)}s) · decode errors: ${decodeErrors} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (!a || decodeErrors || Math.abs(dur - expected) > 0.2) {
  console.error("❌ Output verification failed");
  process.exit(1);
}

if (STILLS) {
  const sheet = out.replace(/\.mp4$/, ".sheet.jpg");
  sh("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", out, "-vf", `fps=12/${dur.toFixed(2)},scale=216:-2,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x2:padding=4:color=white`, "-frames:v", "1", sheet]);
  console.log(`  contact sheet: ${path.relative(ROOT, sheet)}`);
}
const outputs = "/mnt/user-data/outputs";
if (existsSync(outputs)) {
  copyFileSync(out, path.join(outputs, path.basename(out)));
  console.log(`  copied to ${outputs}/${path.basename(out)}`);
}
