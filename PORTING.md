# PORTING.md — the porting ledger (HISTORICAL — superseded by ADR 0053)

> **This ledger describes the OLD strategy** (0.32→0.47): upstream commits cherry-picked onto Pup's
> own 0.x line and adapted one by one. Pup re-branch(ed) from upstream/main wholesale in 0.48.0 —
> see [`.adr/0053`](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)
> and [AGENTS.md](./AGENTS.md)'s merge workflow. What stays useful below is the per-subsystem map of
> upstream's tree and what Pup declines; the "how to port a commit" procedure is obsolete.

Porting ledger

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

### The second tap escapes a stuck update — upstream `bb095e3a` (v1.8.0)

**Status:** Ported (web side only).

**What it does.** The stuck guard behind "new build — tap to update" reloads from the ACTIVE
worker, so when activation is what is wedged, the reload lands on the very bundle the operator is
trying to leave and the next tap starts the identical cycle (upstream measured ~3 minutes of taps
on the release lane). The fix: the guard's reload leaves a `sessionStorage` note, spent on the next
`checkForUpdate` whatever it finds; if the page is STILL provably stale (`isStaleBuild` off the
bridge's own build header) and the bridge answered within 20 s (`subscribeServerBuild` freshness —
unregistering offline strands the PWA), that tap takes the escape: delete every CacheStorage cache
FIRST (no SW job needed; workbox falls through to network), start `unregister()` WITHOUT awaiting
it (it queues on the same per-scope job queue as the wedged update), reload. The escape sits above
the `!registration` check because `register()` queues behind the wedged job too.

**Pup differences from upstream.**
- Pup carries neither upstream's two-lane `ReloadLane`/`spent`/`navigating` machinery (an earlier
  upstream fix, M20/05, "a tap never swallowed by an auto-reload that didn't leave the page" —
  see Declined below) nor its i18n; the note's guard maps to Pup's single `reloaded` latch with
  the same "only when the timer is really about to reload" semantics.
- Upstream pinned the missing-registration ordering only in the Playwright suite; Pup's port adds
  a unit case (`pwa.test.ts`) so the lean port loses no coverage. The Playwright tier itself stays
  behind — Pup's gates are typecheck + Vitest + the ctl suite.
- `web/src/lib/pwa.test.ts` is NEW here (Pup had no pwa unit tests); 7 cases pin the cycle, the
  offline safety, the ordering, and the note's write/spend rules.

**Files.** `web/src/lib/pwa.ts`, `web/src/lib/pwa.test.ts` (new).

### Hermes transcript history — upstream `85e0da5e`, `33f54224`, `801f879a` (v1.8.0)

**Status:** Ported (final form).

**What it does.** Sixth journal adapter. Hermes keeps one SQLite SessionDB (`state.db`) at the top
of its root; the pane supplies the exact session id and the adapter resolves it in whichever root
holds it (`COLLIE_HERMES_ROOT`, default `~/.hermes`). Compressed parent sessions are walked with a
bounded recursive CTE (depth < 32) and ordered parents-first; rows are JSON lines clipped to the
existing `MAX_TRANSCRIPT_BYTES`. Read-only open, fixed filename confined via `containedRealpath`,
parameterized SQL only, `withDb` closes in `finally`.

**Pup differences from upstream (found in review, live-verified on this host).**
- Upstream's SELECT names four `messages` columns (`reasoning_content`, `active`, `compacted`,
  `display_kind`) that do not exist in the real SessionDB here (13-column schema, 2026-04 data) —
  and upstream's own fixture builds its table from the adapter's SELECT, so the drift is invisible
  to their tests too. Pup builds the SELECT from `pragma table_info` per database: both shapes
  read, and a schema that is neither fails LOUDLY out of `load` (a swallowed SqliteError used to
  read as "no history" forever). **Report this upstream.**
- `resolve` stays tolerant per root (an unreadable `sessions` table disqualifies the root, not the
  request); `stat`/`load` propagate query errors — the history route answers an error instead of an
  empty page. The read-only open is pinned by the stale-key test (resolve, database vanishes,
  stat → null and nothing recreated — verified by mutation to fail with the flag removed; the
  0444 and no-create cases ride on bun's silent downgrade and the containment pre-guard).
- `scripts/journal-probe.ts` learned the hermes branch (mirroring opencode's) — without it the
  mandated drift check could not see the sixth adapter, which is exactly how the schema bug
  shipped. Live probe result on this host: `hermes ✓ 2 turns` off the real `state.db`.
- Dropped upstream hunks for files Pup does not carry: `web/src/lib/journal-agents.ts` (the
  bridge is the single decision site — see the images round), `bridge/solo-baseline.test.ts`,
  `bridge/beacon-journal.test.ts`, `cli/doctor.test.ts`, `cli/history.test.ts`.
- `bridge/json.ts` is new beyond upstream's file list: the `JsonValue`/`JsonObject` boundary type
  hermes.ts needs to keep `JSON.parse` results honest without `any`.
- Tests are upstream's cases in Pup's journal idiom (real-SQLite fixtures per `opencode.test.ts`),
  plus a v6-schema fixture (the live-verified column set), drift-throws, and read-only pins.
- `.env.example` gains `COLLIE_HERMES_ROOT` (upstream never documented theirs).

**Files.** `bridge/journal/hermes.ts` (+test), `bridge/json.ts` (new), `bridge/journal/registry.ts`
(+test: six adapters, omp still an alias), `bridge/config.ts` (+test), `bridge/server.test.ts`,
`scripts/journal-probe.ts` (hermes branch), `.env.example`, `CLAUDE.md` (adapter list).

### The serve door says "can't tell", never "no HTTPS" — upstream `0062b91` (v1.6.0)

**Status:** Ported (adapted to the shell door).

**What it does.** Pup's `cmd_serve` pre-check conflated an unreadable `tailscale status --json`
(binary missing, logged out, parse failure) with a readable status whose `CertDomains` is empty —
both refused to publish with "no HTTPS". Now three answers: `yes` (publish), `no` (readable,
really no certs — the same refusal as before, admin-console remedy), `unreadable` (warn naming the
admin console in case the publish stops to wait anyway, and PUBLISH anyway — the hang this check
exists to prevent is the one outcome "can't tell" cannot rule out). `self_dnsname` gains the `||
true` its callers always assumed under `set -o pipefail`.

**Pup differences from upstream.** Upstream's fix lives in its TS cli; Pup's door is
`scripts/collie-ctl.sh`, so the three-state parse is a `bun -e` classifier over a captured status
string. `CertDomains: [""]` (only-empty-strings) still counts as present, as before — not visible
to real tailscale output; smallest diff. The host-allowlist readers (`self_hosts`, ~:350) keep
their deliberate fail-closed posture — see their comments; noted, not changed.

**Files.** `scripts/collie-ctl.sh`, `scripts/collie-ctl.test.sh` (new cases: unreadable → warn +
publish; readable-empty still refuses; the existing no-HTTPS case keeps covering refusal).

### A long strip reveals its active tab — upstream `8a774cc4` (v1.8.0+)

**Status:** Ported.

**What it does.** `useRevealActive(scrollerRef, activeKey)` scrolls the strip's
`[aria-current="true"]` chip to the nearest edge when the selection changes — never on a manual
scroll (the effect runs on mount/key change only), `auto` on first reveal and under reduced motion,
`smooth` on later changes, no-ops at `clientWidth === 0`. Pup's three strips (`tab`, `pane`,
`space`) are hidden-scrollbar `overflow-x-auto` rows, so the active chip could sit out of view
with no affordance — pick a pane on the dashboard, come back, wrong end of the strip.

**Pup differences from upstream.** Pup's strips already mark the active chip `aria-current`
(`Chip`, `PanePill`), so the hook's query works unchanged; each strip owns its scroller div
inline — no `LabelledStrip` wrapper (declined architecture), so that upstream hunk has no target.
PaneStrip calls the hook unconditionally before its `< 2` panes early return; SpaceStrip's
comment differs because Pup's drill-in still renders sibling chips. The hook carries one added
comment paragraph pinning the never-on-manual-scroll stance (Pup's single-scroll-container
discipline). Playground hunks dropped (no playground dir).

**Files.** `web/src/hooks/use-reveal-active.ts` (+test, new), `web/src/components/tab-strip.tsx`,
`pane-strip.tsx`, `space-strip.tsx` (+tests each: reveals on change, stays still when visible).

### The build stamp skips a known build — upstream `e3c7816e` (v1.8.0+)

**Status:** Ported (near-verbatim).

The mount effect checks `getServerBuild() !== undefined` BEFORE `fetchConfig()` — the dashboard
remounts on every pane→dashboard move, and a known build needs no second look. Pup's component
was the exact pre-fix code; two new MSW cases pin one-fetch-when-unseeded, zero-when-seeded.

**Files.** `web/src/components/build-stamp.tsx` (+test).

### Images in the mirror — upstream `fd28d018`, `fbae4cf6`, `8e8cf78a`, `ba8e19a0`, `797318d6` (v1.8.0)

**Status:** Ported, then **the mirror half was reverted** ([.adr/0041](./.adr/0052-the-mirror-does-not-guess-images.md)).
The cluster/card/badge machinery below only ever fired for harnesses that *print* Kitty unicode
placeholders (omp does, pi does not — pi's direct `a=T` placement leaves only blank rows in the
read). What survives: the journal half — History/transcript render exact image references — the
`/api/blobs/<hash>` route, and both sides' refusal of remote refs. What replaced the mirror half:
a run of ≥4 blank lines collapses to `[N blank lines]`.

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

**Files.** ~~`web/src/lib/mirror-images.ts`~~, ~~`web/src/hooks/use-mirror-images.ts`~~ (deleted with
the mirror half), `web/src/components/ansi-output.tsx` (blank-run collapse),
`web/src/components/agent-chat.tsx`, `web/src/components/transcript-view.tsx`
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

### Crew wire v2, warrants, crew rename — upstream 1.7.0/1.8.0 wave

**Status:** Declined — pack/HA, per ADR 0020 and the out-of-scope list. Noted here because the
rename (`bridge/pack/` → `bridge/crew/`, `X-Pack-*` → `X-Crew-*`, protocol v2) will make future
cherry-picks from shared files conflict more. Continue porting final designs, not interim
commits (the pattern the images round set).

### The swallowed-tap two-lane reload guard — upstream M20/05 (pre-image of `bb095e3a`)

**Status:** Declined this round, deferred. Upstream's pwa.ts carries a two-lane guard
(`ReloadLane`/`spent`/`navigating`) so a manual tap is never swallowed by an automatic reload
that already ran but did not actually leave the page (it gives the tap back after 3 s). Pup's
single `reloaded` latch predates it and the stuck-guard port above maps cleanly without it. The
bug it fixes is real but narrow (reload that fails to navigate); if a Pup update ever hangs on a
spent latch, port M20/05 next — this note is the trailhead.

### iPhone notch / strip-band header fixes — upstream `59c77fc3`, `1b3939cf`, `93a4ecc2`, `15bd0bbd`

**Status:** Declined — they patch the `notice.tsx`/`strip-host.tsx`/`update-ribbon` top-band
architecture Pup never adopted (upstream 13af1fe3/ff4bf255, declined with i18n). Pup's single
header shell already reserves `env(safe-area-inset-top)` (app-header.tsx) and its update banner
is its own (watching this fork's tags).

### Screen-slide transition, seven-column Keys tray, dev/playground icon rounds — upstream `d24a4d73`, `e12b4334`, `c7c4cc9e`/`9429bd61`, `ee3338a2`

**Status:** Declined — features and dev UX, not fixes; Pup is fix-first. The Keys tray redesign
in particular rewrites nav-tray into a shape Pup has no complaints about; the dev-icon rounds
ride on upstream's playground, which Pup does not carry.

### 1.7.0 update-run machinery — upstream `90fc363a`, `c7191904`

**Status:** Declined — upstream's staged update orchestration for pack runs and its runner
handoff; Pup's update path is its own (ADR 0006) and single-host. The genuinely phone-facing
hazard that wave produced is covered by the stuck-guard escape ported above.

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
