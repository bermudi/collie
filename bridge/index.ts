import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { ActivityLedger } from "./activity.ts";
import { trackActivity } from "./activity-tracking.ts";
import { CacheTracker } from "./cache/tracker.ts";
import { CacheWarden } from "./cache/warden.ts";
import { CacheWatchStore } from "./cache/watch.ts";
import { localWatchPane } from "./cache/watch-key.ts";
import { buildJournalRegistry } from "./journal/registry.ts";
import { createCacheRulesReader } from "./operator-cache-rules.ts";
import { AuditLog, fileAuditAppender } from "./audit.ts";
import { loadConfig, nonLoopbackBindRefusal, type Config } from "./config.ts";

import { loadConfigLayer } from "./config.ts";
import { applyConfigLayer } from "./config-source.ts";
import type { AgentView } from "./types.ts";
import { EventPoker } from "./event-poker.ts";
import { HERDR_DIAL_MODE_OPTION } from "./mux/herdr/adapter.ts";
import { DEFAULT_TIMEOUT_MS } from "./mux/herdr/client.ts";
import { deriveConfigRoot } from "./mux/herdr/sessions.ts";
import {
  buildMuxRegistry,
  createMux,
  DEFAULT_MUX,
  describeMux,
} from "./mux/registry.ts";
import { TMUX_BINARY_OPTION } from "./mux/tmux/adapter.ts";
import type { MuxAdapter } from "./mux/types.ts";
import { ZELLIJ_BINARY_OPTION } from "./mux/zellij/adapter.ts";
import { NotificationCoordinator, makeNotifySink, type NotifyClock } from "./notifications.ts";
import { NotifyPrefsStore } from "./notify-prefs.ts";
import { filePairingIo, PairingStore } from "./pairing.ts";
import { Push } from "./push.ts";
import { pluginRoot } from "./root.ts";
import { startServer } from "./server.ts";
import { herdTagFor, SessionRegistry, type SessionFactory } from "./sessions.ts";
import { Snooze } from "./snooze.ts";
import { StateEngine } from "./state-engine.ts";
import {
  bridgeStampSync,
  githubCredential,
  githubTagsFetcher,
  resolveUpdateRepo,
  UpdateMonitor,
  UpdateStateStore,
} from "./update.ts";
import { SWEEP_INTERVAL_MS, sweepUploads } from "./uploads.ts";
import { collieVersionBare } from "./version.ts";

// How often the registry rescans the filesystem for sessions that appeared/disappeared after boot.
const SESSION_REFRESH_MS = 15_000;
// Upstream release check cadence. Releases are rare, so poll every few hours; the first check is
// delayed so we never probe the network mid-boot.
const UPDATE_FIRST_DELAY_MS = 90_000;
const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Entry point: resolve config, wire the pieces, start polling and serving.
//
// Pup is a SOLO bridge by construction: the crew/pack machinery, the speech-to-text seam and the
// staged update runner are not carried in this fork (see .adr/0053), so everything below wires
// exactly one machine's herd — no trust store, no peer listeners, no second door.
//
// The config files come FIRST, and they come in under the environment (ADR 0040): `~/.collie/config.toml`
// then `<configDir>/config.toml`, applied to `process.env` only for names it does not already carry.
// One read, one application point, so every module that resolves its own settings from the
// environment sees the file without learning about it. A broken file warns and the bridge still
// starts; that is the whole posture, and it is why nothing here can throw.
const configLayer = await loadConfigLayer(process.env, undefined, (line) => console.warn(line));
applyConfigLayer(configLayer);

// loadConfig throws on config it cannot parse at all. Print the reason alone — a stack trace here
// buries the one line the operator needs.
let cfg: Config;
try {
  cfg = loadConfig();
} catch (err) {
  console.error(`[bridge] FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

// A solo bridge is a browser front door: every write gate it owns is a header a client can set, so
// a wide bind hands write access to anything that can reach the port. Refuse to start (ADR 0001's
// posture; upstream exempts crew members here, and Pup carries no crew to exempt).
{
  const refusal = nonLoopbackBindRefusal(cfg);
  if (refusal !== null) {
    console.error(`[bridge] FATAL: ${refusal}`);
    process.exit(1);
  }
}

// Ensure the state dir exists with private (0700) perms before push/snooze/uploads write into it —
// it holds push subscription endpoints and uploaded images, so keep it owner-only.
await mkdir(cfg.stateDir, { recursive: true, mode: 0o700 });

// Append-only audit trail of write-level actions (see audit.ts). A write failure here is swallowed
// inside record() so it can never break the user action it's auditing.
const audit = new AuditLog(fileAuditAppender(join(cfg.stateDir, "audit.log")), {
  content: cfg.auditContent,
});

// ── Process-global services, shared across every session ─────────────────────
const push = new Push(cfg);
await push.init();

const snooze = new Snooze(cfg);
await snooze.load();

const notifyPrefs = new NotifyPrefsStore(cfg);
await notifyPrefs.load();

// Device pairing (bridge/pairing.ts). Constructed unconditionally and holding no state of its own:
// it re-reads `<stateDir>/paired-devices.json` per request (cached on mtime), so pairing and device
// revocation land on the RUNNING service without the restart every other backend change needs. An
// empty registry — the state every existing install starts in — enforces nothing.
const pairing = new PairingStore(filePairingIo(cfg.stateDir));

// When each pane last moved, and when you last looked at it — the two numbers the dashboard sorts
// and triages by (see activity.ts). Process-global and keyed by session name, because pane ids are
// session-scoped and collide across sessions.
const activity = new ActivityLedger(cfg);
await activity.load();

// How long each pane's prompt cache stays warm (bridge/cache/tracker.ts). The registry is built HERE,
// once, and handed to both the tracker and the server, so the probe and the history route share the
// adapters' memoised path caches. Null when `COLLIE_TRANSCRIPT` is off: no journal means no probe, and
// every pane then reads exactly as it did before this feature existed.
const journals = cfg.transcript ? buildJournalRegistry(cfg.journalRoots) : null;
const cacheRulesReader = createCacheRulesReader(cfg.cacheRulesFile);
const paneCache =
  journals === null
    ? null
    : new CacheTracker(journals, { overrides: () => cacheRulesReader() }, () => Date.now());

// Which panes the operator asked to be warned about before their prompt cache goes cold, and the
// deadlines already warned (bridge/cache/watch.ts). Loaded here beside the other two preference stores;
// the file does not exist until an operator toggles something or a warning actually goes out.
const cacheWatch = new CacheWatchStore(cfg);
await cacheWatch.load();

// The warden that judges them. A DEPS LITERAL WITH NO LOGIC IN IT, for the reason
// `bridge/update.ts`'s monitor is built the same way: there is no `bridge/index.test.ts`, so every gate
// is proved in `bridge/cache/warden.test.ts` instead and this line must hold nothing that could be
// wrong. It owns no timer — `tick` is called from the poll below.
const cacheWarden = new CacheWarden({
  now: () => Date.now(),
  muted: () => snooze.isMuted(),
  globalOn: () => notifyPrefs.current().cache,
  store: cacheWatch,
  warnSeconds: cfg.cacheWarnSeconds,
  send: (msg) => void push.send(msg),
});

// ── Update-availability monitor ───────────────────────────────────────────────
// The running plugin version, captured NOW at module load — never re-read from disk later, or a
// post-pull package.json would mask the very update we detect (same class of bug as the buildId gap).
// The bridge-source stamp is snapshotted here too, so a rebuilt-but-not-restarted process reads stale.
const rootDir = pluginRoot();
const bridgeDir = join(rootDir, "bridge");
// SAFETY: this is the plugin's OWN package.json, shipped in the same checkout as this file, and
// `scripts/check-version.sh` gates every build on its `version` being present and agreeing with the
// manifest — so the field is guaranteed by the release process, not hoped for.
const currentVersion = (
  JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8")) as { version: string }
).version;

// What this process answers `/api/health` with — resolved once, here, so the update monitor and the
// health route can never name two different versions of one running build (bridge/version.ts).
const version = collieVersionBare(rootDir);

const updateStore = new UpdateStateStore(cfg);
await updateStore.load();

// The repo the release check + release links point at. Defaults to this fork's own — the same repo
// `collie-ctl.sh update` advances the checkout from — and is overridable for a fork-of-the-fork (or
// a synthetic test target) via COLLIE_UPDATE_REPO.
const updateRepo = resolveUpdateRepo(process.env);
const updateMonitor = new UpdateMonitor({
  repo: updateRepo,
  current: currentVersion,
  startupStamp: bridgeStampSync(bridgeDir, rootDir),
  // With the operator's GitHub token when the env holds one (#254): the same three names, in the
  // same order, that `collie update` reads, so the banner and the verb share one budget.
  fetchTags: githubTagsFetcher(updateRepo, githubCredential(process.env)),
  bridgeStamp: () => bridgeStampSync(bridgeDir, rootDir),
  store: updateStore,
  now: Date.now,
  // The `updates` notify pref is the off-switch — update pushes bypass snooze, so this is their gate.
  updatesEnabled: () => notifyPrefs.current().updates,
  notify: (latest) =>
    void push.send({
      type: "update",
      tag: "collie:update",
      // No command in the body — the tap opens Settings (target below), and the update banner / linked
      // release page carry the location-independent Herdr actions. Keeps this off the cwd-dependent path.
      title: "Collie update available",
      body: `Version ${latest} is available`,
      target: "settings",
    }),
});

// First check delayed (don't probe mid-boot); then every few hours. unref() so neither timer holds
// the process open; both cleared on shutdown.
const updateFirstCheck = setTimeout(() => void updateMonitor.checkRelease(), UPDATE_FIRST_DELAY_MS);
updateFirstCheck.unref();
const updateTimer = setInterval(() => void updateMonitor.checkRelease(), UPDATE_INTERVAL_MS);
updateTimer.unref();

// The multiplexers this build can drive. Built once — the map is derived from each factory's own
// name, so a key can never drift from the adapter it resolves to.
const muxRegistry = buildMuxRegistry();

// Say what this collie drives, once, before anything dials it. A reachable multiplexer used to be
// silent — the log named one only when it could not be reached — so `collie logs` could not answer
// the first question a tmux or zellij operator asks (docs/multiplexers.md → "Did it work?").
console.log(`[bridge] mux: ${describeMux(muxRegistry, cfg.mux, cfg.muxEndpoint)}`);

// ── Per-session runtime factory ──────────────────────────────────────────────
// One mux adapter + StateEngine + EventPoker + NotificationCoordinator per herd session. The
// registry calls this for the primary at construction and for each session discovered later. Push,
// snooze, notify-prefs, the audit log and the uploads dir stay process-global (shared here).
//
// THE ADAPTER IS BUILT THROUGH THE MUX REGISTRY and this is the only place that happens. `COLLIE_MUX`
// picks it and defaults to Herdr, so a deployment that sets nothing behaves exactly as it always has.
// The endpoint fork is the one thing this site knows: Herdr's endpoint IS the discovered session
// socket, and every other adapter is told where it lives by its own `COLLIE_MUX_ENDPOINT_<NAME>`
// (config.ts). Both per-adapter knobs ride the target's OPAQUE options — which local dialer opens a
// filesystem-path endpoint is Herdr's question, where the tmux binary is, is tmux's, and the registry
// reads neither key.
const makeSession: SessionFactory = (name, socketPath, isPrimary) => {
  const target = {
    endpoint: cfg.mux === DEFAULT_MUX ? socketPath : cfg.muxEndpoint,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    options: {
      [HERDR_DIAL_MODE_OPTION]: cfg.dialMode ?? "auto",
      [TMUX_BINARY_OPTION]: cfg.tmuxBin,
      [ZELLIJ_BINARY_OPTION]: cfg.zellijBin,
    },
  };
  const herdr: MuxAdapter = createMux(muxRegistry, cfg.mux, target);
  const engine = new StateEngine(herdr, cfg.pollMs);

  // Event-poked polling: a long-lived watch on the multiplexer pokes an immediate re-poll on any
  // herd change, and while it's healthy the interval relaxes to the safety-net cadence. Events are
  // ONLY a poke — the snapshot poll stays the source of truth — so a missed one costs one interval,
  // not correctness. The fresh snapshot after any pane lifecycle change re-scopes the watch.
  // `attention` rides through the poker to the adapter's watch: an adapter that CENSUSES for topology
  // (zellij) tightens its cadence while a phone is plainly reading this collie, and one that pushes
  // ignores it entirely. The bridge's own poll cadence is NOT touched by this — that stays the
  // event-health question two lines below.
  const poker = new EventPoker(herdr, { attention: () => engine.attention() });
  poker.onPoke(() => engine.pokeNow());
  poker.onHealth((h) => engine.setCadence(h ? cfg.pollIdleMs : cfg.pollMs));
  engine.onUpdate((s) => poker.setAgentPanes(s.agents.map((a) => a.paneId)));

  // Activity bookkeeping. A status change stamps `activeAt` (the only thing that can make a pane
  // read as unseen); every successful poll reconciles the ledger against the panes that exist, which
  // seeds first sightings as already-seen and reaps closed ones. Reconciling covers bare shells too,
  // which the engine's agent-derived removal event never reports.
  trackActivity(engine, activity, name);

  // The prompt-cache probe rides the same poll, and for the reason the tracker's header gives:
  // `localSnapshot` is synchronous, so the disk read cannot happen at serialise time. It is fired and
  // not awaited — `onUpdate` is synchronous and a poll must never wait on a probe — and the tracker
  // itself never throws, so a rejected promise here is not a case that exists. Its own per-session
  // floor means a poll every 1.5 s does not become a read every 1.5 s.
  // The cache warning rides the same poll, one step behind the probe: `refresh` is awaited through its
  // own promise so the panes the warden judges already carry the reading this very tick produced (spec
  // 02's ordering, made mechanical). `refresh` never throws, so there is no rejection branch to write.
  // The tracker is ONE object for the whole bridge and every session runtime polls it with its own
  // panes, so each poll names its session: the reap then forgets only this session's departed panes
  // and never the other sessions' readings (bridge/cache/tracker.ts, § one tracker, many sessions).
  if (paneCache !== null) {
    const tracker = paneCache;
    const probeThenWarn = async (panes: readonly AgentView[]): Promise<void> => {
      await tracker.refresh(panes, { session: name });
      cacheWarden.tick(
        panes.flatMap((p) => {
          const pane = localWatchPane(p, isPrimary ? undefined : name, (key) => tracker.get(key));
          return pane === undefined ? [] : [pane];
        }),
      );
    };
    engine.onUpdate((s) => void probeThenWarn(s.agents));
  }

  // Background notifications on lifecycle transitions (foreground toasts are computed client-side by
  // diffing snapshots). Each session gets its own coordinator + notification slot: the primary keeps
  // the bare `collie:herd` tag (so pre-feature notifications don't orphan) and omits the session name
  // from the payload; every other session tags `collie:herd:<name>` and carries the name for deep-links.
  const clock: NotifyClock<ReturnType<typeof setTimeout>> = {
    schedule: (fn, ms) => setTimeout(fn, ms),
    cancel: (h) => clearTimeout(h),
  };
  const sink = makeNotifySink(push, snooze, herdTagFor(isPrimary, name), {
    session: isPrimary ? undefined : name,
  });
  const notifications = new NotificationCoordinator(clock, sink, cfg.notifyDelayMs, (status) =>
    notifyPrefs.isNotifiable(status),
  );
  engine.onTransition((agent, from, to) => notifications.onTransition(agent, from, to));
  engine.onRemove((paneId) => notifications.onRemove(paneId));

  engine.start();
  poker.start();
  return { herdr, engine, poker, notifications };
};

const registry = new SessionRegistry({
  configRoot: deriveConfigRoot(cfg.socketPath),
  primarySocketPath: cfg.socketPath,
  factory: makeSession,
  // The OPERATOR's switch, and nothing else. Whether this multiplexer has other instances on this
  // machine to front is the adapter's own `listSessions` declaration, asked by `registry.refresh()`.
  // An adapter that keeps no such list refuses the call and the registry pins to the primary (ADR 0022,
  // ADR 0036).
  multiSession: cfg.multiSession,
});

// Fail soft with a clear message if the PRIMARY multiplexer isn't reachable at startup. Other
// sessions come up lazily via refresh(); an unreachable one just reads `reachable:false` in the list.
const primary = registry.get();
if (primary && !(await primary.herdr.reachable())) {
  console.warn(
    `[bridge] cannot reach ${cfg.mux} at ${cfg.mux === DEFAULT_MUX ? cfg.socketPath : cfg.muxEndpoint || "its default server"} yet — ` +
      `will keep retrying on the poll loop. Is it running?`,
  );
}

// Discover any already-running named sessions now, then rescan on an interval so a session
// started/stopped after boot is picked up (or disposed) within SESSION_REFRESH_MS. A no-op when
// multi-session is off. unref() so the timer never keeps the process alive; cleared on shutdown.
await registry.refresh();
const refreshTimer = setInterval(() => {
  void registry.refresh();
}, SESSION_REFRESH_MS);
refreshTimer.unref();

// Prune uploaded images past their TTL: once at startup, then on an interval. Uploads are single-use
// (the multiplexer reads them by path when the message is sent), so nothing else reclaims them.
// unref() so the timer never keeps the process alive; it's also cleared on shutdown.
const uploadsDir = join(cfg.stateDir, "uploads");
const sweepNow = async (when: string): Promise<void> => {
  const removed = await sweepUploads(uploadsDir);
  if (removed.length) console.log(`[uploads] swept ${removed.length} expired image(s)${when}`);
};
void sweepNow(" at startup");
const sweepTimer = setInterval(() => void sweepNow(""), SWEEP_INTERVAL_MS);
sweepTimer.unref();

const server = startServer({
  cfg,
  registry,
  push,
  snooze,
  notifyPrefs,
  updateMonitor,
  version,
  audit,
  activity,
  // Built above so the cache tracker probes through the same adapters this serves history from.
  journals: journals ?? undefined,
  cache: paneCache ?? undefined,
  cacheWatch,
  pairing,
});

const shutdown = async () => {
  console.log("\n[bridge] shutting down");
  // Stop accepting new connections and let in-flight requests drain briefly (non-forced stop)
  // before we tear down the poll loops and exit.
  await server.stop();
  clearInterval(refreshTimer);
  registry.disposeAll();
  // Writes are debounced, so the last few seconds of "you looked at this" live only in memory —
  // persist them before exiting, or every restart quietly resurrects alerts you'd already cleared.
  activity.stop();
  await activity.flush();
  clearInterval(sweepTimer);
  clearTimeout(updateFirstCheck);
  clearInterval(updateTimer);
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
