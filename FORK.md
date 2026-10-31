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
- **Current integrated base:** [`UPSTREAM`](./UPSTREAM) — the main line only; a strict-release
  absorb leaves it alone (ADR 9010). The runtime record the update monitor reads is the tracked
  [`upstream-merged`](./upstream-merged) file
  ([ADR 9007](./.adr/9007-pup-watches-upstream-minor-and-major.md), amended by
  [9010](./.adr/9010-pup-absorbs-upstream-strict-releases.md)) — written by the merge ritual,
  never by hand.
- **Issues:** fork-specific behavior here; product questions belong upstream.

## Conventions that break the defaults

- **Upstream arrives only through `scripts/merge-upstream.sh`** — fetch, `git merge --no-ff`
  the main line, then absorb upstream's newest strict release tag when the main line does not
  contain it (upstream cuts stable releases from `release-1.x` branches; ADR 9010), mechanical
  conflict passes, record, gate, commit. No rebase, no cherry-pick ports (ADR 9006).
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
  - `upstream-merged` holds the newest upstream **strict release** whose commits are in `main`
    (ADR 9010); it is written only by the ritual, only to a tag that exists on the upstream
    remote. A merge that named a version from some branch's manifest has silently disarmed the
    signal — a dev-tip manifest can carry a number nobody can download.
  - The release workflow stays Linux-only; the dropped windows/macOS rows stay dropped.
- **Release gate:** `scripts/merge-upstream.sh` runs lint + typecheck + build; `collie build`
  gates on version consistency; a tag publishes only from a green `ci.yml` run (`release.yml`'s
  `gate` job waits on it). No test suite runs on this fork — say so when reporting a merge or
  release; do not call an unverified-by-run integration good.

## Active changes

| ID | What / seam | Verify with | Upstream status | Removal condition |
|---|---|---|---|---|
| P001 | Devin support: journal adapter (`bridge/journal/devin.ts`, the journal registry) plus the steered-send surface (echo-as-sent-witness, one resend of a dropped submit key) | `bun scripts/journal-probe.ts` against a real devin log; a live send from the phone | local, deliberately | upstream ships a Devin adapter, or devin leaves the herd |
| ~~P002~~ | **Retired 2026-10-30** — upstream nests worktrees under the repo-root group itself (#587, 1.25.0); the removal condition fired and the carried code is gone. ADR 9005/9006 stay as history | — | absorbed | — |
| P003 | 0.x version line + `merge.pup-version` driver keeping it across merges (`scripts/merge-pup-version.ts`) | `scripts/check-version.sh` | deliberate (the update channel reads origin tags) | mode change or fork retirement |
| P004 | Own update channel, carried two ways: the deployment's `[update] update_repo` in `~/.config/collie/config.toml` names `bermudi/collie` (upstream's own `COLLIE_UPDATE_REPO` seam — env, `.env`, or config), and the carried `bridge/released-tags.ts` guard makes a tag with no GitHub release invisible and unselectable as an update target | `grep -A1 '^\[update\]' ~/.config/collie/config.toml`; `rg -n releasedTagsOnly bridge/index.ts cli/update.ts` | the seam is upstream's design (deliberately used, not duplicated); the released-tags guard is deliberately local | fork retirement |
| P005 | Upstream-merge signal: `upstream-merged` + the (major, minor) fire rule + dismissible nudge; the ritual absorbs the newest strict release the main line lacks (ADR 9007, amended by 9010) | `cat upstream-merged` vs upstream's newest strict tag — the record must never name a version that is not a released tag | deliberate | stop tracking upstream |
| P006 | Linux-only releases: windows workflow and zip gate dropped (ADR 9008), macOS rows and codesign dropped (ADR 9009) | `ls .github/workflows` — no `windows.yml` | deliberate | platform support returns |
| P007 | Test suite removed (operator directive); gate is lint + typecheck + build | `ls web/vitest.config.ts` fails | deliberate divergence | a suite returns — re-add `bun run test` to the gate (marked in `merge-upstream.sh`) |
| P008 | The app's copy names the fork: every i18n string that names the app says ColliePup, swept again at each sync (`web/src/lib/i18n/messages/*`) | `grep -rP '\bCollie\b(?!Pup)' web/src/lib/i18n/messages/` prints nothing | local, deliberately | fork retirement |
| P009 | piz (the local ZCode fork, `~/build/piz`) support: `bridge/journal/piz.ts` plus its registry/roots/config seams, mux name + launch entry, `web/src/lib/surface/profiles/piz.json` send profile, and the agent-commands/operator-scope catalog entries | `bun scripts/journal-probe.ts` against `~/.zcode/cli/db/db.sqlite`; a live send from the phone | local, deliberately | upstream ships a zcode/piz adapter, or piz leaves the herd |

### Merge tripwires

- **Every merge re-imports the test files** upstream still carries — delete/modify conflicts;
  resolve by re-deleting. `rerere` learns after the first merge.
- **The three version files conflict by design every merge** — the pup-version driver takes ours
  when only the version line differs; anything more is real work and `merge-upstream.sh` prints
  it for a human.
- **P001's seam** is the journal registry and the send-verification surface — upstream's harness
  grammar work lands in the same files the steered-send logic reads.
- **P002 is retired** — upstream owns the worktree fold now (#587). Its old view seams
  (`agent-list.tsx`, `pane-groups.ts`, `home.tsx`) are upstream surfaces again; take theirs.
- **New test files upstream adds arrive as PLAIN ADDS, never as conflicts** — the delete/modify
  conflicts only cover files that existed when P007 landed. After resolving, sweep the merge's
  staged list by pattern (`git diff --cached --name-only | grep -E '\.test\.|\.spec\.|/tests/'`)
  and `git rm` what matches.
- **`web/src/fixtures/` and `web/src/test/handlers.ts` are not the suite** — the playground
  imports both, and P007 deliberately kept them. Sweeping them by name breaks `collie build`
  (the 2026-10-24 merge did exactly that; the gate caught it).
- **Upstream cuts strict releases from `release-1.x` branches `upstream/main` does not always
  contain** — the ritual absorbs the newest strict tag (ADR 9010). Merging it after the main
  line can conflict where main moved the same seams: the 2026-10-24 v1.23.4 absorb hit
  `protocol.ts` (main's steer constants vs the release's notice wording — both kept) and the
  dictionaries.
- **The dictionaries are a three-way surface, never a take-theirs**: ours is main's superset
  (plus the ColliePup sweep), theirs is the older release line. Taking theirs wholesale drops
  main's keys and typecheck fails on every missing string (done and repaired on 2026-10-24).
  Resolve as ours + theirs' delta (`git diff <merge-base> <tag> -- web/src/lib/i18n/messages/`
  applied three-way), then run the ColliePup sweep again.

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

### 2026-10-30 — `upstream/main` 37351ff1 → 22b6c3ad (280 commits); strict releases ride along — v1.25.0, v1.25.1 and v1.25.2 are ancestors, no separate absorb needed

- `upstream-merged` 1.24.1 → 1.25.2; `UPSTREAM` pinned to 22b6c3ad. The signal's (1.24,→1.25)
  fire rule is answered. None of the three releases was marked urgent; 1.25.2 is a bugfix line
  for the Herdr core (sends refused, cards unanswerable, keys losing their case).
- The merge brings the herdr-core multiplexer adapter with auto-pick and a Collie panel mod for
  herdr-app (1.25.0's headline), the composer's image editor before upload, send findings in
  `collie doctor`, space labels and folders, Antigravity 1.4.8, browser-leg replay for Claude
  (M67 — replay cassettes swept with the suite; the leg is not a gate on Pup), upstream's own
  worktree fold into the repo-root group (#587), the `dsh-tui` harness, the 1.25.1
  two-Collies-on-one-machine fixes and the 1.25.2 herdr-core input repairs.
- **P002 retired — absorbed.** Upstream #587 nests a worktree pane under its repo-root group
  itself, the patch's stated removal condition. Taken theirs wholesale in
  `agent-list.tsx`/`pane-groups.ts`/`home.tsx` (the prop surface lost `ambientSession`), and the
  `nestWorkspaceGroups`/`NestedGroup` renderer dropped from `dash-view.ts`. ADR 9005/9006 stay
  as history.
- Conflicts: the test-suite re-import (173 delete/modify, re-deleted; ~60 new suite files
  arrived as plain adds and were swept — `web/e2e/` wholesale, replay cassettes, the dsh test
  fixtures, `bridge/journal/fixtures/`); `cli/testdata/doctor-posix.golden.txt` dropped (its
  doctor test is swept; the `leg*.sh` scripts are Pup's, kept); the eleven dictionaries
  (ours' ColliePup lines plus theirs' new image-edit keys, then the sweep); union resolutions in
  the harness seams (`journal/registry.ts`, `config-schema.ts`, `mux/agents.ts`,
  `journal-agents.ts`, `verified-versions.json` — ours' devin + piz plus theirs' dsh);
  `server.ts` kept Pup's strict `resolvePaneCwd` with theirs' `sessionFolder` wired as the
  middle fallback (typed → sessionFolder → home); `cli/unit.ts` union
  (`harnessSearchPath` + `coreOf`); `pi.json` ours (Enter stays submit/queue; the optional
  frame-label shape propagated to `devin.json` as merge residue); the three version files by
  hand — real deltas this time (renamed actions, contract typecheck which Pup drops with the
  suite), so the driver printed and a human resolved; `.adr/README.md` (theirs' 0125 before
  ours' 9001+); `.gitattributes` union; `.oxlintrc.json` theirs plus Pup's
  `versions/**`/`current/**`/`released-tags.ts` — a residue commit (5892e139) later staged the
  herdr-core/space-labels override entries the first pass dropped; `release.yml` ours
  byte-identical (theirs' delta was macos-14→15 inside the dropped macOS regions);
  `docs/install.md`, `five-minute-install.md`, `claude-code-on-your-phone.md`,
  `troubleshooting.md` — ours' Linux-only text plus theirs' non-platform additions (setup-check,
  Herdr-core entries), their per-OS restructure re-flattened.
- Gate green: lint, typecheck, build; `check-version` 0.58.0 consistent. No test suite ran
  (P007). Two hook notes: the version guard needed the ritual's Unreleased bullet ("Upstream
  1.25.0 through 1.25.2 are in"), and `check-crew-wire.sh` raced on the 436-file staged set —
  its `printf … | grep -q` under `pipefail` loses to SIGPIPE when grep exits early, so
  `SKIP_CREW_WIRE_CHECK=1` stood in; the protocol decision is upstream's own exit (i), with
  `mux`/`panes`/`host` documented in the staged `CREW_PROTOCOL.md` §19. Worth an upstream
  report.
- Housekeeping: 89 local `v1.*` tags deleted — they arrived on an accidental `--tags` fetch and
  the fork keeps upstream tags out of the local store. Unreleased at this writing.

### 2026-10-27 — `upstream/main` 35d3ccfc → 37351ff1 (246 commits); strict releases ride along — v1.24.0 and v1.24.1 are ancestors, no separate absorb needed

- `upstream-merged` 1.23.4 → 1.24.1; `UPSTREAM` pinned to 37351ff1. The signal's (1.23,→1.24) fire
  rule is answered. Upstream marked 1.24.1 **urgent** (OMP panes could refuse, hold or silently lose
  sends; a Claude send during a turn could hold or end unconfirmed).
- The merge brings the large-screen layout (sidebar + pane strip, ADR 0120), two-finger/joystick
  pane navigation (0121), queued-send cards (0122), report-a-problem (0123), Claude/Codex account
  usage windows (0118), per-program send bounds (0124), Kiro panes, Muse/Grok/opencode/Antigravity
  bars, and the 1.24.1 send repairs.
- Conflicts: the test-suite re-import (95 delete/modify, re-deleted; 45 new suite files arrived as
  plain adds and were swept — `web/e2e/` wholesale plus `bridge/surface/fixtures/`, neither exists
  on Pup); the eleven dictionaries (theirs' block per hunk plus our Pup-only lines, then the
  ColliePup sweep — no Pup-only key sat inside a conflicted hunk); `herdr-plugin.toml` ours
  (upstream's delta was the version line only; the driver's ours-vs-theirs check cannot see that —
  resolved by hand); `CLAUDE.md` ours (the Pup paragraph; upstream's Windows-asset and rig-gate
  rows stay out); `docs/troubleshooting.md` (ours' macOS-free list plus theirs' new report entry);
  `.adr/README.md` (theirs' 0115–0124 rows, ours' 9001–9010 appended); `operator-scope.ts` union
  (`devin` + upstream's new `muse`). The two version files went through the driver without a word.
- Gate green: lint, typecheck, build. No test suite ran (P007). Shipped in 0.58.0 (2026-10-27);
  the deployment moved onto `versions/v0.58.0-main` (unit repointed, `current` flipped, bridge
  restarted).

### 2026-10-24 (second sync) — `upstream/main` unchanged; strict `v1.23.4` absorbed via release-1.23 (1.23.2–1.23.4, 14 commits)

- The signal was found disarmed: two dev-tip merges had recorded `upstream-merged = 1.24.0`, a
  version that does not exist, while `release-1.23`'s 1.23.2–1.23.4 never reached
  `upstream/main`. ADR 9010 landed first — the ritual now absorbs the newest strict tag, and the
  record is the newest strict tag proven by ancestry. `upstream-merged` corrected 1.24.0 →
  1.23.4; the banner re-arms for stable 1.24.0.
- The absorb merged `v1.23.4`: pi-pane-under-inset-editor sends (#544), notice-key first-line
  answers, anchored Grok/opencode running-turn patterns, Replace/Cancel for a slash command onto
  a draft. Conflicts: `protocol.ts` (steer constants vs notice wording — both kept;
  replace-as-command auto-merged), the dictionaries (ours-as-superset plus theirs' delta, then
  the ColliePup sweep again), `prompt-select.ts`/fixtures/`ci.yml`/`herdr-plugin.toml` ours
  (main's newer line already carried theirs' work), `flake.nix` by rerere, 33 test re-imports
  re-deleted plus one plain add swept. First dictionary resolution took theirs wholesale and
  typecheck caught the missing 1.24 keys; repaired before the merge commit was final.
- Gate green: lint, typecheck, build. No test suite ran (P007). Unreleased at this writing.
- Found unset beside this: the deployment had no `COLLIE_UPDATE_REPO` — its banner watched
  `AltanS/collie`. `~/.config/herdr/plugins/config/herdr.collie/config.toml` now sets `[update]
  update_repo = "bermudi/collie"`, effective on the bridge's next restart.
- The deployment was then moved onto this tree (`versions/v0.57.9-main`, unit repointed,
  bridge restarted) — and boot refused: upstream's steer grammar arrived with
  `keys.steer: Enter` for pi while Pup's 0.57.7 adaptation (a3c16f25) had made Enter pi's
  submit/queue key; the new profile validation rejects the collision. Fixed by dropping pi's
  steer keys (f823a167) — pi queues on Enter exactly as 0.57.7 shipped; Steer stays off for pi
  until its real 1.x steer keymap is measured. This is the class of catch the removed profile
  suite used to make (P007's price, paid once).

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
  missed (5a4b9696; P008 now inventoried). Shipped in 0.57.9 (2026-10-24).

### 2026-10-21 — 1.22.0 → 1.24.0 (upstream dev tip, `v1.24.0-edge.2`, ed781b6e)

- Test-suite removal (operator directive) carried through the merge as re-deletions; the merge
  gate lost its test step (220f6237). Shipped in 0.57.9 (2026-10-24).

### 2026-10-16 — 1.21.3 → 1.22.0 (73860b2b via 3f30ec00)

- Released as 0.57.0.

### 2026-10-15 — record created at 1.21.3 (81d05388, ADR 9007)

### 2026-10-14 — mode change: strip fork ends, upstream + two features (ADR 9006)

- Earlier selective-port history is not reconstructed here; `git log` and the superseded ADRs
  hold it.
