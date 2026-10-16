#!/usr/bin/env bun
// Record the upstream release just merged (Pup, ADR 9007).
//
// Usage (run with or immediately after the merge commit):
//   bun scripts/record-upstream-merge.ts [upstream-ref]
//
// Reads the version from <ref>'s `herdr-plugin.toml` (default `upstream/main`) — NOT from the
// working tree, whose manifest stays on Pup's own 0.x line — validates it as a strict dotted
// `X.Y.Z`, and writes it to the tracked `upstream-merged` file at the repo root. Commit the file
// with (or immediately after) the merge commit; the monitor re-arms off it without a restart.
//
// A missing ref, a missing version, or a non-strict version fails loudly and writes nothing.

import { join } from "node:path";
import { pluginRoot } from "../bridge/root.ts";

const ref = process.argv[2] ?? "upstream/main";
const root = pluginRoot();

const proc = Bun.spawnSync(["git", "show", `${ref}:herdr-plugin.toml`], { cwd: root });
if (proc.exitCode !== 0) {
  const err = new TextDecoder().decode(proc.stderr).trim();
  console.error(`record-upstream-merge: cannot read ${ref}:herdr-plugin.toml${err ? ` — ${err}` : ""}`);
  process.exit(1);
}
const manifest = new TextDecoder().decode(proc.stdout);
const version = /^version\s*=\s*"([^"]+)"\s*$/m.exec(manifest)?.[1] ?? "";
if (!/^(\d+)\.(\d+)\.(\d+)$/.test(version.trim())) {
  console.error(
    `record-upstream-merge: ${ref}'s herdr-plugin.toml version is not a strict X.Y.Z: ${JSON.stringify(version)}`,
  );
  process.exit(1);
}
const dotted = version.trim();
await Bun.write(join(root, "upstream-merged"), `${dotted}\n`);
console.log(`record-upstream-merge: ${ref} is ${dotted} — wrote upstream-merged`);
