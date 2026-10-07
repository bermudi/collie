// scripts/i18n-align.ts — keep every locale's keys exactly Pup's Dictionary (en.ts).
//
// Upstream locales arrive carrying keys for machinery Pup does not carry (crew.*, the staged
// update UI, mirror images), and Pup has keys upstream does not (mirror.blankLines, the solo
// machines.health.* words). The Dictionary type pins the shape at compile time, but a fresh
// locale file fails that check with 300+ errors and no list. This script is that list, and with
// --fix / --scaffold it is the repair.
//
//   bun run scripts/i18n-align.ts                 # report every locale's drift
//   bun run scripts/i18n-align.ts --fix           # also delete extra keys, in place
//   bun run scripts/i18n-align.ts --scaffold      # also add missing keys: the upstream value
//                                                 #   if upstream has it, else the en value
//                                                 #   tagged with a TODO comment
//
// A scaffolded value is a placeholder, not a translation: the TODO must be read by a human who
// speaks the language before it ships. The new-locale ritual that used it first (2026-10-07,
// ru/it/fr/pt/tr) also had to translate Pup's own keys by hand — the report names them.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dir, "..", "web", "src", "lib", "i18n", "messages");
const fix = process.argv.includes("--fix");
const scaffold = process.argv.includes("--scaffold");

/** The dictionary's key set, read off en.ts by its own two-space indentation. */
export function keysOf(source: string): string[] {
  return [...source.matchAll(/^ {2}"([a-zA-Z0-9_.]+)":/gm)].map((m) => m[1]!);
}

/**
 * Delete whole entries (`"key": value,` or `"key": [ … ],`) for the given keys. Handles the two
 * multi-line shapes the dictionaries use — arrays, and template-literal strings that carry on
 * over following lines until a line ending in `",`.
 */
export function dropKeys(source: string, keys: readonly string[]): string {
  const drop = new Set(keys);
  const lines = source.split("\n");
  const out: string[] = [];
  let mode: "none" | "array" | "template" = "none";
  for (const line of lines) {
    if (mode === "array") {
      if (/^\s*\],?\s*$/.test(line)) mode = "none";
      continue;
    }
    if (mode === "template") {
      // Both quote and backtick multi-line values end with a line whose last token is `,`.
      if (/[",`]\s*$/.test(line)) mode = "none";
      continue;
    }
    const m = line.match(/^ {2}"([a-zA-Z0-9_.]+)":/);
    if (m && drop.has(m[1]!)) {
      if (line.endsWith(": [")) mode = "array";
      else if (!/[",`]\s*$/.test(line)) mode = "template";
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** The `"key": value` line from a dictionary source, verbatim, or null. */
export function entryOf(source: string, key: string): string | null {
  const m = source.match(new RegExp(`^ {2}"${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":.*$`, "m"));
  return m ? m[0]! : null;
}

const en = readFileSync(join(dir, "en.ts"), "utf8");
const enKeys = keysOf(en);
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "en.ts").toSorted()) {
  const path = join(dir, file);
  let src = readFileSync(path, "utf8");
  const keys = keysOf(src);
  const extra = keys.filter((k) => !enKeys.includes(k));
  const missing = enKeys.filter((k) => !keys.includes(k));

  if (extra.length === 0 && missing.length === 0) {
    console.log(`✓ ${file}`);
    continue;
  }
  failed = true;
  if (extra.length > 0) console.log(`✗ ${file}: ${extra.length} extra key(s): ${extra.join(", ")}`);
  if (missing.length > 0) console.log(`✗ ${file}: ${missing.length} missing key(s): ${missing.join(", ")}`);

  if (fix && extra.length > 0) {
    src = dropKeys(src, extra);
    console.log(`  · --fix: deleted ${extra.length} extra key(s)`);
  }
  if (scaffold && missing.length > 0) {
    // Upstream's copy of the locale may already have the translation (Pup's own keys will not be
    // there; upstream's stripped-feature keys would have been — but those are extras, not missing).
    const anchors = [...src.matchAll(/^ {2}"([a-zA-Z0-9_.]+)":/gm)].map((m) => m[1]!);
    const insertAfter = anchors.findLast((k) => enKeys.includes(k)) ?? "connection.dismiss.aria";
    const eol = src.indexOf("\n", src.indexOf(`  "${insertAfter}":`));
    const add: string[] = [];
    for (const key of missing) {
      const own = entryOf(en, key);
      if (own === null) continue; // en itself drifted; tsc will say so where it is fixed
      add.push(`  // TODO(translate): scaffolded from en.ts by scripts/i18n-align.ts\n  ${own}`);
    }
    src = src.slice(0, eol + 1) + add.join("\n") + "\n" + src.slice(eol + 1);
    console.log(`  · --scaffold: added ${missing.length} missing key(s) with TODO markers`);
  }
  if (fix || (scaffold && missing.length > 0)) writeFileSync(path, src);
}

if (!failed) console.log("✓ every locale matches en.ts's dictionary exactly");
