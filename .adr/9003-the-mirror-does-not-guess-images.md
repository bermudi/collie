# 0052 — The mirror does not reconstruct terminal images; blank image rows collapse

Status: **Accepted** (2026-09-12)

Supersedes the mirror half of the v1.8.0 images port (placeholder clusters → journal images in the
pane view). The journal half — exact image references in History/transcript, the `/api/blobs/<hash>`
route, and the refusals of [0040](./0040-a-journal-image-reference-is-never-a-remote-url.md) — is
untouched.

## Context

The removed feature matched Kitty *unicode placeholder* cells (U+10EEEE) in the pane read to journal
images by order. That match is only possible when the harness **prints** placeholder characters into
the text grid — which omp does and pi does not. Pi uses a direct Kitty placement (`a=T`): the
terminal paints pixels over rows it reserved as whitespace, and nothing image-shaped ever enters the
text grid. `pane.read` therefore hands the mirror blank lines; there is no cluster to detect, no card
to draw, and the phone showed the original symptom the feature was built to fix — a tall black box.

We asked whether Herdr could close the gap (the upstream question this ADR exists to answer once):
placement data *does* exist inside Herdr's terminal core, but the public read API does not expose it,
and the honest fix is an additive `graphics` array on `pane.read`, captured atomically with the text
snapshot — a Herdr change, not a Collie one. Synthesizing placeholder cells in the read path was the
other option and was rejected there: vendored-lib patch, viewport-only, and it changes what every
reader sees.

Two failure modes remained if the feature stayed:

- **pi panes**: dead code plus a black void — the detector never fires and the reserved rows render
  as a wall of empty lines.
- **omp panes**: a match that is *positional, not verified*. The placeholder's Kitty image id is not
  recorded in any journal, so "which picture" was always a guess the card had to caption. A guess
  that is right by accident in the common case is still a guess.

## Decision

**The mirror renders only what the pane read contains. It does not infer images.**

- No placeholder detection, no journal fetch driven by the mirror, no image cards, no `[Image]`
  badge. `useMirrorImages`/`mirror-images` are deleted, along with the `images`/`onImageClusterCount`
  props.
- A run of four or more **blank** lines — whitespace-only text with no painted background — collapses
  to one labelled row (`[N blank lines]`). That is what a pi image reservation looks like in the
  read, and collapsing it is what the phone needs: no black box, no false claim that a picture is
  there. Lines carrying a background fill are content (selections, status bands) and never collapse;
  short gaps are ordinary paragraph spacing and never collapse.
- History and the Full-reply card still render journal images exactly — a journal entry *names* its
  image, so no guessing is involved. ADR 0040's two allowed reference shapes stand unchanged.

## Consequences

- Pi panes show `[N blank lines]` where the desktop terminal shows a picture. Honest, compact, and
  stable; the picture itself is one tap away in History.
- OMP panes lose the in-mirror card. They gain the same honesty: a placeholder in the read renders
  as the character it is (or blank space in a collapsed run), and the real image is in History.
- The find/link coordinate space still walks every collapsed line — skipping them was the bug the
  image cards once had, and the collapse keeps the invariant by construction.
- **Revisit when:** Herdr exposes image placements on `pane.read` (grid rect + image id, atomic with
  the text). With ids in hand a mirror image is a lookup, not a guess, and this ADR's premise is
  gone. Until then, re-adding positional matching would need its own argument against this one.
