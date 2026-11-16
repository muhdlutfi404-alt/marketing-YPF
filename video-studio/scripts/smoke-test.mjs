#!/usr/bin/env node
/**
 * SMOKE TEST — checks that every video template loads and renders.
 *
 *   npm test                       typecheck + load all compositions + render preview stills
 *   node scripts/smoke-test.mjs --full            also render every template to MP4
 *   node scripts/smoke-test.mjs --full --scale=0.5  faster, half-resolution MP4s
 *
 * Output: out/test/stills/<composition>/*.jpg and out/test/<composition>.mp4
 *
 * Optional: REMOTION_BROWSER_EXECUTABLE=/path/to/chrome  to use an existing browser
 * (only needed on machines that can't download Remotion's headless browser).
 */
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const FULL = args.includes("--full");
const SCALE = Number((args.find((a) => a.startsWith("--scale=")) ?? "--scale=1").split("=")[1]);
const ONLY = (args.find((a) => a.startsWith("--only=")) ?? "").split("=")[1];
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const EXPECTED = {
  "ProjectAM-Documentary-Landscape": { width: 1920, height: 1080 },
  "ProjectAM-Documentary-Vertical": { width: 1080, height: 1920 },
  "YaPakCikFrozen-Commercial-Landscape": { width: 1920, height: 1080 },
  "YaPakCikFrozen-Commercial-Vertical": { width: 1080, height: 1920 },
  "Sample-AM-Episode-Landscape": { width: 1920, height: 1080, needsFootage: true },
  "Sample-Frozen-Reel-BM-Vertical": { width: 1080, height: 1920, needsFootage: true },
};
const SAMPLE_FILES = ["sample-landscape-60fps.mp4", "sample-vertical-phone.mp4", "sample-kitchen.mp4"].map((f) =>
  path.join(root, "public/footage/ready", f),
);
const haveSamples = SAMPLE_FILES.every((f) => existsSync(f));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

console.log("\n▶ Bundling project…");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
ok("bundle created");

console.log("\n▶ Loading compositions…");
const comps = await getCompositions(serveUrl, { browserExecutable });
for (const [id, exp] of Object.entries(EXPECTED)) {
  const c = comps.find((x) => x.id === id);
  if (!c) {
    fail(`${id} is missing`);
    continue;
  }
  const secs = c.durationInFrames / c.fps;
  if (c.width !== exp.width || c.height !== exp.height) fail(`${id}: expected ${exp.width}x${exp.height}, got ${c.width}x${c.height}`);
  else if (secs < 10 || secs > 120) fail(`${id}: unexpected duration ${secs.toFixed(1)}s`);
  else ok(`${id.padEnd(38)} ${c.width}x${c.height}  ${secs.toFixed(1)}s  @${c.fps}fps`);
}

const targets = comps.filter((c) => {
  const exp = EXPECTED[c.id];
  if (!exp) return false;
  if (ONLY && !c.id.includes(ONLY)) return false;
  if (exp.needsFootage && !haveSamples) {
    console.log(`  • skipping ${c.id} (run "npm run samples && npm run prepare-footage" to include it)`);
    return false;
  }
  return true;
});

console.log("\n▶ Rendering preview stills…");
for (const c of targets) {
  const dir = path.join(root, "out/test/stills", c.id);
  mkdirSync(dir, { recursive: true });
  const frames = [0.04, 0.12, 0.2, 0.3, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92].map((p) => Math.floor(p * (c.durationInFrames - 1)));
  try {
    for (const frame of frames) {
      await renderStill({
        composition: c,
        serveUrl,
        frame,
        output: path.join(dir, `f${String(frame).padStart(4, "0")}.jpg`),
        imageFormat: "jpeg",
        jpegQuality: 80,
        scale: 0.5,
        browserExecutable,
      });
    }
    ok(`${c.id}: ${frames.length} stills → out/test/stills/${c.id}/`);
  } catch (e) {
    fail(`${c.id}: still render failed — ${e.message}`);
  }
}

if (FULL) {
  console.log(`\n▶ Rendering full MP4s (scale ${SCALE})…`);
  for (const c of targets) {
    const output = path.join(root, "out/test", `${c.id}.mp4`);
    const started = Date.now();
    try {
      let last = -1;
      await renderMedia({
        composition: c,
        serveUrl,
        codec: "h264",
        colorSpace: "bt709",
        pixelFormat: "yuv420p",
        crf: 20,
        outputLocation: output,
        scale: SCALE,
        browserExecutable,
        onProgress: ({ progress }) => {
          const pct = Math.floor(progress * 10) * 10;
          if (pct !== last) {
            last = pct;
            process.stdout.write(`\r    ${c.id}: ${pct}%   `);
          }
        },
      });
      process.stdout.write("\n");
      ok(`${c.id} → out/test/${c.id}.mp4 (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    } catch (e) {
      process.stdout.write("\n");
      fail(`${c.id}: render failed — ${e.message}`);
    }
  }
}

// Verify MP4 files really exist on disk (don't just trust the promise)
if (FULL) {
  const { statSync } = await import("node:fs");
  for (const c of targets) {
    const f = path.join(root, "out/test", `${c.id}.mp4`);
    if (!existsSync(f) || statSync(f).size < 10_000) fail(`${c.id}: MP4 missing or empty on disk`);
  }
}
console.log(failures ? `\n✗ ${failures} problem(s) found\n` : "\n✓ All checks passed\n");
// Let Node exit naturally so Remotion can finish moving files into place.
process.exitCode = failures ? 1 : 0;
