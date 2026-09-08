# Porting ledger

Collie Pup tracks the [upstream Collie](https://github.com/AltanS/collie) viewer line and selectively
ports viewer-facing improvements that fit Pup's single-user, tailnet-only shape. This file is the
durable record of what was ported, what was declined, and what was already present.

Pup intentionally stays on the upstream `0.x` line and does not adopt the upstream `1.x` pack/HA,
ASR, or other large subsystems. The categories below distinguish:

- **Ported** — implemented in Pup, with a regression test.
- **Already present** — the feature was already in the working tree; verified, not duplicated.
- **Declined** — the upstream feature was reviewed and intentionally not ported, with the reason.
- **Out of scope** — the feature belongs to a subsystem Pup does not carry and never will.

---

## Ported in this round

### Adaptive mirror polling — upstream `d2cb8a3` (v1.3.0)

**Status:** Ported.

**What it does.** Replaces the fixed two-position poll cadence (1.5s hot / 4s cold) with one
resolved from what the *operator* is doing, not what the herd is doing:

- `300ms` burst for a few polls after a send to the open pane.
- `1.5s` while following an open pane whose agent is working/blocked, or whose mirror moved.
- `4s` on the home screen while some agent is working.
- `6s` when nothing says anybody is watching.

**Why it fits Pup.** Pup is a phone viewer opened many times a day for short reads. The old cadence
was wrong in both directions: a key tap still waited up to 1.5s to land, while an idle pane nobody
was looking at was polled every 4s forever. The new cadence makes a tap read as immediate and lets a
quiet pane back off to 6s — the half of the trade that pays for the burst.

**Pup differences from upstream.**
- Pup's `usePolling(data, paneId)` takes no `scope` parameter (Pup has no pack/multi-scope), so the
  hook reads the poll-intent store directly. The `intervalFor` pure resolver is identical.
- Pup keeps its existing idle-lock / catch-up / supersede machinery; the upstream equivalents were
  already present in Pup and were preserved.
- Send stamps are placed in the same three paths upstream uses: composer Send, composer `pressKeys`
  (which funnels the Keys dock, direct typing, and prompt-button key sends), and the prompt-option
  handler in `agent-chat.tsx`.

**Files.** `web/src/lib/poll-intent.ts` (new), `web/src/lib/poll-intent.test.ts` (new),
`web/src/hooks/use-polling.ts`, `web/src/hooks/use-polling.test.ts`, `web/src/lib/loaders.ts`,
`web/src/components/agent-chat.tsx`, `web/src/components/composer.tsx`.

### omp π mark — upstream `17386ef` (v1.2.0)

**Status:** Ported.

**What it does.** Adds the [omp](https://omp.sh) (oh-my-pi) agent to the brand table, with its
official three-stop gradient mark (`#ED4ABF → #9B4DFF → #5AD8E6`) on a `#0F0A14` tile.

**Why it fits Pup.** Pup renders any harness Herdr exposes, and omp is one of them. An agent
without a brand tile falls back to a generic initials chip, which is wrong for a branded product.

**Pup differences from upstream.**
- Pup's brand table is a `Record`, not a `Map`, so `omp` is a plain object entry.
- Per-mounted SVG gradient IDs use React's `useId()`, sanitised for `url(#…)` references, because
  inline SVG IDs are document-scoped and a dashboard column of tiles would otherwise collide.

**Files.** `web/src/components/agent-icon-data.ts`, `web/src/components/agent-icon.tsx`,
`web/src/components/agent-icon.test.tsx`.

### Mirror default font 10px — upstream `4b005aa` (v1.2.0)

**Status:** Ported.

**What it does.** Lowers the fresh-install mirror font default from `12px` to `10px` for phone
readability. Existing devices with a saved preference are untouched — the localStorage key
`collie:display-prefs:v4` is unchanged.

**Why it fits Pup.** Pup is phone-first; 12px was a desktop carry-over that crowded the mirror.

**Files.** `web/src/hooks/use-display-prefs.ts`, `web/src/hooks/use-display-prefs.test.ts`.

---

## Declined in this round

### Rename tab/pane sheet keyboard-folding fix — upstream `93373ce` (v1.2.0)

**Status:** Declined — the subsystem it fixes is absent from Pup.

**What the upstream fix does.** The upstream `TabStrip` / `PaneStrip` auto-fold when a keyboard
opens (a 1.0.0 "zen-mode chrome" feature). The rename field's own keyboard tripped that fold,
unmounting the strip and destroying the rename sheet mid-typing. The fix adds a
`useComposerFocus()` latch so only the *composer's* keyboard folds the strips, not a rename
sheet's.

**Why it is declined.** Pup never adopted the strips-auto-fold-on-keyboard subsystem. Pup's
`TabStrip` / `PaneStrip` do not fold on `useKeyboardOpen`, so the bug the fix addresses — a
keyboard-driven fold unmounting the sheet — cannot manifest. There is no `composing` /
`keyboardFold` / `stripsFolded` state in Pup's `agent-chat.tsx` to apply the fix to. Porting it
would be a no-op.

If Pup ever adopts the fold-on-keyboard chrome, this fix should be ported alongside it as the
canonical solution (composer-focus latch, sheets stay inside their owning strips).

---

## Out of scope (not ported, by policy)

These upstream features belong to subsystems Pup does not carry. They are listed here so the
boundary is explicit and future porting rounds do not re-litigate them.

- **Pack / HA** — multi-bridge pack, scope routing, pack-aware polling. Pup is single-user,
  single-bridge, tailnet-only.
- **Server-side ASR** — voice / speech-to-text. Not part of Pup's viewer scope.
- **Additional managed front doors** — Funnel, a second Tailscale Serve, or any `0.0.0.0` binding.
  Pup uses one Tailscale Serve as its front door and does not add another.
- **i18n** — internationalisation framework. Pup is English-only.
- **Mux switching** — upstream's connection mux. Pup's single-bridge model does not need it.
- **Packaging / binary distribution** — upstream's release and packaging workflows.
- **Major upgrade path** — upstream `1.x` upgrade machinery.
- **Device pairing** — upstream's multi-device pairing flow.
- **Beacon hooks** — upstream's beacon/telemetry subsystem.
- **Full doctor / update subsystems** — upstream's self-doctor and update orchestration.
- **Typeface settings** — upstream's font family selection. Pup keeps the system font stack.
- **New icon / motion family** — upstream's broader icon and motion redesign beyond the per-agent
  brand tiles that *were* ported (omp above).
