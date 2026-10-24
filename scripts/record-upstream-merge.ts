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
// It also resolves <ref> to a full commit id and writes the maintenance-record `UPSTREAM` file
// beside it (`ref:` + `commit:`), so the integrated base stays pinned without hand edits.
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

const rev = Bun.spawnSync(["git", "rev-parse", `${ref}^{commit}`], { cwd: root });
if (rev.exitCode !== 0) {
  const err = new TextDecoder().decode(rev.stderr).trim();
  console.error(`record-upstream-merge: cannot resolve ${ref} to a commit${err ? ` — ${err}` : ""}`);
  process.exit(1);
}
const commit = new TextDecoder().decode(rev.stdout).trim();
if (!/^[0-9a-f]{40}$/.test(commit)) {
  console.error(`record-upstream-merge: ${ref} did not resolve to a full commit id: ${JSON.stringify(commit)}`);
  process.exit(1);
}

await Bun.write(join(root, "upstream-merged"), `${dotted}\n`);
await Bun.write(join(root, "UPSTREAM"), `ref: ${ref}\ncommit: ${commit}\n`);
console.log(`record-upstream-merge: ${ref} (${dotted}, ${commit.slice(0, 12)}) — wrote upstream-merged + UPSTREAM`);
