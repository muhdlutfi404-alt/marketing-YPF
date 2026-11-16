#!/usr/bin/env node
/**
 * SAFETY CHECK — run before every export (render runs it automatically).
 *
 *   npm run story:check -- <project> [--final]
 *
 * Errors block the export. In --final mode placeholders and unconfirmed facts are errors too.
 * Uses exactly the same engine as the video (src/story/engine.ts).
 */
import { checkBundle, resolveStory } from "../../src/story/engine.ts";
import { fmtTime, loadBundle, projectPaths } from "./lib.mjs";

export const runCheck = (project, final) => {
  const p = projectPaths(project);
  const bundle = loadBundle(p);
  if (!bundle.edit) {
    console.error(`❌ No edit.json for "${project}" — run story:ingest first`);
    return { ok: false, bundle };
  }
  const issues = checkBundle(bundle, { final });
  const { total, shots, layers, words } = resolveStory(bundle);
  console.log(`\n🔎 SAFETY CHECK — ${project} (${final ? "FINAL" : "draft"})`);
  console.log(`   ${shots.length} shots · ${layers.length} graphics/b-roll layers · ${words.length} subtitle words · length ${fmtTime(total)}`);
  const icon = { error: "❌", warning: "⚠️ ", info: "ℹ️ " };
  for (const lvl of ["error", "warning", "info"]) {
    for (const i of issues.filter((x) => x.level === lvl)) console.log(`   ${icon[lvl]} ${i.where}: ${i.message}`);
  }
  const errors = issues.filter((i) => i.level === "error").length;
  console.log(errors ? `\n✗ ${errors} error(s) — fix these before exporting.\n` : `\n✓ Passed${issues.length ? " (see notes above)" : ""}.\n`);
  return { ok: errors === 0, bundle, issues };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [project, ...rest] = process.argv.slice(2);
  const { ok } = runCheck(project, rest.includes("--final"));
  process.exitCode = ok ? 0 : 1;
}
