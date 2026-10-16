#!/usr/bin/env bash
# Activate the repo's version-controlled git hooks (one command, idempotent).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$ROOT" config core.hooksPath scripts/git-hooks
# The merge machinery .gitattributes names is repo-local config, not version-controlled — a hand
# `git merge upstream/main` needs it registered before the merge starts.
git -C "$ROOT" config merge.pup-version.driver 'bun scripts/merge-pup-version.ts %O %A %B %L'
git -C "$ROOT" config rerere.enabled true
chmod +x "$ROOT"/scripts/git-hooks/* 2>/dev/null || true
echo "✓ git hooks active (core.hooksPath = scripts/git-hooks)"
echo "✓ merge machinery registered (merge.pup-version.driver, rerere.enabled)"
