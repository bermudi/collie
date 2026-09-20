# AGENTS.md — Collie Pup

**Collie Pup is a strip-fork of [`AltanS/collie`](https://github.com/AltanS/collie).** Pup re-branches
from upstream/main wholesale and stays there: upstream work arrives by ordinary merges, and Pup's
own diff stays thin. What Pup strips — pack/crew/HA, speech-to-text, the TS `cli/`, agent beacons —
and what it keeps — the whole viewer, i18n, the cache chip, e2e, lint — is decided once, in
[`.adr/0053`](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md). Don't
restate that ADR's reasoning here; link to it. Upstream repo: `AltanS/collie` · Fork: `bermudi/collie`
· Plugin id stays `herdr.collie` (display name `Collie Pup`) so linked installs don't need a reinstall.

**Read [`CLAUDE.md`](./CLAUDE.md) before changing anything.** It is the working agreement — versioning,
build/run, data layer, Herdr socket grammar, journal containment, security posture.

## Decision records — read before you re-argue

[`.adr/`](./.adr/) holds the decisions that **close off an option someone will reasonably propose
again**. If you're about to argue *why not* rather than *how*, check there first — if the answer
isn't there and the decision is that shape, add one (see [`.adr/README.md`](./.adr/README.md)). Pup's
gates live there: one managed front door (0001), no terminal emulator (0008), one major gate (0020),
opencode pane-scoped (0050), generic menu digit ban (0009), the strip-fork strategy itself (0053).
Rows marked **(Pup)** in the index are ours; upstream's ADRs arrive with their own numbers, and the
0011–0045 numbers their pack/crew/STT machinery used are reserved-but-empty here.

## Project

Phone web UI for your Herdr herd over Tailscale. Bun bridge + Vite/React PWA. Single-user,
tailnet-only. Pup's job is to be the boring, reliable viewer you open 20 times a day.

## The herd this fork serves

The real herd is **pi + devin daily, opencode riding along sometimes**. Codex, cc, omp and the rest
are downstream concerns. Upstream under-serves devin — closing that gap is Pup's job, not theirs.
**Parity rule:** when a feature lands for one harness (belt button, command catalog, composer shape,
icon), check pi and devin before calling it done. A pi or devin pane must never be the degraded case
while a louder harness gets the polish.

## Stack

Bun + TypeScript (bridge) · Vite + React + Tailwind v4 + shadcn (web) · the mux seam (Herdr default;
tmux/zellij carried, panes read as shells without beacons) · Tailscale Serve as the one managed front
door (via `scripts/collie-ctl.sh`, not the stripped cli) · `web-push` for notifications · the
prompt-cache chip and watch (kept from upstream 1.10).

## Maintaining the strip (merge workflow)

- `git fetch upstream && git merge upstream/main` is the normal way upstream work arrives. Expect
  conflicts exactly where upstream touches the strip list (`cli/`, `bridge/crew/`, `bridge/stt/`,
  beacons, the staged update runner, the crew ADRs) — resolve every one as **stays deleted**, then
  re-check the strip-list grep: `git ls-tree -r --name-only HEAD | grep -iE '^(cli/|bridge/crew/|bridge/stt/)|beacon'`
  must come back empty.
- The bridge's update path is Pup's own: `bridge/update.ts` is the fork's check-only monitor
  watching `bermudi/collie` tags (ADR 0020's gate rides it), and `POST /api/update/check` is the only
  update route. Upstream's update-run/runner machinery never merges in.
- `scripts/collie-ctl.sh` + `herdr-plugin.toml` are Pup's operating surface (build / restart / update /
  doctor / serve). Upstream equivalents live in their stripped cli — don't port them back.
- Version line stays **0.x** (ADR 0020). A merge never bumps the version by itself; releases are cut
  by hand (the fork Actions gate) until Actions is enabled in `bermudi/collie`'s Actions tab — and
  even then, `release.yml` is not carried, so the hand-cut procedure in this file stands.

## Constraints & Red Lines

- Tailnet-only. `tailscale serve` is the one front door Pup manages ([ADR 0001](./.adr/0001-one-managed-front-door.md)).
  Never `funnel`, never `0.0.0.0`. The dashboard is remote shell access — treat it like a root login.
- Single scroll container on the dashboard. The page (`html`/`body`/`#root`) is `overflow-hidden`;
  only the list's inner `overflow-y-auto` scrolls.
- Opencode sessions are pane-scoped ([ADR 0050](./.adr/0050-opencode-sessions-are-pane-scoped.md)) —
  don't enumerate `opencode.db` / `GET /api/session` into phantom agents.
- Major gate ([ADR 0020](./.adr/0020-a-major-upgrade-is-consented-by-flag.md)), menu digit ban
  ([ADR 0009](./.adr/0009-a-generic-menu-is-driven-by-the-keys-it-names.md)). Don't regress.
- Same-origin + CSP, React text nodes for pane output. Don't regress.

## Workflow

- Build: `bash scripts/collie-ctl.sh build` (typechecks both sides, atomic web swap) or `bun run build`
  at root. Frontend-only `cd web && bun run build` skips typechecks — don't ship from it.
- Backend change: `systemctl --user restart collie` (Bun doesn't hot-reload the service).
- Test: `cd web && bun run test` (Vitest) + `bun run test` at root (Bun runner for `bridge/` +
  `scripts/collie-ctl.test.sh`). Pre-push hook runs both.
- Doctor: `bash scripts/collie-ctl.sh doctor` — the one-command phone-setup check (host filter,
  VAPID, tailnet, Firefox DoH).

## Test-load policy (the laptop also runs the herd)

Full local suites strain the box the bridge and agents live on — vitest's default is one jsdom
worker per core. Rules:

- During a round: **targeted runs only** (`cd web && bun x vitest run <file>`), not the suite.
- Full web suite defaults are polite: `maxWorkers: 4` in `web/vitest.config.ts` + `nice -n 19`
  in the test script (~155s at a quarter of the cores instead of ~90s at full burn). Leave them.
- The real gate is CI: `.github/workflows/ci.yml` — upstream's full tier (version gate, lint,
  typecheck, both suites, Playwright e2e), running on GitHub's runners. It does nothing until
  Actions is enabled once in the fork's GitHub Actions tab (the known fork gate).
- The pre-push hook still runs both suites locally; with CI on, that's the remaining heavy moment.

## Quality bar for Pup

If it runs, it emits signals. No swallowed exceptions, no black-box external boundaries. Every fix
gets a test that would have caught it. Prefer deleting a subsystem to adding one, and keep the
fork's own diff thin enough to re-apply after any wholesale move (ADR 0053's consequence): a change
that could live upstream belongs upstream, as a PR.
