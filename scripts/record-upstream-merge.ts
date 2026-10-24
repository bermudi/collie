#!/usr/bin/env bun
// Record the upstream release the tree actually absorbed (Pup, ADR 9007, amended by ADR 9010).
//
// Usage (run with or immediately after the merge commit):
//   bun scripts/record-upstream-merge.ts [upstream-ref]        # default: upstream/main
//
// `upstream-merged` holds the newest upstream STRICT release — a vX.Y.Z tag on the upstream
// remote — whose commit is an ancestor of HEAD. Never a version that merely sits in some
// branch's manifest: upstream keeps `version` plain X.Y.Z in git even mid-edge-cycle, and cuts
// strict releases from release-1.x branches upstream/main does not always merge back, so a
// manifest read once recorded 1.24.0 while no such release existed and 1.23.2–1.23.4 were still
// unmerged (2026-10-24). Ancestry of a real tag cannot lie.
//
// The ref argument pins the maintenance record `UPSTREAM` (ref + full commit id) — written only
// when the ref IS `upstream/main`, the integrated main line. A release-tag absorb leaves it
// untouched; the sync log carries that.
//
// An unresolvable ref or an unreadable remote fails loudly and writes nothing. The record may
// move DOWN when it retires a value the old manifest-based semantics wrote — that is a
// correction, not drift: this script, inside the ritual, is the file's only writer.

import { join } from "node:path";
import { pluginRoot } from "../bridge/root.ts";

const root = pluginRoot();
const ref = process.argv[2] ?? "upstream/main";

type GitResult = { readonly code: number; readonly out: string; readonly err: string };

function run(args: readonly string[]): GitResult {
  const proc = Bun.spawnSync(["git", ...args], { cwd: root });
  return {
    code: proc.exitCode,
    out: new TextDecoder().decode(proc.stdout).trim(),
    err: new TextDecoder().decode(proc.stderr).trim(),
  };
}

function die(message: string): never {
  console.error(`record-upstream-merge: ${message}`);
  process.exit(1);
}

// `v1.23.4` → triple comparison; callers pass strict-shaped tags, and anything else throws.
function tripleOf(tag: string): readonly [number, number, number] {
  const parts = tag.replace(/^v/, "").split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`not a strict vX.Y.Z tag: ${tag}`);
  }
  const [maj = 0, min = 0, pat = 0] = parts;
  return [maj, min, pat];
}

function compareStrictTags(a: string, b: string): number {
  const [aMaj, aMin, aPat] = tripleOf(a);
  const [bMaj, bMin, bPat] = tripleOf(b);
  return aMaj - bMaj || aMin - bMin || aPat - bPat;
}

// The integrated main line, pinned in UPSTREAM only when this run is a main merge.
const rev = run(["rev-parse", `${ref}^{commit}`]);
if (rev.code !== 0) die(`cannot resolve ${ref} to a commit${rev.err ? ` — ${rev.err}` : ""}`);
const commit = rev.out;
if (!/^[0-9a-f]{40}$/.test(commit)) die(`${ref} did not resolve to a full commit id: ${JSON.stringify(commit)}`);

// Upstream's strict tags: ref → committish, peeled when the tag is annotated (the ^{} line
// names the commit; the plain line names the tag object — both are committish, so either works
// for an ancestry test and for a fetch-and-merge).
const ls = run(["ls-remote", "--tags", "upstream"]);
if (ls.code !== 0) die(`cannot list upstream's tags${ls.err ? ` — ${ls.err}` : ""}`);
const tagCommittish = new Map<string, string>();
for (const line of ls.out.split("\n")) {
  const [sha, name] = line.split(/\s+/);
  if (!sha || !name?.startsWith("refs/tags/")) continue;
  if (name.endsWith("^{}")) continue; // the peeled line's plain sibling (or vice versa) fills the map
  tagCommittish.set(name.replace(/^refs\/tags\//, ""), sha);
}
const strictTags = [...tagCommittish.keys()].filter((t) => /^v\d+\.\d+\.\d+$/.test(t)).toSorted(compareStrictTags);
if (strictTags.length === 0) die("upstream remote lists no strict vX.Y.Z tags");

// The newest strict release actually absorbed. An ancestor commit of HEAD is by definition in
// the local object store, so a missing object reads as "not absorbed", never as an error.
let absorbed: string | null = null;
for (const tag of strictTags.toReversed()) {
  if (run(["merge-base", "--is-ancestor", tagCommittish.get(tag)!, "HEAD"]).code === 0) {
    absorbed = tag;
    break;
  }
}
if (absorbed === null) die("no upstream strict release is an ancestor of HEAD — nothing to record");
const dotted = absorbed.replace(/^v/, "");

const previous = (await Bun.file(join(root, "upstream-merged")).text().catch(() => "")).trim();
await Bun.write(join(root, "upstream-merged"), `${dotted}\n`);

if (ref === "upstream/main") {
  await Bun.write(join(root, "UPSTREAM"), `ref: ${ref}\ncommit: ${commit}\n`);
  console.log(`record-upstream-merge: ${ref} (${commit.slice(0, 12)}) — UPSTREAM pinned`);
}
if (previous === dotted) {
  console.log(`record-upstream-merge: upstream-merged stays ${dotted}`);
} else if (/^v?\d+\.\d+\.\d+$/.test(previous) && compareStrictTags(`v${previous.replace(/^v/, "")}`, absorbed) > 0) {
  console.warn(
    `record-upstream-merge: upstream-merged CORRECTED ${previous} → ${dotted} — the old value named no release (ADR 9010)`,
  );
} else {
  console.log(`record-upstream-merge: upstream-merged ${previous || "(none)"} → ${dotted}`);
}
