# Fork maintenance — Pup

Pup is **bermudi's fork of [AltanS/collie](https://github.com/AltanS/collie)**: upstream plus
exactly two features, on its own 0.x release line, Linux-only payloads. This file is the working
record; the arguments that closed every alternative live in the 90xx ADRs. Fresh sessions read
[`CLAUDE.md`](./CLAUDE.md) first — this file covers only what is specific to being a fork.

## Identity

- **Mode:** patch-carrying — upstream determines the product; we carry a small, justified set
  ([ADR 9006](./.adr/9006-pup-is-upstream-plus-devin-and-worktree-nest.md)). Tracking is
  wholesale merges, never cherry-picked ports: the selective-port and strip-fork eras were both
  tried and retired
  ([ADR 9004](./.adr/9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md),
  superseded).
- **Maintainer:** bermudi — solo, personal deployment.
- **Upstream:** https://github.com/AltanS/collie — remote `upstream`, fetch-only.
- **Lineage:** selective port fork (0.32–0.47) → strip fork (ADR 9004) → upstream + two features
  (ADR 9006, 2026-10-14). ADR 9004 names the re-branch base tag `1.11.0-rc.1`; that tag is absent
  from the upstream remote, so the port-era line it replaced stays preserved on
  `backup/main-pre-rebranch` instead.
- **Current integrated base:** [`UPSTREAM`](./UPSTREAM). The runtime record the update monitor
  reads is the tracked [`upstream-merged`](./upstream-merged) file
  ([ADR 9007](./.adr/9007-pup-watches-upstream-minor-and-major.md)) — written by the merge ritual,
  never by hand.
- **Issues:** fork-specific behavior here; product questions belong upstream.

## Conventions that break the defaults

- **Upstream arrives only through `scripts/merge-upstream.sh`** — fetch, `git merge --no-ff`,
  mechanical conflict passes, record, gate, commit. No rebase, no cherry-pick ports (ADR 9006).
  The script registers the `merge.pup-version` driver and `rerere` itself; merging by hand
  without them can adopt upstream's version files wholesale.
- **The `upstream` remote fetches with `--no-tags`** (deliberate). Upstream's tags are resolved
  against the remote (`git ls-remote`), not kept in the local tag store.
- **Never `git push --follow-tags`.** Upstream's `v1.x` tags are reachable through merges; the
  pre-push hook refuses it. Push release tags explicitly, by name.
- **Versions are 0.x**, strictly below upstream's stable line; three files agree, enforced by
  `scripts/check-version.sh`. The repo (origin tags), not version ordering against upstream, is
  how consumers select this build.
- **The test suite is removed** at the operator's direction (2026-10-21, see the Unreleased
  changelog entry). The merge gate is lint + typecheck + build; behavior is validated by running
  the product. CLAUDE.md's test-tier sections describe upstream's suites, not this tree.
  `scripts/merge-upstream.sh` marks the re-entry point if a suite ever returns.
- **Each release lands a `packaging/<version>` branch on origin** carrying the AUR and nix
  packaging bump, rewritten from the release manifest by `scripts/refresh-packages.ts`.
- **A minor release is upstream-gated:** it ships only after an upstream minor/major has been
  merged into `main` (ADR 9007). Patches are free.
- **`AGENTS.md` stays byte-identical to upstream's** — fork pointers live in CLAUDE.md's header
  and here, so merges never conflict on it.

## Compatibility contract

- **Promised scope:** the operator's own paired devices against his own bridge. Payloads: Linux
  x86_64 and aarch64 only
  ([ADR 9008](./.adr/9008-pup-drops-windows.md),
  [ADR 9009](./.adr/9009-pup-ships-linux-only.md)). The herd is pi + devin daily, opencode
  sometimes (ADR 9006).
- **Invariants a sync must preserve:**
  - The two carried features come through each merge alive.
  - The 0.x version line survives — a merge whose version files adopted upstream's numbers has
    silently broken the channel.
  - `upstream-merged` advances only inside the merge ritual, only to a version actually merged.
  - The release workflow stays Linux-only; the dropped windows/macOS rows stay dropped.
- **Release gate:** `scripts/merge-upstream.sh` runs lint + typecheck + build; `collie build`
  gates on version consistency; a tag publishes only from a green `ci.yml` run (`release.yml`'s
  `gate` job waits on it). No test suite runs on this fork — say so when reporting a merge or
  release; do not call an unverified-by-run integration good.

## Active changes

| ID | What / seam | Verify with | Upstream status | Removal condition |
|---|---|---|---|---|
| P001 | Devin support: journal adapter (`bridge/journal/devin.ts`, the journal registry) plus the steered-send surface (echo-as-sent-witness, one resend of a dropped submit key) | `bun scripts/journal-probe.ts` against a real devin log; a live send from the phone | local, deliberately | upstream ships a Devin adapter, or devin leaves the herd |
| P002 | Worktree-nested herd list on the dashboard (`web/src/lib/dash-view.ts`, [ADR 9005](./.adr/9005-the-herd-list-nests-a-worktree-under-its-repo.md)) | the dashboard after a worktree opens | local, deliberately | upstream nests worktrees itself |
| P003 | 0.x version line + `merge.pup-version` driver keeping it across merges (`scripts/merge-pup-version.ts`) | `scripts/check-version.sh` | deliberate (the update channel reads origin tags) | mode change or fork retirement |
| P004 | Own-channel update monitor: check-only banner reads `bermudi/collie` tags; ADR 0020's major-consent gate rides it (`bridge/update.ts`) | `git grep -n bermudi/collie bridge/update.ts` | deliberate | fork retirement |
| P005 | Upstream-merge signal: `upstream-merged` + the (major, minor) fire rule + dismissible nudge (ADR 9007) | `cat upstream-merged` vs upstream's newest stable tag | deliberate | stop tracking upstream |
| P006 | Linux-only releases: windows workflow and zip gate dropped (ADR 9008), macOS rows and codesign dropped (ADR 9009) | `ls .github/workflows` — no `windows.yml` | deliberate | platform support returns |
| P007 | Test suite removed (operator directive); gate is lint + typecheck + build | `ls web/vitest.config.ts` fails | deliberate divergence | a suite returns — re-add `bun run test` to the gate (marked in `merge-upstream.sh`) |
| P008 | The app's copy names the fork: every i18n string that names the app says ColliePup, swept again at each sync (`web/src/lib/i18n/messages/*`) | `grep -rP '\bCollie\b(?!Pup)' web/src/lib/i18n/messages/` prints nothing | local, deliberately | fork retirement |

### Merge tripwires

- **Every merge re-imports the test files** upstream still carries — delete/modify conflicts;
  resolve by re-deleting. `rerere` learns after the first merge.
- **The three version files conflict by design every merge** — the pup-version driver takes ours
  when only the version line differs; anything more is real work and `merge-upstream.sh` prints
  it for a human.
- **P001's seam** is the journal registry and the send-verification surface — upstream's harness
  grammar work lands in the same files the steered-send logic reads.
- **P002's seam** is view-level: keep the nesting out of the API shape upstream defines.
- **New test files upstream adds arrive as PLAIN ADDS, never as conflicts** — the delete/modify
  conflicts only cover files that existed when P007 landed. After resolving, sweep the merge's
  staged list by pattern (`git diff --cached --name-only | grep -E '\.test\.|\.spec\.|/tests/'`)
  and `git rm` what matches.
- **`web/src/fixtures/` and `web/src/test/handlers.ts` are not the suite** — the playground
  imports both, and P007 deliberately kept them. Sweeping them by name breaks `collie build`
  (the 2026-10-24 merge did exactly that; the gate caught it).

## Maintenance policy

- **Trigger:** ADR 9007's signal — upstream's newest stable tag's (major, minor) strictly past
  `upstream-merged` — not a calendar. Security-relevant upstream fixes jump the queue.
- **Procedure:** `scripts/merge-upstream.sh`, then re-read this file against the tree and delete
  whatever the merge made false.
- **Effort limit:** repeated semantic conflicts in P001/P002 seams mean the seam, not the merge,
  is the problem — time-box and reconsider the feature's shape (ADR 9004 paid for this lesson
  once already).
- **Security:** personal deployment; advisories surface through the upstream releases the signal
  already watches. A relevant fix is a merge plus a patch release, no calendar wait.
- **Exit conditions:** upstream absorbs P001 and P002 (retire the fork, track upstream tags
  directly), or maintenance exceeds value (re-decide the mode honestly, as ADR 9006 did).

## Builds and releases

- **Entry point:** pushing a `v0.x` tag → `.github/workflows/release.yml`, publishing the GitHub
  Release under `bermudi/collie`; its `gate` job waits on the tagged commit's `ci.yml` run.
  Recipe: push `main`, watch CI, push the tag by name.
- **Package identity:** plugin id stays `herdr.collie`; the update channel reads `bermudi/collie`
  tags (P004); AUR and nix repackaged per release (see conventions).
- **Approval boundary:** merges, release commits, and packaging branches are agent-executable;
  pushing `main`, tags, or packaging branches publishes — operator's call.

## Sync / import log

### 2026-10-24 — 1.24.0-edge.2 → `upstream/main` 35d3ccfc (edge.3, edge.4 and past, 187 commits, 7ebc600f)

- `upstream-merged` stays 1.24.0 — upstream has not cut a stable 1.24.0; `UPSTREAM` carries the
  advance. The merge brings Stop-with-receipt, Steer (pi/Codex/OMP), the paste chip, machine
  glyphs, usage dots, walky take-back, four new harness bars, the SDK's `./durable-harness`
  entry, and the Bun 1.4.4 pin (eMudhra revocation).
- Conflicts: the test-suite re-import (84 delete/modify, re-deleted) plus 25 new test files that
  arrived as plain adds; CLAUDE.md's release recipe (the Pup paragraph kept); `flake.nix` (darwin
  stays deleted, Bun 1.4.4 hashes taken); `ci.yml` (typecheck-only gate kept, the durable-harness
  example's typecheck gained); `.adr/README.md` and `agent-icon-data.ts` (unions); nine
  dictionaries (theirs' translations, our ColliePup). The three version files went through the
  driver without a word to print.
- The gate caught an over-deletion of the kept playground fixtures (see tripwires), was repaired,
  and then ran green: lint, both typechecks, build. No test suite ran (P007) — behavior is
  validated by running the product; the browser leg does not exist on this fork.
- Follow-up: the ColliePup sweep extended to the merge's strings and to a few the earlier pass
  missed (5a5b9696; P008 now inventoried). Shipped in 0.57.9 (2026-10-24).

### 2026-10-21 — 1.22.0 → 1.24.0 (upstream dev tip, `v1.24.0-edge.2`, ed781b6e)

- Test-suite removal (operator directive) carried through the merge as re-deletions; the merge
  gate lost its test step (220f6237). Shipped in 0.57.9 (2026-10-24).

### 2026-10-16 — 1.21.3 → 1.22.0 (73860b2b via 3f30ec00)

- Released as 0.57.0.

### 2026-10-15 — record created at 1.21.3 (81d05388, ADR 9007)

### 2026-10-14 — mode change: strip fork ends, upstream + two features (ADR 9006)

- Earlier selective-port history is not reconstructed here; `git log` and the superseded ADRs
  hold it.
