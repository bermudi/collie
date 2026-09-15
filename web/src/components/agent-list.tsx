import { Check, Inbox, WifiOff } from "lucide-react";

import { clockTime } from "@/lib/format";
import { SectionHeader } from "@/components/section-header";
import { ListGroup } from "@/components/ui/list-group";
import { groupPanesByWorkspace } from "@/lib/pane-groups";
import { bucketOf, sectionHeaderProps, triage, type TriageKey } from "@/lib/triage";
import type { AgentView, BridgeStatus } from "@/lib/types";
import { AgentCard } from "./agent-card";

interface AgentListProps {
  agents: AgentView[];
  /**
   * Bare shell panes. They join their own workspace's group, after that tab's agents — a shell is a
   * pane of the tab it sits in, not a species that deserves a pen of its own (lib/pane-groups.ts).
   * Omit and the list is agents alone, exactly as it was. (upstream 64b6f499)
   */
  shellPanes?: AgentView[];
  bridge?: BridgeStatus | undefined;
  /** Open a row, by its pane id. */
  onOpen: (paneId: string) => void;
  /** Show the "no agents" placeholder when the herd is empty (default true). */
  emptyState?: boolean;
  /**
   * The snapshot on screen is stale — the last fetch failed, or this is a cold boot rendering from the
   * write-through cache. An EMPTY herd then means "we don't know", never "nothing is running", so the
   * placeholder must not claim the latter.
   */
  error?: boolean;
  /** When the stale data was fetched, for the "last seen HH:MM" half of the disconnected placeholder. */
  lastSeenAt?: number;
}

/** The sections that mean "a human is required here" — pulled to the top and given the accented
 *  header, and now the only ones the dashboard sorts by URGENCY at all. */
const ATTENTION: ReadonlySet<TriageKey> = new Set<TriageKey>(["needs", "ready"]);

/** A module-level empty list: a fresh `[]` default per render is a new reference for nothing. */
const NO_PANES: AgentView[] = [];

// ── THE DASHBOARD ASKS TWO QUESTIONS, IN THIS ORDER ──────────────────────────
// FIRST, what needs you. Needs you → Ready · unseen, pinned to the top under an accented header,
// and each row still carrying its own place on line 2 — those two groups are by URGENCY, so a row
// in them has to say where it came from. That is the dashboard's job and it does not move.
//
// THEN, everything else, BY WORKSPACE. One group per workspace, headed by its name and counted, in
// workspace-number order (lib/pane-groups.ts), with the panes inside in the order the bridge sent.
// What this replaces is the Working and Recent sections, and the argument for replacing them is the
// complaint they caused: a flat list of eighteen rows, each repeating an address, said nothing
// about what KIND of thing a row was, and a status word the row's own dot already carries is a poor
// heading to spend a group on. Rows under one workspace heading are panes, because that is what a
// workspace holds. The workspace is the level the operator thinks in, so it is the level the
// heading names; the tab drops onto line 2 of the row (`AgentCard` at `scope="place"`), where it
// tells two rows apart without spending a heading, and the group reads as one 44px pitch.
// (upstream 64b6f499)
//
// A ROW IS LISTED ONCE. An urgent pane is PULLED out of its workspace rather than copied to the top:
// it is one thing, and two rows for it would mean answering it twice. So the group's count counts
// the rows actually under the heading, and a workspace whose every pane needs you has no group left
// at all — it is entirely on top, which is where you are already looking.
//
// The sort toggle and the Recent fold went with those two sections: a workspace's handful of rows is
// not a tail to fold away, and there is no clock left in the order to reverse. (upstream 6e8eeafc)
export function AgentList({
  agents,
  shellPanes = NO_PANES,
  bridge,
  onOpen,
  emptyState = true,
  error = false,
  lastSeenAt,
}: AgentListProps) {
  // A herd with nothing but bare shells in it is still something to show, and "No agents running."
  // is then true rather than empty — so the placeholder waits for BOTH lists to be empty.
  if (agents.length === 0 && shellPanes.length === 0) {
    if (!emptyState) return null;
    // "No agents running." is a claim about the herd, and only the bridge can make it. A stale render
    // (failed fetch, or a cold boot with nothing cached) knows nothing about the herd — saying the
    // herd is empty there is the bug this branch exists to prevent, so the outage is named instead.
    // `bridge` is no help on its own: a cached snapshot still says "connected".
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-muted-foreground">
          <WifiOff className="size-7" />
          <span className="text-sm">
            {lastSeenAt === undefined
              ? "Disconnected"
              : `Disconnected — last seen ${clockTime(lastSeenAt)}`}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-muted-foreground">
        <Inbox className="size-7" />
        <span className="text-sm">
          {bridge === "connected" ? "No agents running." : "Waiting for Herdr…"}
        </span>
      </div>
    );
  }

  // Two passes over one herd. The attention buckets keep `triage()` exactly as they had it; the
  // rest of the panes leave triage behind entirely and are grouped by workspace, in the order the
  // bridge sent them (which is what `filter` preserves here). That `filter` is the whole of the
  // pulled-out rule: a pane listed on top is never handed to the grouper, so it cannot appear a
  // second time and the group's count never counts it.
  const all = triage(agents);
  const urgent = all.filter((s) => ATTENTION.has(s.key) && s.agents.length > 0);
  const groups = groupPanesByWorkspace(
    agents.filter((a) => !ATTENTION.has(bucketOf(a))),
    shellPanes,
  );
  if (urgent.length === 0 && groups.length === 0) return null;
  // "What needs me right now?" deserves an answer even when the answer is "nothing". Without this
  // the section simply doesn't render, and an absence reads the same as a stale load.
  const allClear = all.find((s) => s.key === "needs")!.agents.length === 0;

  const row = (a: AgentView, scope: "herd" | "place", unseen = false) => (
    <AgentCard
      key={a.paneId}
      agent={a}
      onClick={() => onOpen(a.paneId)}
      scope={scope}
      statusStyle="dot"
      density="row"
      unseen={unseen}
    />
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* The product of the twenty-times-a-day glance. Rendered with presence, not as a caption:
          you should be able to resolve it one-handed at arm's length without focusing. */}
      {allClear && (
        <p className="flex items-center gap-2 py-1 text-sm font-medium">
          <Check className="size-5 shrink-0 text-status-done" aria-hidden />
          Nothing needs you
        </p>
      )}

      {/* What needs you, by urgency. statusStyle="dot": the heading already says the status, so a
          pill on every row restates it and costs the width the title needs. Every section, urgent
          or not, renders its rows at `density="row"` inside ONE framed `ListGroup` — the header
          still carries the accent and the urgency, the rows look like every other row in the list.
          `scope="herd"` keeps the row's own place (`workspace › tab`) on line 2, because the
          section header names a STATUS, never a workspace. (upstream 10cd0557, 458876bf) */}
      {urgent.map((s) => (
        <section key={s.key} className="flex flex-col gap-2">
          <SectionHeader {...sectionHeaderProps(s)} />
          <ListGroup id={`agent-section-${s.key}`}>
            {s.agents.map((a) => row(a, "herd", s.key === "ready"))}
          </ListGroup>
        </section>
      ))}

      {/* Everything else, by workspace. The heading IS the marker: it names the workspace and counts
          the rows it actually holds, so a row under it says neither. Flat rows in ONE bordered
          group, which gives the run of hairlines a first edge and a last edge for 2px. */}
      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2">
          <SectionHeader
            label={g.label}
            trailing={
              // The count in words rather than in the header's own `(n)` parentheses: this heading
              // is an address, and "3 panes" after it says what the three things ARE — which is the
              // whole reason the list is grouped this way. It counts what is LISTED here, not what
              // the workspace holds: a pane pulled to the top is answered up there.
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {g.panes.length === 1 ? "1 pane" : `${g.panes.length} panes`}
              </span>
            }
          />
          <ListGroup>{g.panes.map((p) => row(p, "place"))}</ListGroup>
        </section>
      ))}
    </div>
  );
}
