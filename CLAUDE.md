# CLAUDE.md — working agreement for this repo

**Collie Pup** (fork `bermudi/collie`, tracking [`AltanS/collie`](https://github.com/AltanS/collie)
wholesale — [ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)) —
a phone web UI for the AI agents running in your terminal, served over Tailscale. A mobile-first PWA (Vite + React + TS + Tailwind v4 + shadcn) plus a Bun/TS
bridge that mirrors ONE multiplexer per install — Herdr, tmux or zellij — letting you monitor and
reply to agents from a phone. Herdr is one adapter among the three, not the product: it is the
default, it is the only one that talks over a Unix socket, and its plugin route stays supported —
plugin id `herdr.collie` (manifest: `herdr-plugin.toml`). Orientation:
[`README.md`](./README.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) · the UI's visual
language [`DESIGN.md`](./DESIGN.md) · verified API [`HERDR_API.md`](./HERDR_API.md) ·
decisions [`.adr/`](./.adr/) · adding a harness
[`HARNESS_CONTRIBUTING.md`](./HARNESS_CONTRIBUTING.md) · adding a multiplexer
[`MUX_CONTRIBUTING.md`](./MUX_CONTRIBUTING.md).

## Decision records — read before reopening a settled question

[`.adr/`](./.adr/) holds the decisions whose reasoning would otherwise live only in a PR thread —
specifically the ones that **close off an option someone will reasonably propose again**. If you're
about to argue *why not* rather than *how*, check there first; if the answer isn't there and the
decision is that shape, add one (numbering + format: [`.adr/README.md`](./.adr/README.md)).

Rules elsewhere in this file stay short and normative and link to the ADR for the argument. Don't
restate an ADR's reasoning here, and don't edit a superseded ADR into agreement with the present —
mark it superseded and write the next one.

## Versioning — MANDATORY

Collie is **SemVer**ed, and the version is **enforced**, so it never silently drifts.

**The version lives in three files that must always agree, plus a matching CHANGELOG entry:**
`herdr-plugin.toml` (canonical — Herdr reads it) · `package.json` · `web/package.json` ·
newest *numbered* `## [x.y.z]` heading in `CHANGELOG.md`. `## [Unreleased]` is not numbered and is
not part of that agreement.

**Two kinds of commit. A functional commit records; only the release commit bumps.** Never bump a
version because you fixed something; the version moves once, when the release is cut.

**Before committing any functional change** (anything under `bridge/`, `web/src/`,
`web/public/`, `scripts/`, `systemd/`, or the manifest / package files, minus the tests and hooks
carved out below), you MUST, **in the same
commit**, add **one bullet** to `CHANGELOG.md` at the end of the `## [Unreleased]` list so the
list stays in landing order. **Style: a group, a bold lead, then the detail.** The bullet sits
under one of five level-3 headings, in this order and only where there is content: `### Added`,
`### Changed`, `### Fixed`, `### Packaging`, `### Docs`. It opens with a short bold lead sentence, present tense,
about ten words, the period inside the `**`, and the detail follows in the same bullet:
`- **The lead sentence.** The detail follows here.` End with the thanks and the issue or PR it
answers where one exists (`Thanks @handle (#147).`), and with **no commit hash**: the hash does not
exist yet, and the release commit adds it. The lead is what the GitHub Release page prints, so
write it as the sentence an operator reads there. Do not touch the three version files.

**Cutting a release is one `chore(release): x.y.z` commit** that does all of this and nothing else:

1. **Pick the axis** from the *sum* of the Unreleased entries — what the operator has to do, not how
   visible any one change is:
   - **PATCH** (`0.2.0 → 0.2.1`): nothing to learn. Bug fixes, internal refactors, and small
     additions that build on an existing verb or screen and change nothing about how you already
     use Collie: a QR printed beside the pairing code, an extra column in `devices list`, a new
     flag with a safe default. The phone folds a patch-only delta into its weekly update digest
     (`DIGEST_PATCH_WINDOW_MS` in `bridge/update.ts`); the in-app band shows it at once.

     **An urgent patch keeps the daily cadence.** A patch the operator must take today, data loss, a
     security fix, a broken update path, may carry ONE line directly under the release heading in
     `CHANGELOG.md`, above the first `###` group, in the same bold-lead style as a bullet:
     `**Urgent.** <one sentence, present tense, why this must reach operators today.>` The release
     job copies that line into the `collie-release.json` sidecar and onto the release page, and the
     phone then keeps the daily digest window for that release instead of folding it into the weekly
     patch one. **The axis stays patch**: urgency changes the delivery, never the number. Use it
     rarely, at most one release in a quarter in normal operation, and a release that is merely good
     is not urgent ([ADR 0046](./.adr/0046-an-urgent-patch-keeps-the-daily-cadence.md)).

     **Write the sentence for the operator, not for the diff.** Name the impact, never the code path.
     No version numbers, no links, no backticks, under 140 characters, ending in a period. The
     release fails if the line is nearly right, so copy the shape of one of these:

     - `**Urgent.** A pane closed from the phone can delete the wrong pane.`
     - `**Urgent.** A paired device stays paired after you revoke it.`
     - `**Urgent.** Updating from 1.9.0 leaves the service stopped.`

   - **MINOR** (`0.2.0 → 0.3.0`): something to learn, or worth hearing about today. A new verb,
     a new page, a new capability, a changed default, anything that earns its own section
     in `docs/`. The phone nudges within a day.
   - **MAJOR** (`0.2.0 → 1.0.0`): the operator must change something. A config key renamed or
     removed, a contract broken, a workflow that used to work and now does not.

   The person cutting the release decides. When in doubt, pick patch.
2. **Bump** all three version files to that number.
3. **Rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD`**, using the release date. The four
   `###` group headings and their bullets come along as they are; within a group the bullets stay
   in landing order, oldest first, because each was appended to the end. **Append each
   line's short commit hash** in the link format
   `([abc1234](https://github.com/AltanS/collie/commit/abc1234))`. Clean up the section: merge
   or reorder lines as needed, and delete entries for changes reverted before release.
4. **Re-create an empty `## [Unreleased]` heading above it.**
5. **Bump `flake.lock` if it is to move at all** — in this commit and no other. The input is
   pinned by revision, so a bump is two edits: the `rev` in `flake.nix`, then `nix flake lock` to
   re-record it. The lock pins the toolchain the published binary is built with (*Build / run* →
   the flake), so a lock that moved in a feature commit describes a build nothing records. This is
   the only commit allowed to touch it, and `scripts/check-flake-lock.sh` refuses the others.
   Leaving it alone is the ordinary case; a release does not owe the lock a bump.
6. **Run `scripts/check-version.sh`** — it must print `✓`. Then tag and push (next paragraph).

**A PR from a fork is the exception: leave all four files alone.** Bump nothing, add no CHANGELOG
line — send the functional commits only. The version is the maintainer's to pick, because it depends
on what else lands in the same release and on which axis the *sum* of those changes sits; a bump
guessed at PR time collides with the `chore(release):` commit that actually cuts the release, and two
PRs both guessing `0.26.1` conflict with each other. `scripts/check-version.sh` stays green either
way — all four files simply keep the version they already agree on. The pre-commit hook may object
locally; `SKIP_VERSION_CHECK=1 git commit …` is the intended escape hatch here. If you'd like a
CHANGELOG line in your words, put it in the PR description and it'll be used. (Maintainer side: the
Unreleased line is yours to write on merge — cherry-pick the functional commits with `-x`, then add
the line in a follow-up `docs(changelog):` commit or by amending the merge. When a fork PR does carry
a release commit, drop that one — authorship is preserved and `main` stays unreleased until you cut
it.)

Doc-only changes (`*.md`) need neither a bump nor a CHANGELOG line, and neither do **tests**
(`*.test.ts`, `*.test.tsx`, `*.test.sh`) or **the git hooks** (`scripts/git-hooks/`). Both ship
nothing: a test is not in the binary and not in `web/dist`, and a hook runs on a developer's machine
at commit time and is not in the release tarball at all. No operator can see either change, so there
is nothing to record. Touch one of them *and* the code under it and the ordinary rule is back — the
source file is what the line is about. This is enforced two ways, but **you are the first line — do
it as part of the change, not after**:

**A docs change reaches colliepwa.dev only with a release.** Collie's `release.yml` tells the website
on every tag, and the website re-quotes `docs/*.md` at the newest published release — so a doc-only
fix pushed to `main` and not released sits unpublished, and the website's daily cron will not pick it
up either. To publish sooner, run the website's sync by hand against a ref:
`gh workflow run sync-docs.yml -R AltanS/collie-website -f ref=main`.

- `scripts/check-version.sh` runs inside `collie build` (a release can't build while versions
  disagree).
- A **git pre-commit hook** (`scripts/git-hooks/pre-commit`, activate once with
  `scripts/install-hooks.sh`) blocks a functional commit that neither adds a line under
  `## [Unreleased]` nor bumps the version, blocks a commit whose staged `## [Unreleased]` bullets
  are not grouped under one of the five `###` headings or do not open with a bold lead, and blocks
  a release commit (version bumped) whose `## [Unreleased]` section still has lines in it. The same hook holds guard (D), which refuses a
  staged `flake.lock` that is not part of a release commit. Escape hatch for a single commit:
  `SKIP_VERSION_CHECK=1 git commit …` (every `SKIP_*` hatch is listed under *Linting* below).

**Publish every release you cut — tag it when you push it.** Cutting a release means the three
version files + the newest numbered `CHANGELOG.md` heading agree on `x.y.z`, and `## [Unreleased]`
is empty again (the release recipe above). A cut version that never gets a tag is not a release at
all: `.github/workflows/release.yml` triggers on
`push: tags: ["v*.*.*"]` and nothing else creates the GitHub Release the in-app update banner links
to, so an untagged version exists only as a CHANGELOG heading and nobody can install it. So when
that release lands and you push, **always push a matching annotated git tag with it** —
`git tag -a vX.Y.Z -m "Collie X.Y.Z" && git push origin vX.Y.Z` (or `git push --follow-tags` so the
tag ships *with* the release). One `v<x.y.z>` tag per shipped version on the remote.

**A release is published only from a commit whose CI run succeeded.** `release.yml` enforces it: its
first job, `gate`, looks up the `ci.yml` run for the tagged commit, waits while that run is still in
flight, and refuses the release when the run failed, was cancelled, or never existed. 1.5.5 was
published from a red commit because nothing joined the two workflows; now they are joined, and the
whole matrix waits behind the gate.

**Push `main` first, watch CI, then push the tag.** That is the recipe:

```
git push origin main
gh run watch                 # or: gh run list --commit "$(git rev-parse HEAD)"
git push origin vX.Y.Z
```

`git push --follow-tags` in one go still works, because the gate waits rather than races. The
two-step form is preferred anyway, because a red CI then costs nothing: no tag exists yet, so you fix
it on `main` and the release commit can still be amended before anything is public. Once the tag is
pushed and CI is red, that door is shut: the fix is a follow-up patch release with a new tag, never a
moved or re-pointed tag.

**This is why pushes are held while a release is being cut.** `ci.yml`'s concurrency group is
`ci-<ref>` with `cancel-in-progress`, so a second push to `main` cancels the release commit's run
mid-flight. The gate then sees `cancelled`, not `success`, and refuses. Re-running CI for that commit
and then re-running the Release workflow clears it, but the cheaper move is the old rule: hold the
push until the release is out.

**The GitHub Release page is built, not written.** `release.yml` runs
`scripts/release-notes.ts` over `CHANGELOG.md` and hands the result to `gh release create`. The
order on the page is the reader's, not the file's: **`## Update` first and unfolded**, because a
phone arrives here from the in-app banner to copy one command and must not have to open anything
to see it; then `## What changed`, the bold lead of every bullet in that version's section, one
line each, under its group's name; then a link to the section itself for the commits and a compare
link; then the by-hand verify recipe, the one block that sits in a `<details>`.

The compare link's other end is a **real tag, asked of git** (`git describe --tags` on the tagged
commit's parent), never derived from a CHANGELOG heading: betas 33 to 41 have headings and no tags,
so a derived link would 404. No previous tag means no compare line. GitHub's generated notes are no
longer appended either: that list only knew merged pull requests, and most of Collie's history
lands as direct commits or cherry-picks that keep the author, so it read as if almost nothing had
shipped. Nobody writes release notes by hand, and a bullet the script cannot read stops the release
rather than publishing an empty page. `scripts/release-notes.test.ts` pins the body's shape and
also reads this repo's own `CHANGELOG.md`, so a badly shaped bullet is red in CI on the commit that
wrote it; the pre-commit hook refuses one at commit time, and the tag-time failure is the backstop.

`scripts/check-tag.sh` checks this: with no arguments it asks whether the version the repo currently
claims has a tag; given a rev-list selector it asks the same of every `chore(release):` commit the
selector picks, reading the version from *that commit's* manifest. The **pre-push hook runs it over
the range being pushed and WARNS** — loudly, last, with the exact `git tag -a` command. It warns
rather than blocks because the tag may legitimately be cut after CI has looked at the release
commit; skip it once with `SKIP_TAG_CHECK=1 git push`. Nothing checks the remote, so the last step is
still yours.

**Betas 33 to 41 are unreachable on purpose. Do not back-fill them.** They were cut in the version
files and the CHANGELOG and never tagged — not even locally — which is the failure the guard above
exists to stop repeating. Their commits are superseded by the betas that followed, and a tag cut
today would claim a release nobody ever tested.

**Update notice (user-facing).** The app's in-app update banner links to the newest release's GitHub
page and shows the command to run. Pushing a `v*` tag auto-creates that GitHub Release (with the
commands) via `.github/workflows/release.yml`. **Every Pup install is a Herdr-managed checkout, so always express user-facing update/restart
instructions as Herdr plugin actions** — `herdr plugin action invoke update --plugin herdr.collie`
(or `restart`) — never `systemctl … collie`, which depends on the caller's cwd and the unit name;
the Herdr action runs from anywhere.

## Docs style (`docs/*.md`, published to colliepwa.dev)

The website re-quotes these pages, so they are read on a phone: the renderer scrolls a code block
instead of wrapping it, renders a `>` blockquote as a card, and silently drops raw HTML. Write every
page to be skimmed.

- **Commands before prose.** A section that has something to run opens with the command, then
  explains it.
- **One numbered step is one sentence and one command.** A step that needs a code block holds the
  block indented under it. Explanation past one sentence goes in a paragraph after the list, never
  inside the step.
- **A callout is a real blockquote** (`> **Note.**`, `> **Experimental.**`), never a bold sentence
  buried in a paragraph. The site renders the blockquote as a card; the bold sentence is lost.
  The site colours the card by its bold lead word: `Note.` blue; `Experimental.`, `Caution.`,
  `Warning.` amber; `Never`, `Danger.` red; else neutral. A callout needing severity opens with
  one of these words bold; the phrase may continue (`**Experimental in 1.0.**` keys experimental).
- **One idea per paragraph, about four lines at 80 columns.** A caveat still stays in the same
  sentence as the claim it qualifies. Split the material around it rather than let the paragraph
  grow.
- **A fact the reader needs now is stated inline**, the default, the path, the command, and the
  link comes after, for the rest. `see X for where that lives` is the shape to avoid.
- **Enumerable facts go in a table:** variables, flags, per-multiplexer differences.
- **A code line fits 90 columns, trailing comment included.** The renderer scrolls, it does not
  wrap, so a long comment goes on its own line above the value.
- **Every `##` opens with a one-line summary**, before any detail.
- **No raw HTML and no `<details>`.** The site drops both without a word. Tables and blockquotes are
  safe.

## Build / run (operational facts that are easy to forget)

- **Every verb is `scripts/collie-ctl.sh <verb>`** — Pup's operating surface (build / restart /
  update / doctor / serve), carried whole from the fork. Upstream's `cli/` verbs are not carried
  ([ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md));
  the manifest's action set points at the ctl script, and its path is frozen because Herdr <0.8.0
  invokes the action set cached at install time
  ([ADR 0006](./.adr/0006-update-advances-the-checkout-herdr-installed.md)).
- **There are two checkout shapes, and `update` handles both.** `herdr plugin install` does not clone
  — it leaves a **detached, shallow** checkout, so `git pull` cannot run there; a linked clone sits on
  a branch. One predicate (`git symbolic-ref -q HEAD`) picks the strategy, and the same predicate
  stops `update` re-linking a managed checkout — a re-link re-registers the plugin as local and Herdr
  then refuses `herdr plugin install`, the operator's only other way to refresh
  ([ADR 0006](./.adr/0006-update-advances-the-checkout-herdr-installed.md)).
- **Frontend changes** (`web/`): rebuild with `bun run build` (root) or `cd web && bun run build`.
  The bridge serves `web/dist` **from disk at request time**, so on the deployment host
  a rebuild is **immediately live — no restart**.
- **Backend changes** (`bridge/*.ts`): Bun does **not** hot-reload the service — you must
  `systemctl --user restart collie`. Forgetting this is the #1 "my change didn't take" trap.
- `bun run build` (root) is now **one definition**: it runs `collie build`, which gates on
  `scripts/check-version.sh`, installs both trees, **typechecks both sides** (root tsc + web tsc),
  compiles `bin/collie`, builds web to `dist-staging`, and swaps both artifacts in **last** — a
  failed build never empties a live `web/dist` and never replaces the running binary. The binary is
  always renamed into place, never written through (the running service keeps its old inode until
  it restarts). Bare `cd web && bun run build` skips all of that; don't ship from it.
- **Typecheck, and the trap in it:** the ROOT `bun run typecheck` does **not** cover `web/`'s test
  files. Only `cd web && bun run typecheck` does. So a change to a shared type can leave the root
  check green while `bun run build` — and therefore `make deploy` — fails on stale test fixtures.
  Run **both**, every time: `bun run typecheck` at the root *and* `cd web && bun run typecheck`.
  This has shipped a broken tip to `origin/v1` once; it is not theoretical.
- **Tests:** frontend `cd web && bun run test` (Vitest + jsdom + Testing Library + MSW); backend
  `bun run test` at the root, Bun's own runner over every pure-logic module in
  `bridge/` (access checks, state engine, config, journal adapters, notifications, uploads, …) plus
  `scripts/collie-cli.test.sh`, which drives every verb of the compiled binary in a sandboxed HOME,
  and `scripts/collie-ctl.test.sh`, which pins the shim's delegation and bootstrap. Neither of these
  opens a browser, the browser tier is separate, see "Browser tests" below.
  A **pre-push hook** (`scripts/git-hooks/pre-push`) runs **both** before
  every push — override once with `SKIP_TESTS=1 git push` (see *Linting* → escape hatches). The bits that genuinely need `Bun.serve` /
  `Bun.connect` (HTTP handlers, the socket client) stay unit-untested — Vitest-on-Node can't run them,
  so keep new backend logic pure/injectable enough for `bun test`, or exercise it through `web/`.
- **`flake.nix` is the build environment, and `nix develop` is the reference.** It pins the five
  tools this tree is built and checked with — Bun, Node, git, tmux, zellij — at one nixpkgs
  revision, and `release.yml` builds every published payload inside it. Build and check through the
  flake where you can (`nix develop --command bun run build`, and the same for `lint`, `test` and
  both typechecks); a committed `.envrc` carries `use flake` for direnv users, and nobody is
  obliged to allow it. **Do not install a build tool by hand** to get past a version problem — move
  the pin, or say why you did not. Herdr is deliberately not pinned: it is the product's peer, not
  one of Collie's build tools.
- **`nix develop` is the reference, not a requirement.** A developer with no Nix works exactly as
  today — `bun run build`, `bun run lint`, `bun test`, unchanged. No script, hook or `bun run`
  target needs Nix to be installed.
- **Never touch `flake.lock` outside a `chore(release): x.y.z` commit.** It records which toolchain
  a published binary was built with, so a lock that moves in a feature commit means the binary a
  bisect builds is not the binary the release built, and nothing in the tree says when it changed.
  The release recipe (*Versioning*, step 5) is where it moves; `scripts/check-flake-lock.sh` refuses
  it anywhere else, with `SKIP_FLAKE_LOCK_CHECK=1` as its own hatch. The guard judges a change to the
  lock, so the first commit that adds it passes without a release commit. The pinned Bun must also stay
  at or above `MIN_BUN` in `scripts/collie-ctl.sh` — they are one fact, and
  `scripts/check-flake-bun.test.ts` fails when they drift apart.
- Service: `systemd --user` unit `collie` on the deployment host; logs `journalctl --user -u collie -f`.
- **Dependencies must be 7 days old to install** (`bunfig.toml` + `web/bunfig.toml`, mirrored in
  `.npmrc` for npm users) — a compromised release is usually pulled within hours. A brand-new
  version resolving to an older one is the rule working, not a bug; CI's `--frozen-lockfile` is
  unaffected.
- TS is strict on both sides, with `noUnusedLocals/Parameters` everywhere. **`web/` additionally**
  enforces `verbatimModuleSyntax` + `erasableSyntaxOnly` (use `import type`, no parameter-property
  shorthand there). The **bridge** tsconfig does not enable those two — bridge code uses
  parameter-property shorthand by convention; keep each side consistent with itself.

## Browser tests (Tiers 1-3)

A real Chromium opens the app. Vitest still covers every unit test; this layer sits above it and
tests nothing Vitest already covers.

- **Tier 1** runs in CI, on every push. `cd web && bun run e2e` builds the web bundle, serves it,
  and drives Chromium at `phone` (390x844) and `tablet` (820x1180), declared as four projects in
  `web/playwright.config.ts`: `app-phone`, `app-tablet`, `states-phone`, `states-tablet`, plus a
  fifth, `app-phone-webkit`, the same `app` specs under WebKit, Safari's engine. That one is always
  on in CI and opt-in elsewhere (`COLLIE_E2E_WEBKIT=1`), because Playwright's WebKit build cannot
  launch on Fedora; `make e2e-webkit` at the workspace root runs it inside an Ubuntu distrobox
  there. It exists because Safari disagrees with Chromium on geometry a unit test never sees
  (`web/e2e/belt.spec.ts` holds the first such case, 2026-09-14). The `app`
  target serves `web/dist` and answers every `/api/*` request from `web/e2e/fixtures/api.ts`; it
  never touches a live bridge. The `states` target runs the playground on port 5199, the way `make
  playground` runs it, and answers no API at all. Cases live under `web/e2e/`: today
  `smoke.spec.ts` and `handles.spec.ts`, plus the named cases proving a hand check,
  `web/e2e/service-worker.spec.ts`, which builds two bundles under `web/e2e/.builds/` to prove an old shell picks up a new one.
- **Tier 2** runs by hand, from the workspace root: `make e2e`. It drives the dev lane's lead,
  instance `next` on port 8788, reads only, and never restarts or rebuilds anything. Its cases live
  under `web/e2e/live/`, sharing the harness in `web/e2e/live/live.ts`. It never runs in CI:
  `web/e2e/live/playwright.config.ts` throws when `CI` is set, so a copied command cannot point a
  runner at somebody's machine.

**Fixtures.** Tier 1 imports the same fixture modules the vitest suite already uses,
`web/src/test/handlers.ts` and `web/src/playground/fixtures.ts`, and feeds them to `page.route`. A
case never invents its own payload.

**The selector rule.** A case addresses a role and an accessible name, `getByRole` or `getByText`,
never a CSS class. No case adds a `data-testid` anywhere in `web/src`. The one exception is the
playground: every card carries an explicit `data-state` handle, set by a `state` prop on `Card`
(`web/src/playground/harness.tsx`), never derived from its label.

**The locale rule.** A case that checks translated text pins the locale before the first
navigation, by writing the bare locale code into `collie:locale:v1` in `localStorage`
(`web/src/lib/i18n/index.ts`). There is no URL parameter and no `Accept-Language` path. Assert
against the string in `web/src/lib/i18n/messages/<code>.ts`, never against English's absence.

**Adding a case.**
- Tier 1, `app` target: add a `.spec.ts` under `web/e2e/`, call `installApiStub(page)` from
  `web/e2e/fixtures/api.ts` in a `beforeEach`, then `page.goto("/")`.
- Tier 1, `states` target: add a case to `web/e2e/handles.spec.ts` or a sibling `.spec.ts` matched
  by `STATES_TEST_MATCH` in `web/playwright.config.ts`, `page.goto("/playground.html")`, and address
  a card by `[data-state="…"]`.
- Tier 2: add a `.spec.ts` under `web/e2e/live/`, import `test`/`expect`/`message` from
  `web/e2e/live/live.ts`. Read only, no pairing, no "Take over", no update, no device revoke, no
  pane close or rename.

**Reading a failure.** A failed case leaves a screenshot and, on a retry, a trace
(`screenshot: "only-on-failure"`, `trace: "on-first-retry"` in `web/playwright.config.ts`); CI
uploads both under `if: failure()`. Open the HTML report (`playwright-report/`, `["html", { open:
"never" }]`) to see them together with the run log.

**Two prohibitions.** Never assert a pixel, no `toHaveScreenshot`, no baseline images, a screenshot
is evidence for a person, not a comparison. And never point Tier 2 at anything but the dev lane.

The pre-push hook (`scripts/git-hooks/pre-push`) runs the backend suite and `cd web && bun run
test`. It does not run the browser suite, a browser download does not belong in a hook that fires
on every push. `cd web && bun run typecheck` covers `e2e/`; the root `bun run typecheck` does not.

## Linting — one linter, one config

- **oxlint is the linter and `bun run lint` is how you run it** — oxlint's own
  correctness/suspicious/perf catalog plus all 15 rules of the vendored
  [anti-slop](./tools/oxlint/README.md) plugin, at `error`. Don't add ESLint or biome
  ([ADR 0019](./.adr/0019-oxlint-and-vendored-anti-slop-are-the-lint-gate.md)).
- **One config, `.oxlintrc.json` at the root** — the editor, the PostToolUse hook, pre-commit and
  CI all shell out to it with no flags of their own. `web/` has no lint script;
  the root config already covers `web/src`. Only the **full-tree** run (CI) defines "passing".
- **`collie build` does NOT lint, and must not learn to.** `build` is the operator's path — a clean
  install and `update` both run it on the operator's machine — and oxlint's allocator SIGABRTs below
  roughly 7 GB of RAM, which bricked installs on ordinary boxes (1.0.0-beta.44). The mux-name check
  left with it; CI covers it through `scripts/check-mux-names.test.ts`.
- **A finding is fixed in the code, never suppressed and never cleared by downgrading a rule.**
  There are zero `oxlint-disable` comments in the tree and that is the policy. A `// SAFETY:`
  comment must state the invariant that makes the assertion sound — "safe, trust me" clears the
  rule and fails review.
- **Changing what's enforced goes through the rationale table in
  [ADR 0019](./.adr/0019-oxlint-and-vendored-anti-slop-are-the-lint-gate.md)**, which also holds the
  fix-shapes for the rules you'll trip most and the reasoning for the scoped `no-runtime-typeof`
  parse-boundary overrides. Per-rule reasons live as comments at the rule in `.oxlintrc.json`.
- **Don't edit `tools/oxlint/anti-slop/`** — it's a vendored copy, overwritten at the next
  re-vendor. Re-pinning upstream is the maintainer's deliberate act, and the diff gets a human
  read: vendored code is copied, not installed, so the 7-day dependency age gate never sees it.
- **`overrides.files` globs match the full path** — a glob must start with `**/` or it silently
  matches nothing. Verify any new one with a planted violation in-scope and a negative control out.

### Escape hatches (all of them, in one place)

Each guard has its own name on its own surface, so skipping one never disarms another. Use one for
a single command; never export one.

| variable | surface | skips |
| --- | --- | --- |
| `SKIP_VERSION_CHECK=1` | `git commit` (pre-commit hook) | the version-consistency + bump-on-change guard |
| `SKIP_LINT_CHECK=1` | `git commit` (pre-commit hook) | oxlint over the staged files |
| `SKIP_FLAKE_LOCK_CHECK=1` | `git commit` (pre-commit hook) | the `flake.lock`-only-in-a-release guard |
| `SKIP_TYPECHECK=1` | `bun run build` / `collie build` | both typecheck steps |
| `SKIP_TESTS=1` | `git push` (pre-push hook) | both test suites |
| `SKIP_TAG_CHECK=1` | `git push` (pre-push hook) | the untagged-release warning |

The pre-commit hook's guards are **independent** — `SKIP_VERSION_CHECK=1` does not disarm the
lint guard or the `flake.lock` guard.

## Frontend data layer (React Router, not TanStack)

- **The UI has a written design language — read [`DESIGN.md`](./DESIGN.md) before building a
  visual component.** Its first rule is the one that keeps getting broken: look in
  `web/src/components/ui/` for an existing primitive, and promote one the moment a second
  place needs the same visual idea. It also holds the no-shift rule, the radius and line
  tokens, the mono-vs-sans split, and the Tailwind v4 traps that each cost a day.
- **Before adding any recurring visual pattern, check `web/src/components/ui/` for the
  primitive; if none exists, the primitive comes first, in its own commit.** A pattern built at
  a call site first is one that never gets promoted — the alert family cost six components that way.
- **Check UI states in the playground** (`web/src/playground/`, `cd web && bun run playground`,
  README → "The states playground") before changing a banner, the mark, the boot splash, the idle
  lock — it renders every state at once. Never import playground code from app
  code.
- Data flows through **React Router** (`createBrowserRouter`, data mode): route **loaders**
  (`web/src/lib/loaders.ts`) fetch the snapshot + pane; **polling is `useRevalidator()` on an
  adaptive interval** (`web/src/hooks/use-polling.ts`); mutations are direct `lib/api.ts` calls
  followed by `revalidator.revalidate()`. There is **no TanStack Query** — don't reintroduce it.
- Routes (`web/src/router.tsx`): `/`, `/space/:spaceId`, `/settings`, `/pane/:paneId` and
  `/pane/:paneId/history`. The router instance is module-scoped so it keeps its location.
- **The idle lock pauses; it does not gate.** It only appears when Collie is left *open, visible and
  untouched* — a hidden page never locks, and returning to the foreground auto-resumes. It covers a
  still-mounted router (unmounting it ate in-progress composer drafts) and pauses polling through
  `lib/idle.ts`. Don't restore it as a security control or re-describe it as one
  ([ADR 0007](./.adr/0007-the-idle-lock-is-a-pause-not-a-gate.md)).
- **"Type into terminal" is armed by a named choice and dies with the pane view.** Long-pressing Send
  opens a menu; the hold never arms it alone. It disarms on a pane switch, a composer lock (gone pane,
  read-only, idle pause), a hidden page, and a failed batch — never persisted, never restored. Don't
  lift it, and don't add the reply guard's `composerReady` pre-flight to it; the reasoning for both
  sits in `web/src/components/send-mode-menu.tsx`'s header.
- **The phone moves the operator's terminal only on the "Show in terminal" tap** (`setFocus`, one
  row in the pane sheet). `MuxPane.focused` is a fact the snapshot reports, and the terminal never
  moves the phone in the other direction — that may not become a side effect of navigation
  ([ADR 0031](./.adr/0031-freshness-is-a-declared-promise.md)).
- **The "Full reply" card is gated on an identity check, not a length check.** The pane view re-shows
  the newest journal turn only when the tail probe proves that turn IS the message on screen and the
  head probe shows its start is not. A failed tail probe means render nothing — don't relax it to "the
  newest journal turn", which would present a stale or still-streaming reply as the one you're reading
  (`web/src/lib/latest-reply.ts`). It **replaces** the rows it covers rather than sitting above them
  (`hideLeadingLines`), and that hiding is render-only, applied after every grammar has run over the
  whole screen — never trim the text a detector, guard or draft probe sees.
- **The operator's rows in `commands.toml` replace the shipped command catalog on the panes they
  address, never merge into it** ([ADR 0018](./.adr/0018-operator-command-rows-replace-the-catalog.md));
  the bridge re-reads the file behind an mtime check, so edits are live and need no restart.
- **That replace-law runs PER SURFACE, and the harness bar is the second surface** — a row with
  `bar = true` goes on the bar above the keys as well as into the palette, and the bar's
  replace-or-fall-back runs over the `bar = true` rows ALONE, so one bar row never blanks the Agent
  palette ([ADR 0043](./.adr/0043-operator-bar-rows-replace-the-bar-not-the-palette.md)).
  `web/src/lib/harness-bar.ts` is a VIEW of `agent-commands.ts`, never a second catalog: a command it
  spells that the catalog lacks is a failing test, and a row for a capture-sourced harness needs an
  `evidence` path that exists. `commandsFor` is unchanged.
- **`keys.toml` is `commands.toml`'s sibling** — the operator's rows replace the Keys tray's shipped
  Ctrl presets on the panes they address (ADR 0018 again), and only those presets: the tray's
  keyboard is fixed. Both files share one reader (`bridge/operator-file.ts`) and one scope ladder
  (`web/src/lib/operator-scope.ts`); teach both, never one.
- **`quick-replies.toml` is the third on that contract** — the operator's groups replace the Quick
  dock's shipped phrases on the panes they address (ADR 0018 once more), shell panes included when
  a row is scoped to them. Same reader, same scope ladder: the three files differ in grammar and
  never in posture, so teach all three or none.
- **`theme.toml` is the operator's fourth file, and it is the one that ADDS rather than replaces** —
  its `[[font]]` rows put extra UI typefaces UNDER the shipped three in the Settings picker, and the
  bridge serves the files read-only from `<config-dir>/fonts` at `GET /api/fonts/<basename>`. Same
  reader, same mtime liveness; the opposite posture, because a font cannot fire an action and so
  shadows nothing ([ADR 0033](./.adr/0033-the-app-face-is-a-device-preference.md)). Don't dilute
  ADR 0018's replace-law to cover it.
- **`launchers.toml` is the operator's fifth file, and the only one whose rows CREATE a pane** — its
  rows are the allowlist `POST /api/launch` matches exactly, so the client names a row and never
  supplies a command line. Same reader, same mtime liveness; no scope ladder, because a row that
  makes its own pane has nothing to address. Do not add a second allowlist and do not let the client
  supply a command line.
- **Every user-facing string goes through `t()`/`tn()` from `@/lib/i18n`**, and a component that
  calls them subscribes via `useLocale()` so it re-renders on a locale (or lazy-dictionary) change.
  `messages/en.ts` is the source of truth; all six dictionary files change together, enforced by
  `tsc`. Not translated: terminal/agent output, quick replies, menu/dialog labels the screen printed,
  key caps, push notifications, service-worker strings, connection errors, and the
  slash-command descriptions in `web/src/lib/agent-commands.ts` (another tool's vocabulary — deferred)
  ([ADR 0030](./.adr/0030-the-ui-is-translated-by-a-typed-dictionary-not-a-library.md)).
- **PWA** via `vite-plugin-pwa` (`web/vite.config.ts`): manifest + `sw.js`, registered manually
  from `virtual:pwa-register` in `main.tsx` (bundled = CSP-safe). Install/SW need a **secure
  context** — over plain HTTP they no-op silently (Chrome insecure-origin flag, or HTTPS, to test).
- **The app's UI typeface is a per-device SETTING, not the maker's choice** — System / Space Grotesk /
  Aldrich (default), plus whatever the operator declared, applied pre-paint as a root class by
  `web/public/theme-init.js` and stored in `collie:design:v1` (`web/src/lib/design.ts`). CSS owns
  every stack; JavaScript only swaps a class name. What survives the reversal is the other half of
  the rule: **the chosen face never dresses agent-authored text** — `font-mono` and `font-content`
  are untouched by it ([ADR 0033](./.adr/0033-the-app-face-is-a-device-preference.md)).
- **The bundled Nerd Font subsets stay lazy and out of the precache** — `unicode-range` per face,
  version in the filename, cached first-use by `sw.ts`. Don't add them to `globPatterns`, don't
  widen a range, don't move subsetting into the build; the reasoning for each sits at the line that
  would change (`web/src/index.css`, `web/vite.config.ts`, `scripts/build-nerd-font.sh`).

## Herdr socket gotchas (see HERDR_API.md for the full, verified contract)

- RPC is **one-shot**: one request per connection; the server closes after one reply. `id` must be
  a **string**. Only `events.subscribe` streams.
- `pane.send_keys` grammar is **`+`-joined, not tmux**: `ctrl+c` (NOT `C-c`), `shift+tab`, `Up`,
  `Tab`, `Escape`, `Enter`, `Backspace`. `PageUp`/`Home`/`End`/`Delete` are unsupported.
  Herdr 0.8.0 mis-encodes `shift+tab`; the herdr client sends only that chord as the complete raw
  `ESC [ Z` through `pane.send_text`. Keep the UI/audit spelling semantic and preserve queue order
  across the adapter's sequential RPCs — a segment that fails after an earlier one landed refuses
  with a do-not-retry message, never a plain transport error.
- **A long send to Claude is verified via its paste placeholder** — anything past Claude's paste
  threshold collapses in the input box to `[Pasted text #N +M lines]`; the guard accepts that token as
  send evidence only when it is consistent with the message just typed. Don't try to dodge the
  threshold by chunking sends ([ADR 0010](./.adr/0010-long-sends-are-verified-via-the-paste-placeholder.md)).
- **A password prompt is recognised so Collie can SAY what it is, never so it can send** — no
  automatic Enter, no relaxed verification, no secret channel; the remedy offered is the operator's
  own tap on "Type" ([ADR 0017](./.adr/0017-recognising-a-password-prompt-changes-what-collie-says.md)).
  Recognition does one thing on its own: it drops the stored draft and stops persisting keystrokes.
- Pane output is rendered as **React text nodes** (never `innerHTML`); the ANSI parser only derives
  colors/weights. Keep it that way — it's the XSS boundary. Strict CSP + same-origin gate stay.
- **Collie runs no terminal emulator** — `pane.read` returns Herdr's already-rendered grid, so the
  parser needs colour and nothing else. Don't add one on either side, and don't reach for
  `terminal session observe`/`control`: a stale mirror is a transport problem, cursor position is an
  upstream ask, and `control` resizes the *shared* PTY
  ([ADR 0008](./.adr/0008-collie-does-not-run-a-terminal-emulator.md)).
- **A table pans; the mirror around it keeps wrapping** — `lib/table-run.ts` groups a table's rows
  into a single scroller inside the wrapping `<pre>` (`ansi-output.tsx`). One scroller per table,
  never one per row. Each grammar anchors on a row nothing else prints — a markdown delimiter row,
  a `+---+` rule, a frame row carrying a **cross** — and then grows by agreement, so a menu, a
  chrome box or a rule beside a table is never claimed. `table-run.test.ts` gates it against every
  capture in `fixtures/panes`; the argument sits in `table-run.ts`'s header.
- **Never use a `dark:` variant inside the mirror `<pre>`** — it tracks the root theme, which is
  backwards in a surface that renders dark under every theme and inverts in light
  ([ADR 0002](./.adr/0002-invert-the-light-terminal-mirror.md)). Fails silently;
  `ansi-output.test.tsx` guards it.
- **The plan dialog's last row is a text input, and it is never a button** — its label is only a
  placeholder while the box is empty, and its digit merely focuses the field. While `❯` sits on it the
  terminal swallows every digit as a character, so no button on that dialog may be pressable; while it
  holds text, Collie must not type into it (the caret resets to position 0, so it would prepend). A
  long value **wraps** the row rather than windowing it, which re-flows the screen above — so nothing
  may read that row as one line, and no mid-flight identity may reach above the question.
  Feedback is sent as a verified sequence, never a keystroke — the ground truth for every state is
  [`PLAN_FEEDBACK_NOTES.md`](./web/src/lib/grammar/PLAN_FEEDBACK_NOTES.md); re-walk it before touching
  `harness/claude/prompt-select.ts` or `lib/prompt-action.ts`.
- **The phone parses what the phone draws; the bridge parses only what it must act on alone.** Every
  pane grammar is client-side, under `web/src/lib/harness/`. The bridge holds one,
  `extractClaudeSessionName`, and only because the bridge itself consumes it, for a label that must
  exist when no app is open. Do not move a grammar into the bridge and do not add a parsed field to
  `/api/snapshot` to save the client a walk: a styled row has no wire form, a peer one release behind
  sends nothing so the client needs the parse regardless, and the client already walks that tail once
  per poll. Need something new off the screen? Add a probe to `HarnessAdapter`
  ([HARNESS_CONTRIBUTING.md](./HARNESS_CONTRIBUTING.md) → *Which side parses a pane*).
- **A generically-detected menu emits only the keys the screen printed** — the footer's
  `<key> to <verb>` hints plus the arrows it advertised. Never synthesise a digit from a numbered row:
  in the `/model` picker a digit confirms *and* persists the user's default. The generic grammar
  (`harness/claude/menu.ts`) runs LAST, after every specific detector declines, and an unrecognised
  modal refuses composer typing via the adapter's `composerReady` pre-flight
  ([ADR 0009](./.adr/0009-a-generic-menu-is-driven-by-the-keys-it-names.md)).
- **A composed key queue never outlives its dock** — closing Keys discards it (guarded by a two-tap
  confirm on the drawer transition, not the ✕). Don't lift or persist it: a queue surviving into a
  later open would let Send fire a stale sequence into a pane that has moved on
  ([ADR 0005](./.adr/0005-a-composed-key-queue-never-outlives-its-dock.md)).
- **The Claude input box is found by its own frame, not by walking the rows under it** — the lowest
  bare bottom border, a `❯` line and a top border, then every row below labelled (statusline, popup
  or unknown) and no modal on screen. The statusline-run bound in `chrome.ts` bounds only what the
  view strips; it never guards the send. Size it up if a real statusline needs more rows; don't
  delete it, and don't credit it with protection it doesn't provide
  ([ADR 0004](./.adr/0004-the-statusline-run-is-bounded.md), amended by
  [ADR 0048](./.adr/0048-the-input-box-is-found-by-its-own-frame.md)). `chrome.test.ts` and
  `input-box-frame.test.ts` pin both halves.
- **The Herdr socket is never dialled across a machine boundary** — one Collie mirrors one host's
  multiplexer ([ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)).
- **How soon Collie sees an out-of-band change is DECLARED (`topologyLatency`), never measured**, and
  `refresh()` is on the floor of the port so the phone can ask for a look now
  ([ADR 0031](./.adr/0031-freshness-is-a-declared-promise.md)). Every mutating route refreshes before
  it answers; `POST /api/refresh` is a read because it mutates nothing.

## The journal (scrollback the mirror can't give you)

`bridge/journal/` reads the agent's own session log off disk, per harness (`claude` / `codex` / `pi`,
registered in `registry.ts`). One other thing touches the filesystem, and it is not an exception to
the rule below: the operator's own
font files under `<config-dir>/fonts`, served read-only through `bridge/operator-fonts.ts`
([ADR 0033](./.adr/0033-the-app-face-is-a-device-preference.md)).

**The law is that the journal is the only place a CLIENT-SUPPLIED value becomes a path** — and even
there it is a pane id, never a path. `GET /api/fonts/<basename>` does not become a second such place:
the request's name is **looked up** in the rows the operator's own `theme.toml` declared and that
row's path is taken, so a name nobody declared is refused before any path exists. The containment
rule in [`files.ts`](./bridge/journal/files.ts) then runs anyway, on both surfaces and as an
independent second check: **every** path about to be read goes through `containedRealpath` — after
symlink resolution, on the real paths, including paths derived from one already checked. Reuse that
function; don't write a third answer to the sentence in bold. Run
`bun scripts/journal-probe.ts` against real logs after touching an adapter; unit tests pin the
grammar, the probe catches on-disk format drift.

## Security posture (don't regress)

Loopback bind only · exactly one hardened front door — `tailscale serve` (never `funnel`) or a
conforming reverse proxy per DEPLOYMENT.md Variant C (`COLLIE_SKIP_SERVE=1`) · same-origin gate ·
optional identity/device gates · strict CSP. A socket call can type into a real terminal — treat a
collie as remote shell access.

**The loopback gates fail closed.** Host validation is on by default (`COLLIE_ALLOW_ANY_HOST=1`
opts out), `COLLIE_TRUSTED_USER` rejects an ABSENT `Tailscale-User-Login` as well as a wrong one
(`COLLIE_TRUSTED_USER_OPTIONAL=1`), a non-loopback bind refuses to start
(`COLLIE_ALLOW_NON_LOOPBACK_BIND=1`), and a non-loopback TCP peer is refused. Pup has no second
listener and no exempted surface — every route a client can reach sits behind these gates
([ADR 0001](./.adr/0001-one-managed-front-door.md),
[ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)).

**The bridge makes no outbound call and spawns no long-running child for content.** Speech-to-text
is not carried ([ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md));
the phone keyboard's own microphone is the voice path on Pup.

**Two device gates guard writes, independently, and compose by AND.** `COLLIE_DEVICE_HEADER` trusts
a name a proxy injects; **pairing** (`bridge/pairing.ts`) requires a
bearer credential the device holds, and is on exactly when the registry is non-empty. Reads stay
ungated by both. The reasoning sits in
`bridge/pairing.ts`'s header; don't collapse the two gates into one.

**Collie manages exactly one front door: `tailscale serve`** — `collie-ctl.sh serve` publishes it,
records the mapping in `tailscale-managed-handler`, and only ever tears down a mapping matching that
record. Every other tunnel (NetBird, ZeroTier, Cloudflare Tunnel) is `COLLIE_SKIP_SERVE=1` +
DEPLOYMENT.md Variant E: the operator owns the ingress, Collie publishes nothing. **Don't add a
second managed front door** — [ADR 0001](./.adr/0001-one-managed-front-door.md).

**There is no peer link on Pup** — no `/crew/v1/*`, no second listener, no standby door, no wire
protocol to guard: the strip-fork removed them all
([ADR 0053](./.adr/0053-pup-tracks-upstream-wholesale-and-strips-the-pack-not-the-viewer.md)). If a
merge reintroduces any of those files, resolve as deleted and re-run the strip-list grep from
AGENTS.md.
