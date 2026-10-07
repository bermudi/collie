# Changelog

All notable changes to Collie are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project uses
[Semantic Versioning](https://semver.org/). The newest `## [x.y.z]` heading **must** match the
`version` in `herdr-plugin.toml`, `package.json`, and `web/package.json` (enforced by
`scripts/check-version.sh`). See [`CLAUDE.md`](./CLAUDE.md) → *Versioning* for the bump policy.

## [Unreleased]
### Added
- **The upstream merge is tooling now.** `scripts/merge-upstream.sh` runs the ADR 9004 ritual
  start-to-finish (DU cleanup, policy sheet, then the whole verification battery at `--finish`);
  `scripts/check-strip.ts` + `strip-manifest.txt` fail loudly on strip leaks and on upstream files
  that vanished silently (the rename/delete casualty git never reports); `scripts/i18n-align.ts`
  aligns new locales to Pup's dictionary; `herdr-plugin.toml` and `README.md` now merge=ours. No
  bump: dev tooling, nothing the phone or bridge ships.
- **The ledger tracks devin — Pup's row.** Upstream's carries no entry for the harness this fork serves daily; the row pins devin's installed version (3000.11.3, no adapter — raw mirror, one-shot send) with the mirror layer's capture evidence, so `bun run harness:drift` flags when a devin update moves past what the phone was last checked against.

**Upstream main — 2026-10-07**
### Added

- **Paths the agent prints are links.** A file path in the chat, on an Edit, Write or Read card, or in
  the terminal mirror opens that file in Files, at the line when the path names one (`src/a.ts:42`).
  The phone resolves the path against the pane's repo; a path outside it stays plain text, and only a
  root-relative path ever reaches the bridge, and a path becomes a link only once the bridge has
  confirmed the file is there, one batched check per view (ADR 0088).
- **A second agent on a branch.** A pane's menu offers "New agent on a branch": the branch name is
  prefilled, pick one of your launchers or a shell, and Collie creates a git worktree and starts the
  session in it beside the first. Each create carries a request id and the bridge keeps a receipt, so
  a retry after a lost answer never makes two worktrees. Herdr only, on the lead (ADR 0089).
- **Collie speaks five more languages.** Русский, Italiano, Français, Português (Brazilian wording) and
  Türkçe join the language list in Settings → Appearance, so the interface has twelve. Russian reads
  every count in a form that fits both 2 to 4 and 5 or more.
- **A paired device can carry an expiry you chose.** The bridge honours a lifetime on the token the
  phone claims (upstream mints one with `collie pair --expires 30d`, also `h`, `w`; Pup carries the
  bridge half and the phone's handling of an expired token). Without one a token never expires,
  exactly as before, and no existing token changes. The Settings screen shows each expiry, and an
  expired token is refused as `device expired` so the phone offers **Pair again**. An expired device
  still keeps pairing on until you revoke it.
- **Known secret shapes are masked before pane text leaves the machine.** API keys with a
  known prefix, JWTs, PEM private keys, bearer tokens and `password=`-style values become `•` marks
  of the same width on the bridge, so the mirror, the Chat and History views and every push
  notification carry the mask, never the key. A mitigation, not a guarantee: plain passwords and
  bare hex are not matched. `COLLIE_REDACT=off` turns it off. Push bodies now name a pane by the
  label you gave it, never by the program's own title. File bodies in Files and diffs in Changes
  are masked the same way.
- **Stricter response headers, a private blob cache and a pair rate limit.** Every answer now
  carries a `Permissions-Policy` that denies camera, location, payment and USB and keeps the
  microphone for hands-free speech; the content policy adds `object-src 'none'` and
  `form-action 'self'`; HSTS is sent when the request arrived over HTTPS. Pane images under
  `/api/blobs` are no longer cached by the browser (they were public for a year). `/api/pair` refuses
  more than ten attempts per source address per minute with `429`.
- **Unpairing wipes what the pairing left on the phone.** One wipe routine clears the token, every
  draft, the saved pane text, the push subscription and the runtime caches when you unpair, when
  the bridge revokes or expires the device, and (for one pane only) when a password prompt shows.
  Settings and the app shell stay. Before it wipes, the phone confirms the refusal with one more
  call, and a wipe cut short resumes on the next open. Revoking a device now asks once more and
  says what is cleared, and the pair screen names the cause afterwards. "Clear saved copies now"
  in Settings → Device empties the store by hand.
- **The phone keeps session content in one store.** The last herd snapshot and the last pane text
  move from the tab's session storage into one IndexedDB database with a 24-hour lifetime, a
  256 KiB cap per pane and a 10 MiB cap in all, purged on open and deleted whole on unpair
  (ADR 0087). A cold open can read it back; nothing in it can trigger an action. Without IndexedDB
  the store falls back to memory for the session.
- **Read a session offline.** The phone keeps the newest Chat turns of each pane on the device
  (Settings → Device → "Keep chat on this phone": off, 1 day, 7 days; 1 day is the default) and
  reads them back when the bridge does not answer, under "Saved copy from {time}". A cold open with
  no bridge shows the saved herd, dimmed, with every status in the past tense and "as of {time}" in
  the header. The banner tells you whether the phone is offline or the bridge is unreachable. The
  raw terminal mirror is never kept as chat, and a password prompt drops that pane's saved turns.
  A failed poll never drops what is on screen: the view keeps its content, dims it and dates it.
  A poll waits at most 6 seconds, one second longer than the bridge waits for the multiplexer, so a
  phone whose VPN is up but whose radio is off learns within one poll that the bridge is gone. The
  banner then says either "You are offline" or "No connection to the bridge"; the phone cannot tell
  a dead internet from a dead Tailscale, so it no longer guesses.
- **Nothing saved on the phone can act.** While the last read of a pane failed, the phone is
  offline, or the screen is a saved copy, dialog options and the send button are disabled with
  "Reconnect to answer" and "Reconnect to send". Typing still works and the draft still saves.
  There is no queue, no retry and no send on reconnect.

### Changed

- **The connection strip floats under the header, and nothing moves for it.** The band that held
  the connection, auth and update strips painted above the header and pushed the whole page when a
  strip came or went. It is an overlay now, anchored to the header's bottom edge with a shadow: it
  covers the pane strip or the filter row while it shows, and the X uncovers it. The header owns the
  notch inset for good, the "as of" chip left it, and the brand column cannot be squeezed by the
  chips beside it. "Saved copy from …" left its own bar too: it is the first line of the transcript
  or the mirror, where "Start of the conversation" and "Load older" sit, and scrolls with the text.
- **The connection strip can be hidden, and the Collie mark shows the state after that.** The red
  strip keeps one button, Retry, and gets an X. Hidden, it stays hidden for the rest of that outage
  and comes back on the next one; recovery after a hide shows no green flash. While the connection is
  lost, the Collie mark in the header carries a small badge with the same icon as the strip, so the
  state stays visible with the strip gone.
- **The offline draft note floats above the belt and can be dismissed.** "The draft stays on this
  phone" used to open under the input field and push the field up. It now shows in the same floating
  card as the terminal-draft notice, one notice at a time, with an X, and moves nothing. It shows
  only on the first keystroke while offline that leaves text in the field, not on going offline.
- **The file screen in Changes: icons, a path row, and a clearer end of the list.** The Diff, Source
  and Preview switcher shows icons, each with its word as the title and the accessible name. A thin
  mono row under the name shows the path from the repo root and folds the middle folders to an
  ellipsis when the row is too narrow, the file name last to go. Previous and Next lose their border
  and go muted when there is nothing to step to.
- **Pairing is always on, and every request needs the token, reads included.** A bridge with no
  paired device answers `403 device not paired` to every `/api/*` route except `/api/health` and
  `/api/pair`, so run `collie pair` on the host first; `collie doctor` and the installers now say so.
  Reads (the herd, panes, history, chat, changes, files, images and fonts) need a valid pairing
  token like writes did; the crew path between bridges keeps its own trust. The gate sits in front of
  the router with a two-entry allowlist, and a corrupt pairing file answers 503, never "not paired". The worktree list route
  had no gate at all and now has one. This is a break for unpaired browsers on the tailnet and for
  scripted setups (ADR 0086). Unknown `/api/*` paths answer 403 then 404 instead of the app shell.
  Desktop browsers and scripts on the tailnet must pair once: run `collie pair` (or
  `collie pair --expires 30d` for a script), and the script claims the code with a label such as
  `script`; the token comes back once, in the pair answer. A CLI on the host (`doctor`, `history`,
  the crew update sweep) reads its own bridge with a local credential the bridge writes to the state
  directory, so nothing changes there.
- **Rolling back below 1.18.0 ignores token expiries.** An older bridge does not know the
  `expiresAt` field, so an expired device works again until the bridge is updated; revoke it instead
  if that matters.
- **A file in Files gets the screen.** On a phone the All files | Changes control and the two-row
  file bar held the top 227 px of 844 before the first line of the file, and stayed pinned while
  you read. While a file is open the control leaves, and the file's name, size and Source | Preview
  control share one 44 px row, so the file starts 122 px higher.

### Fixed

- **Herdr 0.9.3 hid every repository from Collie.** The workspace row no longer carries the repo, so
  the New worktree tab listed nothing and the Files view lost the workspace folder. The bridge now
  asks Herdr's worktree list once per workspace and caches it (ADR 0032 addendum).
- **Six older translations had lost a placeholder.** "Show in {mux}" had become "Show in the
  terminal" in German, Spanish, Japanese, Korean and both Chinese files, and the Korean status label
  kept an em dash. A parity test now checks every translation against English for keys,
  placeholders and em dashes.
- **A pane opened while offline no longer reads as gone.** A pane address carries no dashboard
  scope, so with the bridge away the herd for that address was empty and the pane looked closed:
  "(agent gone)", "Pane is gone". "Gone" now needs a live answer. Offline, the pane's row comes
  from any herd the phone kept for that machine, and a pane with no saved text says "No saved copy
  of this pane on this phone." with Send off.

- **Typed characters never reach the audit log.** Type mode sends one key per character, and the
  audit trail listed `keys` as a parameter, so a password typed on the phone landed in `audit.log`
  character by character, even with `COLLIE_AUDIT_CONTENT=none`. Typed characters, spaces and tabs
  are now a body: redacted under `none`, a count of `•` marks under the default preview. Named keys
  such as Enter and Ctrl+C stay readable. Audit files written before 1.18.0 may still hold typed
  characters; rotate or delete them.

**Upstream 1.17.2 — 2026-10-06**
### Fixed

- **The question shows once on a prompt card.** In the Terminal view, a Codex, Grok, opencode, omp or Antigravity card whose rows the card already shows no longer prints the question twice, above the card and on it. A fade now shows at the bottom of the card's command or diff while more of it continues below.
- **The slash-command list is read again on Claude Code 2.1.291.** That version marks the selected command with a pointer and indents the list differently, so the list stayed on the raw terminal view, and with a long list open the phone could not send at all. Collie now reads both layouts, and the composer stays sendable while the list is open.
- **The effort card shows only real levels on Claude Code 2.1.291.** That build replaced the `ultracode` level with a toggle beside the `/effort` slider, and the card listed the words of its `Tab to toggle` hint as three more levels. The `/tasks`, `/resume` and rewind panels on Claude Code 2.1.291 are now checked against captures of that build, and read as before.
- **A multi-line draft no longer reads as a plan dialog.** On Claude Code 2.1.291 a multi-line draft printed a `ctrl+g` hint that Collie read as a plan dialog, so the phone showed the unread-dialog card and a send stalled. The plan family is now claimed only when the plan dialog's own words are on screen. A draft that quotes a plan dialog is never read as one. The plan dialog at 40 columns, whose question, hint and plan path wrap onto extra rows, now lifts with the same buttons as at 82 columns.

**Upstream 1.17.1 — 2026-10-06**

### Fixed

- **Permission cards show what the agent asks for.** The card now shows the dialog's header, the command or diff, any warning, and the question above the buttons. A permission raised by a subagent used to show only Yes and No in the Chat view, because the card left the rest in the terminal rows above it, which are off screen. A long command or diff scrolls inside the card, so the buttons stay in reach. Every other question card shows its question as text too.

**Upstream 1.17.0 — 2026-10-06**

### Added

- **The dashboard can order by Activity or Cache.** On the Dashboard tab, a clock and an hourglass beside the status line order the dashboard by the pane where something last happened, or by the cache that goes cold first. Either one folds the workspace groups into one list, with pinned panes first and each row naming its workspace. It is the same per-device setting as the switcher and Settings → Appearance, Place stays the default, and the order is read once and held, so a poll never moves a row. Tapping the selected choice, or coming back to the page, reads it again.
- **The Quick dock offers "drastically simplify".** It is the last phrase of the common group for every agent pane, and a long phrase now wraps inside its button instead of running past it. A `quick-replies.toml` that already addresses a pane replaces the shipped list, so add the phrase to your own file to keep it there.
- **Files shows the files of the workspace's folder with the changes marked, and Markdown, JSON and HTML files open as a Preview.** The screen that was Changes is now called Files and opens on the folder it reads, one folder at a time. A changed file shows its status letter and an icon in the same colour, a new untracked file counts as changed, a folder shows a dot and how many changed files are inside it, and a deleted file stays in its folder, struck through, with a D. An **All files | Changes** control under the header chooses the body: Changes carries the number of changed files in a small badge and shows the list of changes as before, headed by the count of changed files and its `+added −removed` totals; the choice stays on the device, and it is All files at first. The list's List and Tree choice is now one Tree button, so the header keeps room for the workspace's name. A changed file opens on its Diff, with Source and Preview one tap away, and a new file shows as all added. A file opens as numbered, coloured source. A Markdown file previews as text, a JSON file as a tree that folds, and an HTML file in a sandboxed frame that runs no scripts and loads nothing remote. Links in a Markdown file work: a relative link opens that file or folder, a `#heading` link scrolls to the heading, a web link opens in a new tab, and a link that leaves the folder reads as plain text. A changed file of those types has a Preview button in its diff header, which opens the same file screen on Preview. Back goes up one level, from a file to its folder and from a folder to the one above. A folder or a file is read when it opens or on refresh, never on a timer, and an older crew member answers "Update this machine to browse files". When the folder cannot be shown, for an unpaired device or a workspace in the home folder, Files offers **Show changes**. On the bridge, `GET /api/pane/:id/files` and `GET /api/workspace/:id/files` list one folder (`?dir=`) or read one text file (`?path=`) under the same folder the Changes view reads, and nowhere else. A path that leads out of it, also through a symlink, a `.git` folder, Collie's own state and config folders, and any file named like a Collie state secret (`paired-devices.json`, `crew-trust.json` and the rest) are refused with one answer. It needs an authorised device, like a write, caps a folder at 2000 entries and a file at 1 MiB, and works on a crew member running 1.17.0 or later (ADR 0083). The tree hides what git ignores, such as `node_modules` and build output, with a quiet "{count} ignored hidden" line and a Show action, which turns into "{count} ignored shown" and a Hide action once they are shown (the Filter row has the same choice, as an "Ignored hidden" or "Ignored shown" toggle); a Filter button in the header holds the name field, and an ignored file still opens. The device check is on only when a device is paired or `COLLIE_DEVICE_HEADER` is set. Until then, every device that can read panes can browse and read files under that folder, `.env` files included. Credential files under it are readable too: a workspace opened in `~/.claude`, `~/.codex`, `~/.config/gh` or `~/.ssh` shows what is there, and a hard link to a file outside the folder is not caught.
- **Machines show every machine's load and disks for a day and hold its alert rules.** Each Collie reads its own CPU, memory, load and network on the tick it already runs, about every 15 to 25 seconds, and the lead every 5 seconds while a phone has its machines open, so every minute has a reading and a sample costs well under a millisecond. Once a minute it also reads how full the disks that hold the home folder, the root (the system drive on Windows) and Collie's state folder are, with numbers that match `df`, in the background so a hung network mount never holds it up; a read-only system image such as the Fedora Atomic root, and any filesystem under 1 GiB, is left out. A crew member sends its last reading with the answer the lead already asks for, and the lead keeps one point per minute for 24 hours. A Collie with no crew keeps the same day for its own machine. Settings, Machines lists each machine's CPU, memory, fullest disk, network and load now, with the lead first, and a small chart of CPU and memory over the last 30 minutes. The dashboard's Crew tab shows the same cards, read every 15 seconds while it is on screen, and back from a machine returns to it. A machine's page has two views. Status shows the numbers, a bar for each disk, and charts of CPU, memory, the fullest disk and network over the last hour or the last 24 hours, with a gap wherever minutes are missing. Alerts (`?tab=alerts`) sets a CPU, memory or disk alert: a threshold of 80, 90 or 95 percent held for 5 to 60 minutes, and the lead sends one push when a value stays above the line. A firing alert is named in words on its card, and that line opens the Alerts view, whose switch shows a dot while a rule fires; switching views adds no step, so Back leaves the machine. A machine that is not answering shows the age of its last reading, one that answers but has sent no new reading for two minutes shows its numbers greyed with that age, and a member on an older Collie says it needs an update. A machine's page reads the day once and then only the newest minutes, once a minute, and nothing Machines-related is read for a page or tab that is not on screen. The lead keeps a day of one machine in about 68 KB of memory and writes it at most every five minutes, only when it changed. Settings, Alerts, "Machine load stays high" turns every machine rule off at once, and it is on by default, and a machine alert opens the machine's Status view on the phone. An alert reports sustained high load only, not a machine that goes offline. Network on Linux counts the physical interfaces only, so traffic through a bridge, a container or a tunnel is counted once. The pages need the lead of a crew or a collie on its own. A deputy that takes over starts with no history and no rules, and a collie on its own that becomes a lead drops the history it kept for itself. Nothing leaves the crew. See `docs/crew.md`, *Machines*.
- **Collie can drive the Tern multiplexer.** Set `COLLIE_MUX=tern` to watch and answer agents in Tern (`so.stencil.tern`, probed on 0.4.5) from the phone. A Tern session is a space, a tab is a tab and a block is a pane. Collie reads the screen with its colours and its scrollback, types text and keys, moves the focus, and creates, renames and closes tabs. Agents are found through the beacon hooks. Tern is experimental and `collie start` does not detect it, so name it. Details: `docs/multiplexers.md`. Thanks @Codder13 (#356)

### Changed

- **The Changes list's List and Tree choice is one Tree button.** It sits in the header beside Filter, pressed while the list draws as a folder tree, and the list shows only when the Changes segment under the header is on. One square less leaves the workspace's name readable on a 375 px phone.
- **The dashboard's tabs are Crew, Dashboard and Files.** The first tab is now called Dashboard. With a crew the footer reads Crew, Dashboard, Files, so the default sits in the middle, and a Collie on its own reads Dashboard, Files. The third tab, which was Changes, is Files now, with the tree glyph, and still lists each workspace's changes; the stored tab choice is unchanged, and the icon-only button on the pane's Chat belt that opens the same screen is named Files. Focus is no longer a tab: it is the circle-dot switch in the summary line, beside the order toggle, and it filters the Dashboard list the way Focus did. A device that had Focus selected opens the Dashboard with the switch on. Crew is a new tab that appears left of Dashboard only while you run a crew, and a device that stored it keeps the choice if the crew goes away. The red count of blocked panes now sits on the Dashboard tab.
- **Chat is the default view of an agent pane.** An agent pane opens as the agent's own conversation on every device, and the Chat switch under Settings → Experiments is gone. A new agent pane shows Chat from its first frame, even before Codex reports its session or pi writes its log, with one quiet line that says how to begin. It falls back to the terminal only when something happens that Chat cannot show: the agent asks a question, or its first turn ends with nothing to read. As a last resort it also falls back when a pane works for a minute with nothing to read and sends no event at all. The bridge polls faster for a few beats after you type or start an agent, so the conversation shows up without waiting for the next idle poll. The pane's ⋮ menu has **Terminal view** one tap away, and a device that already chose the terminal keeps it. Hermes can still lose a turn from its own log, and the docs under "Chat view" say so. This brings forward the flip that 1.15.0 planned for 2.0.
- **The pane name opens Pane settings, and the workspace line opens the space.** The header's single tap target is now two, one per line, each as wide as the block. Pane settings gains a **Rename** row that opens the same rename view as the ⋮ menu.
- **The dashboard follows an Activity or Cache order you already chose.** A device that picked Activity or Cache order in the pane switcher before 1.17.0 now sees the dashboard in that order too. Choose Place in Settings → Appearance to get the workspace groups back.

### Fixed

- **The dashboard summary is one row: words while there is room, else dots and numbers.** With one or two states the first reads "● 2 needs you"; with three or more every state is a dot and a number, so all five fit a phone beside the sort controls. It never wraps or grows taller, fades at its right edge for huge numbers, and the button still names every count in words.
- **An opencode draft and dialog read correctly with a sidebar open beside the pane.** A sidebar row that shares a row with the composer or a dialog is now skipped, so the Draft card shows what you typed, the reply guard can verify the send, and a question card is not lost behind the sidebar's box glyphs. Thanks @AndiWandHerd (#352). ([fedbe6dc](https://github.com/AltanS/collie/commit/fedbe6dc))
- **A tabbed opencode question lifts with a sidebar row under the free-text row.** With the Models sidebar open, a sidebar row under "Type your own answer" made Collie read the input as open, so a multi-select question or one with several tabs showed no card. That row is now ignored while the pointer is on a real option, and committed text that shares its row with the sidebar still reads as committed. An open input still shows no card. Thanks @AndiWandHerd (#347).
- **An iOS home-screen launch fills the screen to the bottom edge.** Every screen now takes its height from one `--app-h` token, which reads the full height in a home-screen launch on iOS, so the tab bar and composer no longer float over a dead band above the home indicator. Thanks @broven (#355). ([3007f8e2](https://github.com/AltanS/collie/commit/3007f8e2))
- **On macOS, `collie start` and `collie restart` start the launchd job and check that it runs.** Before, they printed "bridge started" as soon as launchd loaded the job, even when no process came up, and `collie status` then said "loaded, not running" with an empty log. Collie now runs `launchctl kickstart` on the job after it loads it, reads the job back for up to two seconds, and prints "bridge started" only when launchd reports a pid. If none shows, it warns that the job is loaded but not running and prints `launchctl kickstart gui/<uid>/herdr.collie` and the log path. The exit code stays 0, as on systemd, and the status banner shows the state. This has not been tried on macOS 26 yet. Thanks @babhishek21 (#213). Reported by @PhillipChaffee (#213).
- **The agent-start animation and the switch to Chat are one sequence.** When a shell turned into an agent, the animation ran on its own clock while the pane swapped from the terminal to Chat whenever the first answer arrived, so the swap showed beside it. The swap now happens under the animation, once it covers the pane, and the animation lifts when its own short dwell ends. It waits for no session and no first answer, and it has no cap, because a new agent pane draws Chat at once. A tap on it still ends it at once.
- **The global cache warning switch now stays on.** Settings, Alerts, "Cache about to go cold" showed the switch move and then fall back, because the bridge dropped that key from the request and kept the old value. Panes watched one by one were not affected.
- **tmux listings read the same with no UTF-8 locale.** Collie now starts every tmux command as a UTF-8 client with `-u`. Before, a bridge started with no UTF-8 locale, in a minimal container or a systemd unit, got `_` where tmux prints its field separator, so every listing parsed to zero rows and the phone showed the multiplexer as disconnected. It also keeps a non-ASCII session or window name intact. Thanks @WynandVStaden (#360). Reported by @cyxou (#358).
- **The red connection bar no longer blames Herdr for an unreachable crew member.** Viewing a member, the bar asked the lead whether it was up, and when the lead answered it said "Herdr is down on the host" even though the fault was the member. Now that sentence shows only for a solo install or the lead, and a member view says "{name} is unreachable" or that it runs an incompatible Collie when the lead's roster says so, and "Can't reach Collie" otherwise. Thanks @toRolex (#361). Reported by @cyxou (#357).
- **A Claude mode badge no longer shows as the session name.** On an unnamed session, Claude draws a mode badge such as `ultracode` in the rule above the `❯` prompt, where a `/rename` name sits, and Collie took it for the name and kept it. The bridge now reads that rule with its colours, takes the words as a name only when they share the rule's colour or sit on a chip of it, and drops a cached name when the input box shows none. A multiplexer that hands over no colour still reads the badge as a name. Thanks @GGGODLIN (#363).

**Upstream 1.16.2 — 2026-10-04**

### Fixed

- **The pane row scrolls sideways on an iPhone.** With more panes in a tab than fit the screen, the row did not move under a thumb on iOS Safari, so the panes past the edge could not be reached from it. The tab row was not affected. Thanks @enieuwy (#350). ([cbc94647](https://github.com/AltanS/collie/commit/cbc94647))
- **An overlay row under the free-text row no longer hides the opencode question card.** When opencode drew a foreign row under the closed "Type your own answer" row, Collie read it as an open input and showed no card. The row is now ignored unless the pointer is on the free-text row. Thanks @AndiWandHerd (#348). ([418e978f](https://github.com/AltanS/collie/commit/418e978f))
- **A long reply or voice note reaches Claude whole.** A reply over 800 characters now goes to a Claude pane as one bracketed paste. Before, Claude kept only its last 1 KB or so and Collie submitted that. Text inside the reply cannot end the paste early, and an image marker in the box is accepted only for a picture Collie attached. Thanks @wwilson1017 (#349). ([b9efb5c9](https://github.com/AltanS/collie/commit/b9efb5c9))
- **Claude Code's "Switch model?" question gets its two buttons.** After the model picker, Claude Code 2.1.286 and later asks "Switch model?" when the conversation is cached. Collie could not read that screen and offered only Esc, which cancels the switch. The card now shows "Yes, switch" and "No, go back". A tap moves the pointer, checks it, then sends Enter, and never a digit. ([3e7d1f78](https://github.com/AltanS/collie/commit/3e7d1f78))
- **A card button works on the first tap after an arrow tap.** After "Move up" or "Move down" on a card, the card could keep the old highlight for up to six seconds, and the next button answered "The screen changed". Each key Collie sends now starts the fast refresh, and the card waits for the new picture, for 1.2 seconds at most, before it takes the next tap. ([2a64ebad](https://github.com/AltanS/collie/commit/2a64ebad))

**Upstream 1.16.1 — 2026-10-03**

### Changed

- **Release pages and the changelog no longer repeat the upgrade path from 0.x.** The steps stay in `docs/upgrading.md` under "Upgrading from 0.x to 1.0". ([8b1f4faf](https://github.com/AltanS/collie/commit/8b1f4faf))
- **The Windows note on a release page names the installer and the setup guide.** It said "There is no installer yet", which has been false since `install.ps1`. It now gives the `irm https://colliepwa.dev/install.ps1 | iex` command and links `docs/windows.md`, and the README inside the zip says the same. ([8b1f4faf](https://github.com/AltanS/collie/commit/8b1f4faf))

### Fixed

- **On Windows (experimental): `collie doctor` and `collie crew status` no longer suggest `collie crew invite`.** With no crew, both ended on "`collie crew invite` here makes it a lead; `collie join …` makes it a peer", and both verbs refuse on Windows. They now say "A Windows machine cannot join or lead a crew in this release." Linux and macOS print what they printed before. ([c9322daa](https://github.com/AltanS/collie/commit/c9322daa))
- **On Windows (experimental): `collie doctor` no longer tells you to run `collie serve`.** Collie publishes no front door on Windows, so the `front-door` remedies sent you to a command that does nothing useful there. They now give the Tailscale command to run by hand, `tailscale serve --bg --set-path=/ <port>`, with a reminder to pair a device right away, and point to `docs/windows.md`. A mapping you made by hand that points at Collie now passes the `front-door` check instead of warning. Linux and macOS print what they printed before. ([ebc5f304](https://github.com/AltanS/collie/commit/ebc5f304))
- **On Windows (experimental): `collie doctor` passes a front door published over HTTP on a Headscale tailnet.** Headscale issues no HTTPS certificates, so the Windows guide publishes with `tailscale serve --bg --http=80 --set-path=/ <port>`. The `front-door` check kept the warning "this tailnet has no HTTPS certificates" after that. It now looks for a mapping made by hand that points at Collie, on port 80 too, before it asks about certificates. Linux and macOS print what they printed before. ([1418ba02](https://github.com/AltanS/collie/commit/1418ba02))
- **Windows commands find PowerShell again when PowerShell 7 is installed.** The tool lookup now skips a directory that carries the tool's name. On Windows 11 with PowerShell 7, `System32\PowerShell` is a directory, and it came before the real `powershell.exe` on PATH. It was picked as the program, so `collie status`, `doctor`, `start`, `restart`, `stop`, `uninstall` and the update check all failed. Thanks @ronanflannery (#344). ([a86d8b91](https://github.com/AltanS/collie/commit/a86d8b91))
- **The Finished alert no longer misses a turn that ends as idle.** Herdr 0.9 can report a finished turn as idle instead of done, and tmux and zellij always do, so the push did not fire there. A working agent that goes idle now counts as finished, on this machine and for crew peers. Answering a prompt does not count. An agent you interrupt also goes idle and pushes too. Finished is off by default, in Settings → Alerts. Thanks @homieyangg (#345). ([a01c22e6](https://github.com/AltanS/collie/commit/a01c22e6))
- **OMP panes with the `claude` or `borderless` composer shape accept a send.** Collie found no input box in these two shapes, so every send asked "Type anyway?". Both are now recognised, and a draft left in the terminal reads back. Captured on OMP 18.4.10. Thanks @nhl4000 (#343). ([1897d3cc](https://github.com/AltanS/collie/commit/1897d3cc))

**Upstream 1.16.0 — 2026-10-03**

### Added

- **Oh My Pi's `/resume` picker is a list of sessions on the phone.** Tap a session and Collie
  moves the pointer to it and presses Enter, in the boxed picker of omp 18.4 and the unboxed one
  before it. On a very large pane the picker stays terminal text with an Escape button. Every other
  Oh My Pi dialog that names its way out, such as `/model`, `/settings`, an Ask question or a tool
  approval, now shows a button for that key. `/tree` names none, so it keeps no button. ([d83f3281](https://github.com/AltanS/collie/commit/d83f3281))
- **`collie doctor` checks Oh My Pi's Herdr hook.** An `omp` pane that reported no session had no
  line of its own in `agent-sessions`, so its missing Chat and History went unexplained. The doctor
  now names the pane and the `integration-omp` line, which says to run
  `herdr integration install omp` and restart the agent. ([13eaf692](https://github.com/AltanS/collie/commit/13eaf692))
- **Oh My Pi's Ask questions with one answer are buttons on the phone.** Tap an answer and Collie
  moves the pointer to it and presses Enter, so the agent gets the answer at once. `Other (type your
  own)` opens omp's answer box, and the phone's composer types into it. A question where you pick
  several answers, several questions in one call, options with descriptions, or a long list still
  show the terminal text with an Escape button. ([3c5dbab6](https://github.com/AltanS/collie/commit/3c5dbab6))
- **Oh My Pi's `bash` and `write` approvals are buttons on the phone.** The card names the tool and
  shows the whole command, or the path and all of the file's content, on the Approve button. Approve,
  Deny and Cancel each take one tap, and Deny can never land on Approve, even if the pointer moves at
  the desk. Approvals for other tools, a third choice, a countdown, text omp itself cut short, a file
  of more than thirty rows, hidden or direction-changing characters, or a screen that is not omp
  18.4.10 or 18.1.17 still show the terminal text with an Escape button, which denies. ([0f50426b](https://github.com/AltanS/collie/commit/0f50426b))
- **`collie start`, `stop`, `restart`, `status` and `uninstall` supervise the bridge on Windows through Task Scheduler.** (experimental) `start` registers the task `herdr.collie` at your logon with a limited token and runs a launcher Collie owns, which relaunches a bridge that exits with an error. `status` names the task and its state, `restart` restarts the bridge alone, and an install of the community script is taken over under the same task name. The first supervisor was written by @JJLiebig in contrib/windows, and the restart path by @mqmalagris (PR 309). ([17d29445](https://github.com/AltanS/collie/commit/17d29445))
- **`collie status` and `collie doctor` say whose Task Scheduler task runs on Windows.** Status names Collie's launcher or the old script's loop, `doctor` gains a `windows-task` line, and a task that still points at the deleted script is reported as `Task herdr.collie still runs the old script. Run: collie restart`. `start` refuses a task that runs another install and prints `Registered Task Scheduler job herdr.collie (starts at logon)`. ([8cd2487d](https://github.com/AltanS/collie/commit/8cd2487d))
- **Oh My Pi's model picker is a list of models on the phone.** With omp 18.4.10, `/switch` and Alt+P
  open omp's session-only model picker. The card lists the rows the picker shows right now, not the
  whole catalog. Tap a model and Collie moves the pointer to it and presses Enter, which switches this
  session's model and leaves your role models and config as they are. The current model is named on
  the card but cannot be tapped. To reach a model that is not listed, type a search through Keys or
  Type mode, and the card updates after about a second. A row omp cut short and a model the
  conversation no longer fits (picking it compacts first) are left out. The `@` quick roles, the
  task-model picker, narrow panes and the Nerd Font symbols stay terminal text with an Escape button. ([ddcb2759](https://github.com/AltanS/collie/commit/ddcb2759))
- **Voice input can run a transcription command already on your machine.** The new `local-cli` provider runs a command such as `whisper-cli` or `muesli-cli` once per recording, with the recording's path as its last argument, and takes the transcript from its stdout. Set it up with `collie stt setup --provider local-cli --command <path> --args <list>`, and check it with `collie stt test`. Collie runs it without a shell, as the bridge's user, and kills it after 60 seconds. The phone never sees its command line or its error output. Thanks @SubodhDahal (#227). ([64c65416](https://github.com/AltanS/collie/commit/64c65416))
- **The `local-cli` provider cleans up after the command it runs.** On Linux and macOS the command starts in its own process group, and Collie kills the whole group with SIGKILL at the 60-second limit, at the 256 KiB stdout cap, and after a clean exit, so a process the command started cannot outlive it. At most two dictations run the command at once, and a third gets the busy answer without starting anything. `collie stt setup` and `collie stt status` refuse a command that is not a regular, executable file and say why. Temp folders left by a bridge that was killed are removed at the next start once they are an hour old (#227). ([1622bbf4](https://github.com/AltanS/collie/commit/1622bbf4))
- **Collie can check the Cloudflare Access token itself.** Set `COLLIE_ACCESS_TEAM` and
  `COLLIE_ACCESS_AUD`, and every request through the tunnel must carry a `Cf-Access-Jwt-Assertion`
  that Cloudflare signed for this application. A deleted Access app, a bypass rule or a policy that
  has not propagated yet then shows the panes to nobody. Half a setting, or keys Collie could not
  fetch, refuse every tunnel request. Unset, nothing changes. Thanks @xbach (#341). ([072e6abc](https://github.com/AltanS/collie/commit/072e6abc))
- **With the Access gate on, only a process on the machine itself skips the token.** A request
  that carries a forwarding header (`X-Forwarded-For`, `Forwarded`, `X-Real-Ip` and the like) needs
  the token too, so `tailscale serve` beside the tunnel stops serving browsers. `COLLIE_ACCESS_TEAM`
  must name a `<team>.cloudflareaccess.com` team, so the key fetch cannot be pointed at another host.
  The fetch gives up after 5 seconds, reads at most 64 KiB and follows no redirect. A bad setting or a
  failed first fetch prints one line in the bridge log that names the cause.
  The app's manifest is fetched with the Access cookie, so the phone can install it behind Access. ([5addcf57](https://github.com/AltanS/collie/commit/5addcf57))
- **Muse panes have History and Chat.** Collie reads Muse's own `session.jsonl` log, finds the newest
  session whose workspace is the pane's folder, and needs no Herdr hook, so a Muse pane no longer
  answers "no transcript". `collie doctor` reports the hook line as green for that reason.
  Thanks @jpcarranza94 (#333). ([49af69b6](https://github.com/AltanS/collie/commit/49af69b6))
- **Each release now tries to build an experimental Windows zip (unsigned `collie.exe`).** `install.ps1` installs it, and `docs/windows.md` says how. Linux and macOS releases are unchanged. If the Windows build fails, the release still ships without it until one release has carried the zip, or until 2026-11-15. After that, and whenever GitHub's list of releases does not answer, a failed Windows build stops the release. ([c1da6cf0](https://github.com/AltanS/collie/commit/c1da6cf0))
- **`install.ps1` installs Collie on Windows without a toolchain.** (experimental; it is not on colliepwa.dev yet, so download it from the repository and run it as a file, as `docs/windows.md` shows) `scripts/install.ps1` needs no Bun, Git or bash, and works in Windows PowerShell 5.1. It downloads a release's Windows zip, checks its sha256 and stops on a mismatch or a missing `.sha256`, lays it into `%LOCALAPPDATA%\collie\versions\<version>`, points the `current` junction at it, and adds `current\bin` to your user PATH. It never asks for admin and never starts Collie: it runs the new `collie.exe version` once to check that Windows lets it run, then prints the next steps. A second run changes nothing and points at `collie update`. `COLLIE_DIR`, `COLLIE_UPDATE_REPO` and `COLLIE_TAG` steer it, as they steer `install.sh`. ([57ce888e](https://github.com/AltanS/collie/commit/57ce888e))
- **`collie uninstall` on a Windows binary install prints how to remove the rest.** (experimental) It keeps the install folder and the user PATH entry, as every install keeps its files, and now ends with the two PowerShell lines that remove them: `rmdir /s` for the folder and a registry edit that drops only `current\bin` from your PATH. Linux and macOS print what they printed before. ([55e0f29e](https://github.com/AltanS/collie/commit/55e0f29e))
- **Windows 11 x64 with Herdr is a supported host, and it is still experimental.** A release carries the Windows zip when its Windows build succeeds, and `install.ps1` installs it. Until the Windows build is a required part of the release, a release may ship without it. Then `install.ps1` and `collie update` say so and install nothing. Linux and macOS behave exactly as before. A Windows workflow tests every push, but phone access needs a front door you set up yourself and has not been tested on Windows. `docs/windows.md` says what is covered, what is not (tmux, zellij, Windows on ARM, a Windows machine in a crew) and that `collie.exe` is unsigned. Thanks @JJLiebig for the first Windows supervisor and @mqmalagris (#309) for the restart and update path. ([4186abdf](https://github.com/AltanS/collie/commit/4186abdf))

### Changed

- **A tap on a dialog card can bind a larger screen region.** The bridge accepted at most 8 KiB of the
  screen a card drew when it checked a tap, which a full-screen picker on a pane wider than about 134
  columns exceeds. The limit is now 32 KiB. A phone newer than its bridge still gets the old refusal on
  such a pane and no key is sent, so update the lead and its crew together. ([13a30db8](https://github.com/AltanS/collie/commit/13a30db8))
- **Groundwork for Windows support.** The code that picks path rules or a binary name now reads one host object. Nothing changes on Linux or macOS. ([e9644cf4](https://github.com/AltanS/collie/commit/e9644cf4))
- **The community Windows script in `contrib/windows` is gone, and Collie runs the task itself.** Every verb of `collie-ctl.ps1` is a `collie` verb of the same name: `update`, `build`, `version`, `logs`, `url`, `start`, `stop`, `restart`, `status` and `uninstall`. `COLLIE_TASK_NAME` is gone (the task is always `herdr.collie`), and so is the script's crash-log rotation: the bridge log is `collie.log` in the plugin config folder (`%APPDATA%\herdr\plugins\config\herdr.collie\collie.log` by default), appended to and never rotated. One Collie per Windows machine is supported: `start` refuses a task that runs another install, and warns when a second instance registers its own. Run `collie restart` once after updating (and `collie build` before it if the script's own `update` pulled this version). Until then `collie status` and `collie doctor` say `Task herdr.collie still runs the old script. Run: collie restart`. ([9c7650ad](https://github.com/AltanS/collie/commit/9c7650ad))
- **The Spaces section follows the workspace you isolate.** Tap a workspace chip on the dashboard and
  the Spaces list shows that space and the worktrees of its repo. Tap All and every space is back.
  Thanks @dantebarba (#338). ([7a9532cd](https://github.com/AltanS/collie/commit/7a9532cd))
- **On Windows (experimental): `collie crew invite`, `crew join` and `crew add` refuse at once.** A Windows machine cannot join a crew or take in a member in this release. The three verbs, and the old `collie join`, say so in one sentence, exit with an error and change nothing. `crew status` and `crew leave` still work, so crew state copied from another machine can be read and dropped. ([e1e3a833](https://github.com/AltanS/collie/commit/e1e3a833))
- **On Windows (experimental): the crew verbs that join, lead or change a crew refuse at once.** A Windows machine cannot join, lead or change a crew in this release. `collie crew invite`, `crew join` (and the old `collie join`), `crew add`, `crew deputy`, `crew approve-promote` and `collie promote` say so in one sentence that points at docs/windows.md, exit with an error and change nothing. `crew status` and `crew leave` still work, so crew state copied from another machine can be read and dropped. ([c03a408a](https://github.com/AltanS/collie/commit/c03a408a))

### Fixed

- **Windows no longer prints a false `.env` mode warning, and `collie doctor` checks Herdr's version there.** NTFS has no mode bits, so the line saying `.env` was tightened to 600 was untrue on every command. Collie now reads the file's access list instead (see the owner-only line below). `doctor` warns when Herdr on Windows is older than 0.9.3, the build Collie was checked with. ([9d6a695a](https://github.com/AltanS/collie/commit/9d6a695a))
- **On Windows (experimental): the phone's Update button works.** It used to answer `412 no systemd user unit`, because the update's check looked for a systemd unit; it now asks Task Scheduler for the `herdr.collie` task. `collie doctor` no longer fails a Windows machine that has no Python, which also kept the button off. A source checkout is not updated on Windows: `collie update` and the button say so in one sentence and change nothing. ([a073e9fd](https://github.com/AltanS/collie/commit/a073e9fd))
- **On Windows (experimental): `collie restart` says what it found and stops waiting after 30 seconds.** It says whether the bridge was running, gone, or whether the process list did not answer. It used to wait about 3 minutes for a bridge that did not come back, so a broken update took 221 seconds to roll back; now about 75. A launcher killed by hand comes back within 5 minutes. ([a073e9fd](https://github.com/AltanS/collie/commit/a073e9fd))
- **On Windows (experimental): an old version folder that is still in use no longer fails the next update.** The update prints a note, and a later update removes the folder once nothing uses it. ([a073e9fd](https://github.com/AltanS/collie/commit/a073e9fd))
- **On Windows (experimental): Collie keeps its secret files and folders private to your account, SYSTEM and Administrators.** It repairs loose permissions at start, only in its own folders. `collie doctor` checks this (`secrets-private`). The false `.env mode 666` warning is gone. Linux and macOS are unchanged. ([38bc979b](https://github.com/AltanS/collie/commit/38bc979b))
- **A phone reply reaches omp's `ask` answer box.** Picking `Other (type your own)` or adding a note
  opens a box Collie did not recognise, so Send refused with "input box isn't on screen". Send now
  types, checks and submits there. A multi-line message is refused on that box, because a newline
  submits it. Thanks @enieuwy (#336). ([7d964012](https://github.com/AltanS/collie/commit/7d964012))
- **A refused multi-line reply says when part of it was already typed.** On an input that submits on
  a newline, a long message sent in several parts could be refused after the first part landed, and
  the notice still said nothing was typed. It now says the earlier part is in the pane. Thanks
  @enieuwy (#336). ([ada4908c](https://github.com/AltanS/collie/commit/ada4908c))
- **A tapped row is confirmed only after the pointer is seen on it.** A tap on a pointed list now sends the arrow keys first, reads the screen again, and sends Enter only when the pointer stands on the tapped row, bound to that very screen. A keystroke at the terminal in between, or a row that changed under the pointer, refuses the tap instead of confirming the wrong row. This covers every harness with a pointed list: Claude Code, Codex, Oh My Pi and opencode, whose permission buttons are a row and walk sideways. A resume list whose ages tick while the arrows go out still commits. A conformance guard now requires every such grammar to prove, on two real captures with the pointer on different rows, that a moved pointer is still the same dialog. ([ddcb2759](https://github.com/AltanS/collie/commit/ddcb2759))
- **The model picker's Close button says when it clears a search instead.** With a search typed, Oh My Pi's Escape clears the search and keeps the picker open, so the button now reads "Clear search" and only reads "Close" when a tap closes the picker. ([ddcb2759](https://github.com/AltanS/collie/commit/ddcb2759))
- **A tap on an opencode permission chip is bound to the highlighted chip.** The bridge now also checks the colours of the dialog it is about to answer, because opencode marks the chosen chip only by a background colour. A keystroke at the terminal that moved the highlight refuses the tap instead of confirming another chip. A refused tap also writes the reason to the browser console. ([cbd355a7](https://github.com/AltanS/collie/commit/cbd355a7))
- **Sidebar edges and shared-row borders no longer leak into an opencode draft.** With a sidebar open over the composer, a row holding only the sidebar's `│` edge now reads as blank, and a panel's closing border on the same row as your words is cut off, so the Draft card shows what you typed and the reply guard verifies the send. A pasted box row such as `╭─ title ─╮`, a typed rule and a pasted tree keep their glyphs. Thanks @AndiWandHerd (#340, fixes #337). ([54bc0c1f](https://github.com/AltanS/collie/commit/54bc0c1f))
- **The Escape button on a dialog Collie cannot read now needs a second tap.** The first tap only arms it, and it disarms by itself after four seconds. On an opencode question dialog the button reads "Tap again to dismiss", because Escape there ends the whole question turn. One stray tap no longer does that. Thanks @AndiWandHerd (#339). ([433722ba](https://github.com/AltanS/collie/commit/433722ba))
- **On Windows (experimental): ending the task by hand no longer starts a second launcher.** Ending `herdr.collie` in Task Scheduler stops only its console window, so the launcher and the bridge kept running, and five minutes later the task started a second launcher. `collie restart` and `collie update` then acted on the second one while the first bridge kept the port, and an update could roll back for nothing. Each launcher now holds a named pipe for its life, and a second one exits when the first is a live Collie launcher of the same install. If anything else holds that pipe, the launcher writes one line in the log and runs anyway. ([a318c5d2](https://github.com/AltanS/collie/commit/a318c5d2))
- **On Windows (experimental): `collie stop` no longer says "bridge stopped" when it could not look.** When PowerShell did not answer about the running processes, `stop` took that as "nothing is running", deleted its record of the launcher and the bridge, and printed `bridge stopped` over a bridge that was still running. It now keeps the record, says the process table could not be read, and fails, so you can run it again. ([60a33b2c](https://github.com/AltanS/collie/commit/60a33b2c))
- **On Windows (experimental): Collie never changes the permissions of a `.env` or `config.toml` that is a link or a hard link.** The repair at start checked only the folder, so a second name for a file kept somewhere else would have carried Collie's new permissions to that file too. Such a file is now left as it is, its secrets are not loaded, and the warning gives the command to fix it yourself. ([12364f92](https://github.com/AltanS/collie/commit/12364f92))
- **On Windows (experimental): updating again to a version you rolled back from no longer stops with an error.** The launcher keeps running from the version it started with, so that version's folder stays in use after a rollback, and the next update to the same version died when it tried to move the folder aside. If the folder is complete and holds the same build as the download, the update now uses it as it is and says so in a note. Otherwise the update stops, changes nothing, and says to run `collie stop` and `collie start` first. ([eab47316](https://github.com/AltanS/collie/commit/eab47316))
- **On Windows (experimental): `install.ps1` with `COLLIE_TAG` over an install says to restart, not to start.** A pinned run that downloaded a version printed "Nothing is running yet" and `collie start`, though Collie may already run; it now prints `collie restart`, as the run that finds the version on disk already did. A `collie.exe version` check that hangs is now stopped together with every process below it, so it can no longer hold the new version's folder open. ([bfe89162](https://github.com/AltanS/collie/commit/bfe89162))
- **On Windows (experimental): `collie restart` fails in plain words when Windows does not let it stop the bridge.** A bridge that runs as another account or as administrator cannot be stopped from a normal terminal, and the kill failed without a word. The old bridge then answered the wait for the new one, so the restart reported success while nothing restarted. It now looks again a second after the kill and, when the bridge is still there, says so and fails. ([3c914094](https://github.com/AltanS/collie/commit/3c914094))
- **On Windows (experimental): Collie judges a custom state or config folder by what is really in it.** A folder counted as Collie's own, and so had its permissions repaired, when it held files such as `.env.production` or `audit.log.x`, or a `fonts` or `uploads` folder of your own things. Now only Collie's own file names and temporary files count, and a `fonts`, `uploads`, `beacons` or `acl-backups` folder counts only when it holds Collie's kind of file. A link or a junction never counts. ([c7de435b](https://github.com/AltanS/collie/commit/c7de435b))
- **On Windows (experimental): the `icacls` lines Collie prints work in PowerShell for a path with `$` or a backtick.** Inside double quotes PowerShell reads `$name` as a variable, so a pasted fix or restore line could act on the wrong path. Such a path is now printed in single quotes. ([2044068a](https://github.com/AltanS/collie/commit/2044068a))
- **On Windows (experimental): `collie start` refuses a path with a `%` in it.** Task Scheduler reads `%NAME%` in a task as an environment variable and has no way to write a literal `%`, so a task for a folder such as `C:\pct%TEMP%dir` ran another path, or did not start at all. `start` now says which path holds the `%`, writes no task, and asks you to move Collie and its config folder. ([b29df4ad](https://github.com/AltanS/collie/commit/b29df4ad))
- **On Windows (experimental): `collie stop` checks that the bridge really stopped.** Windows can refuse to end a program that runs as another account or as administrator, and `stop` used to report success anyway. It now looks again after a moment, names each Collie program still running, keeps its record, and says to close it in Task Manager and run the same command again. `restart` and `uninstall` name themselves in that last step. ([eb17d9eb](https://github.com/AltanS/collie/commit/eb17d9eb))
- **On Windows (experimental): `collie start` waits until Collie answers.** It used to print `bridge started` as soon as Task Scheduler took the job, even when no bridge came up. It now waits, as `collie restart` does, and fails with the steps to take when nothing answers. ([a318c5d2](https://github.com/AltanS/collie/commit/a318c5d2))
- **The update check and `install.ps1` read every page of release tags.** GitHub lists 100 tags a page and the repository has about 92, so the next releases would soon have landed on a second page that nothing read, and a new release could go unseen. The release picked today does not change. ([3553dbeb](https://github.com/AltanS/collie/commit/3553dbeb))
- **On Windows (experimental): the `local-cli` voice provider ends the command's whole process tree.** At the 60-second limit, at the stdout cap and after a clean exit, Collie runs `taskkill /T` and then ends any process the command left behind, so an engine started by a wrapper no longer outlives it. Before, only the command itself was killed. A process started by a helper that has already exited can still outlive it. ([2b1a8473](https://github.com/AltanS/collie/commit/2b1a8473))

**Upstream 1.15.3 — 2026-10-02**

### Fixed

- **A folder on Windows no longer reads as "no folder".** The Changes view only accepted a path that
  started with `/`, so every Windows folder was refused. It now reads a path the way the host does, and
  the install check, the link check and the update smoke test find `collie.exe` instead of a bare
  `collie`. On macOS a folder reached through `/tmp` or `/var` now maps to its repo. ([f70595f8](https://github.com/AltanS/collie/commit/f70595f8), [20d1e6d5](https://github.com/AltanS/collie/commit/20d1e6d5))
- **A lead behind `tailscale serve` now tells a new member to dial port 443.** `crew add` and
  `crew invite` handed the member the bare tailnet name, and `collie join` reads a bare host as the
  lead's own listener on port 8787. A default HTTPS lead listens on loopback and publishes only 443,
  so the member saw "Unable to connect". Both now give `https://<full-tailnet-name>`, or
  `<name>:<port>` when `COLLIE_SERVE_PORT` moved the front door. With `COLLIE_SERVE_MODE=http`,
  `invite` keeps the short name. Thanks @sbakhour (#334). ([228f65ee](https://github.com/AltanS/collie/commit/228f65ee))
- **`collie crew join --address` now needs a port.** A portless `--address` made the lead dial port 443 on the member, so a member whose
  address had no port stayed unreachable with nothing naming the cause. `join` now refuses it and
  suggests `--address <host>:<port>`. An `https://host:8787` address is still accepted and stored
  as `host:8787`, while `https://host` with no port and any `http://` address are refused. For a
  peer row that cannot be dialled, `crew status` now names `collie crew set-address <member>
  <host:port>`. `crew status` and `doctor` print the exact `set-address` command for a stored
  address without a port. ([228f65ee](https://github.com/AltanS/collie/commit/228f65ee), [58cd66af](https://github.com/AltanS/collie/commit/58cd66af))
- **A failed TLS dial now says which way it failed.** Every TLS failure read "the TLS certificate
  was not accepted". A certificate that is not the pinned one now reads "something other than the
  pinned member answered at this address", which is what a wrong port looks like. A name mismatch
  and an expired or not yet valid certificate each get their own sentence. ([228f65ee](https://github.com/AltanS/collie/commit/228f65ee))
- **A fresh omp session no longer shows a draft in the terminal.** omp 18.4 paints a key hint,
  Shift+Tab to change thinking effort, into an empty editor. The omp reader took the hint's key
  glyphs for a typed draft, so every new session showed "Draft in terminal" with Take over. The
  reader now knows the hint's shape in all three composer layouts and reads the editor as empty.
  Thanks @enieuwy (#320). ([e3887c1d](https://github.com/AltanS/collie/commit/e3887c1d), [487f70b0](https://github.com/AltanS/collie/commit/487f70b0), [73f417cd](https://github.com/AltanS/collie/commit/73f417cd))

**Upstream 1.15.2 — 2026-10-02**

### Fixed

- **A working Claude pane no longer shows "Collie cannot read this dialog".** Claude Code's default
  footer prints `esc to interrupt` while a turn runs and `↓ to manage` while a background task or
  monitor exists. Collie took both for a modal's key hints, found no input box, and drew the Escape
  card over a live composer, where the reply path then refused to type. A pane with a custom
  statusline never showed it, which is why no capture in the corpus had the footer. Those two hints,
  and their clipped forms on a narrow pane, now read as the composer's own status, and a real
  `Esc to cancel` footer still refuses. Thanks @aryanscaler (#330). ([63bf5b61](https://github.com/AltanS/collie/commit/63bf5b61))

**Upstream 1.15.1 — 2026-10-02**

### Added

- **The Chat view shows what a question tool asked, with its options.** An opencode `question` call or a Claude Code AskUserQuestion reaches the phone with its questions, their options and, once answered, the labels chosen, instead of a bare tool name, and while it waits the card points at the dialog below the stream (#329). ([10a383c9](https://github.com/AltanS/collie/commit/10a383c9))

### Changed

- **A compaction is one marker line in a session view, and its recap is off by default.** When an
  agent compacts its context it writes a recap of the whole session for itself. Chat drew that as a
  centred wall of text and History as a full card, thousands of characters nobody reads on a phone,
  all built into the page. Both views now draw "Context compacted" and the time, and the text is
  never built. Turn the recap back on under Settings → Appearance → Compaction summaries, or in a
  pane's Display sheet, and it folds behind the marker and opens on a tap. A find on History always
  reaches it. Long machine notes fold behind a System label as well. ([ec93cae6](https://github.com/AltanS/collie/commit/ec93cae6))

### Fixed

- **Updating on Windows works with the community supervisor.** With the community Task Scheduler
  supervisor, `collie restart` stops only the bridge process it recorded and the supervisor
  relaunches it, where it used to fail on a `bin/collie` that Windows names `collie.exe`. The build
  steps the running `collie.exe` aside to `.old` before the swap, because Windows refuses to rename
  onto a running executable, and the bridge finds `bin/collie.exe`, so the phone's Update button can
  run there. Windows stays community-supported and best effort. Thanks @mqmalagris (#309). ([0debdcc4](https://github.com/AltanS/collie/commit/0debdcc4), [c942047b](https://github.com/AltanS/collie/commit/c942047b), [2c96e76b](https://github.com/AltanS/collie/commit/2c96e76b), [039a4b11](https://github.com/AltanS/collie/commit/039a4b11), [eb1fd1ca](https://github.com/AltanS/collie/commit/eb1fd1ca), [a0017871](https://github.com/AltanS/collie/commit/a0017871))
- **Switching a pane to Chat lands with the turns already there.** Choosing Chat from the pane menu
  used to swap the body at once, onto an empty box, and the turns popped in after it. Chat now reads
  the session while the pane menu or the Display sheet is open, so the swap happens as the sheet
  closes. If that read has not come, the terminal stays up for at most a second and a half. ([6ca7b5a4](https://github.com/AltanS/collie/commit/6ca7b5a4))
- **A Windows restart reports it when the bridge never comes back.** On Windows with the community
  supervisor, `collie restart` waits for the bridge to answer, 30 seconds unless
  `COLLIE_UPDATE_HEALTH_TIMEOUT_MS` says longer. If nothing answers, it now exits with an error that
  points to `collie status` and `collie-ctl.ps1 logs`, where it used to report success. An update run
  in a terminal then no longer prints `✓ update complete`, though the new version may already be
  installed, and a slow machine can come up a few seconds after the error. The phone's Update button
  keeps its own health check and its one rollback. Windows stays community-supported and best effort. ([29760622](https://github.com/AltanS/collie/commit/29760622))
- **A quiet tuios shell is named a shell, not an id.** Until a program sets a title, tuios fills the
  window title with `Terminal` and the first eight characters of the window id, and Collie passed
  that on as the terminal title, so every such pane read as "Terminal 6247db65" on the phone. The
  placeholder is now dropped and the pane reads as a shell, as on tmux and zellij. Thanks
  @Gaurav-Gosain (#328). ([20df9596](https://github.com/AltanS/collie/commit/20df9596))
- **An opencode question dialog can be answered from the phone.** A single-select question shows as
  a card with one button per option, and a tap sends that option's digit. A multi-select question
  shows its options as checkboxes: a tap toggles one, a button moves on to the Confirm tab, and
  Confirm lists the answers with a button to submit them and one to dismiss the dialog, which ends the
  turn. A call with several questions shows each question as a step with its tabs, and the same
  Confirm tab ends it. Before, every one of these showed as raw terminal text that no button could
  answer. The card locks while the free-text row is open, because the terminal takes digits as text
  there, and Collie never types into that row. A list of more than nine options stays on the
  terminal mirror, with the Escape card to dismiss it (#329). ([199d31f5](https://github.com/AltanS/collie/commit/199d31f5))

**Upstream 1.15.0 — 2026-10-01**

### Added

- **The journal now says what a tool call did, not only what it was asked to do.** Every tool part
  carries a structured `call` beside its one-line summary: an edit knows its path, its diff hunks
  and how many lines moved, a command knows its exit code, a read knows its range. A refused call is
  marked `denied` rather than lumped in with a real failure, because "you said no" and "it crashed"
  are not the same thing to read. The shape is additive, so every existing view keeps working, and
  the name table is shared, so `Bash`, `bash`, `shell` and `exec_command` are one kind of thing. ([d5faea94](https://github.com/AltanS/collie/commit/d5faea94))

- **Settings is four sections instead of one long column.** The page was seventeen cards deep on a
  phone with no headings to skim by, so finding one switch meant reading every card above it. It is
  an index now: Appearance, Device, Alerts and System, each short enough to take in at once. No
  setting is removed and none changes what it does. Back from a section returns to the index. The
  QR `collie pair` prints still opens the pairing form, which now lives under System. ([7527b53e](https://github.com/AltanS/collie/commit/7527b53e))

- **Tool calls are off in a session view, and that is the new default.** A working session is
  mostly tool calls: one turn can be forty reads and a grep, which buried the paragraph you opened
  the page for. The History page now draws what the agent SAID, with one muted line per turn saying
  how many steps it took and a tap to bring them back. A find always overrides it, so a search that
  matches inside a command's output still shows what it matched. Turn them back on for good under
  Settings → Appearance → Tool calls. ([b36b7c55](https://github.com/AltanS/collie/commit/b36b7c55))

- **A pane that becomes an agent pane says so.** You are watching a bare shell on your phone, you
  type `opencode` at your desk, and the Collie mark flies out of the header, blooms over the mirror
  and hands the pane to the agent's own mark. It marks a fact the poll has already found, so it
  never reads as progress, it holds no space and moves nothing, a tap ends it, and under reduced
  motion it is a still picture instead. Opening a pane that was already running an agent announces
  nothing: it is the change that is drawn, never the state. ([36063545](https://github.com/AltanS/collie/commit/36063545))

- **The boot splash shows the Collie mark, not the old galloping dog.** The sprite was retired when
  the new mark landed and every screen moved to it, but the first-paint splash in `index.html` kept
  its own hand-written copy, so a cold open still flashed a galloping dog and then swapped it for a
  different animal. It is the brand's own header-weight mark now, in a light and a dark file, so the
  hand-off to React changes nothing but the mark's own motion. ([2dd6ca80](https://github.com/AltanS/collie/commit/2dd6ca80))

- **Every harness now records what a tool call DID, not just that one ran.** Claude already did;
  Codex, opencode, pi, grok and hermes now do too. A command carries its exit code, an edit carries
  its hunks and its added and removed counts, a search carries its hit count, and a call the
  operator refused is marked as refused rather than as an error. Nothing is guessed: each harness
  fills only what its own record actually holds, and the three that write no exit code and no patch
  say so rather than inventing one. This is what a session card will draw, and it is read from one
  place for all six. ([0a143094](https://github.com/AltanS/collie/commit/0a143094))

- **The pane switcher can run by activity instead of by place.** The sheet you open with the layers
  mark keeps every pane in its space and tab, which is the right answer when you know where you are
  going and the wrong one when you just want the pane you were last in. A Place / Activity toggle now
  sits at the top of it, and Activity folds the space headings and the Shells fold into one list,
  newest first, counting both the agent's own last turn and the last time you were in the pane. The
  choice is a standing one and also a row under Settings → Appearance → Pane order. It reads the
  clock once, when the sheet opens, so a pane that finishes a turn while you are reaching for a row
  repaints where it stands and never moves under your thumb. ([cf10b860](https://github.com/AltanS/collie/commit/cf10b860))

- **The journal reads a session one row at a time.** Every harness adapter now folds its log row by
  row instead of only parsing a whole file, and says which earlier turns a row changed as well as
  which turns it added. That second half is the point: a tool result lands rows after the call it
  belongs to, so attaching it edits a turn that is already on screen. A live session that gains one
  row can now cost one row of work instead of re-reading and re-parsing the last 32 MB of a log that
  can be 187 MB long. Nothing you can see changes yet, and the whole-file reading is the same reading
  it always was, proved for all six harnesses against the same bytes arriving in torn random chunks. ([a417a46d](https://github.com/AltanS/collie/commit/a417a46d))

- **Asking a session what is new now costs only what is new.** Every harness can answer that
  question in the language its own storage speaks: the four that write a log file count bytes, and
  the two that keep a SQLite database count a row's own clock or its row id. The reader above them
  learns none of that, so a harness can change how it counts without anything else changing. Three
  things follow. A first read takes a bounded tail instead of a whole session, which starts to matter
  once a log runs to hundreds of megabytes, as a long Claude session does. A row the agent is halfway
  through writing is held back
  until the newline arrives, so it is never shown half and never dropped. And a read that cannot
  simply continue, because a log was truncated or because Claude handed the conversation over to a
  new file, says so in one word and hands back the truth instead of a guess. Nothing you can see
  changes yet. ([7953e9c8](https://github.com/AltanS/collie/commit/7953e9c8))

- **A watching screen asks what is new and is told only that.** A new read answers a pane's session
  the way a poll wants it answered: the turns you have not seen, the turns that changed since you
  last looked, and nothing else. A poll that finds nothing new sends no body at all. The bridge holds
  a bounded tail per session, about two megabytes of it, so a session of any length costs the same
  memory, and older turns come off the disk only when somebody asks for them. It rides the poll
  Collie already has rather than a new socket, so it crosses a crew link exactly as the history read
  does, and a member one release behind simply reports no such read instead of an empty session.
  Nothing you can see changes yet. ([c75ced6e](https://github.com/AltanS/collie/commit/c75ced6e))

- **The pane menu can copy a pane's output.** There was no way to get the terminal text off a
  phone at all: an installed iOS PWA suppresses long-press selection app-wide unless an element asks
  for it back, and the mirror never did. Two ways in now. The mirror opts back into selection, so
  long-press and Copy works. And a Copy output row joins Find and History in the pane menu, which
  copies the whole buffer in one tap, unwrapped, so a paste reads as real lines rather than as the
  phone's own hard wraps. The row copies the screen you are looking at, not a poll that landed under
  your thumb, and it stays hidden where there is no output or no clipboard to write to, which is
  every plain-HTTP deploy. Thanks @jyothyswaroop (#287). ([d5057d23](https://github.com/AltanS/collie/commit/d5057d23))

- **A push notification arrives in the language you picked.** The bridge writes a notification title,
  and the bridge has no idea which language your phone is set to, so a German device still read an
  English line on its lock screen. The bridge now sends a short catalogue code beside the English
  title. The page leaves the active language's templates in Cache Storage, and the service worker
  fills them in there, which is the only place that runs when the app is closed. Any miss falls back
  to the English title, so a phone that has not opened the app since you changed language still gets
  a readable notice instead of a code. Thanks @jaehyun2yo (#310). ([ffd600cb](https://github.com/AltanS/collie/commit/ffd600cb))

- **A canary run now checks what Chat reads, not only what the screen shows.** Each of the six
  journal readers counts the row kinds and content kinds it has no branch for, and `bun run canary`
  reads the session each agent wrote in its own pane: a user item for the prompt the canary sent, a
  tool item for the file read it asked for, a reply below it, and nothing unrecognised. Above zero
  the run fails and NAMES the type, which is a gate against a vendor format change nobody has
  written a test for. Claude Code and Codex both broke reading on the day they shipped, while
  every test stayed green. No session file is saved anywhere, not even under `/tmp`: an
  agent's log carries file contents from every read and environment from every command, so only
  counts and item kinds are kept. `verified-versions.json` records the journal reader's verified
  version beside the screen reader's and `bun run harness:drift` prints a row per reader, because
  the two drift apart: a vendor can change what it paints without changing what it writes. ([160d2fab](https://github.com/AltanS/collie/commit/160d2fab))

- **The phone can now read a working session and hold it correctly.** It asks a pane's session what
  moved and merges the answer by turn, so a turn that changed is written over where it already sits
  and never drawn a second time lower down. An unchanged poll costs nothing and changes nothing. A
  machine still running an older Collie has no such read at all, and it now says so and names the
  remedy instead of looking like a pane with nothing to show. No screen uses this yet. ([a2231ee1](https://github.com/AltanS/collie/commit/a2231ee1))

- **Collie now holds the blocks a session reads as.** A turn from an agent's own record becomes what
  you would expect to see: your own turn, the reply, thinking behind a fold, and a card per step. A
  command carries its output, an edit carries its diff in the same colours the Changes view uses, and
  a run of steps folds to one line you can open. They were drawn and lived with in the session-stream
  prototype first and moved here whole, tests included, so there is one definition of a card and not
  two. No screen mounts them yet. ([c126f4fa](https://github.com/AltanS/collie/commit/c126f4fa))

- **A pane can be read as a chat instead of a terminal.** Turn Chat on under Settings →
  Experiments, and a pane draws the agent's own conversation: your turns, its replies, thinking
  behind a fold and a card per step, with the composer, the belt and the pane menu exactly where
  they were, so you still take the work over by typing. The switch is a row in the pane's ⋮ menu and
  the choice is one standing setting for the whole device. Older turns load on a tap. A pane with no
  session keeps the terminal and the row says why, and a crew member a release behind says to update
  it rather than pretending there is nothing to show. Terminal stays the default; the default flips
  in 2.0 (#316). ([2e46ea22](https://github.com/AltanS/collie/commit/2e46ea22))

- **The pane switcher can sort by which prompt cache dies first.** A third order beside Place and
  Activity, and the one with a deadline in it: the pane you should go to next is often neither the
  one you just left nor the one asking for you, it is the one whose cache you are about to pay to
  rebuild. A pane with no cache left to lose sinks to the bottom in its usual order. Like Activity,
  the order is read once when you open the sheet and held there, so a window ticking down never
  pulls a row out from under your thumb. ([f0e5856f](https://github.com/AltanS/collie/commit/f0e5856f))

- **Chat shows the work a codex pane did, not only the words it said.** Codex runs nearly everything
  through one custom tool, and the journal reader dropped that shape, so every file it read and every
  patch it wrote was missing from Chat. It reads now, with the command, the output and the exit code.
  Claude's pasted images reach the phone too, and an OpenCode patch or attachment shows as itself. ([38a93df6](https://github.com/AltanS/collie/commit/38a93df6))

- **Chat says a turn is still running, and shows what you queued behind it.** A compaction writes no
  row for minutes, so a compacting pane in Chat looked exactly like a finished one, and a message
  typed while the agent was busy appeared nowhere at all. The thread now ends with a working mark, and
  the queue sits under it in your own colour until the agent takes it. ([c906c453](https://github.com/AltanS/collie/commit/c906c453))

- **Collie drives tuios, as an experimental backend.** Set `COLLIE_MUX=tuios` to mirror a tuios
  daemon's sessions as spaces, its workspaces as tabs and its windows as panes, with the agent, its
  state and its conversation read from tuios itself. It needs tuios 0.8.3 or newer. The mux
  contract now also says that an agent name is one of Collie's harness names or `shell`. Thanks
  @Gaurav-Gosain (#321, #322). ([c1928e3d](https://github.com/AltanS/collie/commit/c1928e3d))

### Changed

- **The theme card is called Theme.** It was called Appearance, which is now the name of the
  section it sits in, and a page that says Appearance twice tells you nothing the second time. ([7527b53e](https://github.com/AltanS/collie/commit/7527b53e))

- **The canary runs pi the way an operator runs it.** pi was launched with `--no-session`, so it
  wrote no session file, so the journal check spec 05 added could never see pi at all. The flag is
  gone. pi was also the only agent exempt: Claude, Codex and opencode already write to their own
  stores on every canary run, because the canary isolates Herdr and deliberately leaves an agent's
  own configuration alone. `--thinking off` stays, because that one only makes a run cheaper. ([71cbe684](https://github.com/AltanS/collie/commit/71cbe684))

- **A canary ledger entry is judged per agent, not per run.** One agent failing used to block the
  ledger for every agent in the run. The run on 2026-09-30 showed the cost: a Codex three versions
  behind painted its update picker over the composer and failed one scenario, which blocked the
  entries for Claude 2.1.285 and opencode 1.18.33, both of which had passed all six of their own
  scenarios and were the two versions the drift check was asking about. Another vendor's startup
  prompt is not evidence about our Claude reader. A run with any failure is still a failed run. ([a4dfd913](https://github.com/AltanS/collie/commit/a4dfd913))

- **Claude Code 2.1.285, opencode 1.18.33 and pi 0.87.1 are verified, for both readers.** The canary
  ran all six scenarios against each of them, idle, drafts, sends, journal, narrow and start-exit,
  and every one passed. `journal` is the new scenario: it parses the canary's own session with the
  same adapter Chat uses, and asserts the kinds it finds. The ledger now carries two lines per
  agent, the screen reader's and the journal reader's, so `bun run harness:drift` covers Chat as
  well as the mirror. ([926a03e4](https://github.com/AltanS/collie/commit/926a03e4))

- **The canary's journal prompt cannot be answered without opening the file.** It used to say "read
  README.md, then reply with only OK", and "OK" needs nothing from the file, so an agent was free to
  skip the very tool call the scenario exists to watch. Codex did exactly that, on two versions. The
  canary's own README now carries a token, and the prompt asks for the token it names, which no
  agent can answer without reading. The reply is still one word. ([d0411bef](https://github.com/AltanS/collie/commit/d0411bef))

- **Codex 0.159.2 is verified, for both readers.** The canary ran idle, drafts, sends, journal and
  narrow against it and every one passed. The journal scenario saw Codex's `custom_tool_call` and
  counted no row it does not know, so the ledger now names 0.159.2 for the screen reader and for
  the journal reader, which had been last swept at 0.156.1. ([3bbd7863](https://github.com/AltanS/collie/commit/3bbd7863))

### Fixed

- **A long file name in Changes keeps both ends instead of losing its start.** The tree truncated a
  name from the left, which is correct for a path and wrong for a bare file name, so a folder of
  long names drew every row as `…m_breaks_under_podman_compose.md` with the very prefix that orders
  them cut off. A name now gives up its MIDDLE: the start and the extension both stay, the way a
  file manager does it. Compacted folder rows keep both ends too, so two repos holding the same deep
  folder chain no longer read as the same row. ([fe7015b0](https://github.com/AltanS/collie/commit/fe7015b0))

- **A two-pane box pans on a phone instead of losing its right half.** Claude Code's dynamic-workflow
  view draws the phases in a left pane and the running agents in a right one, and on a phone every row
  of it was cut off at the screen edge: the report showed a band of stacked rules with `· 74…` hanging
  off the side. The mirror only ever panned a box whose divider crossed a rule, `┼`, and a two-pane box
  never draws one, so it was refused and then clipped rather than wrapped. It now pans like any other
  wide table, which also gives back the model names in omp's `/model` picker and the Tips beside omp's
  welcome logo. Thanks @cryptiklemur (discussion #301). ([8c811438](https://github.com/AltanS/collie/commit/8c811438))

- **A pi turn that failed now says so, instead of vanishing.** When a provider call errors, pi
  writes the turn with no content at all, so the failure was not merely unexplained, the turn was
  simply missing from the history. The message pi recorded now shows as a note under the turn, set
  apart from anything the agent said, and an interrupted turn says so too while keeping whatever the
  model got out first. Measured over 44 real sessions before the fix: 37 errored turns, every one of
  them empty, and 15 interrupted ones. ([d2a0dec4](https://github.com/AltanS/collie/commit/d2a0dec4))

- **A pi session you rewound shows the path you are on, not both paths.** pi keeps every branch in
  one file, and Collie was reading all of it, so History showed the turns you had abandoned mixed in
  with the live ones and nothing said which was which. It now follows the branch you are actually on,
  and rewinding back onto a path you left brings it back. Eight of forty-four real sessions had
  forked, so this was the common case rather than the corner. ([d2a0dec4](https://github.com/AltanS/collie/commit/d2a0dec4))

- **pi's compaction, its branch summaries and a desk command all show up now.** Collie read only
  pi's message rows, so a compacted conversation read as though nothing had happened, an extension's
  own note never appeared, and a `!command` you ran at the desk looked like a message you had typed.
  Each now reads as what it is, set apart from anything the agent said. ([d2a0dec4](https://github.com/AltanS/collie/commit/d2a0dec4))

- **A panel drawn over opencode's composer no longer reads as a draft.** When another panel's box
  border crosses the composer bar, the draft walk could land on that border row and hand it back as
  the draft, so the phone showed a Draft in terminal card holding one line of box glyphs, and Take
  over would have typed that junk into the composer. A border row is excluded now, and it takes two
  conditions to be one: a corner or a junction on the row's interior, AND nothing but chrome inside
  it. Either condition on its own gets a real draft wrong. People type a bare rule inside a message,
  and a pasted `tree` carries a junction on every line, which read four typed lines back as the last
  one. The reader also held two glyph sets that disagreed about whether `─` and `│` were border
  glyphs, and there is one set now. Thanks @AndiWandHerd (#319). ([ed705820](https://github.com/AltanS/collie/commit/ed705820))

- **Two Chinese catalogues said a cache had expired when it had only gone cold.** A cold cache still
  works, it only costs more, so the word carries a fact. The Simplified Chinese notification setting
  read 缓存即将失效, which claims the cache became invalid, while the two strings next to it already
  said 变冷. Traditional Chinese said 冷卻 where its own neighbours say 變冷, which was consistency
  rather than fact. Both now use the wording their catalogue already uses everywhere else. ([1f46ffcf](https://github.com/AltanS/collie/commit/1f46ffcf))

- **German, Japanese and Korean said a cache had expired, and German said it was idle.** The same
  wrong fact sat in three strings in each of those catalogues. German is the worst of the three:
  "inaktiv" is German's own word for an IDLE pane, so one word named two different states. Each
  catalogue now uses the word its own cache chip already uses, "kalt" in German, コールド in Japanese
  and 콜드 in Korean. Nothing was newly translated; the word was already in the file. ([89724bc5](https://github.com/AltanS/collie/commit/89724bc5))

- **A notification about a finished agent now uses the same word as the app.** German said "ist
  fertig" and Spanish "ha terminado", while the status chip in the app says "abgeschlossen" and
  "completado". Every other push title matches its chip, so these two were the exception. Both carry
  the chip's word now, with an object, because German "ist abgeschlossen" is wrong for an actor and a
  bare "hat abgeschlossen" can be read as having locked up. ([89724bc5](https://github.com/AltanS/collie/commit/89724bc5))

- **A send on a Muse pane could type your message and then never submit it.** With block grammars
  on, tapping Send typed the text into the composer and stalled, three taps in a row, while the
  words sat in the box. The verify read after typing can catch the terminal's echo one character
  short, and the matcher accepted that prefix, so the phone bound a partial row and the bridge's own
  exact check then refused to submit it. A single-chunk send now waits for the echo's tail before it
  binds, which is what the multi-chunk loop already did. Thanks @jpcarranza94 (#312). ([1791674b](https://github.com/AltanS/collie/commit/1791674b))

- **`collie status` sees a launchd agent that Home Manager put in the user domain.** Collie probed
  only `gui/<uid>`, so an agent declared with `domain = "user"`, which is what a background service
  without a graphical login needs, read as not loaded while it was running. Both domains are probed
  now, the status line names the full target, and both registrations are reported when both exist,
  so a running background agent is not hidden behind a stopped GUI one. The pidfile fallback is
  unchanged. Thanks @mavam (#314). ([623401a6](https://github.com/AltanS/collie/commit/623401a6))

- **A URL an agent typed as itself is now a link you can tap.** Agents write a bare address
  constantly, a server they started or a pull request they opened, and only a Markdown link ever
  became an anchor. A bare `http://`, `https://` or `mailto:` is now one too, in History and in Chat.
  It keeps the sentence punctuation it ended on, so a URL at the end of a sentence does not swallow
  the full stop, and a URL inside backticks stays code. ([8ab22bcc](https://github.com/AltanS/collie/commit/8ab22bcc))

- **Prose reads better: code wears the docs site's blue chip, and your own turns are findable.**
  Inline code was grey ink on a grey wash inside grey prose, with nothing to scan for. It now wears
  the same blue chip `colliepwa.dev` draws around a command, so one command looks like one thing
  wherever you read it. A short hash also stopped splitting mid-word across two lines, `6c` on one
  and `70894d` on the next, and a long token now breaks only when it cannot fit a line of its own.
  Your own turns carry the brand's orange as a wash, so scrolling back for what you asked is a
  glance rather than a read. ([8ab22bcc](https://github.com/AltanS/collie/commit/8ab22bcc))

- **Loading older turns in Chat keeps your place instead of throwing you to the top.** The tap puts
  forty turns in above what you are reading, and the scroller held its offset, so the block you were
  on slid down by the whole height of the new page. It gives that height back once the page paints,
  the way History's own scrollback and the terminal mirror's already did. ([1712ec61](https://github.com/AltanS/collie/commit/1712ec61))

- **A bulleted list now reads at the same pace as a paragraph.** A list took the base line height
  and a paragraph took the relaxed one, so the same prose was set two different ways depending on
  whether it had a bullet in front of it. A list was also the one place a code chip did not fit its
  line: two chips on consecutive wrapped lines touched. Lists and block quotes take the paragraph's
  own leading now, and the chip is a millimetre shorter so it sits inside the line rather than
  pushing it apart. ([30f2ac31](https://github.com/AltanS/collie/commit/30f2ac31))

- **A flag or a branch name in backticks is no longer cut in half at the line end.** A hyphen, a
  slash and a colon are ordinary places for a line to break, so `--force` could come out as `--`
  then `force`, and an address like `http://bluefin:8788` could be split across two lines. Anything
  short enough to fit a column of its own now stays in one piece, and only something genuinely too
  long to fit, a full path, breaks where it must. ([37161551](https://github.com/AltanS/collie/commit/37161551))

- **The belt's Display settings answer for the body you are looking at.** Over a Chat stream you got
  the terminal mirror's six rows, of which one did anything, with no way to tell which. The dock now
  carries the Terminal / Chat switch at the top, the same choice the pane's ⋮ menu writes, and below
  it the rows that apply: text size and tool calls for Chat, the mirror's five for the terminal.
  Text size comes first in both instead of last under five switches, and Chat's size is its own
  number, so a stream you can read does not mean a terminal you cannot. ([299fc465](https://github.com/AltanS/collie/commit/299fc465))

- **The belt's Display settings open as a sheet, so nothing under them moves.** They rode an in-flow
  panel that took its height out of the pane body, so opening the settings pushed the very thing you
  opened them to look at, and the terminal and Chat lists are different lengths, so switching bodies
  pushed it again. It is the pane switcher's own sheet now: it covers, and nothing above it shifts. ([71c096dc](https://github.com/AltanS/collie/commit/71c096dc))

- **Tool calls off now actually hides them in a live session.** The setting folded a run of steps to
  one line, and then a step that was still running opened the run again and kept it open for good.
  In a live session almost every run is running at some point, so the setting looked like it did
  nothing. A running step no longer overrules the choice. Your own tap still opens any run. ([6563ed77](https://github.com/AltanS/collie/commit/6563ed77))

- **The pane switcher gives two rows back to the panes.** The alarm line and the order control each
  took a full row of a phone sheet, above a heading, before the first pane. They now share one row,
  with the order as glyphs. The heading below still names the order in words, so nothing is lost. ([f0e5856f](https://github.com/AltanS/collie/commit/f0e5856f))

- **Chat says when a turn is still running, so a compaction is not an empty screen.** The terminal
  mirror shows the agent's own spinner, but Chat draws the agent's record, and a record gains nothing
  while a session compacts. So a pane that had been busy for minutes looked exactly like a finished
  one. The thread now ends with a working mark until the next turn lands. ([43827305](https://github.com/AltanS/collie/commit/43827305))

- **A phone paired under a name outside ASCII can reach a crew member again.** A header value must
  be plain bytes, so a label like `폰` made every forwarded call fail with a 500 before it left the
  lead. A name like that now travels percent-encoded (RFC 8187) and the member reads it back whole,
  for its allowlist and its audit line. An ASCII name is sent exactly as before. Reported by
  @dmstjd1024 (#324). ([06374508](https://github.com/AltanS/collie/commit/06374508))

- **A Codex pane pursuing a goal keeps its input box.** A Codex `/goal` puts `Pursuing goal (…)`
  at the right end of the status row, and Codex paints the spaces in front of it in the colour of
  the field before. Collie read that as a row it did not know, so it lost the input box: the pane
  showed the unread-dialog card and every reply from the phone was refused. The padding now reads
  as the gap it is. Reported with a capture by @CorrectRoadH (#317). ([ed647185](https://github.com/AltanS/collie/commit/ed647185))

- **The canary judges the read send by its token and starts codex without its update prompt.**
  The `sends` scenario accepted only a bare "OK" as an answer, so a codex that replied with the
  README token the read prompt asks for still timed out. A message can now declare its expected
  reply. Separately, codex's "Update available" prompt (default answer: Update now) took the place
  of the composer at startup, so the canary now launches codex with
  `check_for_update_on_startup=false`. ([9dd96df0](https://github.com/AltanS/collie/commit/9dd96df0))

### Docs

- **The docs have a Guides section, and it opens with an install in five minutes.** Install was
  the only way in, and it answers every system and every front door at once, so a first-time reader
  had to find their own path through it. The new guide walks one path: Tailscale, Herdr and the
  install script on the computer, then the home screen and `collie pair` on the phone. The README's
  documentation table splits into Guides and Reference, and `collie docs five-minute-install` prints
  the guide from the binary. ([9243abd2](https://github.com/AltanS/collie/commit/9243abd2))

- **Every Settings path in the docs names its section.** The settings page became an index of four
  sections, so fifteen instructions across seven pages pointed at a card that had moved. Paired
  devices and Updates are under System, the harness shortcuts, the typeface and the language are
  under Appearance, and zen and Changes are under Device. Two were wrong twice over: one told you
  to open Appearance and pick a theme, which is now the Theme card inside that section, and two
  named a "notifications" section that never existed and is called Alerts. ([95bf1b74](https://github.com/AltanS/collie/commit/95bf1b74))

- **Changes has its own docs page, and the README names it as a feature.** The view was
  documented only as one section of the Configure page, which said it opens from the pane menu and
  never updates on its own. Both had stopped being true. `docs/changes.md` covers both ways in, the
  list, the diff, the last commit, the 5-second refresh, how the folder and nested repos are found,
  the read-only rules and the limits. `collie docs changes` prints it from the binary. ([1948ef6b](https://github.com/AltanS/collie/commit/1948ef6b))

**Upstream 1.14.2 — 2026-09-28**

### Docs

- **A walkthrough for running Claude Code from your phone.** `docs/claude-code-on-your-phone.md`
  first keeps Claude Code alive in tmux, Herdr or zellij when SSH drops, and shows how to run
  several sessions at once. Then it takes one path end to end, from install to answering an agent
  from the Keys tray. `collie docs claude-code-on-your-phone` prints it. ([2bec9cbd](https://github.com/AltanS/collie/commit/2bec9cbd))

**Upstream 1.14.1 — 2026-09-27**

### Fixed

- **Grok 1.0.41 panes send from the phone again.** Grok 1.0.41 adds `Shift+Enter/Opt+Enter:newline` to the key-hint row under its input box while a draft is in it. Collie did not know a hint with two keys joined by `/`, so it lost the input box as soon as the phone typed the message: the send stopped with "Message didn't reach the input box", and the unread-dialog card covered the pane. Collie now reads that hint, and the `Alt` spelling a Linux Grok may print. Every other saved pane reads as before. Thanks @CorrectRoadH for the pane capture (#294). ([7c9f6497](https://github.com/AltanS/collie/commit/7c9f6497))

**Upstream 1.14.0 — 2026-09-27**

### Added
- **The canary opens real dialogs and sends to a busy agent.** `bun run canary --dialogs` asks Claude for a Bash command, a WebFetch, an AskUserQuestion and a plan, and Codex for a command and a file edit, then checks the card, the labels and the free-text lock with Collie's readers, presses the declining key where it was measured live and checks the file was not written. It also sends to each agent while Herdr says it is working. Run against the 1.13.1 readers, it fails on the Claude permission pointer on row 2, the amend note, WebFetch and the Codex patch approval.
- **A picture pi shows reaches the live mirror.** pi draws a picture by direct placement, which leaves nothing on the screen Collie reads, so until now its pictures reached the phone only through History. When a pi or Oh My Pi turn finishes, the pane reads the agent's log once and shows that turn's newest picture as one card right after the mirror, where the view already sits. A later turn without a picture removes the card, and older pictures stay in History. A picture a placeholder already shows is not shown twice, and other agents pay no extra read. This closes the gap from #292. Thanks @leiyangyou.
- **A pane can be pinned to the top of the dashboard and the switcher.** Hold a dashboard row or a pane pill, or open the pane's ⋮ menu, and tap Pin to top. Pinned panes lead the Panes, Focus and Changes lists and the switcher, under the summary line, in the dashboard's own order, and a status change never moves them. Each pane is still listed once, and its workspace still counts it. Pins stay on this device, and closing the pane from Collie removes its pin. Thanks @wwilson1017 for the idea (#286).
- **A crew's dashboard can hide a machine.** Open the Machines sheet and turn off Show on the dashboard beside a machine, and its workspaces leave the Panes, Focus and Changes lists. One dimmed chip in the workspace strip stands in for the machine, keeps its most urgent status dot, and shows the machine again on a tap. The machine you are on always shows, a tap on a machine's row still goes there, and pinned panes still lead the list. The summary line, the Focus badge and notifications still count every machine. The choice stays on this device. Thanks @dantebarba for the idea (#288).
- **Each workspace heading on the dashboard opens a new tab.** A "+" now ends every workspace heading on Panes and Focus, after its counts. A tap opens a new tab in that workspace, in the workspace's own folder, and steps into its fresh shell, as the tab strip's "+" does, so a new tab no longer means opening a pane first. In a crew the tab opens on the machine the heading belongs to. A machine whose multiplexer cannot open tabs shows no "+", and a machine that is not taking writes says why when tapped. Each heading is 8px taller to make room. Thanks @dantebarba (#290).
- **OpenCode panes get their own reader.** Collie now finds OpenCode's input box, so a reply is typed, checked on screen and only then submitted, and a draft left in the box shows on the phone. A permission dialog for a shell command, a file edit or a web fetch shows as buttons, Allow once, Allow always and Reject, and the Always allow confirmation that follows it is a second card with Confirm and Cancel. Each button walks OpenCode's own pointer with the arrow key and then presses Enter, and never types a digit. A picker such as the agent list or the command palette gets the one Escape button. Checked on OpenCode 1.18.32 at full width and at 50 columns. Thanks @Gabrielribeiroic (#255).
- **An X on the actions belt empties the text box.** While the phone's text box holds text or an attachment, an X stands at the belt's right end, left of the Changes button, or left of the Switch button on a pane without one. One tap clears the text, the attachments and that pane's saved draft, keeps the keyboard up, and sends nothing to the pane. The X then becomes Undo, which puts all of it back, until the next keystroke, attachment, send, tap on another belt button or pane change. Undo has no timer, so the belt never shifts under a tap on its own. Thanks @dantebarba (#291).
- **The new-space sheet offers the folders you opened before.** Under the Directory field, the sheet lists Favourites, then Recent, for the machine the space goes to. Recent holds the last 8 folders a space was created in, counting only creates that worked and named a folder, and never home. A tap on a row fills the field and creates nothing. The star beside a row moves it to Favourites, up to 12, and a second tap moves it back. Each machine keeps its own list in `folders.json` in its state directory, so every phone and tablet sees the same folders, and a machine on an older version shows no list. Thanks @dantebarba (#289).
- **A hold now shows while you press.** A dashboard row, a pane pill, a workspace chip or a tab starts to press in and tint a moment after your finger lands, and the look fills until the hold opens its menu half a second in, so a hold in progress no longer looks like nothing is happening. A quick tap changes nothing. The look ends as the menu opens, with one short buzz where the phone supports it. With reduced motion, only the tint shows.
- **The dashboard says once that a hold pins a pane.** On the Panes tab, while nothing is pinned and at least three panes show, one quiet line under the summary line reads "Hold a pane to pin it here.", or "Right-click a pane to pin it here." on a device with a mouse. Its X, or your first pin from any screen, removes it for good on that device, also after you unpin everything.

### Fixed
- **Starting an update no longer shows the previous update as finished.** On a lead that had updated before, "Start update" showed "Update finished" at once, with the clock at 0:00 and the old versions on every row. The real update then showed as "started on another device", and this phone's own step never came. The bridge now sends the new update's id with its answer, and the phone stays on "Checking" until that update reports its first state. If none comes within three minutes, the phone gives the app back. The Updates card also stops showing the previous result, such as "Updated to 1.13.2.", while it waits. The update to this version still runs the old phone code, so it can show the old screen one last time.
- **A busy Codex pane keeps its input box on the phone.** While Codex 0.156.1 writes the first reply of a new conversation, its status row ends in a small spinner until the conversation gets its title. Collie painted that spinner over as starfield decoration, then read the row as no status row, found no input box, and showed the unread-dialog card over the working pane. A message sent in that time was refused as blocked. The spinner now counts as the end of the status row, but only as the very last mark and only after a complete status row. Found by the harness canary.
- **`collie update` on Windows gets through the build and the binary swap.** The build child keeps the `Path` a Windows environment carries, and the swap renames the `collie.new.exe` that Bun writes. Windows stays best effort: only the community lifecycle in `contrib/windows/` is maintained. Thanks @mqmalagris (#296, #297, #298).
- **The phone can update a Claude plugin marketplace.** The Marketplaces tab of Claude Code's `/plugin` screen, and the page one marketplace opens, showed only the unread-dialog card with Escape, so the phone could not press `u`. Their footers say "Enter to select", which Collie took for a question it could not read. Collie now reads both screens by their own words and shows Select, Update, Go back and the arrows, and after `u` it shows Apply changes and Cancel. Remove is never a button, on the tab or on the page, because its confirm is not a screen the phone can read. In the full-screen renderer, a marketplace page taller than the pane hides its footer, and the phone still shows no buttons there. Checked on Claude Code 2.1.283 in the classic and full-screen renderers, at 40, 82 and 120 columns.
- **A Muse pane with background tasks keeps its input box.** While a background task exists, Muse draws a small task list between its input box and its status line. Collie did not expect a row there, found no input box, and drew the unread-dialog card over a live pane, and an approval asked while a task ran lost its buttons the same way. Collie now reads the task list as part of Muse's own frame and leaves it off the phone, so replies, drafts and the status line work again, and an approval over one or two tasks shows its buttons. An approval over three or more tasks, or a question over any, keeps the card and its Escape, because the phone could not tie a tap to it there. While the task list has the keyboard and offers x to stop a task, the phone does not type into the pane. Checked on Muse Code 1.4.0. Thanks @jpcarranza94 (#304, #305).
- **History no longer shows Claude's injected text as your messages.** Claude Code marks the rows it writes itself with `isMeta`: a skill's instructions after a slash command or a Skill call, the source path of an attached image, the caveat before a local command. History showed them as your turns, and the jump between your messages stopped on each. They are now left out. A prompt Claude sends on its own, such as another session's message, a scheduled or `/loop` wake-up, or the go-on after a usage limit, stays as a System note, because the reply after it answers it. Thanks @GGGODLIN (#306).
- **Codex 0.157 panes keep their input box on the phone.** Codex 0.157.0 turned on its full-screen layout by default. That layout puts one more row under the status row, `? for shortcuts`, `tab to queue message`, or `← for agents · ? for shortcuts` when Codex runs through its background server. Collie expected the status row to be the last row, so it found no input box on any such pane, showed the unread-dialog card over it, and refused every send. Collie now takes that one row under the status row as part of the input box. Checked on Codex 0.157.1 with the harness canary, dialogs and a busy send included. Thanks @CorrectRoadH for the pane capture (#294).
- **A rewrapped row no longer leaves one word alone on its last line.** An agent writes each paragraph as one row as wide as its pane, and the phone breaks that row again at its own width, which often left a single word, such as "form.", on a line of its own. The mirror now asks the browser to balance those lines, so a word moves down to keep it company. The text itself does not change, so find, links and copy work as before, and no row gets taller. Chrome and other Chromium browsers do this on every screen. Safari 26 skips it on a screen that holds a row too wide to break, such as a rule or a table, which is most screens, and older Safari breaks lines as before. Thanks @jpcarranza94 (#302, #303).

**Upstream 1.13.3 — 2026-09-26**

### Fixed
- **Codex panes started with no Herdr client attached show their input box again.** A Codex started while no Herdr client was attached gets no answer to its colour queries, and 0.156.1 then paints the ` · ` between its status fields with no colour at all. Collie read that row as no status row, found no input box, and showed the unread-dialog card over every idle pane. The status row now accepts a separator with no paint, with the rest of the rule unchanged: coloured fields, one paint for every separator, and the row at the bottom under the `›` prompt (#294). ([764300f0](https://github.com/AltanS/collie/commit/764300f0))
- **A new Codex pane no longer blames the Herdr integration for its missing history.** Codex reports its session to Herdr only when its first prompt is sent, not when it starts, so every fresh Codex pane showed "has not reported a session" and told you to reinstall a hook that was fine. The phone now says Codex reports its session after its first message, and names the remedy only for a note that stays after a reply: review its hooks with `/hooks` in Codex (declining to trust changed hooks turns the Herdr hook off while `herdr integration status` still says current), or update the integration. `collie doctor` lists such a pane under `agent-sessions` and `integration-codex` as not reported yet, not as a fault (#294). ([2a3594bf](https://github.com/AltanS/collie/commit/2a3594bf))
- **Codex 0.156 panes take your messages again.** Codex 0.156 paints its status row in a new way, so Collie found no input box on a default Codex pane and showed "Collie cannot read this dialog" over an idle prompt, and a draft with line breaks never read either. Its rewritten folder-trust prompt, its file-edit approval, a command approval with only two options, and approval options that wrap on a narrow pane now show as buttons; each of their keys was tried live on Codex 0.156.1. The update prompt and the /model and /permissions pickers keep the Esc card. ([100bf7e3](https://github.com/AltanS/collie/commit/100bf7e3))
- **Claude permission dialogs show their buttons in every state.** Collie knew a permission dialog only by its "Tab to amend" hint, which Claude hides once the pointer leaves the Yes and No rows, and the web-fetch dialog has no hint at all. All of these showed "Collie cannot read this dialog". Collie now reads the dialog's own question and options. A note opened with Tab shows as text being written in the terminal, and the other buttons wait while it has the keyboard, because a digit there is typed into the note. The reject button stays a button on a narrow pane, where its "(esc)" wraps onto a row of its own. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e), [c71085e7](https://github.com/AltanS/collie/commit/c71085e7))
- **A tapped answer no longer types into the "Type something" field.** With the pointer on a question's "Type something" row, tapping another answer typed its digit into that field, and the Enter after it submitted the wrong answer. Typed text also showed as an answer button. The row is now read as a field: the buttons wait while it has the keyboard, and typed text shows as text. On a multi-select or multi-question step with the pointer on the field, the Esc card shows instead. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))
- **A draft with a pasted rule or prompt line no longer blocks sending.** A message with a `────` line or a `❯` line in it, as in pasted terminal output, hid Claude's input box from Collie, so Send stalled with "Message didn't reach the input box" and the pane showed the Esc card. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))
- **Claude's slash-command screens show their keys.** Newer Claude opens /mcp, /hooks, /memory, /rewind, /effort, /status, /usage, /export and /login with a new top edge, so they showed the Esc card. They show their own keys again. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))
- **Plan approval reads with a custom Claude config folder.** When the plan file lived outside `~/.claude`, the plan approval showed the Esc card. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))
- **Questions show in full.** A question that wrapped, or that Claude wrote on two lines, kept only one of its lines and a stray `│`. Permission options that wrap on a narrow pane keep their whole label. ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))
- **Starting or quitting Claude no longer flashes the Esc card.** For a moment before Claude draws its screen, and after it exits, the shell prompt showed "Collie cannot read this dialog". ([71b28a1e](https://github.com/AltanS/collie/commit/71b28a1e))

### Docs
- **A misread screen is reported with the pane's raw text.** The bug report form and the troubleshooting page ask for `herdr pane read <pane-id> --source recent --lines 200 --format ansi`, which shows the colours and dim text a screenshot cannot. ([d017c327](https://github.com/AltanS/collie/commit/d017c327))

### Added
- **A ledger records which agent version each reader was last verified on.** `verified-versions.json` carries claude, codex, grok, omp, agy, antigravity and muse's last-verified version and date, plus opencode and pi's installed one (no reader yet, so `how: "unverified"`). `bun run harness:drift` (`scripts/harness-drift.ts`) compares the ledger against what's actually installed and prints `same`, `NEWER, run the canary`, `older` or `not installed` per agent. It is read-only: it only runs `<agent> --version`. ([6fcf98b0](https://github.com/AltanS/collie/commit/6fcf98b0))
- **A canary drives real agents and checks what the phone would read.** `bun run canary` starts claude, codex, opencode and pi in a Herdr session of its own (`collie-canary`), types 15 kinds of draft and three real sends, and judges each screen with Collie's own readers and each send with the client's reply guard over the bridge's reply handler, in process. It never touches another session's panes, a port or a paired device, and it tears everything down. `--readers` points it at an older checkout, `--record` writes a clean agent into the ledger. See `scripts/harness-canary/README.md`. ([0852cc7b](https://github.com/AltanS/collie/commit/0852cc7b))

## [0.50.0] - 2026-09-25

Merged from upstream past their 1.13.1 (2026-09-24). The round brings OpenCode 2 journal support
and the Muse fixes below; the update-mode screens and the update runner they drive stay stripped
([ADR 9004](./.adr/9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md),
[ADR 0020](./.adr/0020-a-major-upgrade-is-consented-by-flag.md)).

### Added
- **A scope can say "every harness" in one word.** The operator files' `scope` now takes `agent` — every agent harness, never a shell — sitting between unscoped and a named family in the specificity ladder, so "these quick replies on every harness, but keep y/n on shells" is two rows instead of one per family. The same token works in `keys.toml` and `commands.toml`.

### Fixed
- **OpenCode 2 panes show their history and their prompt-cache chip.** OpenCode 2 keeps its sessions in new tables in the same database, which the journal reader did not read, so History said there was no log and the cache chip never appeared. The reader now reads both the OpenCode 1 and the OpenCode 2 tables, and when a session sits in both, it reads the one written last; its tool error record reads too, and a failed compaction is skipped. Thanks @kekefigure.
- **A Muse message with a blank line in it sends.** A paragraph break in the draft made the pane lose Muse's input box: the send typed but never submitted, the unread-dialog card covered the box, and each retry typed the message once more. The box is now read across blank lines. Thanks @jpcarranza94 (#274).
- **A slash command sent to a Muse pane runs.** Typing `/usage` opens Muse's command list under the input box, and the send read that list as part of the message, so it never matched and stalled. When the list shows exactly the command you typed, the command alone is submitted. Thanks @jpcarranza94 (#276).
- **A photo or file sent to a Muse pane submits.** Muse turns a typed image path into `[Image #1]` and puts quotes around any other path, so the input box never showed the text sent and the send stalled. Each image mark now maps back to its path, in order, and the quotes drop before the compare. Thanks @jpcarranza94 (#278).
- **A Muse request for network access shows its answers as buttons.** Muse asks before it reaches a host, and the pane used to show only the card with Esc, which answers No. The four answers now show as buttons, with the host and the full address on screen above them. Thanks @jpcarranza94 (#280).

## [0.49.0] - 2026-09-23

Merged from upstream past their 1.12.1 (2026-09-23). The update-mode screens and the crew update
machinery that arrived in the same window stay stripped ([ADR 9004](./.adr/9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md));
everything below ships here.

### Added
- **A pane can show what changed in its workspace since the last commit.** The Changes mark at the right end of the actions belt opens the files changed in the pane's repos, grouped by repo with added and removed line counts; tap a file to read its diff. It only reads — nothing is staged, no hook runs, no network is touched. The list can show as a tree, a filter narrows it, and diffs over 2000 lines stay plain. Every pane in a workspace shares one list, and phones that read the same workspace share one git run ([ADR 0065](./.adr/0065-the-changes-view-reads-git-read-only.md)).
- **A clean repo can show its last commit.** Agents commit their own work, so the list often empties right after the change you wanted to read; a clean repo now offers the last commit with the same list, tree, filter and diffs, read from HEAD only (ADR 0065).
- **The dashboard has a footer with three tabs: Panes, Focus and Changes.** Panes is the dashboard as it was; the tab you pick is kept on this device, and the footer, workspace strip and summary line stay put when you switch. Focus shows only the panes that need you, in their own order, and the Changes tab lists every workspace with its counts ([ADR 0066](./.adr/0066-the-dashboard-has-a-footer-panes-needs-you-changes.md)).
- **The six translated catalogs catch up.** The Changes view, the belt-size setting, the dashboard footer and the older strings that still read English are translated in German, Spanish, Japanese, Korean and both Chinese scripts.

### Changed
- **The actions belt is 15% larger, and Settings can make it larger still.** The band grows to 45px and Settings → Action belt size offers Default, Large and Larger.
- **Tapping a row glides it into the screen it opens, and the back arrow glides it back.** Where the browser supports view transitions, a Changes row or a pane row flies into the arriving header; the swipe back, reduced motion and a slow read skip the glide for the plain slide ([ADR 0069](./.adr/0069-a-row-glides-into-its-header.md)).
- **Panes keep the multiplexer's order everywhere.** A pane that blocks no longer jumps to the top of the pane strip, the space view or the Switch pane sheet; the sheet now groups panes by workspace like the dashboard ([ADR 0063](./.adr/0063-a-pane-keeps-its-place-when-its-state-changes.md)).
- **An attachment chip whose marker you deleted says where its path will go.** Its border turns dashed, its number gains an arrow, and its title and screen-reader text say the path goes in front of your text (ADR 0060).
- **The Changes and Switch pane pills tint on press**, so a tap is visibly acknowledged on both.

### Fixed
- **Block and Powerline characters paint to the full row in the terminal mirror.** Prompt pills' round caps and stacked `█` bars no longer stop a quarter short, so rows meet and half blocks split at half the row.
- **A swipe back goes up one level.** Switching panes, tabs or spaces replaces the screen instead of stacking it, so the edge swipe and the in-app back arrow agree; a pane opened from a notification has the dashboard behind it ([ADR 0067](./.adr/0067-back-goes-up-one-level.md)).
- **The last action on the belt stops clear of the pane switcher**, with 16px of room to spare instead of sliding under the fade.
- **The keyboard stays open on a foldable's cover screen** — auto-zen starts only when the phone itself is turned.
- **An open Changes screen refreshes every 5 seconds** while the app is visible, waits while you scroll, and never flickers a redraw when nothing changed.
- **A drag-opened pane switcher no longer drops out and slides back in**, and a deep link seeds only in the installed app or a notification's window.

## [0.48.0] - 2026-09-20

The re-branch ([ADR 9004](./.adr/9004-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)): Pup now tracks [`AltanS/collie`](https://github.com/AltanS/collie) wholesale (base: their 1.11.0-rc.1) and stays there as a strip-fork — upstream work arrives by ordinary merges from here on, and the per-commit port rounds of 0.32→0.47 are retired.

### Added
- **The prompt-cache chip and the cache watch.** Each agent pane shows how long its prompt cache stays warm, sourced-claim rules (`cache-rules.toml`) can override it, and you can ask to be warned before a pane's cache goes cold. The countdown is measured, not guessed.
- **The multiplexer seam: tmux and zellij adapters.** Herdr stays the default; a tmux or zellij host can now be mirrored too. (Their panes read as shells — the agent-identifying beacon hooks live in upstream's CLI, which Pup does not carry.)
- **Typed-dictionary translations.** The UI ships in six locales behind a typed dictionary — carried rather than re-stripped, because stripping it was the adaptation tax that made port rounds expensive.
- **Device pairing** (`bridge/pairing.ts`): an optional second write gate — a bearer credential a paired device holds — composing by AND with the device-header gate.
- **The browser tier in CI** (Playwright, chromium + webkit) and the oxlint lint gate — both run on GitHub's runners, never the laptop.
- **Everything upstream shipped 0.32→1.11** that earlier rounds ported piecemeal: the 1.9 dashboard redesign, pane history from journals, images in the mirror, adaptive polling, the switcher sheet, launchers, uploads, Muse panes, and the frame-search/capture-corpus keystroke work of 1.10.

### Changed
- **Pack/crew/HA** — leads, deputies, warrants, takeover, the standby door, the crew wire: none of it compiles here. A solo bridge is the only bridge.
- **Speech-to-text** — no audio in Pup's bridge; the phone keyboard's own microphone remains the voice path.
- **The TypeScript `cli/`** — Pup's operating surface stays `scripts/collie-ctl.sh` (build / restart / update / doctor / serve) and the fork's `herdr-plugin.toml` actions. The bridge's update path is the check-only banner watching this fork's tags; `update --major` remains the consented crossing (ADR 0020).
- **Agent beacons** — without the CLI that installs them, the markers could never be written.

### Fixed
- **Android/Firefox viewport repairs** — stale height after keyboard dismiss, the CSS dvh rule, the single scroll container — and the sheet's isolated paint and early-settling dim.
- **Devin: the command catalog** (20 synced commands), the pinwheel brand mark, clipped two-label composer rules.
- **The opencode pane-scoped web adapter** ([ADR 9001](./.adr/9001-opencode-sessions-are-pane-scoped.md)).
- **Shift+Tab arrives as one raw BackTab** (`ESC [ Z`).
- **Hermes reads the schema that is actually on disk**; pi's composer prompt is bounded before the wire; `~` expands and new-space directories are validated (`~/build` no longer opens `$HOME`); multi-select attach.
- **Box-drawing tables render as tables in transcripts**; the Kitty placeholder cards are gone again and blank runs collapse ([ADR 9003](./.adr/9003-the-mirror-does-not-guess-images.md)).

## [0.47.0] - 2026-09-17

Port of the upstream 1.10.0/1.10.1 dashboard and harness work. Pup keeps its own compact
tab-strip look; the cell-level behavior (names, marks, spoken names) tracks upstream.

### Changed

- **The dashboard keeps every pane where it sits.** Panes stay in their workspace group in the multiplexer's own order, whatever their status; a pane that needs you or finished unseen is no longer pulled to the top. Urgency shows in place instead: a wash on the row, a lit workspace heading, and one summary line that counts every state in words while each heading shows the same counts as numbers.
- **A strip of workspace chips filters the dashboard.** Tap a workspace to see it alone, tap it or All to see everything; long-press to hide a workspace, and its chip stays in the strip, dimmed, still showing its status. The choice is kept per device.
- **An unseen reply is marked with a square.** A finished pane you have not opened carries a small square after its name, on the summary line, on its workspace heading and on its chip, instead of a white dot and a green wash that read as one more status.
- **The switcher mark shows a red dot when another pane needs you.** The layers mark at the belt's right end carries a red dot as soon as any pane other than the one on screen is waiting on you, and its spoken name says so. Only a pane that needs you lights it.
- **A named tab that holds one pane names that pane.** The header, the belt, the dashboard and a push now say the tab name you gave, ahead of the title Claude writes itself, which moves to the dashboard row's second line. A `/rename` and a pane label still come first.
- **The tab belt names the pane.** A tab that holds one pane shows that pane's name, so the open tab and the header read the same word, and the belt's spoken names follow what a cell draws. (Pup keeps its outlined-pill belt; upstream's underline treatment stays theirs.)

### Fixed

- **Claude's input box is found by its own frame.** A slash popup with a clipped command name, a stale box echoed above a dialog, or a statusline mark near the box no longer hides the composer or masquerades as one: the guard refuses screens it cannot read instead of guessing, and a stalled send on an 82-column pane is now a pinned regression.
- **Faint "suggested next prompt" text is no longer read as a draft.** Claude's ghost suggestion is painted dim; treating it as typed text could recover a draft you never wrote and vouch for a send that never landed. It is now classified out at the single place a draft is derived.
- **The whole input-box walk is pinned by a capture corpus.** Sixty real-screen captures at four widths run on every test pass, so a detection change shows up as a diff instead of as a stall on the phone.
- **A summary count never splits across two lines.** When five states do not fit the phone's width, whole counts wrap; a count never breaks inside itself.

## [0.46.1] - 2026-09-16

### Fixed

- Devin's two-label input-box rules (cwd + mode, queue strip) clip to one row instead of wrapping into stacked fragments on the phone (421044a1)

## [0.46.0] - 2026-09-15

The upstream **1.9.0 redesign round**, ported whole onto Pup: the composer's actions belt, the
dashboard's workspace grouping, and the one-name rule — on a branch first, so the herd on the phone
can try it before it becomes Pup's face. The cache subsystem, config.toml, crew machinery, and the
mux abstraction the redesign upstream rides on are **not** part of this port; see Declined.

### Bridge

- **One name rule, one place rule, mirrored bridge-side.** `bridge/pane-name.ts` is the push's half
  of the rule the screens use: NAME — paneLabel, else sessionName, else a non-stale terminalTitle,
  else the agent word; PLACE — `space › tab`. Shared fixtures (`pane-name.fixtures.json`) run on both
  sides, so a rule changed on one side alone turns red. A multi-agent push digest names the panes
  instead of reading "claude, claude, claude", appending the place only when two panes would read
  the same; a single alert's body is the place, not `workspace · absolute-path`. (upstream 6e8eeafc,
  15f9db67)
- **Panes arrive in the multiplexer's own arrangement.** The bridge no longer tie-breaks panes by
  pane id (an opaque string whose alphabetical order nobody can see); space, then tab, then pane
  position all read off Herdr's listing order, and a poll caught mid-create sorts last. (upstream
  6e8eeafc, on Herdr's listing — Pup does not port the mux layer upstream built this on)
- `terminalTitleStale` is declared on the wire type for the mirrored rule to read; Herdr reports no
  foreground command, so on this bridge it is never set. Known limit: Claude `/rename` session
  names are already sniffed and ride the wire as before.
- **Workspaces carry their repo.** Herdr's `workspace.list` already reports `worktree.repo_root`
  and `is_linked_worktree` (live-probed on this herd: 11 spaces, 2 with repos); the wire type now
  declares the pair and the snapshot carries it, so the web can nest a worktree under the space
  holding its repo. (upstream 6e8eeafc's worktree half)

### Web — the names pass and the dashboard's second axis

- **One name and one place, on every screen.** A pane is called the same thing everywhere — your
  label, else the session's `/rename` name, else the terminal title, else the agent word — and
  `space › tab` sits beneath it as the second line, never as the first. The fork's project-first
  row titles are superseded by this on the branch. A numbered tab reads `tab 2` in a lighter ink
  everywhere it renders alone. `lib/pane-name.ts` carries the rule once; `paneDisplayName` is
  gone. (upstream 6e8eeafc, 583e561d)
- **Rows keep the multiplexer's arrangement.** Triage buckets no longer re-sort by activity — a
  row moves only when it changes bucket, never while you reach for it. The space list keeps
  Herdr's own workspace order (same as the strip), recency sort deleted; the row still shows its
  time. Worktrees nest one step under the space holding their repo, a filtered list stays flat.
  (upstream 6e8eeafc)
- **The dashboard asks two questions, in order.** Needs-you and Ready·unseen stay pinned on top
  by urgency; everything else sits under its WORKSPACE, one counted group per space, shells
  joining their tab after its agents. An urgent pane is pulled out of its group, never copied.
  Working/Recent headings, Recent's fold and its sort toggle are gone — no clock is left in the
  order to reverse. Every row is the one 44px two-line form (name + dot and mark inline, place
  beneath), urgent rows in the same framed list shape as workspace rows, and a finished-unseen
  pane carries a small dot after its name. (upstream 64b6f499, 10cd0557, 458876bf, cd70aa30)
- Pup-shaped omissions: no host or cache chips on the name line (no crew, no cache subsystem),
  and Pup has no i18n layer, so upstream's locale strings are the literals they rendered to.

### Web — the compact strips and the pane header

- **The tab row and the pane row get compact, one continuous band.** Tabs draw as 32px plain cells
  (11px text) that still answer a 44px tap through a transparent hit-area extension; the open tab
  is an outlined pill on the row's own ground, there is no horizontal rule and nothing under the
  tab row, and the pane pills beneath shrink to 24px on the same band (`--chrome`, a new token for
  the ground chrome stands on when it cannot stand on the page). A numbered tab reads `tab N` in
  the lighter ink on the strip too. (upstream c2a16502, 02ac7a53, 0ded2d2e, 583e561d)
- **The raw pane id is gone from every pill.** `p3` is Herdr's coordinate, not a name; a pill is
  numbered only when a neighbour would otherwise read the same, and the number is its 1-based
  place in the row — the thing the reader is actually looking at. (upstream 2eefd38e, new
  `lib/pane-ordinal.ts`)
- **The pane header follows the one name rule.** Line 1 is the pane's name with the agent's mark
  on it; line 2 names the workspace alone (the tab strip below already names the open tab), and
  the cwd left the header — it lives on the dashboard's tab-scoped rows and in History. The title
  block keeps its 44px tap to the space overview. (upstream 6e8eeafc, b14ffd49)
- New `ui/labelled-strip.tsx` / `ui/section-label.tsx` primitives (the strip row's shared recipe:
  tap floor, scroller padding, above-label) and `ui/list-group.tsx` (the framed flat-row region)
  arrive with them, as upstream ships them. Pup drops upstream's per-tab agent tile on the strip.

### Web — the actions belt

- **One row of actions above the keyboard, with the running agent's own commands in it.** Keys,
  Type, Quick, Agent and the display gear share a single scrolling belt with the harness's
  commands, which sit in a segment tinted with that harness's brand colour (Claude's orange, omp's
  purple; Codex and pi are monochrome by design and take the muted ground) and carry an icon each.
  Every button sends its bare command and the harness paints its own picker in the mirror, so the
  list of models or effort levels never lives in Collie. The old Controls row and the 30px
  swipe-handle band are gone; a bare Layers mark pinned at the belt's right end opens the pane
  switcher, a drag up from anywhere on the band opens the same sheet, and the composer keeps its
  row back. Settings gains a per-device "Harness shortcuts" switch (on by default).
  (upstream fc8d1be9, 9b530786, 5e7f626c, 63513aee, 931f857a, adaa1fb3 + the belt's follow-ups,
  ported as the end state)
- **Operators add or replace the segment with `bar = true` in `commands.toml`**, with an optional
  `bar_label` (twelve characters kept whole). The replacement rule is per surface (ADR 0018's
  posture, applied to the bar alone): bar rows never blank the Agent palette, and a shipped
  dangerous command's two-tap confirm is inherited as a floor. (upstream fc8d1be9)
- **Pup-shaped limits, stated:** the belt carries no host tag and no cache reading (no crew, no
  cache subsystem); the composer's verified-paste transport, guarded submit, draft previews and
  docks are untouched — only the row that held their toggles changed shape; omp's Tree button
  stays off the bar until this repo holds an `omp--tree.txt` capture to vouch for it (upstream
  cc38c2de's own rule, followed rather than shortcut).

### Web — the keys tray

- **A compact seven-column Keys pad.** One fixed grid, two rows — Esc/Tab/⇧/Ctrl/Alt/Up/⏎, then
  Ctrl C / a 3-wide Space / ← ↓ → with Down under Up — replaces the Keys/123 segmented toggle and
  the stacked rows. The digits, the Ctrl presets and F1–F12 fold behind one row of accordion
  chips (123 / Presets / F keys, one panel open at a time). The tray's resting height drops from
  ~275px to ~119px at 390px with every key still ≥36px tall; Enter and Shift draw glyphs with the
  full word as the accessible name. A composed key queue still dies with its dock (ADR 0005) and
  still survives switching to the digit grid mid-chord. (upstream e12b4334)

### Declined (this round, with reasons)

- **The prompt-cache subsystem** (~6,400 lines upstream): countdown chips, cold-cache push
  warnings, dated vendor TTL claims, `cache-rules.toml`. A feature, not a fix, and still settling
  upstream (six follow-up fixes in the days after 1.9.0). Revisit once quiet.
- **config.toml + `collie config show/check/init`** (~3,000 lines): a config layering machine for a
  single-user install that has `.env`.
- **The crew/mux substrate**: protocol floors and compat removals, host-keyed grouping, the mux
  adapter layer the redesign upstream rides on, tmux auto-rename. Pup is one host on Herdr.
- **The first-launch screen**: onboarding for a fresh install, shaped around crews.
- **Screen slide transitions, tour, playground, i18n**: polish and scaffolding Pup doesn't carry.
  Upstream's locale strings landed as the literals they rendered to.
- **omp's Tree bar button**: waits on an `omp--tree.txt` capture in this repo's corpus (the same
  rule upstream held it to before their capture existed).

### Fixed

- **Devin panes get their mark.** A devin pane rendered the generic "DE" initials tile on every
  surface (dashboard row, pane header, switcher) — the brand table had no entry and the resolver
  no rule, so it fell through to the fallback. Devin's own pinwheel mark now rides a black tile
  with a white fill, monochrome like Codex's and pi's (no belt accent — its absence is a real
  answer for a monochrome brand). Source: the SVG Logos collection (CC0), rescaled from its
  256×294 viewBox to 24×24 and centred; verified rasterized at render time — ink box dead-centre,
  53–61% tile coverage, no clipping. Tried from the phone on day one of the redesign trial.

- **Sheets no longer pick up stale terminal paint while sliding in.** Both floating panels (the
  switcher and Agent commands) showed bands of terminal output across their surface during the
  entrance, gone the next frame — the animated sheet shared its paint with the filtered mirror
  layers beneath. The panel is now one isolated paint boundary, promoted for the life of the
  sheet (f770a73d); and the dim settles before the slide — a 150ms ease-out scrim on its own
  compositor layer, so the panel moves against a stable ground instead of a dim still mid-fade
  (7fbfad84). Found on the phone during the redesign trial.

### Fixed (upstream round, ported 2026-09-16)

- **A plugin action resolves the service's state directory** (upstream #226, d07ec4c4). Herdr
  injects `HERDR_PLUGIN_STATE_DIR` into every plugin action; the systemd service never receives
  it. Honouring it split one install in two: push-test, pairing and devices — every verb that
  reads or writes state through an action — read `~/.local/state/herdr/plugins/herdr.collie`,
  found no subscriptions, and failed, while the service kept them under `~/.local/state/collie`.
  `resolveStateDir` (now pure and exported, like `defaultSocketPath`) reads `COLLIE_STATE_DIR`,
  else the user state dir, and ignores Herdr's variable on purpose.
- **A finished agent that Herdr reports as `idle` reaches Ready · unseen** (upstream #222,
  769cdaa8). Herdr 0.9's API says `idle` for an agent whose turn ended; only its own client
  projects `done`. `isUnseen` now accepts either settled status, gated by our own read receipts
  and excluding bare shells; and only a turn that ends (`working`/`blocked` → idle/done) counts
  as new work, so Herdr's own acknowledgement and detection flicker never re-mark a read pane.
  The ledger wiring moved to `bridge/activity-tracking.ts` so the gate has one home. ADR 0003
  and HERDR_API.md carry the compatibility note.
- **Light fills match by luminance, not by one observed value** (upstream #224, 6fb0f1f5 +
  ebd63ffd). Codex's submitted-message band was matched against the literal `rgb(240,240,240)`,
  and a 0.154.0 pane paints `rgb(244,244,244)` — four levels apart, so the whole band inverted
  to a black bar again. The rule moved to `lib/harness/light-fill.ts` (Rec. 709 luma, Codex's
  floor 220, omp's 180), shared by both adapters; a real 0.154.0 capture pins the shape. omp's
  belt of pastel card fills now gets the same marking on Pup for the first time — upstream has
  marked them since before the fork point; Pup's raw-only omp path just never carried it.
- **The belt stands at 40px, and the field's focus ring clears it** (upstream a0ae39e7). The
  belt's scroller reads `py-1` — 40px on the phone instead of a thin 32px strip; the harness
  section grows to `h-10` with `-my-1` so its tint still runs rule to rule; and the field row's
  `pt-1` is the one place that puts the focus ring's 4px reach inside the row rather than on the
  belt's bottom edge.

## [0.45.0] - 2026-09-12

### Changed

- **The mirror no longer guesses at terminal images; the black box is gone.** The Kitty
  placeholder→journal-image cards only ever worked for harnesses that print placeholder characters
  into the grid (omp does; pi paints a direct `a=T` placement that reaches the pane read as blank
  rows). For pi that meant a tall black void and dead machinery; for omp it meant a picture matched
  by order, never verified. The mirror now renders only what the read contains: runs of four or
  more blank lines collapse to a single `[N blank lines]` row — which is exactly what a pi image
  reservation looks like — and History keeps the exact journal images it always had
  (.adr/0041). Deleted: `useMirrorImages`, `mirror-images`, the `images`/`onImageClusterCount`
  props, the `[Image]` badge and cards. (c50fc562)

## [0.44.1] - 2026-09-12

### Fixed

- **Review hardening of the 0.44.0 port round: the Hermes adapter reads the schema that is
  actually on disk.** A real `~/.hermes/state.db` on this host carries a `messages` table with
  none of the four optional columns upstream's SELECT names (`reasoning_content`, `active`,
  `compacted`, `display_kind` — upstream's own fixture builds its table from the adapter's
  SELECT, so their tests cannot see the drift either; report pending). The SELECT is now built
  from the database's own column list, both observed schemas read, and an unknown schema throws
  out of `load` — the history route answers an error instead of an empty page that looks like
  "no history". `resolve` stays tolerant per root (an unreadable `sessions` table disqualifies
  the root, not the request). The read-only open is pinned twice in tests (no-create on an empty
  root; a 0444 database still reads), and `scripts/journal-probe.ts` learned the hermes branch —
  without it the mandated drift check could not see the sixth adapter, which is exactly how the
  drift shipped. Live probe on this host: `hermes ✓ 2 turns` off the real database.

## [0.44.0] - 2026-09-12

### Added

- **Hermes panes get transcript history.** The sixth journal adapter reads Hermes' one SQLite
  SessionDB (`~/.hermes/state.db`, `COLLIE_HERMES_ROOT` to relocate) through the exact Herdr
  session id — never the newest row — including compressed parent sessions, walked depth-first
  and capped at 32 generations. The database is opened read-only and the fixed filename is
  confined to the configured root before opening; Collie never writes Hermes state. The SELECT is
  built from the database's own column list, so both observed on-disk schemas read
  (live-verified against the real thing), and an unknown schema fails loudly instead of serving
  an empty history page. `omp` stays an alias of pi, not an adapter. (upstream 85e0da5e,
  33f54224, 801f879a, with a review fix for a schema drift upstream's tests cannot see)

### Fixed

- **A second tap escapes the update that keeps coming back stale.** When the eight-second guard
  behind "new build — tap to update" reloads the page and the phone comes back on the same old
  bundle, the next tap now unregisters the service worker and reloads from the bridge instead of
  repeating the identical cycle. The caches go first and nothing waits on the worker (unregister
  queues behind the very job that is stuck); the escape fires only while the page is provably
  stale and the bridge answered within the last 20 s, so an offline install keeps its precache
  and its stale bundle rather than landing on an error page. (upstream bb095e3a, web side only —
  the Playwright suite stays behind)
- **`collie serve` no longer refuses to publish when it cannot read the HTTPS status.** A
  `tailscale status --json` that fails or does not parse is "can't tell", never "no HTTPS": the
  publish proceeds with a warning naming the admin console. A readable status with no CertDomains
  still refuses, exactly as before. (upstream 0062b91, adapted to the shell door)
- **A long strip reveals its active tab.** The tab, pane, and space strips are hidden-scrollbar
  scrollers; the active chip could sit scrolled out of view with no affordance. All three now
  scroll the active chip to the nearest edge on selection change — never on a manual scroll, and
  `auto` (not `smooth`) under reduced motion. (upstream 8a774cc4; the `labelled-strip` hunk has
  no target in Pup — Pup's strips own their scroller directly)
- **The footer build stamp stops re-fetching `/api/config` on every dashboard open.** The mount
  effect now checks whether the build is already known before fetching; a known build needs no
  second look. (upstream e3c7816e)

## [0.43.2] - 2026-09-10

### Fixed

- Multi-select attach: the picker's two inputs now declare `multiple` and the composer uploads the
  whole batch — one POST per file (the bridge's existing contract), each landed path appended to
  the draft in picker order — so attaching six images is one gallery trip instead of six. A mixed
  batch attaches the good files and names the refused ones in one status line (identical refusal
  phrases collapse; the error tone persists until tapped). Pasting several files at once rides the
  same path. This was never a PWA/Firefox/Android limitation: the phone's pickers have offered
  multi-select all along — the page just never asked (`multiple` absent, and the change handler
  read `files[0]` and dropped the rest).

## [0.43.1] - 2026-09-09

### Fixed

- Review hardening of the 0.42.0/0.43.0 port round: the pi-shaped omp editor's prompt region is
  bounded to its trailing rows (an unbounded ~101-row region on a wide pane would exceed the
  bridge's 8192-char `expected_prompt` cap and fail-closed the submit of a long reply — upstream
  carries the same latent bug); `imageSrc`'s refusal of remote/malformed image references now has
  its own test, as do transcript journal images (anchor affordance + refused-ref-renders-nothing);
  `resolveBlobPath` uses the single-root containment spelling files.ts documents for paths built
  from a root; and the registry's alias doc no longer claims a frontend mirror list Pup never had.

## [0.43.0] - 2026-09-09

### Added

- Images in the mirror: an agent's terminal graphics (screenshots it took or was shown, drawn with
  the Kitty protocol on a capable terminal) now render in the pane in place of the placeholder
  block. Read from the agent's own session log, on demand — never on the poll. Matched by order
  from the end; a cluster with no match gets an "[Image]" badge, a failed load falls back to it,
  and every card says the match is by order (upstream fd28d018, fbae4cf6, 8e8cf78a, ba8e19a0,
  797318d6).
- `GET /api/blobs/<hash>` serves the content-addressed image bytes out of pi/omp's blob store:
  16 MiB cap, magic-byte content sniffing (the digest filename carries no extension), the hash as
  ETag, immutable caching, and containment-checked paths. A journal image reference is only ever
  this bridge's blob path or inline `data:image/` bytes — an `http(s)` URL in an agent's log is
  refused on both the bridge and the web side.
- omp panes have journal history: omp writes pi's own session format under
  `~/.omp/agent/sessions`, so the pi adapter reads it (an alias, not a sixth adapter), and pi's
  default roots now cover both homes.
- History and the Full-reply card render journal images — attachments, spoken pictures, and
  tool-output screenshots — as anchors with alt text.

## [0.42.0] - 2026-09-09

### Added

- The pane shows the agent's newest reply in full when the terminal clipped its opening: read from
  the agent's own session log, rendered in place of the rows it covers (everything below — tool
  calls, dialogs, the cursor — untouched), collapsible per message, off via "Full latest reply" in
  the ⚙ View dock (upstream 46d2fe6).

### Fixed

- omp panes drawn with `composer.shape=pi` (OMP 18.1.13) verify again: the pi-shaped editor is
  recognised for drafts, status and prompt binding, Korean and multiline drafts extract correctly,
  and an unaccepted inline completion stays out of the live draft (upstream 47369fb).
- Long omp replies travel as small verified pastes instead of one opaque chip: omp collapses big
  pastes into `📄 #N` chips that carry no content evidence, so the reply guard now plans ≤512-char /
  4-line chunks, verifies each on screen before the next goes out, and only the complete reply can
  authorise Enter — a dropped final chunk stalls, never submits (upstream 47369fb).
- A link inside a clipped terminal row (a labelled rule carrying a URL) no longer re-wraps that row
  on Firefox: the clip span now outranks the link style's `break-all` (residue of upstream PR #168,
  4b995f8).

## [0.41.1] - 2026-09-09

### Fixed

- The pi command palette was missing `/thinking` — pi's built-in command list has 23 entries, the
  shipped catalog had 22, and the one gap was the thinking-level switch. Now surfaced as a common
  row (one tap opens pi's fuzzy picker), next to `/model`.
- The Devin catalog drifted behind the current docs (docs.devin.ai/cli/reference/commands): 20
  newer commands were absent (`/fast`, `/fork`, `/steps`, `/revert`, `/title`, `/btw`, `/mcp`,
  `/context`, `/usage`, `/session-stats`, `/theme`, `/autonomous`, `/shortcuts`, `/config`,
  `/org`, `/copy`, `/feedback`, `/mouse`, `/login-status`, `/cloud-sessions`). All added; `/fast`
  joins the common set, `/revert` gets the two-tap confirm (it rewrites files and the
  conversation). Deliberately still out: `/rm-session` (irreversible) and pure aliases
  (`/rename-session`, `/remove-dir`, `/stats`, `/yolo`…). `/thinking` stays out too — Devin has
  no such command (the thinking trace is Ctrl+O, a keybinding). `/handoff` stays in: it fell off
  the docs' reference table, but the CLI changelog still ships changes to it.

## [0.41.0] - 2026-09-08

Three upstream viewer changes ported fix-first, plus a durable porting ledger. Declined with
reasons: the rename tab/pane sheet keyboard-folding fix (93373ce) patches a strips-auto-fold-on-
keyboard subsystem Pup never adopted, so the bug cannot manifest here. See `PORTING.md` for the
full porting record.

### Added

- Adaptive mirror polling (upstream d2cb8a3): the poll cadence is now resolved from what the
  operator is doing, not what the herd is doing — a 300ms burst after a send, 1.5s while following
  a moving pane, 4s on a busy home screen, 6s when nothing is being watched. A tap reads as
  immediate, and a quiet pane nobody is looking at backs off. The burst bookkeeping lives in a
  new `lib/poll-intent.ts` (pure, tested in isolation); send stamps land in the composer's Send,
  `pressKeys`, and the prompt-option handler, and the pane loader reports whether the mirror
  changed. The `changed` verdict is pane-scoped so a poll from pane B can't leak into pane A's
  cadence.
- The omp (oh-my-pi) π mark (upstream 17386ef): omp now renders its official three-stop gradient
  on a `#0F0A14` tile instead of falling back to a generic initials chip. Per-mounted SVG
  gradient IDs via `useId()` keep a dashboard column of tiles from colliding.

### Changed

- The fresh-install mirror font default is 10px, down from 12px (upstream 4b005aa), for phone
  readability. Existing devices keep their saved preference — the storage key is unchanged.

## [0.40.0] - 2026-09-07

The upstream 1.5.5–1.6.0 round, ported fix-first (no pack, no packaging, no new surfaces of
theirs). Declined with reasons: the exe-replacement check (this fork runs Bun from source, so
the source-stamp staleness witness already answers it), the multi-instance plugin-id fix (no
instances here), the dismissed-version memory, and the zen / latest-reply / AnchoredMenu /
Collapse / update-card subsystems the fork never had.

### Added

- The attach button asks Photos or Files behind a two-row sheet: one `accept` cannot carry
  `image/*` and the text extensions at once, or both Android and iOS drop the camera roll. A
  photos-only host opens the roll directly, and every tap gets a buzz plus a pressed tone
  (9fa55a7; the AnchoredMenu refinement has nothing to anchor to here)

### Fixed

- Codex's inline queue/context footer reads as a live composer again, so the guarded reply stops
  stalling there (0ad4f2f)
- OMP 18.1.6's borderless rule composer is recognized by its own tail-choreography scanner, so
  replies, drafts and the statusline survive the new shape (72fbfec + 67b72e3)
- The guarded submit carries the verified prompt region, so a dialog that takes focus between
  typing and Enter is refused instead of answered (e7c1c78; the bridge binding already existed)
- A failed notification setup refreshes and releases the switch instead of wedging it busy, with
  the error beside the switch and a retry; plus a 30s cap on stalled phone operations,
  registration through the API client, and an unreachable config reading as retryable (6fa2694)
- The https door refuses before teardown on a tailnet with no HTTPS, naming the admin console or
  plain-HTTP mode, instead of hanging on a hidden prompt (da8afeb)
- The session-name scrape skips panes whose content revision hasn't moved: O(claude_panes) pane
  reads per poll becomes O(changed) (198fe20)

## [0.39.0] - 2026-09-07

The two operator features from the upstream 1.4.0–1.5.4 round, fork-shaped (single host, no
pack, no i18n). Both are off until the operator declares them — an install with neither file is
byte-for-byte the dashboard and headers it had.

### Added

- Text-file attachments: the composer paperclip takes `.md`/`.txt`/`.json`/`.yaml`/`.toml` as
  well as images, within `COLLIE_MAX_UPLOAD_MB` (default 10) and `COLLIE_UPLOAD_EXTRA_TYPES`
  (8c8845d, upstream e1493f4 + 9833ba3)
- Your own launchers, declared in `launchers.toml`: one tap opens a new Space, types the row's
  command into its fresh shell and sends Enter. The file is the allowlist — `POST /api/launch`
  matches the command string exactly before herdr is touched, and a failed send rolls the
  half-born Space back. Rows appear as a folding Launch section on the dashboard and behind the
  rocket button in the Space and pane headers (see README → Your own launchers)

## [0.38.0] - 2026-09-07

The upstream 1.4.0–1.5.4 viewer round, ported fix-first (no pack, no staged updates, no mux
switch, no i18n). The two operator features from that round — text attachments and launchers —
ship in 0.39.0, below.

### Fixed

- A notification tap opens the app again on Android after the 1.x service-worker rewrite regressed it (c34004c, upstream ecee7c2)
- Release tag reads stay on HTTPS when git rewrites them to SSH: `update`'s version check uses an `https::` transport prefix for GitHub remotes (48f6bd3, upstream b3bd127)
- The new-tab and new-Space controls show they heard you, and a second tap is refused while the first create is in flight (a4dc8fb, upstream d03ccd7)
- An over-drag on the mirror list can no longer chain into the page behind it: the list contains its own overscroll (4fec3eb, upstream 7b77d7c list half)
- A truncated connection error opens on a tap, with the whole message and a copy button (0bcb730, upstream 747afaa)
- One classifier clips a labelled terminal rule whatever harness drew it, and codex's submitted rows stop reading as black bars on a phone (d406962, upstream 0104d27 + d980f37)

### Changed

- Tables in the mirror pan as one unit inside the wrap, keeping find and link coordinates (3792b68, upstream 8d079ff)
- The Switch-pane sheet rises from the handle and follows the thumb, with a haptic tick past the dismiss line (a6d2248, upstream 5bfa631 sheet half)
- The pane and history screens sit in a centred column above phone width — 768px for the 80-column mirror — instead of stretching full-bleed (858f0c8, upstream 28255ae + 3870c1c)

## [0.37.0] - 2026-09-03

Ported from upstream 1.x (fix-first; no pack/HA, no ASR, no new front door).

### Added

- Claude's slash-command completion popup is lifted out of the mirror and rendered as a list — it used to hide the input box from the box walk, so every send stalled with "Message didn't reach the input box" (b17964e)

### Fixed

- Boxed TUI rows (`/model` pickers, panel borders) stay on one clipped line on a narrow phone instead of wrapping into a scrambled frame; `tree` output and prose still wrap (12f1aba)
- The mirror no longer freezes when the soft keyboard or Keys dock shrinks the pane: a scroll arriving with a changed container height is layout, not the user leaving the bottom (4fd91e0)
- A notification tap on Android opens the deep-linked pane again when the Collie tab had been discarded (12bfbb6)
- Android push shows a proper small badge glyph and a full-size mark instead of a grey block (b40cc11)
- omp ghost suggestions are read by relative colour, so a WORKING pane (where omp 18 colours the whole draft) no longer stalls every send; OMP 18.1.2's clipped `╰─ <draft>` composer shape is recognized (3bbba93)
- Codex: a dim one-segment status row is recognized (4f9eda0); a draft wrapped onto an indented continuation row locates its composer (763c754)

## [0.36.2] - 2026-09-03

### Fixed

- The update banner watches this fork's tags, not upstream's — upstream's new 1.x major was advertised with a remedy the fork's `update` verb can never take, and every future Pup release was invisible to it (upstream 0.x is frozen at their 0.36.1) (7f07174)
- `update`'s non-git-checkout remedy and the README install commands point at `bermudi/collie`, not upstream (7f07174)

## [0.36.1] - 2026-08-29

### Fixed

- New space/tab directory: `~/…` now expands against home and the path must exist — `~/build` used to silently open `$HOME` (96e94d8)

## [0.36.0] - 2026-08-28

**Merges upstream 0.36.0 and upstream 0.35.0's security hardening — read the BREAKING block before updating.**

- `COLLIE_PUBLIC_HOSTS` is now **required** on every reverse-proxy or tunnel install (Variant C/E) — Host validation fails closed.
- With `COLLIE_TRUSTED_USER` set, a request carrying no `Tailscale-User-Login` is now rejected; tagged nodes used to pass.
- A non-loopback `COLLIE_HOST` refuses to start.
- Opt-outs, one per gate: `COLLIE_ALLOW_ANY_HOST=1`, `COLLIE_TRUSTED_USER_OPTIONAL=1`, `COLLIE_ALLOW_NON_LOOPBACK_BIND=1`.

### Added

- **AGY (Antigravity CLI) first-class harness adapter** — ask_question menus, permission, plan and trust dialogs lifted into native buttons, boxed composer stripped with status row re-surfaced, slash-command palette, brand icon (4285457)
- **Codex: large sends verified through the `[Pasted Content N chars]` placeholder** — the exact character count is the evidence Enter waits for, per ADR 0010 (1ca57f1)
- **`quick-replies.toml`: your own Quick-dock groups** (title + items + optional `scope`), live-reloaded, replacing the shipped phrases on the panes they address per ADR 0018, shell panes reachable via `scope = "shell"` (eb1e92f) — thanks @fucx (#131)

### Changed

- Host-header validation is on by default and fails closed; `collie-ctl.sh` injects the tailnet name and IPs, `COLLIE_ALLOW_ANY_HOST=1` opts out (5f01bf7) — thanks @bartholomewtj (#129)
- `COLLIE_TRUSTED_USER` rejects a missing `Tailscale-User-Login` as well as a mismatch; `COLLIE_TRUSTED_USER_OPTIONAL=1` restores the old pass (5f01bf7)
- A non-loopback `COLLIE_HOST` refuses to start unless `COLLIE_ALLOW_NON_LOOPBACK_BIND=1`; non-loopback TCP peers are rejected (5f01bf7)

### Fixed

- **Sign-in banner instead of “Can't reach Collie” behind a forward-auth proxy** — an expired session answered with a 3xx is read as a 401, and Authentik's `/outpost.goauthentik.io/` paths bypass the PWA cache (4ca1462)
- **Codex CLI 0.150.1 recognized again on both status rows** — Context-bearing and two-field default shapes, keyed on the row's renderer paint, never field names (0ed3fd5, ffbc995)
- **Codex destructive writes bind to the whole wrapped draft**, not only the first `›` row — no more 409s on pre-clear sweeps for wrapped drafts (47410a1)
- **Codex: the dim “Ask Codex to do anything” placeholder is empty**; the same words typed are a draft (c58ba36)
- **AGY: a bare `>` transcript row is never taken for the composer** — only the boxed composer counts, so an echoed message cannot authorise a reply into a running turn (8c02522)
- Uploads are typed by magic bytes, not the client-supplied Content-Type — `__proto__` and `constructor` used to pass the MIME lookup (5f01bf7)
- `collie-ctl.sh` parses `.env` as key=value instead of sourcing it — a `.env` with `$(…)` or backticks ran as the operator on every verb; an unquoted trailing `# comment` is now stripped (5f01bf7, 9195e00)
- An unversioned managed checkout pins `update` to the newest release tag, never origin HEAD (5f01bf7, 4440c05)
- A failed `tailscale status` no longer writes an empty host allowlist into the unit — the unit keeps the hosts it had, and says so (9195e00)

### Known limits

- Codex keeps only the first 1,024 characters of one send: a longer message shows as `[Pasted Content 1024 chars]` and the guard refuses to press Enter rather than submit a cut message; a send is never chunked (ADR 0010)
- While a Codex turn runs, the composer paints a `»` marker the adapter does not yet recognise, so a mid-turn reply is refused, never mis-sent

## [0.35.2] - 2026-08-26

### Fixed

- **Box-drawing tables render instead of shredding** — TUI tables (`┌─┬┐`) from any agent lift out of the mirror into a pan-instead-of-wrap region, and the transcript's markdown parser now reads them as real tables; verified on a live Devin pane at phone width (ca46ffe)

## [0.35.1] - 2026-08-25

### Fixed

- **opencode adapter handles far footer (Tip + cwd)** — throw-away `1.18.22` pane kept `~/build/collie:main` 22 rows below the `╹▀▀` box, outside the 8-row tail window, so `locateComposer` returned null and the red `input box isn't on screen` banner stayed (92cf018)

## [0.35.0] - 2026-08-25

### Added

- **opencode first-class harness adapter (Tier-1)** — composer chrome stripped with Build/status re-surfaced, draft extraction (single + wrapped), idle/draft/working/done fixtures (Pup) (92cf018)

## [0.34.0] - 2026-08-24

### Added

- `COLLIE_SERVE_PORT`: publish the https front door on a chosen tailnet port — several Collies per host (#98) (c02e3ea)
- **Codex CLI first-class harness adapter** — boxless composer chrome stripped with the status row re-surfaced, folder-trust prompt, exec approvals and `request_user_input` question cards lifted into native buttons (by @kennymcavoy) (e5fab3a)
- **Grok Build first-class harness adapter** — composer chrome stripped with the status strip re-surfaced, permission cards, `ask_user_question` radios/wizards and plan approval lifted into native buttons, plus a Grok session-journal adapter (by @kennymcavoy) (bd01e51)
- **Devin harness slash catalog** — `/Agent` palette + `AGENT_FAMILIES` (Pup) (0c58737)
- **`doctor` phone-setup check** — VAPID/host-filter/push/ Herdr socket + 5-step phone checklist as `herdr plugin action invoke doctor` (Pup) (b39656a)
- **Collie Pup fork charter** — `herdr-plugin.toml` display name `Collie Pup`, `AGENTS.md` stable-fork charter (Pup) (50931a2 / 3000ce2)

### Fixed

- **omp replies no longer stall on an inline completion suggestion** — the ghost omp paints after the typed text is dropped from the draft the send guard verifies (by @enieuwy) (bdfac02)
- **Codex adapter review fixes** — drafts wrapping past 8 rows keep the composer, and the persistent "don't ask again" approval row stays visible in the mirror (d469507)
- **`journal-probe` checks each root on its own** — a populated healthy root can no longer hide a broken sibling (by @kennymcavoy) (6f68677)
- **Shift+Tab sends BackTab `ESC [ Z`** instead of bare Tab `0x09` (Pup) (3bfd767)
- **Single scroll container + Firefox viewport fix** — `html/body/#root overflow:hidden`, `ViewportFrame` skips VisualViewport hack on Firefox and scrolls only the list inner `overflow-y-auto` — eliminates double scroll / header clip / white gap (Pup) (4cec1bc / 8fc4ae0)
- **Web Push default-on** — `ensure_push_keys` auto-generates VAPID on first start and `shouldAutoRepairPush` repairs when permission granted (Pup) (e760720)

## [0.32.1] - 2026-08-23

### Fixed

- **`url` (and `status`/`qr`) honour `COLLIE_PUBLIC_URL`** instead of always inferring the bare tailnet name with no port (#122) (859610d)

## [0.32.0] - 2026-08-19

### Added

- **F1–F12 in the Keys tray, behind an "F keys" disclosure** — chords with armed modifiers included (#119 by @martin-tahli) (09b0571)
- **`keys.toml`: your own Keys-tray preset rows** (label + chords + optional `danger`), live-reloaded, replacing the shipped presets on the panes they address per ADR 0018 (c02ab19)
- **The update gate (ADR 0020)**: a routine `update` follows release tags within the installed major; crossing a major takes explicit consent — `update --major`, wired as the `update-major` plugin action (633b2a1)
- **The update banner says which kind of behind you are** — an in-major release, or a pending new major with the consent command (a38df8c)

### Fixed

- **A cold boot with no network renders the cached last screen**, dated "last seen HH:MM" — never a false "No agents" (0f4c651, c473aa0)
- **A stale pane mirror is dated by its own stamp, not the herd's** (1042fe0)
- **The linked-clone major gate judges the branch's own upstream (`@{u}`), not the remote default branch** (99910cf)

## [0.31.1] - 2026-08-18

### Fixed

- **A long request survives socket backpressure** — Bun's socket accepts fewer bytes than it is handed under pressure and queues nothing; the dialer now parks the tail and resumes from `drain`, so a big request can no longer silently truncate and die on the timeout (cc810c9). Probed while fixing: herdr drops any request line of 1 MiB or more — now in `HERDR_API.md`

### Changed

- In-code pointers name `DEPLOYMENT.md` now that variants B–E live there (cd2f1f8); `COLLIE_MULTI_SESSION` spelled `on`/`off` everywhere; `push-keys`/`push-test` listed in the Commands table (ee64069)

## [0.31.0] - 2026-08-18

### Added

- **`push-keys` generates the VAPID keypair and writes it into the right `.env`** — Web Push setup is now three plugin actions (`push-keys` → `restart` → subscribe), no manual key wrangling (85f0454)
- **"Tap to type" can be turned off** — a display setting stops the mirror volunteering the keyboard on a tap; on by default (357b86f)
- **`COLLIE_AUDIT_CONTENT=none` keeps the audit trail and drops the bodies** — a fail-closed allowlist keeps action parameters legible while anything operator- or screen-originated redacts (#107, 5dda876, cdad445) — thanks @shuangwangnyc
- **Your own slash commands in the palette, declared in `commands.toml`** — on a pane your rows address they replace the shipped catalog (ADR 0018); `confirm = true` adds a two-tap; edits are live, no restart (#109, 35da673, 28bdf5a) — thanks @enieuwy

### Fixed

- **⚠ A paste too big to persist no longer restores an older, shorter draft after a remount** — oversize drafts now ride an in-memory tier whole, never truncated and never swapped for stale text; they survive pane switches but not closing the app, and the composer says so (7965674)
- **A half-arrived long send is no longer accepted as send evidence** — when the input box ends in literal text it must be the end of what was sent, or the guard refuses to press Enter (#110, 27f4cdf)
- **Direct typing no longer owes a "mode stopped" notice to the next pane**, and the blur it schedules is settled by cancellation instead of racing a re-arm (#108, 452da20, 1a2ca49) — thanks @enieuwy

### Changed

- **README cut to ~60% of its length, how-first** — deployment variants B–E now live in `DEPLOYMENT.md`, and troubleshooting entries are findable by the words you'd actually search (9464c14, c52d4af)

## [0.30.0] - 2026-08-16

### Added

- **A password prompt says what it is and offers the control that works.** `sudo`, an SSH passphrase and `gpg` echo nothing, so Send's verification can never arrive — the refusal now names that and hands off to **Type** in one tap, instead of "a menu or dialog is probably up" (#103, 1334540)

### Fixed

- **A password typed into the composer is no longer kept for 48 hours** — recognising the prompt drops the stored draft and stops persisting keystrokes; the write-through had stored it before any send was attempted (#103, 1334540)

## [0.29.0] - 2026-08-16

### Added

- **The plan dialog's feedback row has a route from the phone.** Row 3/4 is a text input, not an option: Collie now models it, locks the other buttons while the terminal owns it, and sends feedback through the guarded choreography — digit, verified paste, bound Enter (#95, c0ce09e, 967e94d, 64de1d4) — thanks @navidkashani
- **A pane is named by what its process says it is doing** — its OSC title, glyph-stripped and dropped when it only repeats the agent or project — so a project's herd stops reading as N identical rows (#100, 9dbc0fe) — thanks @praneetrohida

### Fixed

- **A long plan-feedback value re-flows across lines instead of windowing** — the value is rebuilt from continuation lines and the footer gap widened, so a 355-char value no longer makes the whole dialog vanish (#95, 64de1d4)
- **A shell's `user@host:cwd` title is a locator, not a name** — it no longer replaces the row's cwd with a longer restatement of it (#100, 982b8e1)
- **A push re-subscribe replaces the row it supersedes**, and each row records when and from which browser it was made — Apple keeps answering 201 for an orphaned endpoint, so this is what stops `push-subscriptions.json` growing forever (#104, 0021300)

## [0.28.0] - 2026-08-12

### Added

- **omp gets a harness adapter (Tier 1)** — read-only blocks by construction, its own composer chrome stripped, a slash palette sourced from its captures — a reply stops confirming its pickers (#93, b98b90d) — thanks @qaz74107410
- **Every `COLLIE_*_ROOT` (including `COLLIE_TRANSCRIPT_ROOT`) takes a comma-separated list**, so pane history works across multiple `CLAUDE_CONFIG_DIR` profiles (#92, b549101)
- **`contrib/windows/`** — a community-maintained Task Scheduler lifecycle for Windows (#71, 8572e49) — thanks @Pimpmuckl

### Fixed

- **Update-available pushes to Apple devices never arrived — broken since 0.11.0.** The Web Push topic was an impossible base64 length and APNs refused it; herd alerts were unaffected (#90, 19572d7) — thanks @ojulean
- **The destructive pre-clear sweep now fires only after a live read positively sees the composer**, bound to the prompt it saw — a dialog opening in the gap can no longer eat the burst (#93, 6c8332f)

## [0.27.0] - 2026-08-10

### Added

- **`collie-ctl.sh qr` prints the tailnet URL as a scannable code**, so a phone doesn't have to type a MagicDNS name — opt-in as its own subcommand, since a PWA only needs the URL once. Corrects two defects in the renderer it uses: its filled glyph is a *light* module, so the compact output inverts on a light terminal, and its quiet zone is 1–2 modules where the spec asks 4 (#88, ff84538) — thanks @adrgarcha
- **`start` and `status` say when this node's packet filter admits no peer**, instead of printing the tailnet URL under a green ✓ that no other device can open — the local probe only ever sees loopback, which never touches the filter. Best-effort and deliberately unsure: it speaks up only on a total deny, and stays silent whenever it can't tell (#87, 82bbe0e) — thanks @adrgarcha

### Fixed

- **Idle Claude panes no longer scroll up and snap back on every poll** — the session-name sniffer read `recent`, which on a pane shorter than the read makes Herdr scroll a full-screen agent to reach the rows above it; it reads the visible grid now (#85, dab122e) — thanks @OowhitecatoO
- **A lapsed session behind a redirecting identity proxy shows the Sign-in banner** rather than "can't reach Collie" — API requests now carry `X-Requested-With`, so a proxy answers 401 instead of a 302 that `fetch` follows into an opaque CORS failure with no status to classify (#86, 0dc852e) — thanks @ojulean

## [0.26.0] - 2026-08-10

### Added

- **Type into terminal** — a toggle beside Keys in the Controls row sends what you type straight to the pane as keystrokes, no trailing Enter, so a TUI that wants bare letters (`b`, `q`) can be driven from a phone. Ordered and batched, so a slow tailnet grows the next batch instead of scrambling characters; it never survives a pane switch, a lock, a hidden page or a failed batch (#74, 7dea503) — thanks @aspiers
- **GFM tables render as tables** in Conversation history instead of collapsing into one run-on paragraph — recognised by their delimiter row, alignment and ragged rows included. A table nested in a list or blockquote still collapses: the block parser is flat, and agents put tables at the top level (#72, d82ef1b)
- **Nerd Font symbol glyphs stop rendering as tofu** — two subset woff2 faces ship with the app, fetched only when a pane actually paints a private-use glyph (`unicode-range`) and deliberately kept out of the precache (#70, d31d97d)
- **A quick Ctrl+C in the nav tray's Esc/Up gap** — one tap, without opening Presets (#75, d139b1b) — thanks @Jarva

### Changed

- **A long terminal rule clips at the mirror edge** instead of wrapping into several rows; its full text stays in the DOM, and ordinary output keeps wrapping normally (#79, 4480019) — thanks @en-ver
- **The composer row reads its own state** — an open dock or an armed mode carries a light-sky tint instead of a grey surface, the attach button moves inside the text field, and the "Controls" tag floats above the row so four labelled toggles fit a 390px phone unclipped (57080f5)

### Fixed

- **Sends stalled on a narrow pane with "Message didn't reach the input box"** — the guard located Claude's input box by a run of 20 rule glyphs, which is a hidden assumption that the pane is at least 20 columns wide; it now measures display cells, and the wrapped-draft scan reaches past a long CJK draft (#76, de88b38) — thanks @tyamanak
- **The ctl test suite re-initialised the repository it was run from** — git exports `GIT_DIR` into hooks, which overrides discovery for every git command including `-C`, so the sandbox's `git init` landed on the developer's own checkout (51fce21)
- **The ctl suite failed on a Homebrew Mac** — `resolve_bun`'s absolute-path fallback escaped the sandbox PATH and brought the real `tailscale` back with it, defeating the missing-CLI case (5c48721) — thanks @tyamanak

## [0.25.0] - 2026-08-07

### Added

- **A subscription that keeps failing is retired** after 5 consecutive failures, so stale duplicates (PWA reinstalls) stop accumulating and re-logging every cycle — counted only when a sibling on the same push service succeeded that round, so a service-wide rejection never costs a live device (#68, 2ea3e61) — thanks @alshedivat

### Fixed

- **Push failures log the status and the service's reason** instead of web-push's constant "Received unexpected response code", which named neither (2ea3e61)

## [0.24.2] - 2026-08-06

### Fixed

- **A wrapped CJK reply stalled unsubmitted** — the input box folds its wrapped lines with a space, fabricating one the send never had (CJK has no spaces to wrap at), so the guard's slice check could never match; each seam is now judged on its own, and only a gap the fold itself could have made is loosened (#66, 6def208) — thanks @tyamanak
- **The guard feature-detects `Intl.Segmenter`** and falls back to code points, so an engine without it (Firefox < 125, Safari < 14.1) loses grapheme precision instead of white-screening the app at boot (46a85d1)

## [0.24.1] - 2026-08-06

### Fixed

- **Long/multi-line replies to Claude panes stalled unrecoverably** — the send guard now reads Claude's `[Pasted text #N +M lines]` placeholder as send evidence when consistent with the sent message (ADR 0010) (e9f1a33)
- **Stranded-draft preview withdraws "Take over" when the line holds only Claude's paste placeholder** (e9f1a33)

## [0.24.0] - 2026-08-05

### Added

- **Buttons for Claude's `/model` picker, and any modal like it** — a last-resort grammar reads the footer's `<key> to <verb>` hints and renders them, with the arrows the screen advertised, over the mirrored region (5392ac7)
- **The ←/→ pair says what it adjusts** — the picker's live value ("◐ Medium effort") sits between the arrows and in their accessible names (d872490)
- **A send is refused before it types when the agent's input box isn't on screen** — the draft is kept, and a second Send is a deliberate "Type anyway?" that still never fires the submit key blind (c4ffe45)

### Fixed

- **A half-written reply survives leaving the pane** — drafts are kept per pane (48h, localStorage, so an OS-killed PWA doesn't lose one) instead of dying with the composer when you step over to another tab (9d41411)
- **A reply is no longer typed into a full-screen picker** — the original `/model` bug: no grammar claimed the screen, so the message fed the picker and came back "stalled" (c4ffe45, 5392ac7)
- **The stalled message says a key answer probably landed** — the part that made the original report confusing (c4ffe45)

### Changed

- **Modal menus are a documented harness contract** — the model and its footer/key grammar are harness-neutral, so a future codex/pi/opencode adapter implements them from types plus a conformance leg, not from Claude's internals (0c9dace)
- **A generically-detected menu never synthesises a digit** — in the `/model` picker a digit confirms *and* saves your default for new sessions; [ADR 0009](.adr/0009-a-generic-menu-is-driven-by-the-keys-it-names.md) records why (5392ac7)
- **Every dialog model is a harness contract, not a Claude internal** — the prompt-select, wizard, preview and multi-select payloads join menus in harness-neutral modules, so the AST and the renderers no longer point at one agent's grammar (3b5cf7c)
- **One race guard for every dialog, run through the pane's own adapter** — no more re-deriving through Claude's detectors; an adapter that emits a block kind gets the guard for free, and no adapter fails closed (79ebc0c)
- **The conformance suite pins the signature + identity contract for every block kind** — not just menus: a constant signature, or a comparator that passes a screen that changed, now fails CI (b78aa0f)

## [0.23.3] - 2026-08-04

### Fixed

- **The idle lock no longer ambushes you on the way back in** — a hidden page never locks and returning to the foreground auto-resumes, so it can only appear when Collie is left open, visible and untouched (746ce87)
- **A pause no longer eats an in-progress reply** — the cover sits over a still-mounted router instead of replacing it, so draft, scroll position and open sheets survive it (746ce87)
- **Resuming shows the catch-up instead of handing back a frozen screen** — the cover holds through the refetch, badge swapped for the gallop, and releases when it settles (4ffce3c)

### Changed

- **The lock screen is glass, marked, and honestly worded** — the herd stays legible underneath, the Collie mark says whose screen it is, and there's no lock glyph or "for safety": it gates nothing, and [ADR 0007](.adr/0007-the-idle-lock-is-a-pause-not-a-gate.md) records why (746ce87, 4ffce3c)
- **`ARCHITECTURE.md` no longer lists the idle timeout as a security measure** — it never implemented one (746ce87)

## [0.23.2] - 2026-08-04

### Fixed

- **Agent alerts now send at high urgency** — at web-push's default (`normal`) Android was free to defer them by Doze / App Standby bucket, so pushes were accepted by FCM and never delivered (79f30e6)

## [0.23.1] - 2026-08-03

### Fixed

- `update` now works in a `herdr plugin install` checkout — it is detached and shallow, so `git pull --ff-only` could never run there (#63) (aeeddcd)
- `update` no longer re-links a Herdr-managed checkout, which would re-register it as local and block `herdr plugin install` (aeeddcd)

### Upgrading — `herdr plugin install` users must reinstall once

The fix ships *inside* the checkout it repairs, so `invoke update` still can't run on an install made
before 0.23.1. Take the fix with one reinstall (config and serve state live outside the checkout and
survive), after which `invoke update` works normally:

```bash
herdr plugin install AltanS/collie --yes
herdr plugin action invoke restart --plugin herdr.collie
```

Installs from a `git clone` + `herdr plugin link` were never affected — use `invoke update` as usual.

## [0.23.0] - 2026-08-03

### Added

- **Every key press and quick reply now answers you.** A nav-tray press was silent on success and deferred to a mirror that can be ~2s behind, so tapping Enter felt like nothing happened; the pressed button now fills on the tap (synchronous, no network wait) and shows a ✓ once the bridge accepts it. Quick replies echo on the tapped button and the dock outlives the send, closing after the ✓ instead of on the tap (3be4934)
- **Hold an arrow key to repeat it** — driving a long TUI menu no longer means tapping ↓ fifteen times. Repeats accumulate locally and flush as one batched `send_keys` array with exactly one call in flight, because ordering across two concurrent one-shot RPCs is unguaranteed. Arrows only, by whitelist; a hold while composing stages one chip, not fifteen (e7ada40)
- **Haptics** — a short buzz on press, toggleable in Settings, silently absent where the platform has no `vibrate` (e7ada40)
- **Quick replies follow the pane kind:** a shell gets `y`/`n` instead of "commit and push" and "skip", which mean nothing at a bash prompt (e7ada40)

### Changed

- **The pane's two control rows are now one.** Wrap, raw terminal and text size moved behind a ⚙ into a labelled panel — the raw-terminal escape hatch had been a bare `>_` glyph whose only explanation was a `title` attribute no phone ever shows, and it now says what it does. Find moved to the header, where its find bar already takes over the row. The mirror gets ~85px back (3be4934) — general direction from @simonallfrey in #49, whose "consolidate the terminal toolbar" proposal is what started this; thank you
- Closing the Keys dock on a composed key queue takes a second tap. The queue is still discarded rather than persisted — one surviving into a later open would let Send fire yesterday's chord into today's TUI state — and the guard sits on the drawer transition, since the Keys toggle and the Quick/Agent/Display buttons unmount the tray just as effectively as the ✕ (e7ada40)
- A single key press revalidates on the leading edge instead of sitting out the full 300ms burst window before its refetch even started; bursts still coalesce into one trailing refetch (3be4934)

## [0.22.0] - 2026-08-03

### Added

- **OpenCode panes get Conversation history.** OpenCode ≥1.x keeps every session in one SQLite database (no per-session log), so its journal adapter reads `opencode.db` readonly with bound parameters, touches only the three transcript tables (the same file holds auth tokens), and serves all sessions through a per-session cache key. Needs `herdr integration install opencode` once, then restart OpenCode in the pane (#61, 539cdf4) — reported by @xabilarra
- **A multiselect question inside a wizard is now a tappable dialog**, not raw terminal text. It was owned by no grammar — wizards refuse checkboxes (a wizard digit selects *and* advances; a checkbox digit only toggles) and multi-select only knew the single-question form. It now carries the wizard's step chips, navigates with the wizard's own Left/Right keys, and reads the advance row's label ("Next" / "Submit") from the pane by position, never by assumption (#51, bdf4c26) — thanks @konpyl

### Fixed

- **A preview dialog whose option label wraps no longer falls to the raw mirror.** The grammar required numbered rows on consecutive lines, but the ~30-column gutter wraps longer labels onto continuation rows; a contiguity walk anchored on the label column replaces adjacency (#51, bdf4c26) — thanks @konpyl
- `ReadSource`'s unwrapped variant matches the wire: `recent_unwrapped`, snake_case — the kebab spelling was rejected by Herdr and nothing had ever called it. HERDR_API.md records the probed contract, including that the source is a byte-identical no-op for Claude panes (alt screen + renderer-hard-wrapped prose), which is what closed #53 part 2 by measurement (bddded3)
- `multi-select-action.ts` no longer carries a literal NUL byte (git classified it binary and hid its diffs from review); `.gitattributes` keeps any future stray byte from costing reviewability (#51, bdf4c26)

## [0.21.0] - 2026-07-31

### Added

- **macOS supervises the bridge with launchd.** `start` installs a LaunchAgent (`~/Library/LaunchAgents/herdr.collie.plist`), so the bridge comes back at login and restarts on failure — the parity with the `systemd --user` unit that macOS never actually had (#55, #57, a0be73d) — thanks @darieldatoon
- **The statusline strip shows every row of the run, in the agent's own colour.** Model, cwd, git branch and permission mode live on rows 2+ and were surfaced nowhere; the strip renders them stacked, in the mirror's colour space (#60, 61db7a5, ac3c62d)

### Fixed

- **Sending no longer stalls under a tall statusline** (the run may be 8 rows, was 3). A taller run made `locateInputBox` miss the input box, so a send typed the text and then withheld Enter — with no stranded-draft preview and no pre-clear sweep, so retries stacked duplicates in the pane. Reproduced on a 3-row statusline sitting one wrapped line from the cliff (#54, #56, fe8e548) — thanks @stekman08
- `launchctl bootstrap` is retried across launchd's teardown window, so `restart` — and therefore `update` — can't end with the bridge down (b1ebb83)
- A Mac that can't bootstrap (no console login, so no `gui/<uid>`) keeps an unsupervised bridge instead of exiting with nothing running; `status` reports that degraded tier (5b5106c)
- The pi journal fixture is portable to macOS, where `containedRealpath` resolves `/var` → `/private/var` by design and the backend suite couldn't run at all (a7d8f9a)

### Changed

- **The mirror wraps by default.** Herdr spawns panes at the desktop terminal's width against a phone's ~45–50 columns, so panning was the common case, not the exception; column-faithful no-wrap stays one tap away in View. Display prefs reset to defaults on first load (storage key v4), so a pinned font size needs setting again (#53, 273d886, 73cc7da) — reported by @waynehoover
- ADR 0004 records that the statusline-run bound guards less than it looks: a dialog below the input box is refused by the border checks and by the blank line above its footer hint, never by the row count (36c78c7)

### Upgrading

- **macOS installs migrate on the next `update` or `start`**: the old unsupervised bridge is stopped and replaced by the LaunchAgent. It's a *LaunchAgent*, so it starts at **login**, not at boot — and a Mac administered purely over SSH has no `gui/<uid>` to bootstrap into, so it stays on the unsupervised bridge with a warning until someone logs in at the console once.

## [0.20.2] - 2026-07-30

### Fixed

- `herdr plugin action invoke update` no longer dies with `bun not found on PATH` — Herdr spawns actions with no login shell, so Bun is now found in its install locations too, not just on `PATH`. A failed run had already fast-forwarded the checkout, leaving the old `web/dist` being served (#52, 08f44f6) — thanks @konpyl
- Only an absolute Bun path is prepended to `PATH`, so a `bun` shell function in the plugin `.env` can't put the CWD in front of `git` / `systemctl` / `tailscale`; the control script's Bun resolution now has test coverage (4841e37)

## [0.20.1] - 2026-07-29

### Fixed

- Journal rotation-following re-checks containment, so a sibling symlinked out of the Claude projects root can no longer be served as a pane's history (e8b1357)

### Changed

- Dependency versions must be 7 days old before they install, via `bunfig.toml` (`.npmrc` for npm users) (bf38d45)

## [0.20.0] - 2026-07-29

Three contributions from @konpyl carry this release — light and system themes (#41), the triaged
dashboard (#42) and tappable URLs in the mirror (#45), landed via #46/#47/#48 with review fixes on
top. Thank you: measured rather than estimated, with the reasoning written down where it will be
argued about again.

### Added
- **Light and system themes.** Collie follows your phone's appearance by default; pin Light or Dark from **Settings → Appearance**. Per device, and documented under [Dark mode / light mode](./README.md#dark-mode--light-mode) (#41, 59bcfe1, df47112)
- ANSI slots 0–15 are now CSS variables (`--ansi-*`), so indexed terminal colour is defined in one place and reaches the mirror through both `31m` and `38;5;1` spellings (59bcfe1)
- **The dashboard is triaged, not listed.** Needs you → Ready · unseen → Working → Recent; the first three are pinned, Recent sorts by when you last used each pane (#42, da4f44c)
- **Ready · unseen** — agents that finished while you weren't looking. Opening one clears it, on every device (2f4d691)
- Recent and Spaces fold and remember it; fold both and the page is the triaged herd and nothing else (da4f44c)
- The swipe-up **Switch pane** sheet folds its long tails too — Recent, and the bare **Shells** group that buried the agents underneath it (4cca8db)
- Spaces are ordered by last used and filterable — 45 of them are now three keystrokes, not a scroll (da4f44c)
- The bridge keeps two timestamps per pane (`activeAt`, `seenAt`) in `activity.json`, because Herdr reports none (2f4d691)
- **Tab and space chips carry a status dot** — blocked / ready / working / idle, in the herd list's own palette. They only ever showed a dot for blocked before, so every other state read the same as every other (22d4a5f)
- **URLs in the pane mirror are tappable** — `http(s)://` text becomes a link that opens in a new tab, keeping the colour the agent printed and marked by an underline (#45, cc38351)
- Trailing prose punctuation is trimmed with paren balance respected, so `Fetch(https://x.dev/a)` links the URL and not the paren; a find hit inside a URL still highlights, and a URL that changes colour mid-way stays one link (cc38351)

### Changed
- The pane mirror renders in dark space under every theme and light mode inverts it, because agents emit truecolor almost exclusively and no palette can re-theme an absolute colour — [ADR 0002](.adr/0002-invert-the-light-terminal-mirror.md) (78425bd)
- In light, the page is a step off white with cards staying white, so the dashboard's hierarchy no longer rests on a single hairline — and the mirror's edge stops showing a seam (59bcfe1)
- **Agent rows are titled `project · tab`, not "claude".** The pane's own name moves to the second line; the agent stays in the avatar (da4f44c)
- Spaces moved BELOW every agent section — it's a navigator, not a work queue (da4f44c)
- Only Collie's own reads count as seeing a pane; a Herdr focus at the desk does not — [ADR 0003](.adr/0003-one-shared-seen.md) (6786ca1)
- MINOR, not MAJOR: pre-1.0, purely additive, no config or API break. Defaulting to your phone's appearance is the feature working as designed and Settings pins it either way; an older bridge reports no activity timestamps and simply renders the previous dashboard, minus the one section that would be empty

### Fixed
- **The space and tab chip rows overlapped each other on the space screen** — both strips were missing `shrink-0` inside the route's flex scroller, so they collapsed to 16px around 32px chips and the tab row painted over the space row. Pre-dates this release (636b7af)
- Three `role="alert"` warnings (incomplete multi-select, wizard, preview) used a hardcoded yellow that measured ~2:1 on white; they use the status palette now (59bcfe1)
- An off notification switch was unreadable in light — a white thumb on a 1.09:1 track, legible only by its shadow. It carries an outline now (59bcfe1)
- Focus rings were drawn at half strength, 1.77:1 in light and 1.87:1 in dark; both are full strength now (59bcfe1)
- Small muted text (section labels, the build stamp, the terminal status line, the `(n)` counts) fell under 3:1 in light — light `--muted-foreground` had no headroom left for the `/70` and `opacity-60` modifiers stacked on it, so it was darkened and the modifiers dropped (59bcfe1)
- Header controls had 20px touch targets; the Settings gear and the Settings back button are both 44px now, with no change to how they look (59bcfe1)
- The boot splash stepped from white to the page colour when React took over, and its caption measured 3.45:1 — it used `#ffffff`/`#8a8a8a` under a comment claiming they matched `--background`/`--muted-foreground`, which rasterize to `#f5f5f5`/`#5d5d5d`. Same fix for the light `theme-color` meta, so Android's URL bar matches the page (7f0189d)
- Inverse-video segments in the mirror emitted theme tokens while the muted glyphs beside them used literals; the mirror keeps one spelling now (identical pixels — the literals are those tokens' dark halves) (7f0189d)
- Marking a pane seen had made a read-level GET mutate state, so a cross-site `<img>` at a guessed pane id could silently clear your unseen agents. Only a request carrying the app's own header counts now — caught in this release's security review, never shipped (f9000cb)
- Only a request that will actually be served marks a pane seen — one falling through to 405 no longer clears an alert (f7e616b)
- **Light `--accent` was byte-identical to `--background`**, so "this is the current one" showed nothing in light mode — the open pane in the switcher, the current session, every `hover:bg-accent`. Predates this release; found by the UX sweep (dab7e05)
- Titles truncated away the tab — the only part that identifies a row — leaving several panes rendering the same `moonward_os · t…` (8a8a4c9)
- Section headings rendered at two different sizes and cases, because a `<button>` doesn't inherit `text-transform` from its `<h2>` (8a8a4c9)
- A hollow status ring on the avatar's corner read as a notch cut out of the logo (5c04453)
- A space row and its chip could disagree about what a colour meant — the row still ranked by `STATUS_RANK` while the chip used the triage classifier, so a space holding one working agent and one unseen-done agent showed "working" on the dashboard and "ready" in the strip. Both route through `bucketOf` now, in one pass rather than spaces x agents per render (e024f48)
- `aria-controls` on a collapsed section pointed at an element that isn't rendered — exactly when a screen-reader user is deciding whether to expand it (e024f48)
- A status dot passed a smaller size only resized its wrapper, so chip dots rendered at the wrong size (e024f48)
- The Settings page rearranged itself a frame after opening — Notify-when and Snooze mounted only once push state resolved, inserting ~400px into the middle of the page, and Notify-when then grew another ~180px waiting on its own prefs. Both render from the first frame now, switches disabled until their values land (3d5b191)
- The pane row ran straight into terminal output with no edge between them, so the chrome and the mirror read as one surface (e208408)
- Herd and space rows had a border radius with no border to own it, so a rounded hover fill sat under a straight `divide-y` hairline. Rows without a border are square; the ones with a real border keep their radius (3d5b191)

## [0.19.0] - 2026-07-29

### Added
- **Journal (pane history) is now per-harness, with Codex and pi support.** Reading an agent's own session log is an adapter keyed on the pane's agent (`bridge/journal/`), so a new harness is an adapter rather than a fork of the reader — Codex reads its date-partitioned `rollout-*.jsonl`, pi its per-cwd session log. Raised in #40 by @simonallfrey, who asked where to implement journaling for Codex (7e3b2bd)
- **`scripts/journal-probe.ts`** probes every adapter against the real logs on the host — the format-drift check unit tests can't make. It caught Codex 0.145 adding a `developer` message role the parser would have rendered as operator speech (7e3b2bd)

### Fixed
- **pi could never have had history.** pi reports its session as a kind-`path` ref (an absolute path) and the bridge kept only kind-`id` refs, so a pi pane arrived with no session at all. Both kinds are kept now; a path ref is confined to that harness's root after symlink resolution (7e3b2bd)
- **A pane relaunched as a different agent served the previous agent's session ref.** Herdr keeps reporting the last session announced for a pane — a pane running pi still advertised a `herdr:claude` id. The ref is dropped unless its own `agent` matches the pane's (7e3b2bd)

### Changed
- **A pane's session reference no longer goes to the browser.** `/api/snapshot` sends `hasSession` instead — for pi the reference is a filesystem path, and the History affordance only ever needed "may this pane have history?". It is now also gated on the harness actually having an adapter (7e3b2bd)

## [0.18.0] - 2026-07-28

### Added
- **Approvals are bound server-side to the prompt they were decided against.** `/keys` and `/reply` accept an optional `expected_prompt`; the bridge re-reads the pane immediately before writing and refuses with `409 prompt_changed` if the dialog moved. Shrinks the guard window from human latency to two local RPCs — a mitigation, not a guarantee, until herdr gains a conditional-input primitive (#29) — thanks @Optic00 (6afaf5b)
- **`/auth/` is reserved for a fronting proxy's sign-in page**, and the service worker always passes it to the network. An installed PWA could not reach a proxy page at all before — the precache answered every navigation, reload included — so operators had to squat a page inside `/api/`. The refusal banner now links there (#31) — thanks @Optic00 (1a5972b)

## [0.17.0] - 2026-07-27

### Fixed
- **A reply sent while an agent dialog was focused answered the dialog instead.** The submit key approved whatever option was highlighted (Claude defaults to "Yes") and the message was destroyed, while the bridge reported success. Sending now refuses outright while a dialog is up, and otherwise types first and only submits once the text is verified in the input box (#34) — thanks @maikschuheida-spec

### Changed
- Free-text replies on harnesses with a block grammar (Claude) are two steps — type, verify, submit — so "Sent ✓" now means the text was seen in the input box. Harnesses without an adapter keep the previous one-shot send

## [0.16.1] - 2026-07-27

### Fixed
- `/api/config` is now gated like every other endpoint — it was the one route that skipped the same-origin check and `COLLIE_PUBLIC_HOSTS`, noted by @Optic00 in #32 (a54afd9)

## [0.16.0] - 2026-07-27

### Added
- Bring-your-own-tunnel deployment path documented as **Variant E** — NetBird, ZeroTier, Cloudflare Tunnel (6550041)
- `scripts/collie-ctl.test.sh` — first lifecycle coverage for the control script, wired into the pre-push hook (a004449, 65889da)

### Fixed
- `unserve`/`uninstall` no longer remove a `tailscale serve` mapping Collie didn't create, and `start` no longer replaces one (a004449, thanks @iamtimmy)
- A front door that fails to publish no longer aborts `start` before the status banner (65889da)

## [0.15.0] - 2026-07-26

### Added
- Pane conversation history read from the agent's own transcript — scroll back past the live mirror (77dff7c)
- Windows support for the bridge: dials herdr's named pipe through `node:net`, one code path for both platforms (#25, #27) — thanks @mikebenner and @bwright2810 (dd6610d)
- `COLLIE_HERDR_DIAL=auto|net|bun` forces the dialer; `net` exercises the Windows path on Linux/macOS (f662834)

### Changed
- **Breaking, only if `COLLIE_DEVICE_HEADER` is set:** a request arriving *without* the device header is now read-only. It previously got full write access, which let any tailnet client reach the bridge's own URL and skip the proxy that injects the header. Front doors that inject it on every request are unaffected; direct loopback/MagicDNS access now needs the header sent by hand (#28) — thanks @Optic00 (8ed715d)

### Fixed
- A 401/403 no longer renders as an endless "reconnecting" banner — an access refusal now says so and offers Reload (#30) — thanks @Optic00 (7bdcbfb)

## [0.14.2] - 2026-07-23

### Added
- Paste an image straight from the clipboard into the composer, same upload path as the picker (#24) (ad6957b)

## [0.14.1] - 2026-07-22

### Fixed
- `collie-ctl.sh self_dnsname` shelled out to `node`, which Collie never requires — now uses `bun` (#22) — thanks @jz-wilson (a61f3d1)

## [0.14.0] - 2026-07-21

### Added
- Alt modifier in the nav tray — `alt+<key>` chords now reachable from the phone (#19) — thanks @bnivanov (d1dc947)
- Modifiers combine (checkbox, not radio): `ctrl+shift+p`, `alt+shift+p`, even triple chords (#20) (d1dc947)
- Modifier lock — tap an armed modifier again to keep it armed across presses and Sends; Clear or a third tap releases (#20) (d1dc947)

### Changed
- HERDR_API.md: multi-modifier chords live-verified in any order against Herdr 0.7.3, cross-confirmed on 0.7.4 by @bnivanov (b505c4e)

## [0.13.2] - 2026-07-20

### Fixed
- Tabs render in Herdr's reported order instead of stable-number order, so a reorder in Herdr survives to the screen — thanks @iFwu (a16478f)
- Tapping raw terminal output focuses the composer synchronously, keeping iOS's user-activation window so the software keyboard opens — thanks @iFwu (a78ccfd)

## [0.13.1] - 2026-07-20

### Fixed
- Taking over or sending a draft no longer permanently mutes the preview for that same text — the handled key resets once the host line clears (7153639)
- Send's pre-clear sweep overshoot widened 8 → 32 so host typing inside the poll gap can't leave a remnant (7153639)
- A scrollback line starting with `❯` can no longer pin a bogus session name — only the live (bottommost) prompt decides (808cce7)

## [0.13.0] - 2026-07-19

### Added
- Long-press a pane pill for a pane actions sheet — rename + two-tap close (5b50941, c713551, 90210ce, ea20df0)
- Pane rename end-to-end: `pane.rename` RPC, bridge route, label threading (99c8808)
- Tab rename + tab close (blast-radius confirm) via the same long-press sheet on tab chips (a9664b5, 37a470e)
- Claude's own `/rename` session name surfaced on cards, headers, and the switcher (d22fdd7)
- Read-only "Draft in terminal" preview with explicit Take over — the composer input is exclusively phone-owned (4b6f0ac, 10fa28d)
- Self-update without the service worker: `X-Collie-Build` on polled responses, auto-reload or tap-to-update banner (8d13622)
- Instant offline navigation — during a known outage, routes serve the last good snapshot instead of hanging on a dead fetch (b756edd)
- Busy strip on genuinely hung loads: navigations >500ms, background polls >6s (e886541, 3bfaa1c, 06516c4)
- `-dev` marker in the build stamp for non-release builds (3e785f4)

### Changed
- One shared `AppHeader` for dashboard, space, and pane — same components underneath, stale status badges dim during outages (29432c2)
- Connection status is a single animated top bar — amber "reconnecting…" after 4s of trouble, red with Retry at 15s, green flash on recovery; no header pill (394e6fe, b2dd50e)
- Switcher sections carry status-colored bullets; per-row close removed (switching is the only action there) (3918c69)
- `assets/*` served immutable, everything else `no-cache` — proxy caches can no longer starve `/sw.js` updates (8d13622)

### Fixed
- Own in-flight reply no longer flagged as a stranded terminal draft (e8462f9)
- Wrapped multi-line drafts and the new background-agents footer no longer break input-box detection (829fc7e, d9521e3)
- `navigator.onLine` never gates polling or liveness — lying flags can't wedge the app or fake outages (d31ffb8, 394e6fe)
- One shared connection-lost clock; escalation survives route changes and app switches until a poll succeeds (1486e07, 5949885)
- Sustained outages escalate everywhere — boot splash, header, banner — with Retry/Reload (0cbbac1, 4d89588, 4494cf5)
- Gallop sprite re-centered; the dog never freezes mid-stride (rest state is the static icon) (3c7174a, 394e6fe)
- Offline banner no longer overlaps the sticky header (bf98a88)

## [0.12.0] - 2026-07-17

### Added
- `COLLIE_SKIP_SERVE=1` env var to disable tailscale serve entirely — bridge stays on loopback only, ideal for deployments behind a reverse proxy (Caddy, Nginx, etc.) — thanks @diogenesc (ad5833a)
- `COLLIE_PUBLIC_URL` — `collie-ctl.sh status` banner shows your real reverse-proxy URL instead of a placeholder (4b043be)
- Bridge startup warning when `COLLIE_TRUSTED_USER` is set under `COLLIE_SKIP_SERVE=1` — the identity gate is inert without tailscale serve injecting `Tailscale-User-Login`; use `COLLIE_DEVICE_HEADER` (4b043be)
- README Variant C — reverse proxy as the only front door (no Tailscale), with Caddy example and required env (76019f7)

### Changed
- `collie-ctl.sh unserve`/`uninstall` always attempt serve teardown, even under `COLLIE_SKIP_SERVE=1` — a stale mapping from before the flag flip would keep publishing the app (4b043be)
- Security posture docs: "tailscale serve is the sole ingress" → "exactly one hardened front door" (tailscale serve or a conforming reverse proxy) across README, ARCHITECTURE, CLAUDE.md (76019f7)

## [0.11.1] - 2026-07-16

### Fixed
- Opening a tab/pane lands on the live tail — terminal `<pre>` no longer steals vertical scroll from the message list; stickiness also re-pins when content grows (04bf6fc)

## [0.11.0] - 2026-07-15

### Added
- Pluggable harness-adapter architecture: a `HarnessAdapter` registry replaces the single Claude-only gate, Claude's detectors move to `lib/harness/claude/`, and a core race-guard engine (`lib/harness/guard.ts`) is the only module that may touch the network — an import fence (enforced by `fence.test.ts` under `bun run test`) + a conformance suite let contributors add codex/pi/opencode (see `HARNESS_CONTRIBUTING.md`)
- multiSelect AskUserQuestion support: checkbox options up-level to tappable checkbox rows (terminal is source of truth), with a closed-loop Submit that navigates the pointer to Submit and verifies before Enter (never blind-sends), plus the review/confirm screen
- Prompt overlay: interactive prompts render in a bordered `bg-card` panel that lifts the whole dialog off the terminal mirror, with elevated option rows, leading key-digit badges, and a family-aware caption
- Update notifications: a footer banner (linking to the GitHub release) and an opt-out web-push when a newer release is published upstream or the running bridge is behind the on-disk code — checks the repo's tags over anonymous HTTPS, stamps its own sources for the restart signal, a Settings "check for updates" button forces an immediate check, an `updates` notify pref is the off-switch, and update/restart are surfaced as location-independent Herdr plugin actions

### Changed
- Keys and Quick menus dock in-flow above the controls row instead of a fixed overlay, so the terminal mirror shrinks and re-pins to the bottom (ResizeObserver) — the prompt/cursor stays visible; both buttons are toggles
- Prompt option rows compacted (tighter padding, snug line-height) so a multi-option dialog fits the phone viewport
- "Sent" status toast moved from a bottom overlay (which covered the terminal tail) to a slim in-flow row below the header
- Build stamp marks a dirty working tree (`<sha>-dirty`), so the footer no longer claims HEAD when the build carries uncommitted work
- multiSelect Submit is ~2s instead of ~15s: the pointer walk re-reads the actual position each step and stops on "Submit", instead of polling for the bottom row after every key (which timed out ~2.8s per step)

### Fixed
- Prompt-select + wizard grammars: a numbered list in a dialog body (e.g. a plan's steps) no longer breaks menu detection — the menu is taken as the trailing `1..m` run, so plan-approval prompts up-level correctly

## [0.10.3] - 2026-07-12

### Fixed
- `collie-ctl.sh build` installs the root dependency tree (not just `web/`) before typechecking, so a fresh Herdr install no longer fails with TS2688 "Cannot find type definition file for 'bun'" (03f409f, #9)

## [0.10.2] - 2026-07-12

### Fixed
- Composer Send clears a stranded draft off the terminal `❯` line (ctrl+k + Backspace) before typing so replies no longer accumulate on the prompt; a clean prompt skips the clear (cd1cc25)
- Bridge settles ~350ms between typing and Enter so the TUI reliably accepts the submit key (cd1cc25)

## [0.10.1] - 2026-07-11

### Fixed
- Terminal mirror defaults to no-wrap for table alignment like desktop Herdr; clearer borders/typography (font 12, muted-foreground box-drawing); pane stays viewport-width — toggle Wrap on in View for prose (85f777b)

## [0.10.0] - 2026-07-10

### Added
- Herdr session switcher: one bridge fronts every named herdr session — `?session=` on the API, `?s=` in the app, a sessions summary in the snapshot, per-session notification slots, and a `COLLIE_MULTI_SESSION` kill-switch (8fa1f20)
- Space detail is a deep-linkable route (`/space/:spaceId`) with a working browser Back button, replacing the in-home drill-in state (0e5f9c8)
- Terminal-draft recovery: a queued-then-recalled message stranded on the "❯" input line surfaces as a composer chip, with "Edit here" to clear the line and adopt the text cleanly (46dcf35)

### Changed
- Dashboard leads with "Needs you" — agents awaiting your input sit at the top, above the spaces overview (1d92592)
- Dashboard, space, and settings scroll inside a viewport-clipped region instead of the whole document (2aa9272)
- Session switcher and the session chip are dashboard-only, keeping the in-space and pane headers clean (bb0048d, ba56ba9)
- Header polish: consistent compact height across the dashboard and inside a space, zinc-800 nav chrome, a ringed Collie mark, a smaller pane-header agent logo, and the keyboard-only quick-keys strip removed (6250e0c, 9da7195, 35db0e5, ba56ba9)
- Security posture documents that `COLLIE_MULTI_SESSION` (default on) fronts every named session under the config root (fcb0b7d)

### Fixed
- Deep-linking a space that never existed shows "Space not found" rather than "Space closed" (fcb0b7d)

## [0.9.1] - 2026-07-09

### Security
- Removed one-tap yes/no reply buttons from push notifications — they POSTed to the terminal without opening the app, i.e. approving blind. Notifications now only deep-link to the pane (cb26ee0)

## [0.9.0] - 2026-07-07

### Changed
- Quick keys mimic a physical keyboard on both surfaces: Esc top-left, Tab below it, inverted-T arrows, Enter top-right; Keys sheet gains a full-width spacebar (2f70662)
- Attach image lives in the reply row (usable without the phone keyboard open); digits leave the inline strip — the 123 tab remains (2f70662)
- Header collie logo is transparent like the gallop sprite — removed favicon.svg's baked-in gray backing rect (3f05da8)

## [0.8.0] - 2026-07-07

### Added
- Poll herdr 0.7.2's `session.snapshot` — one RPC per tick instead of three list calls; permanent fallback to the list trio on older servers (5687bbf)
- Event-poked polling: `events.subscribe` stream triggers immediate debounced re-polls; interval relaxes to `COLLIE_POLL_IDLE_MS` (default 12s) while the stream is healthy (5687bbf)

### Changed
- HERDR_API.md re-verified against herdr 0.7.2 / protocol 16; terminal observe/control filed under ARCHITECTURE.md Future ideas (aad94b3)

## [0.7.0] - 2026-07-06

### Added
- Notification type prefs: Settings "Notify when" toggles per agent status, bridge-wide; default pushes only "Needs input" (blocked) — "Finished" (done) is off (98cf5d2)

### Changed
- Push sends carry a `collie-herd` topic + 6h TTL: an offline device now gets one current summary on reconnect instead of replaying every queued update (98cf5d2)
- Disabling a notification kind retracts its pending/outstanding alerts immediately (98cf5d2)

## [0.6.0] - 2026-07-06

### Added
- First-paint PWA splash: the galloping collie shows before React mounts (299f632)
- Keys sheet: `Ctrl` modifier + visible key queue — compose chords/sequences, review, Send as one call; dialer-size digits on a `123` tab (515f795)

### Changed
- Header Collie mark matches the agent logo (2rem, aligned across screens); Find lives in the composer View row; placeholder is just "Type a reply…" (11385ee)

### Fixed
- Option taps no longer pop the phone keyboard or steal the note editor's focus (11385ee)
- Stalled connections no longer zombify the app: fetch timeouts (10s/20s/60s), polls supersede a wedged revalidation at 12s, and the collie gallops within 2.5s of a stalled load or pane-tap navigation (e6ad939)

## [0.5.0] - 2026-07-05

### Added
- **Preview-variant question notes.** Claude Code's *preview* AskUserQuestion — a single-select
  question whose options carry a `preview` field (the mockup/snippet pane, footer hint
  `n to add notes`) — is lifted into a native block that surfaces the per-question note affordance.
  A note (attach / edit / remove) is driven from the native option UI and applies **per question**,
  not per option row. Delivery uses the verified staged keystroke choreography
  (`n` → confirm the input focused → clear → paste the text via the reply path → `Escape` to blur,
  each stage verified rendered before the next fires; `Enter` is never sent, since it would submit
  the dialog — see `web/src/lib/grammar/NOTES_NOTES.md`), and option selection is the two-step
  digit → verify-pointer → `Enter` recipe. Race-guarded like the other dialog blocks (a stale tap on
  a drifted dialog aborts before anything irreversible is sent). Claude-scoped (`hasBlockGrammar`)
  and web-only; the standard non-preview select and wizard steps are unaffected (pressing `n` there
  is a no-op, so no notes UI is shown).

### Security
- **Preview-note tap guard hardened to region-signature parity.** The preview dialog's race guard now
  carries a pointer- and note-independent **core signature** (the subject/question/stepper above the
  options joined with the option rows' left column, `❯` normalised) — matching the 0.4.0 `signature`
  parity the prompt/wizard guards already had. It is enforced at entry AND on **every** mid-flight
  acceptance/drift check, so a same-shaped successor dialog (identical question + labels, different
  subject) can no longer be answered by a stale tap: no digit-then-`Enter` or `Enter` is sent unless
  the fresh read's core signature byte-matches what the user saw. The blur poll is now three-valued
  (ok / drifted / timeout) so the Escape-retry fires only on a genuine swallowed key — never after the
  dialog drifted or vanished (which a blind second Escape could cancel / interrupt). Pasted note text
  is stripped of C0/C1 control bytes (ESC, BEL, …) before it can reach the focused input.

## [0.4.0] - 2026-07-05

### Added
- **Block-based terminal renderer.** Pane rendering now flows through a semantic Block AST (styled
  lines → typed blocks → React components) instead of a flat span mirror. The raw-block foundation is
  byte-for-byte identical to the old mirror, but it's the seam every feature below builds on —
  detected regions are lifted into native blocks in place, and anything unrecognized falls back to
  the raw mirror. Scoped to Claude Code (`hasBlockGrammar`); every other agent renders the plain
  mirror, since their TUIs are unverified.
- **Native prompt buttons.** A Claude single-choice dialog at the buffer tail (select, permission,
  trust, plan approval) is lifted out of the mirror and rendered as tappable buttons; a tap sends the
  per-family keystrokes (digit, or digit+Enter for AskUserQuestion), guarded so a stale tap on a
  scrolled-up menu can't fire. The agent's own input box/statusline are stripped so they don't
  duplicate the composer.
- **Status strip.** The stripped statusline (model · ctx% · cwd · branch · tokens) is re-surfaced as
  a slim line above the composer, so the branch/context stays visible instead of vanishing with the
  input-box chrome.
- **Submission progress bar.** A slim indeterminate bar across the top of the app while any mutation
  (reply, keys, prompt tap, upload, tab/space create, close, snooze) is in flight; background polling
  never triggers it, and a 120ms delay means a fast action never flashes it.
- **Raw-terminal escape hatch.** A View toggle (terminal icon) that turns off the block renderer —
  native prompt buttons, chrome stripping, status strip — and shows the plain mirror, so a
  mis-detected/mis-rendered dialog can always be driven by hand with the keys pad. Persisted.
- **Multi-question wizard.** A multi-question AskUserQuestion (the `☒ Focus area ☐ Scope ✔ Submit`
  stepper) now renders as a native step-by-step wizard instead of bailing to the raw mirror: the
  stepper chips (answered/current per question), the current question's options as tappable buttons
  (one digit each — verified: a wizard digit instant-selects and advances), back/next step
  navigation, and the final Submit review step (answers echoed, submit/cancel). Incremental
  round-trip: every tap is a single race-guarded keystroke re-derived against a fresh read; the TUI
  stays the source of truth. Choreography + fixtures documented in
  `web/src/lib/grammar/WIZARD_NOTES.md`.
- **Galloping Collie loader.** The mascot now doubles as the app's activity indicator: a 6-frame
  gallop sprite (`web/public/dog-gallop.png`, a 768×128 transparent strip) stepped through with a
  pure-CSS `steps(6)` animation (no JS timers). At rest it's the familiar static app icon
  (`favicon.svg`); it springs into the gallop on the boot splash while the first snapshot loads and
  whenever the connection isn't live (connecting / reconnecting / offline), settling back to the
  static icon once live. Honours `prefers-reduced-motion`. New `DogGallop` component; rough
  first-pass art to be replaced with higher-quality frames.

### Changed
- **One consistent top-left mark on every screen.** The Collie is now the brand + home button +
  connection loader in a single shared `CollieHome` component, rendered identically on the dashboard
  and inside a pane — so the header's top-left always means the same thing (previously a "stacks"
  icon inside a pane vs. the Collie logo on the dashboard). Inside a pane the Collie gallops on
  reconnect from the same global connection state as the dashboard (shared `isConnecting` predicate).

### Removed
- **The pane's Nav-hub drawer** (the left "stacks" drawer). It was redundant now that the Collie
  handles Home, the swipe-up switcher already covers pane switching/closing, and the breadcrumb
  covers cross-space jumps — removed along with its `SpaceList` component. The swipe-up switcher now
  appears whenever a pane is open, so even the last pane stays closable.

### Fixed
- **Multi-question AskUserQuestion no longer mis-parsed.** A multi-step AskUserQuestion (the
  `☒ Focus area  ☐ Scope  ✔ Submit` stepper) was detected as a single-question select and answered
  with one digit+Enter — submitting a half-filled form. It's now recognized as a wizard and left as
  the raw mirror (drive it with the keys pad, or via the new escape hatch) rather than mis-sending.

### Security
- **Prompt/wizard taps are guarded against same-shaped successor dialogs.** The tap race guard now
  compares a byte-signature of the whole dialog region — including the subject above the options (the
  diff/command being approved), not just the question and option labels. So a tap on a frozen mirror
  can no longer approve a *different* action that happens to render an identical-looking prompt (e.g.
  a second edit to the same file after the first was answered elsewhere). Herdr's `revision` is a
  stub, so this content signature is the load-bearing freshness check.

## [0.3.0] - 2026-07-03

A full-codebase review pass: four audit agents (backend, frontend, security, ops/product) swept the
tree; everything they found was verified, fixed, and the top feature gaps were built.

### Added
- **Reply from the notification.** Needs-you pushes now carry up to two quick-reply action buttons
  (agent-aware: codex gets `yes`/`no`, others `yes`/`continue`; bridge sends `quickReplies` in the
  payload). Tapping one POSTs the reply straight from the service worker and confirms with a silent
  "Sent ✓" — no app open needed. Body tap still deep-links as before.
- **Find in output.** A magnifier in the pane header opens a find bar: case-insensitive match over
  the visible buffer, match count, prev/next that cooperates with the scroll-freeze, highlights
  rendered through the same React-text-node path (XSS boundary untouched).
- **Load older scrollback.** A "load older" row at the top of the mirror grows the fetched window
  600 lines at a time (up to 5000; the bridge clamps reads at 10000), preserving your scroll
  position across the refetch.
- **Destructive-input confirm.** Replies matching a reviewed pattern list (`rm -rf`, `sudo`,
  `git push --force`, `dd if=`, `mkfs`, redirects to system paths, …) flip Send into a two-tap
  "Really send?" state for ~3s — same pattern the `/clear` palette action already used.
- **Audit log.** Every write action (reply, keys, upload, tab/workspace create, pane close) appends
  a single JSONL line — timestamp, action, pane, device, truncated params — to
  `<state-dir>/audit.log` (mode 0600). Audit failures never block the action itself.
- `COLLIE_PUBLIC_HOSTS` env var — an explicit Host-header allowlist. When set, requests addressed
  to any other Host are rejected before origin logic, defeating DNS rebinding. Strongly
  recommended (set it to your MagicDNS name); effectively mandatory with `COLLIE_SERVE_MODE=http`.
- Startup warnings when `COLLIE_TRUSTED_USER` or `COLLIE_PUBLIC_HOSTS` is unset — parity with the
  existing bind/allowlist warnings, since an empty trusted-user means any tailnet device has write
  access.
- Uploaded images are now swept after 48h (was: kept forever).

### Changed
- **Builds are gated.** `bun run build` (root) and `collie-ctl.sh build` now typecheck bridge and
  web before building, and build into `dist-staging` with an atomic swap — a failed build can no
  longer leave an empty `web/dist` serving 503s. The pre-push hook typechecks both sides too
  (`SKIP_TYPECHECK=1` to bypass once). Root tsconfig now enforces `noUnusedLocals/Parameters`.
- **Write requests without an `Origin` header are rejected** unless they arrive on loopback
  (browsers always send Origin on POST; curl-on-host keeps working).
- Idle lock is now timestamp-based: backgrounding/foregrounding the app no longer resets the
  countdown, and returning past the deadline locks immediately.
- The composer moved into its own `<Composer>` component; `agent-chat.tsx` slimmed by ~230 lines.
- A reply whose text lands but whose submit keystroke fails now reports "typed into the pane but
  not submitted — check the pane before resending" (and `textDelivered: true`) instead of a generic
  error that invited double-sends.
- systemd unit hardened (`NoNewPrivileges`, `PrivateTmp`) and made persistent
  (`StartLimitIntervalSec=0`, `RestartSec=5`) so a crash-loop can't leave the service permanently
  down while you're phone-only.
- Notification deep links URL-encode the pane id; sheets manage focus (focus in on open, restore on
  close, `aria-labelledby`); space status dots gained screen-reader text; pinch-zoom re-enabled
  (removed `maximum-scale=1`).

### Fixed
- **Socket leak on RPC timeout** — a stalled Herdr left the Unix-socket FD open on every timed-out
  request; under the 1.5s poll cadence this exhausted file descriptors and wedged the bridge. Every
  terminal path now closes the socket.
- **UTF-8 corruption across socket chunks** — multi-byte characters (box drawing, emoji) straddling
  a socket-read boundary rendered as `�`; replies are now stream-decoded.
- **Overlapping polls** — a slow Herdr let 1.5s ticks pile up 3-4 concurrent polls; a tick is now
  skipped while the previous poll is in flight.
- **Upload buffering** — a too-large upload was buffered fully into RAM before the 10MB check;
  oversized `Content-Length` is now rejected up front and `Bun.serve` caps request bodies at 12MB.
- Push subscription saves are serialized and written atomically (temp+rename); concurrent
  add/prune can no longer drop a subscription. State files are written 0600 in 0700 dirs.
- First PWA load no longer flashes an immediate reload (service-worker `controllerchange` on
  initial claim was treated as an update).
- A rotated VAPID key now unsubscribes the stale push subscription and re-subscribes fresh instead
  of silently dead-ending pushes.
- Superseded loader revalidations are aborted (`request.signal` threaded through); raw key presses
  debounce their revalidate (one refetch per burst instead of one per keystroke).
- Slash-command insert appends to the draft instead of overwriting it; tap-to-focus no longer
  collapses an active text selection (copying pane output works now).
- `envInt` config parsing rejects garbage and out-of-range values (negative poll/debounce
  intervals, invalid ports) with a warning instead of silently accepting them.
- Static-file path guard now checks the directory boundary (`dist` vs `dist-*`); `?lines=` is
  clamped; API/static responses carry `X-Content-Type-Options: nosniff` and
  `Referrer-Policy: no-referrer`; graceful shutdown drains in-flight requests.
- Pre-commit version guard now also covers `web/vite.config.ts`, `web/index.html`,
  `web/package.json`, `web/public/`, `systemd/`, and root `package.json`, and requires the new
  version to sort strictly above the old one.

## [0.2.0] - 2026-06-30

### Changed
- **Smarter push notifications.** A blocked/done alert is no longer fire-and-forget. Each one now
  waits a short **debounce window** (`COLLIE_NOTIFY_DELAY_MS`, default 30s) before it sends; an agent
  you clear at your desk within that window never reaches your phone. Alerts that *do* fire are
  **retracted** automatically once the agent resolves (or its pane closes), so handled work stops
  piling up on your lock screen. The service worker also **suppresses** the system notification when a
  Collie tab is already open and visible (the in-app status surfaces it instead).
- **Coalesced into one notification.** The whole herd shares a single notification slot: one agent
  shows the named, deep-linked alert; several collapse into a *"N agents need you"* digest (tap → the
  triage home) that updates in place as agents come and go, instead of stacking N separate alerts.

### Added
- **Do Not Disturb / snooze** (Settings → *Do not disturb*): pause all push for 30m / 1h / 4h, or
  resume early. Server-enforced and self-expiring, so it quiets every device — and it clears whatever
  is already on the lock screen the moment you snooze. The current deadline rides the snapshot, so it
  stays in sync across devices.
- `COLLIE_NOTIFY_DELAY_MS` env var — the push debounce window in ms (default `30000`; `0` notifies on
  the next tick with no debounce).
- `POST /api/notifications/snooze` — set/clear the global snooze (`{ snoozedUntil: number | null }`);
  the active deadline is reported on the snapshot as `notifications.snoozedUntil`.

## [0.1.0] - 2026-06-30

Initial public release of **Collie** — a phone web UI to monitor and reply to your Herdr agent
herd over Tailscale.

### Added
- **Mobile-first PWA** (Vite + React + TypeScript + Tailwind v4 + shadcn): a triage dashboard
  (Spaces overview + Needs-you / Working / Idle agent groups), a per-agent colored terminal mirror,
  an agent-aware slash-command palette (Claude Code, Codex, pi, opencode), a special-keys pad with
  inline arrows/Tab, per-agent brand icons, image upload, and animated view transitions. Installable,
  with an auto-updating service worker and a build-stamp footer.
- **Bun/TypeScript bridge** over Herdr's Unix socket: a polled live snapshot (adaptive cadence,
  gzip + `ETag`/`304`) plus reply / keys / upload endpoints, and space/tab/pane management (create
  shell panes, switch, kill) through a unified nav hub.
- **Runs as a `systemd --user` service** supervised independently of Herdr, with a `tailscale serve`
  launcher (`scripts/collie-ctl.sh`) and a thin Herdr plugin (`herdr.collie`) exposing
  start / stop / restart / status / url / version / update / uninstall actions. One-command update
  (pull → rebuild → restart → re-link) for the linked checkout.
- **Optional Web Push (VAPID) notifications** when an agent needs you, with a custom service-worker
  push handler that renders the real message and deep-links the tap to the agent's pane.
- **Security posture:** loopback-only bind, `tailscale serve` as the sole ingress (never `funnel`),
  a same-origin gate, an optional `COLLIE_TRUSTED_USER` identity check, optional per-device
  authorisation via a trusted upstream header, a strict CSP, and terminal output rendered as React
  text nodes (the XSS boundary).
