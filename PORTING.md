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

### Images in the mirror — upstream `fd28d018`, `fbae4cf6`, `8e8cf78a`, `ba8e19a0`, `797318d6` (v1.8.0)

**Status:** Ported (final design, not the interim commits).

**What it does.** A Kitty-protocol image is not in the rendered grid — the terminal painted the
pixels and left a rectangle of U+10EEEE placeholder cells, which is why the mirror used to show a
black box. The final upstream design keeps the poll path clean: `AnsiOutput` parses placeholder
clusters out of the mirror text and reports their count; the pane view (`useMirrorImages`) reads
ONE page of the existing history route when the count grows; images are matched to clusters BY
ORDER from the end (the Kitty diacritics encode an image id no journal maps to a blob — an
approximation the card admits in its caption); and a new `GET /api/blobs/<hash>` route serves the
content-addressed bytes (16 MiB cap, magic-byte sniffing, hash-as-ETag, immutable cache,
containment-checked). Journal image refs are only ever this bridge's blob path or inline
`data:image/` — http(s) is refused bridge-side (`resolveImageUrl`) AND web-side (`imageSrc`).

**Why it fits Pup.** The phone is exactly where a screenshot matters — the desktop terminal shows
it, the phone showed a black box.

**Pup differences from upstream.**
- No pack forwarding (`bridge/pack/forward.ts`, `?host=`): Pup's blob route serves its own disk
  directly, gated as a read like `history`.
- `session` instead of pack `Scope`; the session rides blob URLs as a query param (an `<img>` can
  carry a query, not a header).
- No i18n — the four new strings are inline English, same wording as upstream's `en` dictionary.
- No `cli/` and no `web/src/lib/journal-agents.ts`: Pup's bridge is the single decision site
  (`toPaneWire` consults the registry and strips the answer to `hasSession`), so the frontend
  mirror test was replaced by a note — there is no browser-side list to drift.
- `AGENT_ALIASES = { omp: "pi" }` in the registry (an alias, not a sixth adapter); pi's default
  journal roots cover both `~/.omp/agent/sessions` and `~/.pi/agent/sessions`.
- CSP needed no change — `img-src 'self' data:` already admits both shapes.

**Files.** `web/src/lib/mirror-images.ts` (+test), `web/src/hooks/use-mirror-images.ts` (+test),
`web/src/components/ansi-output.tsx` (clusters, cards, badges, offset fixes),
`web/src/components/agent-chat.tsx` (wiring + tests), `web/src/components/transcript-view.tsx`
(JournalImage), `web/src/lib/api.ts` (`imageSrc`), `web/src/lib/types.ts`,
`web/src/lib/transcript-search.ts`, `bridge/journal/pi.ts` (blob resolve/refuse, image parts),
`bridge/journal/types.ts`, `bridge/journal/registry.ts` (alias), `bridge/config.ts` (two pi roots),
`bridge/server.ts` (`BLOB_ROUTE`, `blobRoute`, sniffing) + tests, `.env.example`.

### omp pi-shaped composer + verified paste transport — upstream `47369fb4` (v1.8.0)

**Status:** Ported.

**What it does.** OMP 18.1.13's `composer.shape=pi` editor brackets its draft with two
same-coloured rules and a status footer BELOW the editor. A third omp scanner (`pi-shape.ts`)
recognises that shape for every chrome probe (draft, status, strip, prompt binding, composerReady),
with Korean/multiline draft extraction and ghost (unaccepted inline completion) exclusion. Alongside
it, `replyChunks` plans long replies as small transport pastes (≤512 UTF-16 units / 4 newlines,
grapheme-safe, never starting a chunk with `/ ~ .` which omp would space-separate) — because omp
collapses big pastes into opaque `📄 #N` chips that carry no content evidence.

**Why it fits Pup.** Keystroke fidelity is Pup's heart: before this, a pi-shaped omp pane could
not verify a send at all (the guard never saw its composer) and a long reply collapsed into a chip
the guard must refuse.

**Pup differences from upstream.**
- The grapheme walker is Pup's own `graphemes()` export from `lib/text-width.ts` (Pup has no
  `lib/env.ts`; upstream's helper was moved there in a lint round we don't carry).
- Guard error strings are Pup's plain English (upstream routes through its i18n `t()`).
- Multipart tail checks (`carriesReplyTail`, `draft !== previousDraft`) ported as-is, including the
  tightened final verification that a dropped-final-chunk cannot satisfy.
- `composerPrompt`'s pi region is bounded to its TRAILING rows (≤6000 chars): the bridge's
  `expected_prompt` cap is 8192, and an unbounded ~101-row region on a wide pane would fail-closed
  the submit of a long reply — the exact case the transport exists for. **Upstream carries the same
  latent bug** (found in Pup review, 0.43.1); report it upstream and drop the bound if they fix it
  there.

**Files.** `web/src/lib/harness/omp/pi-shape.ts` (new), `web/src/lib/harness/omp/reply-chunks.ts`
(new), `web/src/lib/harness/omp/index.ts`, `web/src/lib/harness/types.ts` (`replyChunks?` hook),
`web/src/lib/reply-action.ts` (multipart transport), `web/src/lib/text-width.ts` (`graphemes`
export), fixtures `web/src/fixtures/omp-pi-shape/*`, tests alongside each.

### Clipped-row link class — residue of upstream `4b995f8` (PR #168)

**Status:** Ported (one attribute).

Pup already carried PR #168's substance as `d406962b` (labelled-rule clipping + rule-run muting,
upstream `0104d27` + `d980f37`). This round adds the one hunk that port missed: `[&_a]:break-normal`
on the clipped-row span, which stops Firefox from letting the mirror's link style (`break-all`)
re-wrap a row the clip is holding to one visual line — a labelled rule carrying a URL is the live
 case (pi's `─ Working https://… ──`).

### Full latest reply in place of the clipped mirror rows — upstream `46d2fe6a` (v1.2.0)

**Status:** Ported.

**What it does.** An agent's TUI runs on the alternate screen, which keeps no scrollback, so a
reply longer than the pane is tall reaches the mirror with its opening gone. The pane view now reads
the newest turn from the agent's own journal and, when `locateReply` proves that turn IS the message
on screen and its start is missing, renders it in full IN PLACE OF the rows it covers
(`AnsiOutput.hideLeadingLines` → `dropLeadingLines`, render-only, after every grammar has run).
Everything below the reply is untouched. Collapsible per message; new `Full latest reply` pref
(default on) in the ⚙ View dock; find stands the card down while open.

**Why it fits Pup.** Pure viewer: the phone pane is exactly where a long clipped answer hurts most,
and the alternative was leaving the pane for the history route.

**Pup differences from upstream.**
- `useLatestReply` keys the pane address on `${session}:${paneId}` — Pup has no pack `Scope`/
  `paneScopeKey`; `fetchHistory` carries `session`.
- Strings are plain English (Pup carries no i18n dictionary); the STT composer test hunk is
  dropped with the subsystem.

**Files.** `web/src/lib/latest-reply.ts` (new) + test, `web/src/hooks/use-latest-reply.ts` (new) +
test, `web/src/components/latest-reply.tsx` (new), `web/src/lib/blocks.ts` (`dropLeadingLines`),
`web/src/components/ansi-output.tsx` (`hideLeadingLines`), `web/src/components/agent-chat.tsx`,
`web/src/components/composer.tsx`, `web/src/components/display-prefs.tsx`,
`web/src/hooks/use-display-prefs.ts` (`expandClippedReply`, storage key stays v4).

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

### Statusline strip scroll containment — upstream `7b77d7ce` (v1.2.0)

**Status:** Declined — the subsystem it patches does not exist in Pup.

Upstream's strip is a scrollport (`max-h-[18dvh] overflow-y-auto`) and the fix adds
`overscroll-contain` so an over-drag can't chain into the document and drag the composer away.
Pup's strip is a different design: bounded rows (`MAX_STATUS_LINES`), no scrollport at all, so the
hazard cannot manifest. Both halves of the containment posture are already in force here — the
mirror's message list has `overscroll-contain`, and Pup's own `html`/`body`/`#root` `overflow:
hidden` (the fork's original double-scroll fix) covers the root half stronger than upstream's
`overflow-hidden` on the layout div.

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
