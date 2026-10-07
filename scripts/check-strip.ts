// scripts/check-strip.ts — the strip gate, run at the end of every upstream merge (ADR 9004).
//
// Two failures it catches, both of which bit before it existed:
//   1. THE STRIP LEAKED: a file matching the strip patterns (cli/, bridge/crew/, bridge/stt/,
//      beacons) is tracked on Pup — usually a silent rename/delete mis-resolution.
//   2. A CASUALTY: a file upstream has that Pup does not, with no line for it in
//      scripts/strip-manifest.txt. Git resolves upstream renames onto Pup's deletes with no
//      conflict at all (1.13.x did it to routes/updates.tsx), so the merge report never names
//      the file — this check is the only thing that does.
//
// Usage: bun run scripts/check-strip.ts [--upstream <ref>]   (default ref: upstream/main)
// Exit 0 = clean; anything else prints the offending paths and exits 1.

import { fileURLToPath } from "node:url";


/** The strip patterns, verbatim from AGENTS.md's own grep so the two can never drift in intent. */
const STRIP_PRESENT = /^(cli\/|bridge\/crew\/|bridge\/stt\/)|beacon/i;

/** fnmatch-style glob → RegExp. `*` matches within one path segment; a trailing `/` means prefix. */
export function manifestLineToRegExp(line: string): RegExp {
  if (line.endsWith("/")) {
    return new RegExp("^" + line.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"));
  }
  const escaped = line.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp("^" + escaped + "$");
}

/** Parse manifest text into matcher regexps: comments (`#` to end of line) and blanks drop out. */
export function manifestMatchers(text: string): RegExp[] {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+#.*$/, "").trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map(manifestLineToRegExp);
}

/** The absences no manifest line covers — the casualties. Pure, so it can be tested. */
export function uncovered(absences: readonly string[], matchers: readonly RegExp[]): string[] {
  return absences.filter((path) => !matchers.some((re) => re.test(path)));
}

async function lines(cmd: string[]): Promise<string[]> {
  const proc = await Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0) throw new Error(`command failed (${code}): ${cmd.join(" ")}`);
  return out.split("\n").filter((l) => l !== "");
}

const upstreamRef = process.argv.includes("--upstream")
  ? process.argv[process.argv.indexOf("--upstream") + 1]!
  : "upstream/main";

const tracked = await lines(["git", "ls-files"]);

// ── Side A: the strip must not be tracked ───────────────────────────────────────────────
const leaked = tracked.filter((p) => STRIP_PRESENT.test(p));
if (leaked.length > 0) {
  console.error(`✗ strip leaked — these tracked files match the strip patterns:`);
  for (const p of leaked) console.error(`  ${p}`);
  process.exit(1);
}

// ── Side B: every absence must be a decision ────────────────────────────────────────────
// `fileURLToPath`, not `.pathname`: a file URL's pathname is `/C:/x` on Windows, which is the
// exact platform-blind spelling bridge/host-guard.test.ts exists to refuse.
const manifestPath = fileURLToPath(new URL("./strip-manifest.txt", import.meta.url));
let matchers: RegExp[];
try {
  matchers = manifestMatchers(await Bun.file(manifestPath).text());
} catch {
  console.error(`✗ cannot read ${manifestPath}`);
  process.exit(1);
}

try {
  const upstreamFiles = await lines(["git", "ls-tree", "-r", "--name-only", upstreamRef]);
  const trackedSet = new Set(tracked);
  const absences = upstreamFiles.filter((p) => !trackedSet.has(p));
  const casualties = uncovered(absences, matchers);
  if (casualties.length > 0) {
    console.error(`✗ ${casualties.length} upstream file(s) absent without a manifest line:`);
    for (const p of casualties) console.error(`  ${p}`);
    console.error(
      `  Each is either a casualty (restore it) or a decision (add it to scripts/strip-manifest.txt).`,
    );
    process.exit(1);
  }
  console.log(
    `✓ strip clean: no strip files tracked; ${absences.length} absences all covered by the manifest`,
  );
} catch (err) {
  // No upstream ref here (e.g. a shallow CI checkout) — side B is meaningless; say so loudly.
  // SAFETY: the thrown value is only rendered, never dereferenced; `as Error` shapes it for the
  // template without asserting anything about the failure itself.
  console.log(`~ strip clean on this tree; absence check skipped (${(err as Error).message})`);
}
