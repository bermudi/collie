#!/usr/bin/env bash
# scripts/merge-upstream.sh — the ADR 9004 strip-fork merge, orchestrated.
#
#   bash scripts/merge-upstream.sh             fetch + start the merge (DU cleanup + policy sheet)
#   bash scripts/merge-upstream.sh --finish    the verification battery, post-resolution
#
# What the START does that a bare `git merge` does not:
#   - shows what is arriving (count, log, diffstat);
#   - resolves every delete/modify (DU) conflict as STAYS DELETED (`git rm`), which is the
#     documented answer for the whole strip list;
#   - leaves the content conflicts to you, printed in working order with the standing policy.
# What FINISH runs, in order: marker grep → strip gate → version check → typechecks (root,
# contract, web) → lint → bridge+scripts suites → build. The web suite is deliberately NOT run
# here (test-load policy, AGENTS.md): run it targeted during the round and let CI carry the tier.
set -euo pipefail

cd "$(dirname "$0")/.."

# The `ours` merge driver for fork-owned files (.gitattributes). Defined locally — a repo cannot
# carry git config — so it is ensured here, at the only door through which upstream arrives.
ensure_ours_driver() {
  if [ "$(git config merge.ours.driver || true)" != "true" ]; then
    git config merge.ours.driver true
    echo "· merge.ours.driver configured (fork-owned files keep Pup's side, see .gitattributes)"
  fi
}

if [ "${1:-}" = "--finish" ]; then
  if git status --short | grep -qE '^(UU|DU|UA|AA)'; then
    echo "✗ unresolved conflicts remain:"; git status --short | grep -E '^(UU|DU|UA|AA)'; exit 1
  fi
  if grep -rn '^<<<<<<< ' --include='*.ts' --include='*.tsx' --include='*.md' --include='*.sh' \
      --include='*.json' --include='*.toml' bridge scripts web/src web/e2e .adr *.md 2>/dev/null | grep -q .; then
    echo "✗ conflict markers remain:"; exit 1
  fi
  echo "· markers clear"
  bun run scripts/check-strip.ts
  bash scripts/check-version.sh
  bunx tsc --noEmit
  bunx tsc --noEmit -p tsconfig.contract.json
  ( cd web && bunx tsc --noEmit )
  bun run lint
  bun test ./bridge ./scripts
  bash scripts/collie-ctl.test.sh
  bun run build
  echo ""
  echo "✓ battery green. Commit with:"
  echo "    SKIP_VERSION_CHECK=1 git commit   # merges never bump (ADR 0020); strip-adapted content trips the guard"
  exit 0
fi

ensure_ours_driver
git fetch upstream

BASE=$(git merge-base HEAD upstream/main)
COUNT=$(git rev-list --count HEAD..upstream/main)
if [ "$COUNT" -eq 0 ]; then echo "✓ already at upstream/main ($(git rev-parse --short upstream/main))"; exit 0; fi

echo "── arriving: $COUNT commit(s) past $(git rev-parse --short "$BASE")"
git log --oneline "$BASE"..upstream/main | head -30
[ "$COUNT" -gt 30 ] && echo "  … and $((COUNT - 30)) more"
echo "── diffstat (top):"
git diff --stat "$BASE" upstream/main | tail -3
echo ""

# The merge itself. Content conflicts are expected; a content-conflict exit is not a failure of
# the script — it is the work. A clean auto-merge also leaves the index ready to inspect.
git merge upstream/main --no-ff --no-commit || true

# Delete/modify conflicts: the strip stays deleted, wholesale, with the count said out loud.
DU=$(git status --short | grep -c '^DU' || true)
if [ "$DU" -gt 0 ]; then
  git status --short | grep '^DU' | awk '{print $2}' | xargs git rm -q --
  echo "· $DU delete/modify conflict(s) resolved as stays-deleted (the strip list)"
fi

# Rename-detection phantoms: upstream renames onto strip paths arrive as adds under scripts/
# and similar; check-strip will name them at --finish. Say so now, while it is cheap to look.
echo ""
echo "── remaining content conflicts, in working order:"
git status --short | grep -E '^(UU|AA)' | awk '{print $2}' || echo "  (none — auto-merged)"
cat <<'POLICY'

── standing policy (ADR 9004; details in AGENTS.md → Maintaining the strip)
  bridge/index.ts, server.ts   crew/STT/mirror seams out; solo + machines wiring in;
                               local-secret/pair-limit/mask in when upstream adds them
  web crew chrome              provider/switcher/host-chip out; machines/files in
  update machinery             check-only monitor stands (ADR 0020); runner + screens out
  i18n                         crew.*/update-run keys out; run: bun run scripts/i18n-align.ts
  locales                      then translate mirror.blankLines + machines.health.*
  CHANGELOG                    upstream sections demoted to **Upstream x.y — date** bold under
                               ## [Unreleased]; unreleased work as **Upstream main — date**
  version files                stay 0.x (merge=ours on herdr-plugin.toml handles it)
  markers                      NEVER sed conflict markers; rebuild sides with
                               `git show <base>:f / :2:f / :3:f` + `git merge-file --diff3`
                               (index stages die at the first `git add`)
Then: bash scripts/merge-upstream.sh --finish
POLICY
