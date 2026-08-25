# 0021 — Opencode sessions are pane-scoped, not server-scoped

Status: **Accepted** (2026-08-25)

## Context

Opencode (and opencode2) run a background server on `127.0.0.1:49374` backed by `~/.local/share/opencode/opencode.db` (`session` / `message` / `part`). The TUI is a thin client that shows *all* open sessions as tabs in one terminal pane (e.g. `w1:p1` on `throw-away` can flip between `ses_fc8d…` "ROM collection manager" and `ses_fc98…` "Hello world").

Collie's journal already reads that DB for history (`bridge/journal/opencode.ts` — read-only `bun:sqlite`, `ses_…` validated, `containedRealpath` on `COLLIE_OPENCODE_ROOT`). The temptation is to make the *live* herd do the same: poll `GET /api/session` on `49374` and list every `ses_…` in the DB as a Collie agent, even when its TUI isn't open anywhere.

That would make the TUI's tab bar redundant — Collie would show tabs as its own rows — but it breaks the Herdr model. Herdr's snapshot is pane-scoped: a Collie agent is a Herdr pane (`w1:p1`) with a `cwd` and a `terminal_title`. If we list unfocused server sessions, we invent agents with no pane to type into, no `pane_id` for `pane.send_keys`, and no `revision` for the race guard. We also reintroduce the 5.2 GB DB's OAuth rows into the live path.

The live pane `w1:p1` on `throw-away` proved the simpler road works: `herdr-tui-session.js` (integration `opencode-tui` v10) watches `api.route.current.name === "session"` in the TUI and reports `pane.report_agent_session { agent_session_id: "ses_…" }` over `HERDR_SOCKET_PATH`. When that pane is focused on a session, Collie has a real pane to strip (the `┃` / `╹▀▀` box, `0.35.1` fixes `1.18.22` and `beta` footers) and a real `ses_…` to read from the DB for history.

## Decision

**An opencode session is visible in Collie only when it is actually open and focused on a Herdr pane.**

- The TUI must be on a `session` route (`api.state.session.get(sessionID)` with no `parentID`) for that `sessionID` to be reported. No report, no Collie row.
- Collie never enumerates `opencode.db` or `GET /api/session` to invent agents.
- One Herdr pane = one opencode session at a time. Switching TUI tabs switches which `ses_…` Collie shows for that pane, not a new Collie agent.

## Consequences

- The herd stays small and honest: every row has a pane you can type into and a `revision` the guard can check. No phantom sessions with no PTY.
- History still comes from the DB, but only for the focused `ses_…` (the same key the pane reports). The live mirror is still `herdr pane read` with the `0.35.1` chrome strip, not a server transcript poll.
- A user who wants a session in Collie must `opencode` it in a Herdr pane and focus it. That's the intended workflow — Herdr is the window manager, not the opencode server.
- Revisit if Herdr gains a first-class "server session" kind with its own `pane_id`-like handle and a verified send path. Until then, the TUI focus gate is the whole contract.
