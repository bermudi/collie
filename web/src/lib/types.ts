// Frontend mirror of the bridge's domain model (bridge/types.ts). Kept as a small, deliberate
// duplicate so the web app builds independently of the Bun server's source tree.

import type { ApiErrorCode, ApiErrorDetail } from "@/lib/api-error-codes";
import { t } from "@/lib/i18n";

export type AgentStatus = "idle" | "working" | "blocked" | "done" | "unknown";

export interface AgentView {
  paneId: string;
  workspaceId: string;
  workspaceLabel: string;
  workspaceNumber: number;
  tabId: string;
  agent: string;
  status: AgentStatus;
  cwd: string;
  focused: boolean;
  /** "agent" for an agent-bearing pane, "shell" for a bare shell. Absent = "agent". */
  kind?: "agent" | "shell";
  /** User-set pane label (herdr `pane.rename`), when one is set; absent when the pane is unlabelled. */
  paneLabel?: string;
  /**
   * Claude's OWN session name (set in-agent via `/rename`), derived bridge-side from the pane text.
   * Claude-only; absent for unnamed sessions and non-claude panes. Shown below an explicit `paneLabel`
   * — see `paneName` in lib/pane-name.ts. Render as text only (never markup) — same XSS boundary as paneLabel.
   */
  sessionName?: string;
  /**
   * True when the agent named a session, so a journal may exist for this pane — what the History
   * affordance keys off, without a speculative fetch.
   *
   * A FLAG, not the session itself: the bridge keeps the reference server-side and re-derives it from
   * the pane id on every history request, because for some harnesses (pi) that reference is an
   * absolute filesystem path. It never accepts one from the client. "May exist" is the honest
   * reading — an agent can name a session whose log isn't readable, which the history endpoint
   * answers with `available:false, reason:"no-log"`.
   */
  hasSession?: boolean;
  /**
   * Upper bound on the lines a pane read can return (Herdr's scrollback depth + viewport). The only
   * reliable "is there more scrollback" signal — `PaneReadResponse.truncated` is always false even
   * when history was cut off, which is why "Load older" never used to render. A Claude pane reports
   * just its viewport, because the alternate screen it runs on keeps no scrollback. Absent on older
   * bridges/Herdr, which reads as "unknown" (the button then falls back to hidden).
   */
  readableLines?: number;
  /**
   * The pane's tab label, denormalised bridge-side alongside `workspaceLabel`. Absent when it says
   * nothing: Herdr names an unlabelled tab positionally ("1"), which would render as `project › 1`
   * (see `meaningfulTabLabel` in bridge/activity.ts, and `isUnnamedTab` in lib/pane-name.ts, which
   * is the same rule applied to the RAW label). Render as text only, never markup — same XSS
   * boundary as `paneLabel`.
   */
  tabLabel?: string;
  /**
   * The tab's name, when the operator named that tab and this pane is alone in it. The bridge decides
   * (bridge/state-engine.ts) because only the multiplexer adapter knows whether a label was chosen
   * (`MuxPane.tabNamed`: tmux's automatic window name is not). The name rule reads it: a one-pane tab
   * is how most operators name a pane, and that name outranks the title Claude rewrites every turn.
   * Absent from an older peer, which keeps the title.
   */
  soleTabName?: string;
  /**
   * The pane's 0-based position inside its tab, in the multiplexer's own order. The dashboard's fixed
   * order reads it, since a pane id's alphabetical order is not the order on screen. Absent from an
   * older peer.
   */
  tabPosition?: number;
  /**
   * What the pane's process says it is doing — its OSC title, glyph-stripped and dropped when
   * uninformative bridge-side (see `meaningfulTerminalTitle` in bridge/activity.ts). Unlike
   * `paneLabel` and `sessionName`, which are set once by hand, this follows the work as it moves.
   * Render as text only, never markup — same XSS boundary as `paneLabel`.
   */
  terminalTitle?: string;
  /**
   * True when `terminalTitle` was left behind by a program that has already EXITED — a multiplexer
   * keeps a pane's title after the program that printed it is gone, so a bare shell can sit under a
   * finished agent's sentence for hours. Derived bridge-side; absent on an older bridge, which reads
   * as "not known to be stale" and renders exactly as it always did.
   *
   * It demotes, it never hides: a stale title is not the pane's NAME (see `paneName` in
   * lib/pane-name.ts),
   * but it still shows on the muted line, because it is the only trace of what ran here.
   */
  terminalTitleStale?: boolean;
  /**
   * A finished sentence the bridge composed about this pane, for the operator to read. Absent on
   * almost every pane, and on every bridge older than the version that introduced it.
   *
   * RENDER IT, NEVER READ IT. The frontend does not parse it, branch on it, or infer anything from
   * its presence: it carries no harness name and no multiplexer name, and the pane's status, its
   * controls and its place in the sort are decided exactly as they were without it. Text only,
   * never markup — the same XSS boundary as `paneLabel`.
   */
  hint?: string;
  /**
   * Epoch ms of this agent's last status transition, as the bridge observed it. Absent on an older
   * bridge — which is exactly why triage degrades cleanly; see `triage()`.
   */
  lastActiveAt?: number;
  /**
   * Epoch ms you last opened or drove this pane through Collie. Absent as above.
   *
   * There is no "seen" flag anywhere: a settled (`idle` or `done`) agent is unseen precisely when
   * `lastActiveAt > lastSeenAt`, so opening the pane clears it by construction.
   */
  lastSeenAt?: number;
  /**
   * Which member of the crew this pane lives on — the `?h=` value (CREW_PROTOCOL.md §4). Mirrors
   * `PaneWire.host` in bridge/types.ts.
   *
   * **Present exactly when {@link SnapshotResponse.servers} is**, and absent otherwise: a solo
   * snapshot host-tags nothing (§11), so every install that exists today reads `undefined` here and
   * renders byte-identically. A pane id (`w1:p1`) is unique only within one session on one machine,
   * so this is the field that makes a row addressable — open it with the PANE's host, never the
   * ambient one, or a reply lands on the right pane name on the wrong terminal.
   */
  host?: string;
  /**
   * Which Herdr session on {@link host} this pane lives in — the `?s=` half of the same address.
   * Mirrors `PaneWire.session` in bridge/types.ts.
   *
   * **Present exactly when the snapshot was WIDENED** (`?sessions=all`, the "All sessions" view),
   * and then on every pane in the body including the primary session's. Absent otherwise, which is
   * every request the app made until this feature existed — so an un-widened view reads `undefined`
   * here and behaves exactly as it did.
   *
   * Pane ids collide across sessions on one machine for the same reason they collide across
   * machines: each session is its own Herdr server. So this completes the `(host, session, paneId)`
   * address, and a widened row must be OPENED with its own session (see `paneScope` in lib/hosts.ts)
   * rather than with the ambient one.
   */
  session?: string;
  /**
   * How long this pane's prompt cache stays warm. Mirrors `PaneWire.cache` in bridge/types.ts.
   *
   * **Absent, never a placeholder.** The number is computed on the machine the pane lives on, with that
   * machine's own rules, so a peer's chip is true where it is rendered. A pane whose harness has no
   * journal adapter, that named no session, or whose agent has not taken a turn yet carries no key at
   * all, and a 1.8.x peer simply omits it — every one of those renders as nothing.
   */
  cache?: PaneCache;
}

/**
 * One rule as the pane sheet reads it. Mirrors `CacheRuleWire` in bridge/types.ts.
 *
 * `label`, `sourceTitle` and the publisher are another vendor's words about their own product, so they
 * are NOT translated — the same carve-out ADR 0030 makes for slash-command descriptions.
 */
export interface CacheRuleWire {
  id: string;
  label: string;
  ttlSeconds: number;
  confidence: CacheConfidence;
  sourceTitle: string;
  sourceUrl: string;
  retrievedAt: string;
  slidingWindow: boolean;
  automatic: boolean;
  note?: string;
  overridden?: { ttlSeconds: number; sourceUrl: string; retrieved: string; note?: string };
}

/** GET /api/cache-rules — this host's own catalog. Mirrors `CacheRulesResponse` in bridge/types.ts. */
export interface CacheRulesResponse {
  rules: CacheRuleWire[];
}

/** What the cache chip can say. Mirrors `CacheStateName` in bridge/cache/engine.ts. */
export type CacheStateName = "warm" | "expiring" | "cold" | "unknown";

/** How sure the number is. Mirrors `Confidence` in bridge/cache/claims.ts. */
export type CacheConfidence = "documented" | "reported" | "inferred" | "observed";

/** Why a `cold` reading is cold. Mirrors `ColdReason` in bridge/cache/engine.ts. */
export type CacheColdReason = "observed" | "expired" | "reset";

/** The action behind a cold reading. Mirrors `CacheResetWire` in bridge/cache/engine.ts. */
export interface CacheResetWire {
  ruleId: string;
  /** The rule's own label, a clause in English ("The model changed"). The sheet slots it into a sentence. */
  label: string;
  at: number;
}

/**
 * One pane's prompt-cache reading. Mirrors `PaneCache` in bridge/cache/engine.ts.
 *
 * A few small fields, because the source title and the retrieved date do not ride every pane: the
 * sheet fetches the rule catalog once from `GET /api/cache-rules`.
 */
export interface PaneCache {
  state: CacheStateName;
  /** Epoch ms the cache dies. The chip counts down to this against one page clock. */
  expiresAt?: number;
  ttlSeconds: number;
  ruleId: string;
  confidence: CacheConfidence;
  lastRequestAt?: number;
  /** When the evidence was read. Shown in the sheet as "last read 4m"; never used to decide a state. */
  measuredAt?: number;
  /** Present, and always `true`, when the number came from the operator's `cache-rules.toml`. */
  overridden?: true;
  /** Present on a `cold` reading only, and absent from a bridge older than the field. */
  coldReason?: CacheColdReason;
  /**
   * The action behind a cold reading: the one since the last turn when `coldReason` is `reset`, the one
   * that most likely made the last turn miss when it is `observed`.
   */
  reset?: CacheResetWire;
}

/** A Herdr workspace ("space") — a project-scoped container of tabs. */
export interface WorkspaceView {
  workspaceId: string;
  number: number;
  label: string;
  focused: boolean;
  activeTabId: string;
  tabCount: number;
  paneCount: number;
  /**
   * The Git repo this space sits in, when the multiplexer reports one.
   *
   * Absent means "no repo, or this multiplexer keeps no such mapping" — and absence is what hides
   * the worktree rows, so no extra call is needed to decide whether to show them.
   */
  repoRoot?: string;
  /** Whether this space is a linked worktree of `repoRoot`, not the repo's own checkout. */
  isWorktree?: boolean;
  /**
   * Which member of the crew this space lives on — the same tag a pane and a session carry.
   *
   * Present exactly when `servers` is, absent otherwise, so a solo body is unchanged. Herdr numbers
   * spaces PER MACHINE, so `(host, workspaceId)` is a space's identity in a crew — see `spaceKey`
   * in lib/hosts.ts, and `ambientSpaces`, which narrows these rows to the address the URL is on.
   */
  host?: string;
}

/** A tab within a workspace (holds one or more panes). */
export interface TabView {
  tabId: string;
  workspaceId: string;
  number: number;
  label: string;
  focused: boolean;
  paneCount: number;
  /** Which member of the crew this tab lives on — same rule as {@link WorkspaceView.host}. */
  host?: string;
}

export type BridgeStatus = "connected" | "disconnected";

/**
 * Per-device authorisation for this client (mirrors DeviceAuth in bridge/types.ts). Present in the
 * snapshot only when the feature is enabled on the bridge; absent = not enforced.
 */
export interface DeviceAuth {
  /** Whether per-device authorisation is enforced at all. */
  enforced: boolean;
  /** The opaque device identifier from the trusted header, or null if absent / feature off. */
  device: string | null;
  /** Whether this device may perform sensitive (terminal-driving / structural) actions. */
  authorized: boolean;
}

/**
 * True when device auth is enforced and this device is NOT authorised — i.e. the UI should drop to
 * read-only. False when the feature is off, the device is allowlisted, or the state isn't known yet.
 */
export function isReadOnly(device: DeviceAuth | undefined): boolean {
  return !!device && device.enforced && !device.authorized;
}

// ── Device pairing (mirrors bridge/pairing.ts) ───────────────────────────────────────────────────
// The OTHER write gate: a bearer credential this device holds, independent of the header-based
// DeviceAuth above and composing with it by AND. See lib/pairing.ts for the client-side store.

/** One paired device, as `GET /api/devices` reports it. The token itself never leaves the bridge. */
export interface PairedDeviceWire {
  label: string;
  createdAt: number;
  lastSeenAt: number;
  /** True for the device making the request — i.e. the one you're reading this on. */
  current: boolean;
}

/** The body of `GET /api/devices` and `POST /api/devices/revoke`. */
export interface DevicesResponse {
  /**
   * Whether a bearer token is required for writes. Not a setting — it is simply "at least one device
   * is paired", so pairing nobody leaves Collie exactly as it was.
   */
  enforced: boolean;
  /** The label this request's token authenticated as, or null when it authenticated as nobody. */
  current: string | null;
  devices: PairedDeviceWire[];
}

/** Why a `POST /api/pair` claim was rejected (the `error` field of its 400 body). */
export type PairFailure =
  | "no-pending"
  | "expired"
  | "exhausted"
  | "bad-code"
  | "duplicate-label"
  | "bad-request";

/**
 * One entry in the snapshot's session registry — a named Herdr session the bridge is fanning out.
 * Order is primary-first, then alphabetical. An unreachable session (crashed / stale socket) reports
 * `reachable: false` with zeroed counts and renders greyed-out, non-clickable in the switcher.
 */
export interface SessionSummary {
  /** Registry name, e.g. "default", "collie-demo". */
  name: string;
  /** The `cfg.socketPath` session — all no-`?s=` requests map to it. */
  isPrimary: boolean;
  /** Whether the last poll of this session's socket succeeded. */
  reachable: boolean;
  /** Agent-pane count (0 when unreachable). */
  agents: number;
  working: number;
  blocked: number;
  /**
   * Which member of the crew fronts this session — the `?h=` value. Present exactly when
   * {@link SnapshotResponse.servers} is (CREW_PROTOCOL.md §9.2/§11); absent on every solo snapshot.
   * Sessions are a PER-HOST registry, which is why the switcher lists one host's sessions at a time:
   * a flat merged list would offer "default" twice with no way to tell them apart.
   */
  host?: string;
}

/**
 * One member of the crew (CREW_PROTOCOL.md §9.2) — mirrors `ServerSummary` in bridge/types.ts field
 * for field. The lead's own entry is included, so the phone renders one uniform host list instead of
 * special-casing "here".
 *
 * Note what is NOT here: per-host agent/working/blocked counts. `SessionSummary` carries those
 * because the bridge computes them per session; a `ServerSummary` does not, so the switcher derives
 * them client-side from the merged `agents` array (see `hostCounts` in lib/hosts.ts). That keeps the
 * counts consistent with the rows actually on screen — including an unreachable host's last-good
 * panes, which stay listed rather than zeroing (§10.2).
 */
export interface ServerSummary {
  /** Member id — the `?h=` value. */
  id: string;
  /** Operator-chosen label; today the member id itself. */
  name: string;
  isLead: boolean;
  /** Whether the lead's last poll of this member succeeded. Always true for the lead's own entry. */
  reachable: boolean;
  /** Version negotiation state (§7). */
  protocol: "ok" | "incompatible" | "unknown";
  /** The peer's refusal reason, verbatim, when incompatible — rendered as text, never paraphrased. */
  protocolDetail?: string;
  /**
   * §10.2's presentation split for a member that is not answering. `reconnecting` means the lead is
   * retrying inside its budget and nothing is asked of the operator; `attention` means re-dialling
   * cannot fix it.
   *
   * **Absent means "no distinction offered"**: a reachable member, or a lead older than the field.
   * Beside `reachable: false` an absent value therefore renders today's single word, which is what
   * keeps a new phone honest in front of an old lead (§7.1).
   */
  linkState?: "reconnecting" | "attention";
  /** Epoch ms, stamped by the LEAD on receipt — never the peer's clock (§10.2). `0` = never answered. */
  lastSeenAt: number;
}

/**
 * GET /api/snapshot `update` — whether the running bridge is behind (mirrors `UpdateStatus` in
 * `bridge/types.ts`). Both a newer upstream RELEASE (`releaseAvailable` + `latest`) and a
 * rebuilt-but-not-restarted bridge PROCESS (`bridgeStale`) surface here; the client shows one
 * banner, `bridgeStale` taking precedence.
 */
export interface UpdateInfo {
  /** The version this bridge is running, e.g. "0.11.0". */
  current: string;
  /** Newest upstream release, e.g. "0.12.0", or null when unknown. */
  latest: string | null;
  /** GitHub release page for `latest` (the banner links to it), or null when `latest` is unknown. */
  latestUrl: string | null;
  /** A newer release than `current` exists upstream — the update action will fetch it. */
  releaseAvailable: boolean;
  /** Newest release of a HIGHER major than `current`, or null. A routine update never crosses it —
   *  `update --major` is the consent (ADR 0020), so the banner names that command. */
  majorAvailable: string | null;
  /** GitHub release page for `majorAvailable`, or null when there is none. */
  majorUrl: string | null;
  /** The running bridge PROCESS is behind the on-disk code — a service restart picks it up. */
  bridgeStale: boolean;
  /** When the upstream check last ran (epoch ms), or null if it hasn't. */
  checkedAt: number | null;
}

export interface SnapshotResponse {
  bridge: BridgeStatus;
  /** Per-device authorisation for the requesting client; absent when the feature is off. */
  device?: DeviceAuth;
  agents: AgentView[];
  shellPanes: AgentView[];
  workspaces: WorkspaceView[];
  tabs: TabView[];
  /** Notification quiet-hours: the active snooze deadline (epoch ms) or null. Absent on older bridges. */
  notifications?: { snoozedUntil: number | null };
  /** The bridge's session registry (primary-first). Absent on a single-session / older bridge. */
  sessions?: SessionSummary[];
  /**
   * Every member of the crew, the lead's own entry first (CREW_PROTOCOL.md §9.2).
   *
   * **Optional-and-absent, like `update?` and unlike the always-present `sessions`** — a solo bridge
   * emits no such key at all (§11), so absent (or fewer than two entries) is the one condition under
   * which the whole host dimension renders nothing: no switcher, no chips, no extra row height.
   */
  servers?: ServerSummary[];
  /** Version / upgrade status. Absent on an older bridge that doesn't report it. */
  update?: UpdateInfo;
  ts: number;
}

export interface PaneReadResponse {
  paneId: string;
  text: string;
  truncated: boolean;
  /** Herdr's monotonic pane revision — the prompt-select race guard checks a tapped menu against it. */
  revision: number;
  /**
   * The same rows with soft wraps undone, sent only when {@link text} shows a URL the pane's column
   * edge cut in two. `lib/links.ts` uses it to give every fragment of that URL the href of the whole
   * URL; absent for every other pane.
   */
  logicalText?: string;
  /** Set to true by the client when the server returns 304 Not Modified. Never sent over the wire. */
  notModified?: boolean;
}

/**
 * One renderable piece of a transcript turn. Mirrors `bridge/transcript.ts` (wire types are
 * hand-mirrored across the two sides, as with every other response here).
 */
export type TranscriptPart =
  | { kind: "text"; text: string; truncated?: boolean }
  | { kind: "thinking"; text: string; truncated?: boolean }
  | { kind: "image"; url: string; mimeType?: string }
  | {
      kind: "tool";
      name: string;
      summary: string;
      result?: { text: string; truncated?: boolean; isError?: boolean; imageUrl?: string };
    };

/**
 * One turn. `user`/`assistant` are speech; the other two are not, and render set apart so they can't
 * be mistaken for it — `summary` is Claude's own compaction summary, `note` is machine-injected
 * content that still belongs on screen (a background task finishing, a local command's output).
 */
export interface TranscriptEntry {
  uuid: string;
  ts: string;
  role: "user" | "assistant" | "summary" | "note";
  parts: TranscriptPart[];
}

/**
 * GET /api/pane/:id/history — real conversation history, read from the agent's own session log.
 *
 * This is NOT terminal scrollback and can't be: a Claude pane runs on the terminal's alternate
 * screen, which keeps no scrollback ring, so Herdr only ever holds the visible viewport. `available:
 * false` is an ordinary answer (a shell pane, a harness with no session log, or the feature off) —
 * the UI hides the History affordance rather than showing an error.
 */
export type PaneHistoryResponse =
  | { paneId: string; available: false; reason: "disabled" | "no-session" | "no-log" }
  | {
      paneId: string;
      available: true;
      /** Oldest-first, ready to render top-down. */
      entries: TranscriptEntry[];
      /** Older turns exist before `entries[0]` — page with `?before=<its uuid>`. */
      hasMore: boolean;
      total: number;
      fileTruncated: boolean;
    };

/**
 * `error` is the bridge's English sentence and stays what a client displays when it has nothing
 * better; `code` + `detail` are the machine half, which `lib/api-error-message.ts` turns into the
 * operator's language. `code` was once only ever `"prompt_changed"` — it now names any catalogued
 * refusal, so a client must fall back on a code it doesn't recognise rather than treat it as a bug.
 * Mirrors ActionResponse in bridge/types.ts.
 */
export type ActionResponse =
  | { ok: true }
  | {
      ok: false;
      error: string;
      textDelivered?: boolean;
      code?: ApiErrorCode;
      detail?: ApiErrorDetail;
    };

export type UploadResponse =
  | { ok: true; path: string }
  | { ok: false; error: string; code?: ApiErrorCode; detail?: ApiErrorDetail };

/** A freshly-created shell pane — enough to navigate into before the next poll lands. */
export interface CreatedPane {
  paneId: string;
  workspaceId: string;
  workspaceLabel: string;
  tabId: string;
  cwd: string;
}

/** Result of creating a new tab/space — on success `pane` is the fresh shell to navigate into. */
export type CreateResponse =
  | { ok: true; pane: CreatedPane }
  | { ok: false; error: string; code?: ApiErrorCode; detail?: ApiErrorDetail };

/**
 * Which role the bridge plays in a crew (CREW_PROTOCOL.md §3). Mirrors CrewMode in bridge/types.ts.
 * `solo` is a lead with zero peers — today's Collie, exactly.
 */
export type CrewMode = "solo" | "lead" | "peer";

/**
 * One operator-declared palette row (a `[[commands]]` table in their `commands.toml`). Mirrors
 * OperatorCommand in
 * bridge/types.ts. Resolved against the shipped catalog by `commandsFor()`, which hands a pane
 * these rows instead of the catalog when any of them address it — see agent-commands.ts for why a
 * plugin- or user-registered command can only arrive this way.
 */
export interface OperatorCommand {
  /** Herdr agent name this applies to, lowercased. Omitted = every agent. */
  agent?: string;
  command: string;
  description: string;
  takesArg: boolean;
  argHint: string;
  /** The operator marking their own row dangerous. Optional so an older bridge stays readable. */
  confirm?: boolean;
  /**
   * The operator putting this row on the harness bar above the key rail. Resolved by `barFor()` in
   * lib/harness-bar.ts, which replaces-or-falls-back over the `bar = true` rows ALONE — so a bar row
   * never blanks the Agent palette for that pane (ADR 0043). Optional, like `confirm`, so an older
   * bridge stays readable.
   */
  bar?: boolean;
  /** The bar button's text, already shortened to 12 characters. Absent = the command without its slash. */
  barLabel?: string;
}

/**
 * One operator-declared Keys-tray preset (a `[[keys]]` table in their `keys.toml`). Mirrors
 * OperatorKeyRow in bridge/types.ts. Resolved against the shipped presets by `ctrlPresetsFor()`,
 * which hands a pane these rows instead of the shipped ones when any of them address it. Only the
 * tray's preset CATALOG is configurable — its keyboard is fixed.
 */
export interface OperatorKeyRow {
  /** Herdr agent name this applies to, lowercased. Omitted = every agent. */
  agent?: string;
  /** The button's text, and its identity within one scope. */
  label: string;
  /** Chords in Herdr's `pane.send_keys` spelling; more than one is sent as ONE ordered batch. */
  keys: string[];
  /** The operator putting their own row behind the tray's two-tap confirm. */
  danger?: boolean;
}

/**
 * Every capability a multiplexer adapter may declare. Mirrors `MUX_CAPABILITIES` in
 * bridge/mux/capabilities.ts, which is where each one's meaning and its backing route are written
 * down — the two trees do not share a module, so this list is a copy the way `STATUS_RANK` is.
 *
 * A name here is only ever used to ASK. Nothing in `web/src` may key off which multiplexer answered
 * (scripts/check-mux-names.sh), and that is the difference this list exists to keep.
 */
export const MUX_CAPABILITIES = [
  "paneGrid",
  "gridScrollback",
  "agentDetection",
  "agentSessionRef",
  "typeText",
  "sendKeys",
  "renamePane",
  "closePane",
  "setFocus",
  "createTab",
  "renameTab",
  "closeTab",
  "createSpace",
  "listWorktrees",
  "createWorktree",
  "openWorktree",
  "pushTopologyEvents",
  "pushPaneEvents",
] as const;

export type MuxCapability = (typeof MUX_CAPABILITIES)[number];

/**
 * What the bridge says about the multiplexer underneath (`/api/config`). Mirrors `MuxConfig` in
 * bridge/types.ts.
 *
 * `name` is for display and support — the subject of a sentence, never a branch. Read the
 * capabilities through lib/mux-capability.ts rather than reaching in here: that module owns the one
 * rule that an unanswered capability counts as PRESENT.
 */
export interface MuxConfig {
  name: string;
  /** Total over {@link MUX_CAPABILITIES} on any bridge that knows the capability. */
  capabilities: Partial<Record<MuxCapability, boolean>>;
  /** Neutral key spellings this multiplexer refuses. */
  unsupportedKeys: string[];
  /**
   * How many spaces this multiplexer can hold — not how many exist right now.
   *
   * `"one"` drops the space strip and makes the tab strip the top level. ABSENT (an older bridge, a
   * cached page) reads as `"many"`; the rule and its reasoning live in lib/mux-capability.ts beside
   * every other "what is true of the multiplexer" answer.
   */
  spaces?: "one" | "many";
  /** The adapter's own words for the capabilities it lacks — the text an explanation renders. */
  notes: Partial<Record<MuxCapability, string>>;
  /**
   * Where the bridge serves this multiplexer's mark, for an `<img src>`. Absent on a bridge whose
   * adapter has no mark (and on every bridge older than the field), and absent means NO IMAGE — the
   * header renders its text alone rather than standing something in.
   *
   * The path arrives as DATA and is never spelled here: a mark chosen in the frontend would be a
   * lookup keyed by the multiplexer's name, which is the one thing this app must not do
   * (lib/mux-capability.ts, scripts/check-mux-names.sh).
   */
  logoUrl?: string;
  /**
   * How soon this bridge sees a topology change nobody announced. Mirrors `MuxTopologyLatency` in
   * bridge/mux/capabilities.ts.
   *
   * **Absent on any bridge older than the field, and absent reads as `push`** — the same fail-open
   * direction the capabilities take (lib/mux-capability.ts). Read it through `useTopologyLatency()`
   * rather than here, so that rule lives in exactly one place.
   */
  topologyLatency?: MuxTopologyLatency;
}

/**
 * How soon Collie sees a change made in the operator's own terminal — declared by the bridge, never
 * measured here (ADR 0031).
 *
 * `push` means the multiplexer announces it, so there is nothing to say and the UI says nothing.
 * `bounded` means the bridge censuses and `ms` is the longest a change can sit unseen — which is
 * what makes "synced Ns ago" honest information rather than decoration.
 */
export type MuxTopologyLatency =
  | { kind: "push" }
  | { kind: "bounded"; ms: number };

/**
 * One operator-declared Quick-dock group (a `[[replies]]` table in their `quick-replies.toml`).
 * Mirrors OperatorQuickReplyRow in bridge/types.ts. Resolved against the shipped groups by
 * `quickRepliesFor()`, which hands a pane these rows instead of the shipped ones when any of them
 * address it.
 */
export interface OperatorQuickReplyRow {
  /** Herdr agent name this applies to, lowercased. Omitted = every agent. */
  agent?: string;
  /** The group's heading, and its identity within one scope. */
  title: string;
  /** The literal strings sent — each is typed into the pane and submitted verbatim. */
  items: string[];
}

/**
 * One operator-declared UI typeface (a `[[font]]` row in their `theme.toml`). Mirrors
 * `OperatorFontRow` in bridge/types.ts.
 *
 * These ADD to the shipped faces rather than replacing them, which is where `theme.toml` parts
 * company with the ADR 0018 trio — a font cannot fire an action, so it shadows nothing (ADR 0033).
 *
 * NO URL CROSSES THE WIRE, only the basename: `lib/operator-fonts.ts` builds `/api/fonts/<name>`
 * itself, and re-validates every field here before any of it reaches a stylesheet.
 */
export interface OperatorFontRow {
  /** Display name AND the CSS family name. */
  family: string;
  /** The file's bare name, which is also the row's identity and the tail of its URL. */
  basename: string;
  /** `font-weight` for the `@font-face`, e.g. `400` or `400 700`. Absent = the browser's default. */
  weight?: string;
}

/**
 * One operator-declared launcher row (`launchers.toml`). Mirrors Launcher in
 * bridge/types.ts. A tap creates a throwaway Space and types this shell line verbatim
 * into its fresh shell — herdr deletes a Space when its last pane closes, so quit → gone
 * with nothing to clean up. The label is what the dashboard button shows; when the
 * operator omits it the bridge defaults it to the command's first token.
 */
export interface Launcher {
  /** The shell line typed into the new Space's shell, verbatim. Also the allowlist key /api/launch matches. */
  command: string;
  /** Button label. Defaults to the command's first whitespace-separated token. */
  label: string;
  /**
   * Absolute directory the new Space (or tab) opens in. Absent means "here": from the dashboard,
   * the bridge's home dir; from a pane, that pane's own cwd. Present, it is pinned and shown
   * shortened under home (`shortenHome`) wherever the row's folder is displayed.
   */
  cwd?: string;
}

/**
 * GET /api/launchers — the rows for ONE host (a crew has one file per member), read live off its
 * `launchers.toml`. `home` is that host's own home dir, for shortening a pinned `cwd` without the
 * client knowing which machine answered (a peer's home is not this browser's, and is not even
 * necessarily the same string as the lead's).
 */
export interface LaunchersResponse {
  launchers: Launcher[];
  home: string;
}

export interface BridgeConfig {
  push: boolean;
  vapidPublicKey: string;
  /** Build id of the bundle the bridge is currently serving (for stale-cache detection). */
  build?: string;
  /**
   * The bridge's crew mode. **Absent means `solo`** — a solo bridge emits no such key, so its
   * `/api/config` body stays byte-identical to the pre-federation one. Always read it as
   * `mode ?? "solo"`; never infer the mode from behaviour.
   */
  mode?: CrewMode;
  /** The operator's own palette rows. Absent when there is no `commands.toml`. */
  operatorCommands?: OperatorCommand[];
  /** The operator's own Keys-tray presets. Absent when there is no `keys.toml`. */
  operatorKeys?: OperatorKeyRow[];
  /** The operator's own Quick-dock groups. Absent when there is no `quick-replies.toml`. */
  operatorQuickReplies?: OperatorQuickReplyRow[];
  /** The operator's own UI typefaces. Absent when there is no `theme.toml` (ADR 0033). */
  operatorFonts?: OperatorFontRow[];
  /**
   * The multiplexer and its declared capabilities. **Absent on a bridge older than this field**, and
   * that absence is read as "everything is supported" — a mid-upgrade Herdr operator must never
   * watch controls disappear while a cached config is in flight (lib/mux-capability.ts).
   */
  mux?: MuxConfig;
  /**
   * What this collie accepts as an attachment. Mirrors `UploadCapability` in bridge/types.ts.
   *
   * **Absent is a bridge older than the field**, and the phone reads that as the contract that
   * shipped before it: 10 MB, images only (lib/attachments.ts owns that fallback). So a
   * mid-upgrade operator sees the old picker rather than an empty one.
   */
  upload?: UploadCapability;
}

/**
 * What `/api/config` says about attachments — the two facts the picker needs before it opens.
 * Both are the HOST's own settings, so a crew member with a different cap answers for itself.
 */
export interface UploadCapability {
  /** Largest attachment accepted, decoded, in bytes. */
  maxBytes: number;
  /** Image extensions accepted, bare and lowercase. The bridge sniffs these from the bytes. */
  imageTypes: string[];
  /** Text extensions accepted, bare and lowercase. The bridge takes these from the name. */
  textTypes: string[];
}

/**
 * Notification type preferences (GET/POST /api/notifications/prefs). Which agent statuses push, set
 * bridge-wide (fans out to every device, like the snooze). Mirrors NotifyPrefs in bridge/notify-prefs.ts.
 */
export interface NotifyPrefs {
  /** Push when an agent becomes blocked (waiting on your input). Default on. */
  blocked: boolean;
  /** Push when an agent finishes its task. Default off. */
  done: boolean;
  /** Push when a new Collie version is available (a restart or upgrade is waiting). Default on. */
  updates: boolean;
  /** Push before an agent pane's prompt cache expires. Default off, and it covers EVERY pane — the
   *  panes watched one by one from their own settings sheet keep warning either way (ADR 0042). */
  cache: boolean;
}

/**
 * GET/POST /api/notifications/cache-watch — one pane's place in the cache watch list.
 *
 * `global` is `prefs.cache`, so the sheet can say Settings already covers this pane rather than show a
 * switch that looks off while warnings are going out. `watchable` is false when the pane names no
 * harness session, carries no cache reading at all, or reads `unknown` — the switch is then disabled
 * and the reason is named. `warnSeconds` comes from the bridge so the copy quotes its number.
 */
export interface CacheWatchState {
  on: boolean;
  global: boolean;
  watchable: boolean;
  warnSeconds: number;
}

/** One row of the watched-pane list under the Settings switch. `id` is an opaque handle, never a ref. */
export interface CacheWatchListEntry {
  id: string;
  label: string;
  /** The crew member this pane lives on. Absent for a local pane, never null. */
  host?: string;
  session?: string;
  /** Absent when the entry's pane is not in the current snapshot. Such a row lists, and still removes. */
  paneId?: string;
}

/** GET /api/notifications/cache-watch/list — the whole bridge's list, not one pane's. */
export interface CacheWatchListResponse {
  entries: CacheWatchListEntry[];
}

/** Lower sorts first — "needs you" at the top. Mirrors STATUS_RANK on the server. */
export const STATUS_RANK = {
  blocked: 0,
  working: 1,
  unknown: 2,
  idle: 3,
  done: 4,
} satisfies Record<AgentStatus, number>;

/** Translated status labels, resolved fresh on every call — a caller that renders one must also
 *  call `useLocale()` so it re-renders when the active language changes (see hooks/use-locale.ts). */
export function statusLabel(status: AgentStatus): string {
  return t(`status.label.${status}`);
}

/** One Git worktree of the repo a space sits in. Mirrors `WorktreeView` in bridge/types.ts. */
export interface WorktreeView {
  path: string;
  branch: string | null;
  /** The space showing it, or `null` when nothing does — which is what hides its Remove row. */
  openWorkspaceId: string | null;
  /** `false` for the repo's own checkout: listed for context, never removable. */
  linked: boolean;
  prunable: boolean;
}

/** GET /api/workspace/:id/worktrees */
export type WorktreeListResponse =
  | { ok: true; worktrees: WorktreeView[] }
  | { ok: false; error: string; code?: ApiErrorCode; detail?: ApiErrorDetail };

/** POST /api/workspace/:id/worktree[/open] — `alreadyOpen` is an answer, never a failure. */
export type WorktreeOpenResponse =
  | { ok: true; pane: CreatedPane; alreadyOpen: boolean }
  | { ok: false; error: string; code?: ApiErrorCode; detail?: ApiErrorDetail };

