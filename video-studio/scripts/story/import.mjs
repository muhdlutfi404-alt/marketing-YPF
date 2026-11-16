#!/usr/bin/env node
/**
 * IMPORT FOOTAGE into a project — designed for phone-only workflows.
 *
 *   npm run story:import -- <project> --uploads              copy videos you attached in the Claude app
 *   npm run story:import -- <project> --url "<Drive link>"   download a Google Drive "anyone with the link" file
 *   npm run story:import -- <project> path/to/clip.mp4 …     copy specific files
 *
 * Originals are copied untouched into public/footage/raw/<project>/ (never uploaded to GitHub).
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { VIDEO_EXT, ensureDir, projectPaths, sh } from "./lib.mjs";

const [project, ...args] = process.argv.slice(2);
const p = projectPaths(project);
ensureDir(p.raw);
const UPLOADS = process.env.UPLOADS_DIR ?? "/mnt/user-data/uploads";
const imported = [];

const safeName = (n) => n.replace(/[^A-Za-z0-9._-]+/g, "_");
const copyIn = (src) => {
  const dest = path.join(p.raw, safeName(path.basename(src)));
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) {
    console.log(`⏭  ${path.basename(dest)} already imported`);
    return;
  }
  copyFileSync(src, dest);
  imported.push(dest);
  console.log(`✓ ${path.basename(dest)}  (${(statSync(dest).size / 1e6).toFixed(1)} MB)`);
};

const driveId = (url) => url.match(/\/d\/([A-Za-z0-9_-]{10,})/)?.[1] ?? url.match(/[?&]id=([A-Za-z0-9_-]{10,})/)?.[1];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--uploads") {
    if (!existsSync(UPLOADS)) {
      console.error(`❌ No uploads folder at ${UPLOADS}`);
      process.exit(1);
    }
    const vids = readdirSync(UPLOADS).filter((f) => VIDEO_EXT.test(f));
    if (!vids.length) console.log(`(no video files in ${UPLOADS} yet — attach your MP4 in the Claude app first)`);
    vids.forEach((f) => copyIn(path.join(UPLOADS, f)));
  } else if (a === "--url") {
    const url = args[++i];
    const id = driveId(url ?? "");
    if (!id) {
      console.error("❌ That doesn't look like a Google Drive file link (expected …/file/d/<ID>/…)");
      process.exit(1);
    }
    const tmp = path.join(p.raw, `.download-${id}`);
    console.log(`↓ downloading Google Drive file ${id} …`);
    // confirm=t skips Drive's "can't scan for viruses" page for big files
    try {
      sh("curl", ["-fL", "--retry", "2", "-sS", "-o", tmp, "-D", tmp + ".headers", `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`], { stdio: ["ignore", "inherit", "pipe"] });
    } catch (e) {
      sh("rm", ["-f", tmp, tmp + ".headers"]);
      const msg = String(e.stderr ?? e.message);
      console.error(
        /403|CONNECT/.test(msg) && /tunnel/.test(msg)
          ? "❌ This session's network can't reach Google Drive (environment network settings)."
          : "❌ Download failed. Check that the link is correct and sharing is set to “Anyone with the link → Viewer”.",
      );
      console.error(`   (${msg.trim().split("\n").pop()})`);
      process.exit(1);
    }
    const headers = sh("cat", [tmp + ".headers"]);
    const name = headers.match(/filename\*?=(?:UTF-8'')?"?([^";\r\n]+)/i)?.[1] ?? `drive-${id}.mp4`;
    const type = headers.match(/content-type:\s*([^\r\n;]+)/gi)?.pop() ?? "";
    if (/text\/html/i.test(type)) {
      console.error("❌ Google Drive returned a web page instead of the video. Make sure sharing is set to “Anyone with the link”.");
      process.exit(1);
    }
    const dest = path.join(p.raw, safeName(decodeURIComponent(name)));
    sh("mv", [tmp, dest]);
    sh("rm", ["-f", tmp + ".headers"]);
    imported.push(dest);
    console.log(`✓ ${path.basename(dest)}  (${(statSync(dest).size / 1e6).toFixed(1)} MB)`);
  } else if (existsSync(a)) {
    copyIn(a);
  } else {
    console.error(`❌ Unknown option or missing file: ${a}`);
    process.exit(1);
  }
}
console.log(`\n${imported.length} file(s) imported into public/footage/raw/${project}/`);
console.log(`Next: npm run story:ingest -- ${project}`);
