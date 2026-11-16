#!/usr/bin/env node
/**
 * REVIEW AN AI-GENERATED ASSET — after LOOKING at the image, record the decision.
 *   npm run story:review -- <project> <name> ok "note"      approve (no people, food, products, text)
 *   npm run story:review -- <project> <name> reject "why"   block it (regenerate with another seed)
 * The safety check refuses unreviewed or rejected generated images in a final export.
 */
import path from "node:path";
import { ROOT, readJson, writeJson } from "./lib.mjs";

const [project, name, decision, ...note] = process.argv.slice(2);
const f = path.join(ROOT, "public/generated", project, "manifest.json");
const m = readJson(f, null);
if (!m?.[name]) {
  console.error(`❌ No generated asset "${name}" in ${f}`);
  process.exit(1);
}
m[name].reviewed = decision === "ok";
m[name].reviewNote = `${decision === "ok" ? "APPROVED" : "REJECTED"}: ${note.join(" ")} (${new Date().toISOString().slice(0, 16)})`;
writeJson(f, m);
console.log(`${m[name].reviewed ? "✓" : "✗"} ${name}: ${m[name].reviewNote}`);
