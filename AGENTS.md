# AGENTS.md — Collie Pup

**Collie Pup is a stable fork of [`AltanS/collie`](https://github.com/AltanS/collie).** Pup is small, no pack — just the herd on your phone that scrolls. Upstream is heading to 1.0 with HA/pack and server-side ASR; Pup stays on the 0.x.x line fix-first: scrolling, missing agents, keystroke fidelity, push, Firefox — the phone you actually use.

Upstream repo: `AltanS/collie` · Fork: `bermudi/collie` · Plugin id stays `herdr.collie` (display name `Collie Pup`) so linked installs don't need a reinstall. `https://github.com/bermudi/collie` is the origin for this fork; `https://github.com/AltanS/collie` is `upstream` for porting.

**Read [`CLAUDE.md`](./CLAUDE.md) before changing anything.** It is the working agreement — versioning, build/run, data layer, Herdr socket grammar, journal containment, security posture. This file only explains what Pup is and what matters here; it does not restate CLAUDE.md.

## Decision records — read before you re-argue

[`.adr/`](./.adr/) holds the decisions that **close off an option someone will reasonably propose again**. If you're about to argue *why not* rather than *how*, check there first — if the answer isn't there and the decision is that shape, add one (see [`.adr/README.md`](./.adr/README.md)). Pup's gates live there: one managed front door (0001), no terminal emulator (0008), one major gate (0020), opencode pane-scoped (0021), generic menu digit ban (0009), etc. Don't restate an ADR's reasoning here; link to it.

## Project

Phone web UI for your Herdr herd over Tailscale. Bun bridge + Vite/React PWA. Single-user, tailnet-only. Pup's job is to be the boring, reliable viewer you open 20 times a day — not the place for distributed quorum or voice pipelines.

## Stack

Bun + TypeScript (bridge) · Vite + React + Tailwind v4 + shadcn (web) · Herdr Unix socket · Tailscale Serve as the one managed front door · `web-push` for notifications.

## Why this fork exists

Upstream `1.0-beta` adds pack/HA (lead/deputy, warrants, takeover) and a server-side speech-to-text seam. Both are real scope for the bridge: more state, more attack surface, and for most single-host tailnet users, no day-to-day win — the phone keyboard mic is already world-class. Pup tracks `0.x.x` stable: port upstream fixes that matter to the viewer, skip the subsystems that belong to the mesh or the OS. See [`.adr/0020`](./.adr/0020-a-major-upgrade-is-consented-by-flag.md) (major gate) and [`.adr/0021`](./.adr/0021-opencode-sessions-are-pane-scoped.md) (why we don't list all opencode sessions).

## What Pup does and doesn't do

**Do:** Fix the viewer. Agent catalog gaps (e.g. Devin `/` commands), key chords (`Shift+Tab` as `ESC [ Z`), scroll/viewport on Android/Firefox, push setup, doctor checks, QR/URL correctness. If it makes the list scroll, the keys land, or the notification arrives, it's Pup.

**Don't:** Add pack/HA, ASR via the bridge, or a second managed front door. If it needs a quorum, a warrant, or audio in the bridge, it lives upstream, not here. See `DEPLOYMENT.md` Variant E if you need another tunnel — Pup still publishes nothing when `COLLIE_SKIP_SERVE=1`.

## Constraints & Red Lines

- Tailnet-only. `tailscale serve` is the one front door Pup manages ([ADR 0001](./.adr/0001-one-managed-front-door.md)). Never `funnel`, never `0.0.0.0`. The dashboard is remote shell access — treat it like a root login.
- Single scroll container on the dashboard. The page (`html`/`body`/`#root`) is `overflow-hidden`; only the list's inner `overflow-y-auto` scrolls. That's what fixed the double-scroll/header-clip/white-gap in `w65_p1-mt68*`.
- Opencode sessions are pane-scoped ([ADR 0021](./.adr/0021-opencode-sessions-are-pane-scoped.md)) — don't enumerate `opencode.db` / `GET /api/session` into phantom agents.
- Major gate ([ADR 0020](./.adr/0020-a-major-upgrade-is-consented-by-flag.md)), menu digit ban ([ADR 0009](./.adr/0009-a-generic-menu-is-driven-by-the-keys-it-names.md)). Don't regress.
- Same-origin + CSP, React text nodes for pane output. Don't regress.

## Workflow

- Build: `bash scripts/collie-ctl.sh build` (typechecks both sides, atomic web swap) or `bun run build` at root. Frontend-only `cd web && bun run build` skips typechecks — don't ship from it.
- Backend change: `systemctl --user restart collie` (Bun doesn't hot-reload the service).
- Test: `cd web && bun run test` (Vitest) + `bun run test` at root (Bun runner for `bridge/` + `scripts/collie-ctl.test.sh`). Pre-push hook runs both.
- Doctor: `bash scripts/collie-ctl.sh doctor` — the one-command phone-setup check (host filter, VAPID, tailnet, Firefox DoH).
- Versioning: hook-enforced in `CLAUDE.md`. Fork PRs: bump nothing, `SKIP_VERSION_CHECK=1` if needed. Pup stays on `0.x.x`; routine `update` never crosses to `1.0` — `update --major` is opt-in (ADR 0020).
- **Fork Actions gate:** GitHub runs no workflows on this fork until enabled once in its Actions tab — tag pushes never created a Release (v0.35.2's didn't either). Until that's enabled, cut the release page by hand: extract the version's CHANGELOG section, append the workflow's `## Update` block, then `gh release create vX.Y.Z -R bermudi/collie --title "Collie vX.Y.Z" --notes-file …`.

## Quality bar for Pup

If it runs, it emits signals. No swallowed exceptions, no black-box external boundaries. Every fix gets a test that would have caught it (`viewport-frame.test.tsx`, `herdr-client.test.ts`, `collie-ctl.test.sh`). Keep it fix-first and small — prefer deleting a subsystem to adding one.
