import { useRef, useState } from "react";
import { TerminalSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { LabelledStrip, STRIP_TAP_TARGET } from "@/components/ui/labelled-strip";
import { StatusDot } from "@/components/status-badge";
import { PaneActionsSheet } from "@/components/pane-actions-sheet";
import { useLongPress } from "@/hooks/use-long-press";
import { useRevealActive } from "@/hooks/use-reveal-active";
import { paneName } from "@/lib/pane-name";
import { paneOrdinals } from "@/lib/pane-ordinal";
import type { AgentView } from "@/lib/types";

interface PaneStripProps {
  /** The panes that share the current tab (agents + shells), in stable order. */
  panes: AgentView[];
  currentPaneId: string;
  onSelect: (paneId: string) => void;
  /** Session scope for the long-press pane actions (rename/close); undefined = primary. */
  session?: string;
  /** Drop the long-press write actions when the device isn't authorised. */
  readOnly?: boolean;
  /** Revalidate after a rename. Long-press pane actions turn on only when this AND onClosed are set. */
  onRenamed?: () => void;
  /** Navigate/refresh after a close (Home if it's the open pane). Enables long-press with onRenamed. */
  onClosed?: (paneId: string) => void;
}

// The panes within the current tab, as a horizontal switcher one level below the tab bar
// (space › tab › pane). Mobile deliberately doesn't replicate the desktop's pane tiling — a tab can
// hold several panes, and this is just a quick way to flip between them. Rendered only when the tab
// actually holds more than one pane (a lone pane needs no switcher), so it's an optional extra row.
// A long-press on a pill opens its actions sheet (rename / close) when the parent wires the actions.
export function PaneStrip({
  panes,
  currentPaneId,
  onSelect,
  session,
  readOnly,
  onRenamed,
  onClosed,
}: PaneStripProps) {
  const [sheetPane, setSheetPane] = useState<AgentView | null>(null);
  // Actions need both callbacks wired (revalidate on rename, navigate on close); without them the
  // pills stay plain tap-to-switch — long-press is inert.
  const actionsEnabled = !!onRenamed && !!onClosed;
  // Unconditional, BEFORE the `panes.length < 2` early return — hooks can't be conditional; when
  // the strip renders nothing the ref simply never attaches and the reveal finds no scroller.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useRevealActive(scrollerRef, currentPaneId);
  // WHICH pills need a number: only those a neighbour would otherwise read identically
  // (lib/pane-ordinal.ts) — the multiplexer's raw `p3` is gone from every surface.
  const ordinals = paneOrdinals(panes);

  if (panes.length < 2) return null;

  return (
    <>
      {/* THIS ROW SHARES THE TAB BAR'S OWN GROUND, `bg-chrome` — one continuous band with the tab
          row above, no rule between them; the one rule that survives is the mirror's own top edge
          below both rows. The pills sit inside the band, drawing no ground of their own beyond the
          active pill's fill. (upstream c2a16502, 2eefd38e) */}
      <LabelledStrip label="Panes" className="bg-chrome" scrollerRef={scrollerRef}>
        {panes.map((p) => (
          <PanePill
            key={p.paneId}
            pane={p}
            active={p.paneId === currentPaneId}
            onSelect={onSelect}
            ordinal={ordinals.get(p.paneId)}
            onLongPress={actionsEnabled ? () => setSheetPane(p) : undefined}
            // Tapping the already-active pill would otherwise be a useless re-navigate; repurpose it
            // to open the same actions sheet a long-press would, so it's not a dead tap.
            onTapActive={actionsEnabled ? () => setSheetPane(p) : undefined}
          />
        ))}
      </LabelledStrip>

      {actionsEnabled && (
        <PaneActionsSheet
          open={sheetPane !== null}
          onClose={() => setSheetPane(null)}
          pane={sheetPane}
          session={session}
          readOnly={readOnly}
          onRenamed={onRenamed}
          onClosed={onClosed}
        />
      )}
    </>
  );
}

function PanePill({
  pane,
  active,
  ordinal,
  onSelect,
  onLongPress,
  onTapActive,
}: {
  pane: AgentView;
  active: boolean;
  /** This pane's 1-based place in the row, given only when a neighbour reads the same
   *  (lib/pane-ordinal.ts). */
  ordinal?: number;
  onSelect: (paneId: string) => void;
  onLongPress?: () => void;
  /** A plain tap on the pill when it's already `active` — opens actions instead of a no-op re-select. */
  onTapActive?: () => void;
}) {
  const isShell = pane.kind === "shell";
  // The one name rule (lib/pane-name.ts) — the same string the dashboard row, the pane header and a
  // push all lead with. The icon still conveys which agent it is, and the place is NOT repeated
  // here: this strip is already inside the tab whose place the header above it states. The raw
  // `pN` id suffix is gone — a pill is numbered only when a neighbour would read the same.
  const name = paneName(pane);
  const longPress = useLongPress(onLongPress);

  // A long-press already suppresses the ensuing click via longPress.onClickCapture (stops it before
  // this ever runs), so this only ever sees a genuine tap.
  function onClick() {
    if (active && onTapActive) {
      onTapActive();
      return;
    }
    onSelect(pane.paneId);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      {...longPress}
      aria-current={active ? "true" : undefined}
      // A numbered pill states its own name, because the number is a separate text node and the
      // accessible name computation would otherwise run the two together as "claude2".
      aria-label={ordinal === undefined ? undefined : `${name} ${ordinal}`}
      title={active && onTapActive ? "Tap for pane actions" : undefined}
      className={cn(
        // select-none + -webkit-touch-callout:none stop iOS Safari's selection loupe / touch callout,
        // whose native long-press gesture otherwise fires pointercancel and kills our hold timer.
        //
        // `rounded-md` (2px), not `rounded-full`: this pill carries a name and a tag, so it is far
        // wider than it is tall — a stadium, not a circle.
        //
        // COMPACT: `py-0.5` and `text-[11px]` draw a 24px pill, the size of the header's path line
        // just above it. The drawn box shrank; the TAP FLOOR did not — `STRIP_TAP_TARGET`'s
        // transparent `::before` still answers a real 44px hit, because the reach lives in
        // `LabelledStrip`'s own scroller padding, not in this pill's box. (upstream c2a16502)
        STRIP_TAP_TARGET,
        "flex min-w-11 shrink-0 select-none [-webkit-touch-callout:none] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 py-0.5 text-[11px] font-medium transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {isShell ? (
        <TerminalSquare className="size-3.5 shrink-0" />
      ) : (
        <StatusDot status={pane.status} />
      )}
      <span>{name}</span>
      {ordinal !== undefined && (
        // The pane's place IN THE ROW — what the reader is looking at — never the id suffix.
        <span
          className={cn(
            "text-[10px] tabular-nums",
            active ? "text-primary-foreground/70" : "text-muted-foreground/60",
          )}
        >
          {ordinal}
        </span>
      )}
    </button>
  );
}
