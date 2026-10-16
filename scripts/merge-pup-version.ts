#!/usr/bin/env bun
// Git merge driver "pup-version" — merge the file normally, then pin `version` back to OURS.
//
// Pup keeps its own 0.x line (ADR 0020) while upstream's release commits bump 1.x, so every
// upstream merge contests the same three files: package.json, web/package.json, herdr-plugin.toml
// (.gitattributes routes them here). The version hunk's answer is always "ours wins" — but the
// rest of the file (a new dependency, a renamed script) must still merge, so `merge=ours` would
// silently drop upstream's real changes and is wrong.
//
// Registered repo-locally by scripts/install-hooks.sh and scripts/merge-upstream.sh:
//   git config merge.pup-version.driver 'bun scripts/merge-pup-version.ts %O %A %B %L'
// Git calls it with %O = base, %A = ours (the result is written back over this path), %B = theirs,
// %L = conflict-marker size. Exit 0 = merged; nonzero = still conflicted, file left holding markers.
//
// Two cases:
//   * merge-file comes back clean — pin the version line to ours (covers any path where the
//     merge picked upstream's value outright);
//   * it comes back conflicted — resolve each hunk whose every line is a `version` key to the
//     ours side, and pass the remaining real conflicts through for a human.

import { readFileSync, writeFileSync } from "node:fs";

const [basePath, oursPath, theirsPath, markerSize] = process.argv.slice(2);
if (!basePath || !oursPath || !theirsPath) {
  console.error("merge-pup-version: usage: merge-pup-version.ts <base> <ours> <theirs> [marker-size]");
  process.exit(2);
}

const VERSION_RE = oursPath.endsWith(".toml")
  ? /^([ \t]*version[ \t]*=[ \t]*")([^"]*)(")/m
  : /^([ \t]*"version"[ \t]*:[ \t]*")([^"]*)(")/m;
// A hunk line is "version business" only when its key is exactly `version` — a dependency named
// "version" or `min_herdr_version` must NOT auto-resolve to ours; those are real changes.
const VERSION_KEY = /^[ \t]*"?version"?[ \t]*[:=]/;

const ourVersion = VERSION_RE.exec(readFileSync(oursPath, "utf8"))?.[2];

const args = ["merge-file", "-p"];
if (markerSize && /^\d+$/.test(markerSize)) args.push(`--marker-size=${markerSize}`);
args.push(oursPath, basePath, theirsPath);
const proc = Bun.spawnSync(["git", ...args]);

// merge-file's status is a conflict count; a failure reads negative there and as >=128 here.
if (proc.exitCode === null || proc.exitCode < 0 || proc.exitCode > 127) {
  console.error(
    `merge-pup-version: git merge-file failed: ${new TextDecoder().decode(proc.stderr).trim()}`,
  );
  process.exit(2);
}

const merged = new TextDecoder().decode(proc.stdout);
if (proc.exitCode === 0) {
  writeFileSync(oursPath, ourVersion ? merged.replace(VERSION_RE, `$1${ourVersion}$3`) : merged);
  process.exit(0);
}

// Conflicted: rewrite the hunks that are only version lines, keep the rest marked.
const lines = merged.split("\n");
const out: string[] = [];
let i = 0;
let leftovers = 0;
while (i < lines.length) {
  const line = lines[i]!;
  if (!line.startsWith("<<<<<<<")) {
    out.push(line);
    i++;
    continue;
  }
  const start = i++;
  const oursLines: string[] = [];
  const theirsLines: string[] = [];
  while (i < lines.length && !lines[i]!.startsWith("|||||||") && !lines[i]!.startsWith("=======")) {
    oursLines.push(lines[i++]!);
  }
  if (lines[i]?.startsWith("|||||||")) {
    while (++i < lines.length && !lines[i]!.startsWith("=======")) {
      // diff3 base section — its lines are evidence, not candidates
    }
  }
  i++; // =======
  while (i < lines.length && !lines[i]!.startsWith(">>>>>>>")) {
    theirsLines.push(lines[i++]!);
  }
  i++; // >>>>>>>
  const versionOnly = [...oursLines, ...theirsLines].every(
    (l) => l.trim() === "" || VERSION_KEY.test(l),
  );
  if (versionOnly && oursLines.length > 0) {
    out.push(...oursLines);
  } else {
    leftovers++;
    out.push(...lines.slice(start, i));
  }
}
writeFileSync(oursPath, out.join("\n"));
process.exit(leftovers === 0 ? 0 : 1);
