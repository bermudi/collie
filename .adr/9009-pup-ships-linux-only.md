# 9009: Pup ships Linux only

- **Status:** Accepted
- **Date:** 2026-10-16
- **Relates to:** [9006](./9006-pup-is-upstream-plus-devin-and-worktree-nest.md) (adds a fifth
  deliberate divergence to its list),
  [9008](./9008-pup-drops-windows.md) (same reasoning, smaller blast radius)

## Context

After 9008 the release still built two macOS payloads — `macos-arm64` on a `macos-14` runner and
`macos-x64` cross-compiled beside it — and they were the slowest rows in the matrix: about two
minutes each against forty-five seconds for either Linux row, so the whole `payload` phase waited
on Mac hardware the operator does not own. There are no Macs here: no host runs Collie on one, and
the operator order was "cut it — no Macs here".

## Decision

**The Pup's shipped surface is the two Linux payloads and nothing else.** Removed:

- `release.yml`'s `macos-arm64` and `macos-x64` matrix rows and every Darwin-specific step they
  carried (codesign handling, the x64 `lipo` check)
- `aarch64-darwin` from `flake.nix`'s `systems` and its pinned Bun `passthru.sources`
- `aarch64-darwin` from `packaging/nix/collie.nix`'s `platformKeys` and the `darwin-arm64` entry in
  `packaging/nix/sources.json`
- `darwin-arm64` from `scripts/refresh-packages.ts`'s `NIX_PLATFORMS`; `macos-arm64` and
  `macos-x64` join `windows-x64` in `NOT_PACKAGED` so a manifest cut before this change still reads
- `macos` from `herdr-plugin.toml`'s `platforms`
- every doc and README claim that macOS is a host Collie runs on

**Upstream's Darwin code paths in `cli/`, `bridge/` and `web/` stay**, for the same reason 9008
kept the win32 ones: launchd supervision, `/tmp` socket roots, `otool -L` reading in
`check-payload-links.sh` and `install.sh`'s `Darwin` mapping are inert on the shipped platform and
diverging from upstream there would conflict on every merge. `install.sh` on a Mac now resolves
`macos-*`, finds no artifact in the manifest, and answers the honest "no artifact for your
platform — build from source".

## Consequences

- The payload critical path drops to the slowest Linux row — about forty-five seconds instead of
  two minutes.
- Test time is unchanged: `ci.yml` already ran everything on `ubuntu-latest`; the macOS rows lived
  only in `release.yml`.
- Each upstream merge that touches the matrix lands as a "keep the rows deleted" conflict;
  `scripts/release-workflow.test.ts` pins the two-row shape so a resurrection fails CI rather than
  shipping quietly.
