# 9006: Pup is upstream plus Devin and the worktree nest

- **Status:** Accepted
- **Date:** 2026-10-14
- **Supersedes:** [9004](./9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)
- **Relates to:** [9005](./9005-the-herd-list-nests-a-worktree-under-the-workspace-showing-its-repo.md) (the worktree nest, now carried as a feature rather than a strip-era divergence)

## Context

ADR 9004's strip fork kept the viewer and stripped the pack (crew/pack, speech-to-text, the TS `cli/`,
agent beacons). The maintenance cost exceeded the value: each upstream merge required resolving
stays-deleted conflicts and running strip gates, and the real herd this fork serves is only
`pi + devin daily, opencode riding along sometimes`. The strip era ends on 2026-10-14.

## Decision

**Pup is upstream (AltanS/collie) plus exactly two features: the Devin journal adapter and the
worktree nesting of dashboard sections.** Everything else is exactly upstream: the `cli/`, crew, STT,
beacons, staged-update UI and omp all return. ADR 9004 is superseded and the strip machinery
(`scripts/check-strip.ts`, `strip-manifest.txt`, `scripts/i18n-align.ts`) is removed. ADR 9001 is
retired: upstream's journal is pane-scoped by design, so phantom-agent enumeration does not occur.

## Consequences

Future merges are plain `git merge upstream/main`, then tests and build. The only deliberate
divergences beyond the two features are the 0.x version line (ADR 0020) and the check-only update
monitor watching `bermudi/collie` tags.
