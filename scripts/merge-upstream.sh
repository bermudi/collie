#!/usr/bin/env bash
# Merge upstream into Pup as one command — the ADR 9006/9007 ritual:
#
#   scripts/merge-upstream.sh [upstream-ref]        # default: upstream/main
#
# In order: register the repo-local merge machinery (pup-version driver, rerere) → fetch →
# `git merge --no-ff --no-commit` → auto-resolve the conflicts that are only ever mechanical → record
# `upstream-merged` → run the gate (lint, typecheck, test, build) → commit the merge.
#
# The version files are normally resolved by the pup-version driver DURING the merge; the pass
# below is the fallback for a file left conflicted whose ours-vs-theirs differs only in the
# version line — it takes ours. Anything else that conflicts is real work and is printed for a
# human: resolve, `git add`, re-run this script — it resumes after the merge step.
# `git merge --abort` unwinds a merge in progress.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REF="${1:-upstream/main}"
VERSION_FILES="package.json
web/package.json
herdr-plugin.toml"

die() { echo "✗ merge-upstream: $*" >&2; exit 1; }
in_merge() { git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; }
unmerged() { git diff --name-only --diff-filter=U; }

command -v bun >/dev/null 2>&1 || die "bun is not on PATH"
git remote get-url upstream >/dev/null 2>&1 || die "no 'upstream' remote (expected AltanS/collie)"

# Repo-local merge machinery — the same registrations install-hooks.sh performs, repeated here so
# the driver cannot be absent on the one code path that needs it.
git config merge.pup-version.driver 'bun scripts/merge-pup-version.ts %O %A %B %L'
git config rerere.enabled true

if ! in_merge; then
  [ -z "$(git status --porcelain)" ] || die "working tree is not clean — commit or stash first"
  git fetch upstream
  git merge-base --is-ancestor "$REF" HEAD && { echo "✓ already up to date with $REF"; exit 0; }
  echo "── merging $REF"
  # --no-ff: a fast-forward would adopt upstream's version files wholesale, driver or no driver.
  git merge --no-ff --no-commit "$REF" || true
  in_merge || die "merge produced no MERGE_HEAD — inspect git status"
fi

# True iff the stage-2 (ours) vs stage-3 (theirs) diff touches nothing but version lines — the one
# conflict whose answer is predetermined. Stage entries missing (add/add, delete) fail the check.
only_version_differs() {
  local ours theirs
  ours=$(git rev-parse -q --verify ":2:$1" 2>/dev/null) || return 1
  theirs=$(git rev-parse -q --verify ":3:$1" 2>/dev/null) || return 1
  [ "$(git diff --no-color "$ours" "$theirs" \
    | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -cvE 'version')" = "0" ]
}

while IFS= read -r path; do
  if printf '%s\n' "$VERSION_FILES" | grep -qxF "$path" && only_version_differs "$path"; then
    git checkout --ours -- "$path"
    git add -- "$path"
    echo "── $path: took ours — only the version line differed"
  fi
done < <(unmerged)

if [ -n "$(unmerged)" ]; then
  {
    echo "✗ merge-upstream: conflicts left for a human:"
    unmerged | sed 's/^/    /'
    echo "  resolve, git add, then re-run scripts/merge-upstream.sh — it resumes after the merge."
    echo "  git merge --abort unwinds."
  } >&2
  exit 1
fi

bun scripts/record-upstream-merge.ts "$REF"
git add upstream-merged

# The `bun run test` step left with the suite it ran (f72903a1); re-add it beside typecheck if a
# suite returns.
echo "── gate: lint, typecheck, build"
bun run lint
bun run typecheck
bun run build

git commit --no-edit
echo "✓ merged $REF — upstream-merged $(cat upstream-merged)"
