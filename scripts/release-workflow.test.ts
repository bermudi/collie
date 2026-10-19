import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

// The invariants of the release pipeline that only the workflow file holds, read as YAML (Bun's own
// parser), so a reformat cannot fool them and a moved line cannot hide from them:
//   1. the two Linux rows stay in `payload`, with `fail-fast: true`, exactly as they were — on the
//      Pup there are no other rows (ADR 9009);
//   2. `release` runs only behind a green `payload`, and the jobs after it read its result by name.
// What GitHub does with these conditions was checked once on a throwaway branch (2026-10-02); this
// keeps the file saying what was checked.

interface Step {
  readonly name?: string;
  readonly id?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Record<string, string>;
  readonly env?: Record<string, string>;
}

interface Job {
  readonly needs?: string | readonly string[];
  readonly if?: string;
  readonly "runs-on"?: string;
  readonly "timeout-minutes"?: number;
  readonly strategy?: {
    readonly "fail-fast"?: boolean;
    readonly matrix?: { readonly include?: readonly Record<string, string>[] };
  };
  readonly steps?: readonly Step[];
}

const text = readFileSync(join(import.meta.dir, "..", ".github", "workflows", "release.yml"), "utf8").replaceAll(
  "\r\n",
  "\n",
);
// SAFETY: `Bun.YAML.parse` answers plain data. Every field read below is compared against a literal,
// so a missing or differently shaped one fails the assertion that reads it.
const jobs = (Bun.YAML.parse(text) as { jobs: Record<string, Job> }).jobs;
const job = (name: string): Job => {
  const found = jobs[name];
  if (found === undefined) throw new Error(`release.yml has no job ${name}`);
  return found;
};

describe("release.yml: the Linux rows", () => {
  test("stay in `payload`, behind the gate, with fail-fast true and the same two rows", () => {
    const payload = job("payload");
    expect(payload.needs).toBe("gate");
    expect(payload.strategy?.["fail-fast"]).toBe(true);
    expect(payload.strategy?.matrix?.include).toEqual([
      { platform: "linux-x64", "runs-on": "ubuntu-latest", "bun-target": "bun-linux-x64-baseline" },
      { platform: "linux-arm64", "runs-on": "ubuntu-24.04-arm", "bun-target": "bun-linux-arm64" },
    ]);
  });
});

describe("release.yml: the release job", () => {
  test("needs `payload` alone, and runs only when every row was green and nothing was cancelled", () => {
    const release = job("release");
    expect(release.needs).toEqual(["payload"]);
    expect(release.if).toBe("${{ !cancelled() && needs.payload.result == 'success' }}");
  });

  test("collects every `payload-*` artifact", () => {
    const download = (job("release").steps ?? []).find((s) => s.uses?.startsWith("actions/download-artifact@") === true);
    expect(download?.with?.pattern).toBe("payload-*");
  });

  test("the release notes are the script's whole body, nothing appended", () => {
    const step = (job("release").steps ?? []).find((s) => s.id === "notes");
    const run = step?.run ?? "";
    expect(run).toContain("nix develop --command bun scripts/release-notes.ts \\");
    expect(run).toContain('"${previous[@]}" > "$notes"');
    expect(run).toContain('echo "file=$notes" >> "$GITHUB_OUTPUT"');
  });

  test("the jobs after `release` read its result by name", () => {
    for (const name of ["notify-website", "refresh-packages"]) {
      expect(job(name).needs).toBe("release");
      expect(job(name).if).toBe("${{ !cancelled() && needs.release.result == 'success' && !contains(github.ref_name, '-') }}");
    }
  });
});
