#!/usr/bin/env node
/**
 * GUARDRAIL TESTS — proves the safety check blocks invented content.
 *   npm run story:test
 * Each case takes the sample project and breaks one rule; the check must catch it.
 */
import { checkBundle } from "../../src/story/engine.ts";
import { loadBundle, projectPaths } from "./lib.mjs";

const base = loadBundle(projectPaths("sample-frozen"));
const clone = () => JSON.parse(JSON.stringify(base));
const layer = (o) => ({ id: "test", at: 5, duration: 2, ...o });
let failed = 0;
const expect = (name, mutate, { final = true, want = "error", match }) => {
  const b = clone();
  mutate(b);
  const issues = checkBundle(b, { final });
  const hit = issues.find((i) => i.level === want && (!match || match.test(i.message)));
  const errors = issues.filter((i) => i.level === "error");
  const ok = want === "none" ? errors.length === 0 : !!hit;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${hit ? `  → ${hit.message}` : ""}`);
  if (!ok) console.log("      issues:", JSON.stringify(issues));
};

expect("valid sample edit passes FINAL", () => {}, { want: "none" });
expect("number not spoken (9 vs 'lapan minit')", (b) => b.edit.layers.push(layer({ type: "counter", source: "transcript", evidence: { quote: "Tunggu lapan minit" }, props: { value: 9, suffix: "minit" } })), { match: /number 9/ });
expect("derived number not spoken (4× growth)", (b) => b.edit.layers.push(layer({ type: "keyword", source: "transcript", evidence: { quote: "Kini dah dua ratus pek" }, props: { text: "4X lebih laku" } })), { match: /number 4/ });
expect("invented certification as design text", (b) => b.edit.layers.push(layer({ type: "badge", source: "design", props: { text: "HALAL JAKIM" } })), { match: /claim/ });
expect("invented price as design text", (b) => b.edit.layers.push(layer({ type: "keyword", source: "design", props: { text: "Hanya RM9.90" } })), { match: /claim/ });
expect("superlative claim as design text", (b) => b.edit.layers.push(layer({ type: "keyword", source: "design", props: { text: "Nugget paling sedap" } })), { match: /claim/ });
expect("unconfirmed fact blocked in FINAL", (b) => b.edit.layers.push(layer({ type: "badge", source: "facts", evidence: { fact: "price" }, props: { text: "RM 12.90" } })), { match: /not confirmed/ });
expect("unconfirmed fact only warns in DRAFT", (b) => b.edit.layers.push(layer({ type: "badge", source: "facts", evidence: { fact: "price" }, props: { text: "RM 12.90" } })), { final: false, want: "warning", match: /not confirmed/ });
expect("fact value mismatch", (b) => { b.facts.price = { value: "RM 12.90", confirmed: true }; b.edit.layers.push(layer({ type: "badge", source: "facts", evidence: { fact: "price" }, props: { text: "RM 10.90" } })); }, { match: /number 10.9/ });
expect("confirmed fact with matching value passes", (b) => { b.facts.price = { value: "RM 12.90", confirmed: true }; b.edit.layers.push(layer({ type: "badge", source: "facts", evidence: { fact: "price" }, props: { text: "RM 12.90" } })); }, { want: "none" });
expect("placeholder blocked in FINAL", (b) => b.edit.layers.push(layer({ type: "cta", source: "placeholder", props: { headline: "Order", lines: ["[WhatsApp number]"] } })), { match: /PLACEHOLDER/ });
expect("quote not in transcript", (b) => b.edit.layers.push(layer({ type: "keyword", at: { quote: "beli sekarang juga" }, source: "transcript", evidence: { quote: "beli sekarang juga" }, props: { text: "Beli sekarang" } })), { match: /not found|not in the transcript/ });
expect("transcript layer without evidence", (b) => b.edit.layers.push(layer({ type: "keyword", source: "transcript", props: { text: "Sedap" } })), { match: /evidence/ });
expect("cut point past end of clip", (b) => { b.edit.shots[0].out = 99; }, { match: /past the end/ });
expect("missing clip", (b) => { b.edit.shots[0].clip = "nope"; }, { match: /not found/ });
expect("b-roll longer than its clip", (b) => b.edit.layers.push(layer({ type: "broll", source: "design", duration: 30, props: { clip: "demo-sample", in: 0 } })), { match: /only/ });

console.log(failed ? `\n✗ ${failed} guardrail test(s) failed` : "\n✓ All guardrail tests passed");
process.exitCode = failed ? 1 : 0;
