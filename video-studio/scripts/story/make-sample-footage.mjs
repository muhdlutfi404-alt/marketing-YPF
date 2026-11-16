#!/usr/bin/env node
/**
 * MAKE SAMPLE FOOTAGE — synthetic TEST clips for the raw-footage workflow.
 * NOT real footage: a labelled silhouette "presenter" with a synthetic Malay
 * voice (espeak-ng), plus a labelled "product demo" clip. Used only to test
 * import → analyse → transcribe → edit → render before real footage arrives.
 *
 *   node scripts/story/make-sample-footage.mjs [project=sample-frozen]
 *
 * Output: public/footage/raw/<project>/talking-sample.mp4 and demo-sample.mp4
 * Requires: ffmpeg, espeak-ng (apt-get install espeak-ng)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const project = process.argv[2] ?? "sample-frozen";
const outDir = path.join(root, "public/footage/raw", project);
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(path.join(tmpdir(), "sample-footage-"));
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "ignore", "inherit"] });

// Kelantan-flavoured Malay test lines, with the pause (seconds) AFTER each line.
// Pauses are deliberately uneven so the auto-cut (silence removal) can be tested.
const LINES = [
  ["Assalamualaikum semua. Ambo Pak Cik.", 0.9],
  ["Hari ni ambo nok tunjuk demo produk frozen kito.", 1.4],
  ["Ini nugget ayam.", 0.7],
  ["Cara masak dio senang jah.", 1.1],
  ["Panaskan air fryer dulu.", 0.6],
  ["Lepas tu masuk nugget, tunggu lapan minit.", 1.6],
  ["Siap. Rangup luar, lembut dalam.", 1.0],
  ["Dulu ambo jual limo puluh pek sebulan. Kini dah dua ratus pek.", 1.2],
  ["Kalu demo nok order, hubungi ambo.", 1.0],
];

console.log("→ synthesising test voice (espeak-ng, Malay)…");
const parts = [];
LINES.forEach(([text, pause], i) => {
  const wav = path.join(tmp, `l${i}.wav`);
  run("espeak-ng", ["-v", "ms", "-s", "150", "-p", "40", "-a", "160", "-w", wav, text]);
  const sil = path.join(tmp, `s${i}.wav`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", `anullsrc=r=22050:cl=mono`, "-t", String(pause), sil]);
  parts.push(wav, sil);
});
const lead = path.join(tmp, "lead.wav");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", "0.8", lead]);
const list = path.join(tmp, "list.txt");
writeFileSync(list, [lead, ...parts].map((p) => `file '${p}'`).join("\n"));
const voice = path.join(tmp, "voice.wav");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-ar", "48000", "-ac", "1", voice]);
const dur = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", voice]).toString().trim(),
);

console.log("→ drawing the labelled silhouette presenter…");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const svg = (title, subtitle, body) => `<!doctype html><html><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs><radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#6b4a33"/><stop offset="1" stop-color="#1c120c"/></radialGradient></defs>
<rect width="1080" height="1920" fill="url(#bg)"/>
<rect x="60" y="1180" width="960" height="560" rx="20" fill="#3a2a1f"/>
${body}
<rect x="0" y="80" width="1080" height="150" fill="rgba(255,200,0,0.92)"/>
<text x="540" y="150" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="54" fill="#111">${title}</text>
<text x="540" y="205" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="34" fill="#111">${subtitle}</text>
</svg></body></html>`;
const presenter = `
<ellipse cx="540" cy="1720" rx="420" ry="330" fill="#0d0907"/>
<rect x="470" y="1010" width="140" height="160" fill="#0d0907"/>
<ellipse cx="540" cy="860" rx="190" ry="235" fill="#0d0907"/>`;
const demo = `
<ellipse cx="540" cy="1080" rx="380" ry="120" fill="#222"/>
<ellipse cx="540" cy="1060" rx="340" ry="95" fill="#3b3b3b"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${400 + (i % 3) * 140}" cy="${1030 + Math.floor(i / 3) * 60}" rx="55" ry="32" fill="#d9952f"/>`).join("")}
<rect x="800" y="1040" width="260" height="40" rx="18" fill="#222"/>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const pngP = path.join(tmp, "presenter.png");
const pngD = path.join(tmp, "demo.png");
await page.setContent(svg("SAMPLE PRESENTER — TEST FOOTAGE", "synthetic voice · not a real person", presenter));
await page.screenshot({ path: pngP });
await page.setContent(svg("SAMPLE PRODUCT DEMO — TEST FOOTAGE", "placeholder visuals · not real product footage", demo));
await page.screenshot({ path: pngD });
await browser.close();

console.log("→ encoding talking-sample.mp4 (vertical, HEVC, 60fps — like an Android phone)…");
const ffenc = (args) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
ffenc([
  "-loop", "1", "-framerate", "60", "-i", pngP,
  "-i", voice,
  "-f", "lavfi", "-i", `anoisesrc=d=${dur}:c=pink:a=0.004`,
  "-filter_complex",
  // slight handheld wobble + sensor noise so it behaves like real footage
  `[0]scale=1120:-1,crop=1080:1920:20+12*sin(t*0.9):20+10*sin(t*1.3),noise=alls=10:allf=t,format=yuv420p[v];[1][2]amix=inputs=2:normalize=0,volume=0.55[a]`,
  "-map", "[v]", "-map", "[a]", "-t", String(dur),
  "-c:v", "libx265", "-x265-params", "log-level=error", "-tag:v", "hvc1", "-preset", "fast", "-crf", "24",
  "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
  path.join(outDir, "talking-sample.mp4"),
]);

console.log("→ encoding demo-sample.mp4 (vertical, 30fps, kitchen sizzle sound)…");
ffenc([
  "-loop", "1", "-framerate", "30", "-i", pngD,
  "-f", "lavfi", "-i", "anoisesrc=d=12:c=white:a=0.25",
  "-filter_complex", "[0]scale=1200:-1,crop=1080:1920:'60+50*sin(t*0.5)':60,noise=alls=8:allf=t,format=yuv420p[v];[1]highpass=f=2500,lowpass=f=9000,volume=0.6[a]",
  "-map", "[v]", "-map", "[a]", "-t", "12",
  "-c:v", "libx264", "-crf", "22", "-c:a", "aac",
  path.join(outDir, "demo-sample.mp4"),
]);
rmSync(tmp, { recursive: true, force: true });
console.log(`✓ Test clips in public/footage/raw/${project}/ (talking ${dur.toFixed(1)}s, demo 12s)`);
console.log("  Spoken script (for checking the transcription):");
LINES.forEach(([t]) => console.log("   • " + t));
