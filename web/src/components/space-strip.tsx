import { useRef } from "react";
import { ChevronLeft, Loader2, Plus } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { SectionLabel } from "@/components/ui/section-label";
import { worstTriage } from "@/lib/triage";
import { useRevealActive } from "@/hooks/use-reveal-active";
import type { AgentView, WorkspaceView } from "@/lib/types";

interface SpaceStripProps {
  workspaces: WorkspaceView[];
  agents: AgentView[];
  /** Selected workspace id, or null for the "All" triage view. */
  selected: string | null;
  onSelect: (workspaceId: string | null) => void;
  onNewSpace: () => void;
  /** True while a Space create is in flight — disables the "+" and swaps its icon for a spinner,
   *  the same feedback the tab strip's own "+" gives. */
  creatingSpace?: boolean;
  /** When set (the drill-in view), lead with an explicit "‹ Back" button to the dashboard instead
   *  of the "All" chip — so the way back is obvious, not reliant on the header wordmark. */
  onBack?: () => void;
}

// A horizontal strip of spaces (Herdr workspaces) above the home list. In the drill-in (`onBack`
// set), it leads with a Back button to the dashboard, then the sibling spaces for quick switching;
// otherwise it leads with the "All" triage chip. A trailing + creates a new space. The space focused
// in the desktop TUI gets a subtle ring; a space with a blocked agent gets a dot.
export function SpaceStrip({
  workspaces,
  agents,
  selected,
  onSelect,
  onNewSpace,
  creatingSpace = false,
  onBack,
}: SpaceStripProps) {
  // shrink-0: this strip is a child of the space route's `flex-1 flex-col` scroller, so without it
  // the strip flex-shrinks to 16px while its 32px chips overflow — the tab row below then paints
  // straight over the chips.
  // Keyed on `selected`: on a switch the newly active chip may sit scrolled out of a long row. In
  // the drill-in (`onBack` set) "Back" leads the row, but it's navigation rather than a space — not
  // a chip, never `aria-current` — so the hook simply reveals whichever chip (if any) carries the
  // active mark, and does nothing when none does.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useRevealActive(scrollerRef, selected);
  return (
    <div
      ref={scrollerRef}
      className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background py-1 pl-1.5 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      ) : (
        <>
          <SectionLabel>Spaces</SectionLabel>
          <Chip label="All" active={selected === null} onClick={() => onSelect(null)} />
        </>
      )}
      {workspaces.map((w) => (
        <Chip
          key={w.workspaceId}
          label={w.label}
          active={selected === w.workspaceId}
          ring={w.focused}
          // Same dot language as the tab strip directly below it, and as the herd list.
          status={worstTriage(agents.filter((a) => a.workspaceId === w.workspaceId))}
          onClick={() => onSelect(w.workspaceId)}
        />
      ))}
      <button
        type="button"
        onClick={onNewSpace}
        disabled={creatingSpace}
        aria-label="New space"
        aria-busy={creatingSpace}
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-100"
      >
        {creatingSpace ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" />
        )}
      </button>
    </div>
  );
}
