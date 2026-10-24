# 9010 — Pup absorbs upstream's strict releases, wherever upstream cuts them

- **Status:** Accepted
- **Date:** 2026-10-24
- **Relates to:** [9007](./9007-pup-watches-upstream-minor-and-major.md) — amends its merge
  ritual and its record's semantics; the fire rule itself stands unchanged.

## Context

ADR 9007's signal assumed that merging `upstream/main` means absorbing upstream's releases. It
does not. Upstream cuts strict releases from `release-1.x` branches and does not reliably merge
them back: on 2026-10-24, `v1.23.2` through `v1.23.4` — fourteen commits of surface fixes, docs
and release chores — were not ancestors of `upstream/main` at all. Meanwhile upstream keeps
`version` plain `X.Y.Z` in git even mid-edge-cycle (the edge suffix is stamped at build time), so
`record-upstream-merge.ts`, which read the merged tip's manifest, recorded `1.24.0` from two
October dev-tip merges — a version that did not exist as a release — while the tree was missing
three real ones.

The disarm was mechanical. The fire rule is "newest strict tag's (major, minor) strictly greater
than the record", prereleases invisible, equal never fires. With the record at (1,24): every
remaining 1.23.x is lower, and a stable 1.24.0, whenever cut, is *equal*. The signal built to say
"upstream has moved — merge" could not fire again until stable 1.25.0, precisely while Pup sat
behind upstream's newest release. FORK.md's own invariant — the record advances "only to a version
actually merged" — was false as written.

## Decision

- **The ritual merges the main line and absorbs the releases.** `scripts/merge-upstream.sh`
  merges `upstream/main` as before, then fetches upstream's newest strict `vX.Y.Z` tag and merges
  it too whenever the main line does not already contain it. Release branches are a first-class
  source of upstream truth, not churn. A sync may therefore land two merge commits; the sync log
  records both.
- **The record names a tag, proven by ancestry.** `upstream-merged` holds the newest upstream
  strict tag whose commit is an ancestor of `HEAD`. Ancestry of a real tag cannot lie; a manifest
  read can, and did. No release, no advance — a pure edge merge leaves the record where it was,
  which keeps the signal armed for the stable cut that will contain more than the tip held.
- **`UPSTREAM` keeps pinning the main line only.** A release-tag absorb leaves the `UPSTREAM`
  file alone; the sync log carries it.
- **A lower record is a correction, not drift.** The ritual is the record's only writer, so when
  it writes a smaller number than the file held (as on 2026-10-24: `1.24.0` → `1.23.4`), it is
  retiring a value the old semantics should never have written.

## Consequences

- The fire rule needs no change and no number patched: with an honest record at 1.23.4, a stable
  1.24.0 fires (1.24 > 1.23), and the 1.25 cycle behaves as 9007 designed.
- Merging a release branch after the main line can conflict where main refactored what the
  release patched — the same class of conflict as any merge, resolved by the ritual's mechanical
  passes and, rarely, a human. `rerere` absorbs the repeats.
- If upstream ever cuts stable straight from main again, the absorb step finds the tag contained
  and does nothing; the ritual degrades to exactly its 9007 shape.
