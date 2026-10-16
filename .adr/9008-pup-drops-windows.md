# 9008: Pup drops Windows

- **Status:** Accepted
- **Date:** 2026-10-16
- **Supersedes on the Pup:** [0075](./0075-windows-is-a-supported-host.md) (upstream's Windows
  support decision; it stands upstream)
- **Relates to:** [9006](./9006-pup-is-upstream-plus-devin-and-worktree-nest.md) (adds a fourth
  deliberate divergence to its list)

## Context

Upstream made Windows a supported host (ADR 0075): a `windows.yml` CI workflow, a
`payload-windows` release job, a Windows-zip asset gate in `release.yml`, a PowerShell installer,
and a `make win-rehearse` VM rehearsal before each tag.

On the Pup none of that machinery can do its job. There is no Windows VM on this host, so
`win-rehearse` cannot run. `windows.yml` failed on every push to `main` — a standing red run that
emailed a failure notification per push and per tag. The release gate then multiplied the noise:
a red `ci.yml` (for reasons unrelated to Windows) held the release, and the Windows job's own
failures rode along. Operator order on 2026-10-16: delete everything Windows.

## Decision

**The Pup ships Linux and macOS only.** Removed:

- `.github/workflows/windows.yml` — the workflow itself; nothing runs it again once this lands on
  `main`
- `release.yml`'s `payload-windows` job, its `needs` entry, the "Check for the Windows asset" step
  (`scripts/windows-asset.ts`), and the Windows block appended to the release notes
- `scripts/windows-asset.ts`, `scripts/windows-suites.ps1`, `scripts/build-windows-payload.ps1`,
  `scripts/install.ps1` and their tests
- `docs/windows.md` and every doc or README claim that Windows is a host Collie runs on
- the `platform: windows` labeler rule and the `win-rehearse` step in the release recipe

**Upstream's Windows code paths in `bridge/`, `cli/` and `web/` stay.** ADR 9006 makes Pup
upstream plus named divergences, and each merge is a plain `git merge upstream/main`. Excising the
win32 branches (~180 files) would conflict on every future merge and buys nothing: that code is
inert on Linux and macOS, and it produced none of the noise this ADR answers. Dormant upstream
code stays upstream's to maintain.

## Consequences

- The failure-notification spam stops at the source: no Windows workflow exists to fail, and no
  release job can be held by one.
- A release carries no `windows-x64` artifact. `collie update` on a Windows host answers the
  honest "no artifact for your platform" — the same answer any unlisted platform already got.
- Each upstream merge that touches the removed files lands as a delete/modify conflict; the
  resolution is always "keep them deleted" plus re-checking `release.yml`'s diff for resurrected
  Windows steps. `scripts/release-workflow.test.ts` pins the post-removal shape so a resurrection
  fails CI rather than shipping quietly.
- `windows-x64` stays in `scripts/refresh-packages.ts`'s `NOT_PACKAGED` so a manifest cut before
  this change can still be read.
