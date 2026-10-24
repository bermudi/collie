#!/usr/bin/env bash
# Merge upstream into Pup as one command — the ADR 9006/9007/9010 ritual:
#
#   scripts/merge-upstream.sh [upstream-ref]        # default: upstream/main
#
# In order: register the repo-local merge machinery (pup-version driver, rerere) → fetch →
# `git merge --no-ff --no-commit` the main line → absorb upstream's newest STRICT release tag
# when the main line does not contain it (upstream cuts stable releases from release-1.x
# branches main does not always merge back; ADR 9010) → auto-resolve the conflicts that are only
# ever mechanical → run the gate (lint, typecheck, build) → record `upstream-merged` → commit.
# Each merge lands as its own merge commit; the record rides after the last one, once the gate
# is green — a failed gate leaves a clean tree the script can resume from.
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

# True iff the stage-2 (ours) vs stage-3 (theirs) diff touches nothing but version lines — the one
# conflict whose answer is predetermined. Stage entries missing (add/add, delete) fail the check.
only_version_differs() {
  local ours theirs
  ours=$(git rev-parse -q --verify ":2:$1" 2>/dev/null) || return 1
  theirs=$(git rev-parse -q --verify ":3:$1" 2>/dev/null) || return 1
  [ "$(git diff --no-color "$ours" "$theirs" \
    | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -cvE 'version')" = "0" ]
}

# The mechanical conflict pass: version files that differ only in the version line take ours.
# Anything still unmerged after it is real work for a human — exit loud, resume on re-run.
mechanical_pass() {
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
}

newest_strict_tag() {
  git ls-remote --tags upstream \
    | awk '$2 ~ /^refs\/tags\/v[0-9]+\.[0-9]+\.[0-9]+$/ { print $2 }' \
    | sed 's#refs/tags/##' | sort -V | tail -1
}

# ADR 9010: absorb upstream's newest strict release when the main line lacks it. The tag is
# fetched by explicit refspec (FETCH_HEAD only — the remote's tagopt is --no-tags and the local
# tag store stays clean) and merged as its own merge commit.
absorb_strict_release() {
  local tag sha
  tag="$(newest_strict_tag)" || die "cannot list upstream's tags"
  [ -n "$tag" ] || die "upstream remote lists no strict vX.Y.Z tags"
  sha="$(git ls-remote upstream "refs/tags/$tag" | awk 'NR==1{print $1}')"
  [ -n "$sha" ] || die "cannot resolve upstream's tag $tag"
  git fetch -q upstream "refs/tags/$tag" || die "cannot fetch $tag"
  # An ancestor commit of HEAD is by definition in the local store, so a missing object reads as
  # "not absorbed", never as an error.
  if git merge-base --is-ancestor "$sha" HEAD 2>/dev/null; then
    echo "✓ newest strict release $tag already absorbed"
    return 0
  fi
  echo "── absorbing strict release $tag (upstream cuts releases off-main; ADR 9010)"
  # --no-ff: a fast-forward would adopt upstream's version files wholesale, driver or no driver.
  git merge --no-ff --no-commit FETCH_HEAD || true
  in_merge || die "release merge produced no MERGE_HEAD — inspect git status"
  mechanical_pass
  git commit --no-edit
}

if in_merge; then
  # Resume: a human resolved the conflicts of the merge in progress — finish it, then continue.
  mechanical_pass
  git commit --no-edit
else
  [ -z "$(git status --porcelain)" ] || die "working tree is not clean — commit or stash first"
  git fetch upstream
  if git merge-base --is-ancestor "$REF" HEAD 2>/dev/null; then
    echo "✓ already up to date with $REF"
  else
    echo "── merging $REF"
    # --no-ff: a fast-forward would adopt upstream's version files wholesale, driver or no driver.
    git merge --no-ff --no-commit "$REF" || true
    in_merge || die "merge produced no MERGE_HEAD — inspect git status"
    mechanical_pass
    git commit --no-edit
  fi
fi

absorb_strict_release

# The gate runs before the record so a failure leaves a clean, committed tree the script can
# resume from ("already up to date … already absorbed") instead of a dirty one the entry check
# rejects. The record files change nothing the gate could read.

# The `bun run test` step left with the suite it ran (f72903a1); re-add it beside typecheck if a
# suite returns.
echo "── gate: lint, typecheck, build"
bun run lint
bun run typecheck
bun run build

bun scripts/record-upstream-merge.ts "$REF"
git add upstream-merged UPSTREAM

if ! git diff --cached --quiet; then
  git commit -m "chore(fork): record upstream-merged $(cat upstream-merged)"
fi
echo "✓ upstream absorbed — upstream-merged $(cat upstream-merged)"
