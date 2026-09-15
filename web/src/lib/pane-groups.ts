// THE DASHBOARD'S SECOND AXIS: a pane sits under the WORKSPACE it lives in.
//
// `lib/triage.ts` answers "what needs me", and that answer stays on top of the dashboard because it
// is the dashboard's job. Everything it does NOT flag is answered here instead, by grouping: one
// group per workspace, headed by that workspace's name and counted, so a row no longer has to repeat
// an address eighteen times down the page. The workspace is the level the operator actually thinks
// in — it is the project — and a tab is a divider inside it, so a group per tab cut one project into
// three headings that each held two rows. The tab did not disappear: it moved onto the row, on line
// 2, where it tells two rows of one workspace apart and costs no heading. (upstream 64b6f499)
//
// ── WHAT DECIDES THE ORDER ───────────────────────────────────────────────────
// Groups run by WORKSPACE NUMBER — the multiplexer's own numbering, the same order the space strip
// and the space navigator use. (Upstream also keys a group by machine first, for a crew's merged
// herd; Pup is one host, so the workspace key is the id alone.)
//
// Inside a group the bridge's own arrangement is kept: the tabs in the order they were first met,
// and the panes of a tab in the order they arrived. That is the rule `triage()` already keeps for a
// bucket — the bridge sends one stable arrangement (status, workspace, tab, position in the tab) and
// it is the arrangement the operator made at the desk. A row therefore only ever moves when it
// changes GROUP, never because a clock ticked.
//
// ── SHELLS SIT WITH THEIR TAB ────────────────────────────────────────────────
// A bare shell is a pane of the tab it is in, so it lands after that tab's agents rather than in a
// trailing pen at the end of the workspace. That is the one place the given order is not preserved
// verbatim, and it is deliberate.
import { panePlaceParts } from "./pane-name";
import type { AgentView } from "./types";

/** One workspace and the panes of it that this list is showing. */
export interface WorkspaceGroup {
  key: string;
  /** The heading's text: the workspace's own name. */
  label: string;
  /** Tab by tab in the order they were met, each tab's agents then that tab's bare shells. */
  panes: AgentView[];
}

/** One tab inside a workspace bucket. Never a heading — only an order. */
interface TabBucket {
  /** Where this tab was first met in the given lists. */
  seq: number;
  agents: AgentView[];
  shells: AgentView[];
}

interface Bucket {
  key: string;
  label: string;
  /** The multiplexer's own workspace number — the sort key. */
  workspaceNumber: number;
  /** Where this workspace was first met, so two workspaces sharing a number still have an order. */
  seq: number;
  tabs: Map<string, TabBucket>;
}

/**
 * Bucket a herd by workspace. Every pane handed in appears exactly once, empty groups do not exist,
 * and a caller that hands the same two lists twice gets the same groups in the same order.
 *
 * The caller decides what is IN the two lists: the dashboard withholds the panes it has already
 * listed under "needs you", so a group counts the rows actually under its heading and a workspace
 * whose every pane is urgent gets no heading at all.
 */
export function groupPanesByWorkspace(
  agents: readonly AgentView[],
  shellPanes: readonly AgentView[] = [],
): WorkspaceGroup[] {
  const byKey = new Map<string, Bucket>();
  let workspaceSeq = 0;
  let tabSeq = 0;

  const tabOf = (pane: AgentView): TabBucket => {
    let bucket = byKey.get(pane.workspaceId);
    if (bucket === undefined) {
      bucket = {
        key: pane.workspaceId,
        // The workspace's own name, by the one place rule (lib/pane-name.ts) — the same string the
        // space strip and the crumb use, so the heading and the strip can never disagree.
        label: panePlaceParts(pane).space,
        workspaceNumber: pane.workspaceNumber,
        seq: workspaceSeq++,
        tabs: new Map(),
      };
      byKey.set(pane.workspaceId, bucket);
    }
    let tab = bucket.tabs.get(pane.tabId);
    if (tab === undefined) {
      tab = { seq: tabSeq++, agents: [], shells: [] };
      bucket.tabs.set(pane.tabId, tab);
    }
    return tab;
  };

  for (const a of agents) tabOf(a).agents.push(a);
  for (const s of shellPanes) tabOf(s).shells.push(s);

  return [...byKey.values()]
    .toSorted((a, b) => a.workspaceNumber - b.workspaceNumber || a.seq - b.seq)
    .map((g) => ({
      key: g.key,
      label: g.label,
      panes: [...g.tabs.values()]
        .toSorted((a, b) => a.seq - b.seq)
        .flatMap((tab) => tab.agents.concat(tab.shells)),
    }));
}
