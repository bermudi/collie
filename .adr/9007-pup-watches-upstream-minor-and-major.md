# 9007: Pup watches upstream's minor and major, and says merge

- **Status:** Accepted
- **Date:** 2026-10-16
- **Relates to:** [9006](./9006-pup-is-upstream-plus-devin-and-worktree-nest.md) (the merge ritual this signal re-arms)

## Context

Pup tracks upstream (`AltanS/collie`) by wholesale `git merge upstream/main`, but nothing told the
operator when upstream had moved far enough to be worth merging — he found out by looking. Pup is
on 0.55.0 and last merged upstream 1.21.3; upstream 1.21.4 is churn, 1.22.x is signal, 2.x.x is
signal. Pup's own version is not part of the comparison.

The record must be a tracked file, not derived from git: installs in the field are detached
checkouts without the `upstream` remote and possibly without history, so merge-base derivation
fails exactly where the notification must work. A tracked file ships in every tarball.

## Decision

**Pup keeps a tracked `upstream-merged` file at the repo root holding one dotted strict semver —
the upstream release the last merge absorbed — and the update monitor fires an upstream signal when
upstream's newest strict tag moves its `(major, minor)` beyond the record.**

- Fire rule: newest strict upstream tag's `(major, minor)` strictly greater than the record's.
  Equal, lower, or patch-only never fires. Prereleases are invisible (`SEMVER_TAG`, unchanged).
- The own-channel check (`bermudi/collie` releases vs the running Pup version) keeps running; this
  adds a signal, it does not replace one. Staleness, restart-needed, staged-update, and run-state
  signals are untouched.
- The upstream push rides the existing digest etiquette — daily window, 09:00 host-local floor,
  `updates` pref off-switch, fold-not-drop — in the same `collie:update` push channel; no new
  channel, no new mechanism. After firing for 1.22.0, a 1.22.1 does not re-fire; 1.23.0 or 2.0.0
  does. The banner stays up until a merge re-arms it, regardless of the window.
- A missing or unparseable record is a loud log line and never a fire (fail-safe), with the rest of
  the banner unaffected.
- Copy names both versions (upstream's new one and the merged one) and presents the remedy as a
  merge on the operator's machine — never as tap-to-update. No auto-merge, no change to
  `collie update` or ADR 0020's major gate.
- New env seam `COLLIE_UPSTREAM_REPO`, default `AltanS/collie`, mirroring `COLLIE_UPDATE_REPO`.

## Merge ritual

`scripts/merge-upstream.sh` runs the ritual as one command: fetch, `git merge --no-ff --no-commit
upstream/main` (`--no-ff`, because a fast-forward would adopt upstream's 1.x files wholesale),
auto-resolve the version-line conflicts (the `pup-version` merge driver pins the
0.x line in the three version files; `merge=union` keeps both sides of `CHANGELOG.md`), `bun
scripts/record-upstream-merge.ts` (reads the version from `upstream/main`'s `herdr-plugin.toml`,
not the working tree's), then tests, build, and the merge commit — `upstream-merged` rides it. A
hand merge works too, but the record step is then the merger's to remember.

### Tag hygiene: a tag is not a release

A merge makes upstream's annotated tags reachable from Pup's `main`, and `git push --follow-tags`
flushes every one of them to `bermudi/collie`. On 2026-10-16 that put 130 upstream `v1.x` tags on
the fork: the own-channel check read raw tags, announced upstream 1.21.2 as "a new major" over the
running 0.56.1, and `collie update --major` would have detached the checkout onto upstream's own
commit — stock Collie with the Pup layer silently gone.

Two rules, both enforced:

- **Never `git push --follow-tags` on this repo.** Push `main` by name; push a Pup release tag
  explicitly (`git push origin v0.x.y`). The `pre-push` hook refuses a push that carries a tag
  outside the `v0.*` line (`PUSH_FOREIGN_TAGS=1` overrides once, for the day Pup's line moves).
- **The own channel counts releases, not tags.** The banner, `collie update` (checkout, staged,
  and binary paths), and `collie update --check` intersect the remote's tag list with the repo's
  GitHub `/releases` (`bridge/released-tags.ts`): a tag with no release behind it is invisible, so
  foreign tags that ever land again announce nothing and can never be selected as an update
  target. A releases list that cannot be read fails the check before any fetch — never filters
  silently to empty. Rehearsal mirrors (`COLLIE_UPDATE_MIRROR`) are fixture truth and unfiltered.

The upstream-merge signal is unaffected: it reads `AltanS/collie`'s own tags, where every tag is
honestly theirs, and asks only whether the newest strict tag's `(major, minor)` moved.

## Consequences

The only deliberate divergences beyond the two features are the 0.x version line (ADR 0020), the
check-only update monitor watching `bermudi/collie` tags, and this upstream merge signal watching
`AltanS/collie` tags against the tracked record. A merge that forgets the record leaves the banner
up; the next merge fixes it by writing the file.
