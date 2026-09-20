# 0053 — Pup tracks upstream wholesale and strips the pack, not the viewer

Status: **Accepted** (2026-09-20)

## Context

Pup spent 0.32→0.47 as a selective port fork: upstream commits were cherry-picked onto the fork's
own 0.x line, adapted one by one (i18n stripped, the hosts module stripped, wire types re-mapped).
By 0.47 the cost curve had bent the wrong way: one file (`bridge/journal/claude.ts`) had drifted
168 lines behind upstream for no reason of ours — upstream had grown their prompt-cache feature
*through* it while we stood still — and upstream's fixes were increasingly entangled with
subsystems we had declined, so each port round paid adaptation again. Of 418 fork commits, 328 were
recognisably upstream's own work re-applied by hand.

The fork's own layer, measured, is thin: viewport/scroll fixes, Devin support, push setup, the
one-command doctor, the opencode adapter, keystroke fidelity bits, the 0.x version line, and the
charter docs. The viewer itself — harness detection, dashboard, composer, journals — is upstream's,
and upstream moves it faster than a port round can follow.

## Decision

**Pup re-branches from upstream/main wholesale** (first base: 1.11.0-rc.1) **and stays there as a
strip-fork, not a port-fork.** Future upstream work arrives by ordinary merges. The strip list —
what is removed at re-branch and again on every merge that touches it:

- **pack/crew/HA**: lead/deputy, warrants, takeover, the standby door, the crew wire protocol,
  peer listeners, beacons. A solo bridge is the only bridge.
- **speech-to-text**: the `bridge/stt` seam and the composer mic. The phone keyboard's own mic is
  world-class; audio in the bridge is upstream's scope, not Pup's.
- **cli/**: upstream's TypeScript CLI (serve/update/doctor/crew/config layer's CLI half). Pup's
  operating path is `scripts/collie-ctl.sh` (build/restart/update/doctor/serve) plus the fork's
  `herdr-plugin.toml` actions. The bridge's staged update runner dies with it: Pup updates by
  `collie-ctl.sh update` (git fetch of the fork's tags, ADR 0006) and the check-only
  `POST /api/update/check` banner (ADR 0020's major gate rides this path).
- **Agent beacons** (`bridge/beacon*`): the hook markers that let a blind multiplexer identify
  agent panes. The installer (`collie hooks install`) lives in the stripped cli/, so the markers
  could never be written; Herdr — Pup's only mux in practice — sees agents natively. tmux/zellij
  adapters stay and work; their panes read as shells without beacons.

Everything else upstream ships is **kept as-is**, including things earlier fork rounds had declined
by omission: the typed-dictionary i18n (removing it is the adaptation tax that made porting
expensive), the prompt-cache chip and cache watch, the e2e/Playwright tier and the oxlint gate
(both run on GitHub's runners, never the laptop), the mux seam, and multi-host plumbing (one host
today; the grouping degenerates gracefully).

The 0.x version line survives (ADR 0020): re-branching the code does not adopt upstream's 1.0;
`package.json`/manifest/CHANGELOG stay on Pup's own numbering.

## Consequences

- **The merge tax moves.** Port rounds (hours of adaptation, growing) become merges (cheap, since
  the viewer is shared verbatim) plus a recurring, mechanical cost: upstream commits touching the
  strip list arrive as conflicts that resolve to "stays deleted". Measured on the 1.11-rc window,
  roughly a third of upstream commits touch stripped subsystems — each is a one-line resolution,
  concentrated in files Pup never reads.
- **Attack surface stays small where it matters** — no crew routes, no second listener, no audio,
  no subprocess-spawning updater in the bridge — but the tree is bigger than 0.47's: i18n
  dictionaries, the cache subsystem (~6,400 lines), and the mux adapters are now carried. This is
  the price of not fighting upstream's viewer; it is paid in disk, not in attack surface (the
  additions are local computation and display).
- **Fork-only decisions keep their ADR numbers on Pup's side of the index** (0021→0050,
  0040→0051, 0041→0052 here) so upstream's own ADRs can arrive unrenumbered on every merge.
- **The Pup layer must stay thin and re-appliable**: viewport fixes, Devin, push setup, doctor,
  opencode adapter, keystroke fidelity, version line, charter docs. Every new fork-only change
  that could live upstream should be PR'd upstream first; the strip-fork model only works while
  the fork's own diff stays small enough to re-apply after the next wholesale move (there should
  not be a next one — this is the last wholesale move).
- Docs describing the removed subsystems (CREW_PROTOCOL.md, the crew/voice guides, the crew ADRs)
  go with the code; upstream docs that arrive by merge get the same treatment.

## What would justify revisiting it

Upstream making the viewer itself depend on the pack substrate (snapshot types that cannot
degenerate to one machine), or a Pup need to diverge the viewer faster than merges can carry —
either brings back the port-fork calculus. Absent that, this closes the question.
