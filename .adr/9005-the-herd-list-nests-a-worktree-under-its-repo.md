# 9005: The herd list nests a worktree under the workspace showing its repo

- **Status:** Accepted
- **Date:** 2026-10-12
- **Shipped in:** unreleased (post-0.51.0)
- **Relates to:** [ADR 0032](./0032-a-worktree-is-opened-by-the-multiplexer-not-by-git.md) (the
  multiplexer opens a worktree as a real workspace — the fact this decision renders),
  [ADR 9004](./9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md) (the
  strip-fork posture this divergence is measured against).
- **Trail:** the operator's own thread — "why do worktrees appear as complete workspaces on collie
  instead of being part of their workspace like in herdr?", then the challenge that prompted this
  record: "did you make it a *why did we fork*?" — argued for keeping upstream's flat herd list ·
  `web/src/lib/pane-groups.ts` (`GroupOptions.workspaces`, `parentKey`, the cluster sort) ·
  `web/src/lib/dash-view.ts` (`nestWorkspaceGroups`) · `web/src/components/agent-list.tsx` ·
  `web/src/routes/home.tsx`

## Context

In Herdr's model an opened worktree **is** a full workspace — `worktree.open`/`worktree.create`
makes a real one (ADR 0032) — and Herdr's sidebar draws the repo→checkout tree on top of that flat
list. Upstream collie carries the same relationship on the wire (`repoRoot`, `isWorktree` per
space) and already renders it in the Spaces navigator (`lib/spaces.ts` `nestWorktrees`), but the
herd list — the dashboard's main axis — stayed flat: `groupPanesByWorkspace` was never handed the
workspace records, so each worktree got its own top-level section.

The operator runs linked worktrees daily (`w8A`, `w8B` under `little-goblin`) and asked for the
herdr shape here too. The other road — leave the herd flat and wait for upstream to want this —
was argued on the spot, and it has merit: every line of this is divergence from upstream in files
they edit, and ADR 9004's whole posture is that Pup's own diff stays thin.

Two things decided for diverging anyway. First, the semantics are not a fork invention — they are
the mux's own model and upstream's own navigator rule, applied to the one axis that lacked them.
Second, the change can be shaped as an upstream PR rather than a fork habit: additive options on
upstream's own helpers, no Pup-only machinery in the path, so if upstream lands it the local diff
collapses into their code on the next merge.

## Decision

**A worktree's dashboard section nests inside the section showing its repo's own checkout** — the
herdr sidebar's tree, on the herd's axis — and the divergence is recorded as upstream-bound, not
fork-permanent.

- `groupPanesByWorkspace` takes the ambient machine's workspace records plus the ambient session's
  name; a group whose record marks it a linked worktree carries `parentKey` pointing at the group
  showing `isWorktree:false` for the same `repoRoot`, and the cluster takes the position of its
  earliest member — `nestWorktrees`' own rule, unchanged.
- The link is a fact about the list on screen, recomputed per call: a parent dropped by isolate,
  hide, needs-you or pins leaves its worktrees flat; isolating the repo keeps its worktrees
  (`isolateSpaces`' shape); a group tagged with another machine or session can never link — a
  missed nest degrades to flat, never to a wrong one.
- Each nested section stays a whole workspace — own heading, counts, "+" — set on a left rail
  inside the parent's section.

## Consequences

- Pup's diff grows by ~140 non-test lines in files upstream edits (`agent-list.tsx`'s render block
  most of all). Merge friction is real until upstream takes or replaces this — that cost is now
  on the record as accepted, which is what this file exists to say.
- An upstream PR is owed. It is deliberately a port, not a redesign: same files, same rule as
  `nestWorktrees`, tests included. If upstream declines, this ADR stands as the reason the fork
  carries it; if they land a different shape, Pup re-bases onto theirs and this file marks what
  to delete.
- Revisit if upstream nests by a different rule (e.g. by `folder` containment rather than
  `repoRoot` equality, or depth beyond one) — matching their rule beats keeping ours, per ADR
  9004's posture.
