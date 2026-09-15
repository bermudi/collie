import { commandsFor } from "@/lib/agent-commands";
import { canonicalAgent, rowsFor } from "@/lib/operator-scope";
import type { OperatorCommand } from "@/lib/types";

// The harness bar's table: which of the running agent's own slash commands get a button in the
// belt above the input. One row per harness, four or five buttons, and nothing derived from the
// screen. (upstream fc8d1be9 — Pup has no i18n layer, so upstream's `harnessBar.*` keys are the
// literals they rendered to.)
//
// THE BAR IS A VIEW, NEVER A SECOND CATALOG. Every `command` spelled here is a row that already
// exists in `agent-commands.ts`, which stays the one place a slash command is written down; this
// file only chooses which of those rows are worth a thumb. A unit test looks every command up in
// `commandsFor(agent)`, so a button for a command the catalog does not have is a failing suite
// rather than a shipped button that does nothing. Adding a harness means adding to the catalog
// first and to this table second, never the other way round.
//
// Pure on purpose: no React import, no DOM. The component resolves the labels.

/** Where a capture lives, relative to the repo root. Proof a command exists and behaves. */
const PANES = "web/src/fixtures/panes";

/**
 * One button on the bar. Every one of them sends its `command` as it stands, on one tap.
 *
 * **NOTHING HERE OFFERS ARGUMENTS.** Collie would have to track a list the harness owns and
 * changes without telling us, and the harness paints its OWN picker in the mirror the moment the
 * bare command lands. So the button sends `/model`, and Claude's picker takes the screen from
 * there. One tap, no list of ours to go stale.
 */
export interface HarnessBarItem {
  /** Stable. Keys the echo and picks the button's icon in the component. */
  id: string;
  /** The button's text. */
  label: string;
  /** Sent as it stands, then submitted. */
  command: string;
  /** Two-tap, through `usePendingConfirm`. Inherited as a floor from the shipped catalog. */
  confirm?: boolean;
  /**
   * Repo-relative path of a capture that proves this row: the command exists in that harness, and
   * it behaves the way the button assumes. Read only by the invariant test, never shown in the UI. A
   * row whose capture is missing ships COMMENTED OUT with the path in the comment, so it is written
   * once and enabled later without being redesigned.
   */
  evidence?: string;
  /** True for a row the operator typed. It vouches for its own command, so it carries no evidence. */
  operator?: boolean;
}

/**
 * The harnesses whose catalogs are sourced from CAPTURES rather than docs (`agent-commands.ts`'s omp
 * section states the rule). Every bar row for one of these must name a capture, because there is no
 * published page to check it against.
 */
export const CAPTURE_SOURCED: readonly string[] = ["omp"];

// ── Claude Code ──────────────────────────────────────────────────────────────
// Model, Effort, Compact, Resume — the four Claude Code is driven with from the phone. Each one
// sends its bare command and Claude's own picker comes up in the mirror.
const CLAUDE: readonly HarnessBarItem[] = [
  {
    id: "model",
    label: "Model",
    command: "/model",
    evidence: `${PANES}/claude--menu-model-picker.txt`,
  },
  // Bare, for the same reason Model is bare: the levels are the harness's list, not ours, and
  // `/effort` prints them itself.
  { id: "effort", label: "Effort", command: "/effort" },
  { id: "compact", label: "Compact", command: "/compact" },
  // Bare, which the catalog says opens the picker in the mirror.
  { id: "resume", label: "Resume", command: "/resume" },
];

// ── Codex ────────────────────────────────────────────────────────────────────
// No Effort button, and that is the harness's own shape rather than an omission: Codex's `/model`
// picker sets the model AND the reasoning effort, so the one button reaches both dials.
const CODEX: readonly HarnessBarItem[] = [
  { id: "model", label: "Model", command: "/model" },
  { id: "compact", label: "Compact", command: "/compact" },
  { id: "resume", label: "Resume", command: "/resume" },
];

// ── pi ───────────────────────────────────────────────────────────────────────
// No Effort button, because pi has no effort or thinking command: its thinking level lives inside
// `/settings`, a modal the phone would then have to drive with the keys pad. `/settings` is
// deliberately off the bar for that reason, and `/session` is off it because it prints stats rather
// than opening a picker. Every row here is in pi's own doc-sourced catalog, so none needs evidence.
const PI: readonly HarnessBarItem[] = [
  { id: "model", label: "Model", command: "/model" },
  { id: "compact", label: "Compact", command: "/compact" },
  { id: "tree", label: "Tree", command: "/tree" },
  { id: "resume", label: "Resume", command: "/resume" },
];

// ── omp ──────────────────────────────────────────────────────────────────────
// Capture-sourced, so every row names a capture. Tree ships commented out because omp being a pi
// fork is not evidence; a live `omp--tree.txt` capture is, and Pup's corpus does not hold one yet —
// enable it the day it does (upstream cc38c2de did exactly this, on theirs).
// { id: "tree", label: "Tree", command: "/tree", evidence: `${PANES}/omp--tree.txt` },
const OMP: readonly HarnessBarItem[] = [
  {
    id: "model",
    label: "Model",
    command: "/model",
    evidence: `${PANES}/omp--menu-model.txt`,
  },
  {
    id: "compact",
    label: "Compact",
    command: "/compact",
    evidence: `${PANES}/omp--slash-palette.txt`,
  },
  {
    id: "resume",
    label: "Resume",
    command: "/resume",
    evidence: `${PANES}/omp--menu-resume.txt`,
  },
];

// A Map for the same reason the command catalog uses one: the key tested against it is Herdr's
// agent string, so an object lookup would answer for inherited names that ship no bar at all.
const BARS = new Map<string, readonly HarnessBarItem[]>([
  ["claude", CLAUDE],
  ["codex", CODEX],
  ["pi", PI],
  ["omp", OMP],
]);

/** The agent names a shipped bar is filed under — pinned in the tests. */
export const BAR_AGENTS: readonly string[] = [...BARS.keys()];

/**
 * The bar for a Herdr-detected agent — the operator's own `bar = true` rows if any of them address
 * this pane, otherwise the shipped table. Returns `[]` for every other agent (grok, opencode, agy,
 * antigravity, a bare shell, a pane with no agent at all) and the row does not render.
 *
 * **THE REPLACEMENT RULE IS PER SURFACE.** ADR 0018 says that if any operator row addresses a pane,
 * the operator's rows ARE the catalog for that pane. This applies that rule to the BAR alone: the
 * subset it replaces-or-falls-back over is the rows carrying `bar = true`, so one bar row never
 * blanks the Agent palette, which is the opposite of what the operator typed. `commandsFor` is
 * untouched and ADR 0018 keeps holding exactly as written.
 *
 * The scope ladder runs FIRST, over every row, and the `bar` filter runs on its answer. That way a
 * narrower `bar = false` row correcting a wider `bar = true` one takes the command off the bar,
 * instead of both rows surviving into two different answers.
 */
export function barFor(
  agent: string | undefined | null,
  mine: readonly OperatorCommand[] = [],
): readonly HarnessBarItem[] {
  const aimed = rowsFor(mine, agent, (row) => row.command).filter((row) => row.bar === true);
  if (aimed.length === 0) return shippedBar(agent);
  // `dangerous` is inherited as a FLOOR: a bar row naming a shipped dangerous command keeps its
  // two-tap confirm, and the operator's own `confirm = false` cannot lift it — the same direction
  // rule 3 in agent-commands.ts applies to the palette.
  const shippedDanger = new Map(commandsFor(agent).map((c) => [c.command, c.dangerous] as const));
  // There is NO CAP. Ten rows scroll sideways exactly the way five do, so the bar does not truncate
  // the list, does not wrap to a second line, and does not refuse the eleventh row.
  return aimed.map((row) => ({
    id: `op:${row.command}`,
    label: row.barLabel ?? row.command.slice(1),
    command: row.command,
    confirm: (shippedDanger.get(row.command) ?? false) || row.confirm === true,
    operator: true,
  }));
}

function shippedBar(agent: string | undefined | null): readonly HarnessBarItem[] {
  if (!agent) return [];
  // Canonicalised through the same ladder the command catalog uses, so `claude-code` and `omp-2`
  // reach the bar their catalog is filed under rather than falling off it.
  return BARS.get(canonicalAgent(agent.toLowerCase().trim())) ?? [];
}
