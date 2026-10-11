import { describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "merge-upstream.sh");
const COMMITS = 100;
const IDENTITY = {
  GIT_AUTHOR_NAME: "Merge Fixture",
  GIT_AUTHOR_EMAIL: "merge-fixture@example.invalid",
  GIT_COMMITTER_NAME: "Merge Fixture",
  GIT_COMMITTER_EMAIL: "merge-fixture@example.invalid",
};

function git(dir: string, args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], {
    cwd: dir,
    env: { ...process.env, ...IDENTITY },
    timeout: 30_000,
  });
  if (proc.exitCode !== 0) {
    throw new Error(`git ${args[0]} exited ${proc.exitCode}: ${proc.stderr.toString().slice(0, 400)}`);
  }
  return proc.stdout.toString().trim();
}

function buildFixture() {
  const root = mkdtempSync(join(tmpdir(), "collie-merge-start-"));
  const upstream = join(root, "upstream");
  const work = join(root, "work");
  git(root, ["init", "-b", "main", upstream]);
  git(upstream, ["commit", "--allow-empty", "-m", "base"]);
  git(root, ["clone", upstream, work]);
  git(work, ["remote", "rename", "origin", "upstream"]);
  for (let i = 0; i < COMMITS; i++) {
    git(upstream, [
      "commit",
      "--allow-empty",
      "-m",
      `upstream-commit-${String(i).padStart(4, "0")} ${"x".repeat(8192)}`,
    ]);
  }
  const upstreamTip = git(upstream, ["rev-parse", "main"]);
  mkdirSync(join(work, "scripts"));
  copyFileSync(SCRIPT, join(work, "scripts", "merge-upstream.sh"));
  return { work, upstreamTip, root };
}

function start(work: string) {
  const proc = Bun.spawnSync(["bash", "scripts/merge-upstream.sh"], {
    cwd: work,
    env: {
      ...process.env,
      ...IDENTITY,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "merge.ours.driver",
      GIT_CONFIG_VALUE_0: "true",
    },
    timeout: 30_000,
  });
  return { code: proc.exitCode, out: `${proc.stdout.toString()}${proc.stderr.toString()}` };
}

describe("merge-upstream.sh start", () => {
  test(
    "a start with more arriving commits than the preview prints reaches the merge",
    () => {
      const { work, upstreamTip, root } = buildFixture();
      try {
        const { code, out } = start(work);
        expect(code).toBe(0);
        const mergeHead = git(work, ["rev-parse", "MERGE_HEAD"]);
        const loggedSubjects = (out.match(/upstream-commit-\d{4}/g) ?? []).length;
        expect(mergeHead).toBe(upstreamTip);
        expect(loggedSubjects).toBe(30);
        expect(out.includes(`${COMMITS - 30} more`)).toBe(true);
        expect(out.includes("(none — auto-merged)")).toBe(true);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
