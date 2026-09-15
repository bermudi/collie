import { useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { TabActionsSheet } from "@/components/tab-actions-sheet";
import { StatusDot } from "@/components/status-badge";
import { STRIP_TAP_TARGET, STRIP_TAP_TARGET_SQUARE } from "@/components/ui/labelled-strip";
import { useLongPress } from "@/hooks/use-long-press";
import { useRevealActive } from "@/hooks/use-reveal-active";
import { cn } from "@/lib/utils";
import { worstTriage, TRIAGE_STATUS, type TriageKey } from "@/lib/triage";
import { tabTitle } from "@/lib/pane-name";
import { STATUS_LABEL } from "@/lib/types";
import type { AgentView, TabView } from "@/lib/types";

interface TabStripProps {
  workspaceId: string;
  tabs: TabView[];
  agents: AgentView[];
  /** Selected tab id, or null for "All" (every tab's panes). */
  selected: string | null;
  onSelect: (tabId: string | null) => void;
  onNewTab: (workspaceId: string) => void;
  /** True while this Space's own "+" create is in flight — disables the button and swaps its icon
   *  for a spinner, so a second tap during the round trip is refused rather than silently ignored
   *  (the hook already ignores it; this is the feedback that stops the operator tapping twice). */
  creatingTab?: boolean;
  /** Show the leading "All" tab (home space view); off for the in-pane tab bar. */
  allowAll?: boolean;
  /** Session scope for the long-press tab actions (rename/close); undefined = primary. */
  session?: string;
  /** Drop the long-press write actions when the device isn't authorised (the sheet shows a note). */
  readOnly?: boolean;
  /** Revalidate after a rename. Long-press tab actions turn on only when this AND onClosed are set. */
  onRenamed?: () => void;
  /** Refresh/fall back after a close. Enables long-press together with onRenamed. */
  onClosed?: (tabId: string) => void;
}

interface TabProps {
  label: string;
  active: boolean;
  /** Dimmed dashed outline marking the tab focused in the desktop TUI. */
  ring?: boolean;
  /** The most urgent thing happening inside this tab ({@link worstTriage}) — drawn as a leading dot
   *  in the same palette the herd list uses. Omit (or pass null) when the tab holds no agent. */
  status?: TriageKey | null;
  onClick: () => void;
  /** Long-press (or right-click / Android contextmenu) opens actions. Inert when unset. */
  onLongPress?: () => void;
  /** A plain tap when the tab is already `active` — opens actions instead of a no-op re-select. */
  onTapActive?: () => void;
}

// The selected space's tabs, drawn as PLAIN CELLS on the row's own ground — compact, one continuous
// band with the pane row beneath, no horizontal rule and no hairlines between tabs. The open tab is
// an outlined pill; every other tab is a plain rectangle. (upstream c2a16502, 02ac7a53, 0ded2d2e,
// 583e561d — Pup keeps its status dot and drops upstream's agent tile.)
function Tab({ label, active, ring, status, onClick, onLongPress, onTapActive }: TabProps) {
  const longPress = useLongPress(onLongPress);
  // A POSITIONAL LABEL IS NOT A NAME (lib/pane-name.ts § tabTitle). Herdr calls an unnamed tab "1";
  // printed raw, a row of tabs would read as a row of numbers. So a tab the multiplexer only
  // numbered reads its POSITION instead — `tab 2`, the same words and the same lighter ink every
  // other surface gives it — and only a tab with no label at all (no name, no digit) falls back to
  // the dot: it keeps its status dot, the one fact about it that is real. The raw label is still
  // the button's accessible name, because a screen reader has no row to look at.
  const title = tabTitle(label);

  // A long-press already suppresses the ensuing click (via longPress.onClickCapture), so this only
  // ever sees a genuine tap. Tapping the already-active tab opens actions rather than a dead
  // re-select.
  function handleClick() {
    if (active && onTapActive) {
      onTapActive();
      return;
    }
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      {...longPress}
      // Not role="tab". These do not swap a panel in place — they navigate. `role="tablist"` would
      // promise arrow-key roving over panels that are not there. A nav with aria-current is what
      // this actually is.
      aria-current={active ? "true" : undefined}
      aria-label={label || (status ? STATUS_LABEL[TRIAGE_STATUS[status]] : undefined)}
      className={cn(
        // select-none + -webkit-touch-callout:none stop iOS Safari's selection loupe / touch
        // callout, whose native long-press gesture otherwise fires pointercancel and kills the hold
        // timer.
        //
        // THE OPEN TAB IS AN OUTLINED PILL; AN INACTIVE ONE IS A PLAIN RECTANGLE. Both carry the
        // SAME border-box, always — `border` + `rounded-md` + `my-px` are unconditional, and only
        // the border's COLOUR and the fill flip with `active`: a border reserved as transparent at
        // rest costs the box nothing, so selecting a tab can never re-flow its neighbours. `my-px`
        // insets the box 1px off the row's own edges so the open tab's border paints whole.
        // `font-medium` stays unconditional for the same reason.
        //
        // COMPACT: `h-8` draws a 32px tab, `text-[11px]` the size of the header's path line. A tab
        // used to BE a real 44px tap target, drawn at that height; now it draws small and answers
        // 44px through `STRIP_TAP_TARGET`'s transparent `::before` — the reach lives in the
        // scroller's own `pt-1.5 pb-1.5`, not in this box.
        STRIP_TAP_TARGET,
        "relative flex h-8 min-w-11 shrink-0 select-none items-center justify-center gap-1.5 [-webkit-touch-callout:none] whitespace-nowrap rounded-md border my-px px-3 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // GROUND IS THE ONLY MARK past the border. The open tab takes the page's own surface,
        // `bg-background`, boxed by `border-border`; every other tab sits on the row's bare ground
        // with a transparent border of the same box.
        active
          ? "border-border bg-background text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
        // The desktop TUI's focus — a dimmed dashed outline on top of whatever the phone shows.
        ring && "border-dashed border-border",
      )}
    >
      {status && (
        <>
          <StatusDot status={TRIAGE_STATUS[status]} />
          <span className="sr-only">{STATUS_LABEL[TRIAGE_STATUS[status]]}</span>
        </>
      )}
      {title ? (
        <span className={cn(title.positional && "text-muted-foreground/70")}>{title.text}</span>
      ) : (
        // A tab with no name AND no digit: the dot is all it has. Never an empty button.
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
      )}
    </button>
  );
}

export function TabStrip({
  workspaceId,
  tabs,
  agents,
  selected,
  onSelect,
  onNewTab,
  creatingTab = false,
  allowAll = true,
  session,
  readOnly,
  onRenamed,
  onClosed,
}: TabStripProps) {
  const [sheetTab, setSheetTab] = useState<TabView | null>(null);
  // Actions need both callbacks wired (revalidate on rename, fall back on close); without them the
  // tabs stay plain tap-to-switch — long-press is inert.
  const actionsEnabled = !!onRenamed && !!onClosed;
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Keyed on `selected` (not `workspaceId`): a many-tab strip must reveal the active tab on mount
  // AND every time the operator switches tabs, and `selected` is the value that changes on a switch.
  useRevealActive(scrollerRef, selected);

  const wsTabs = tabs.filter((t) => t.workspaceId === workspaceId);
  if (wsTabs.length === 0) return null;

  return (
    <>
      {/* The row's own ground, edge to edge — one continuous band with the pane row beneath it. No
          horizontal rule of its own: a header above keeps whatever rule it already had, and the
          open tab's outline is what separates the row from what it selects. The accessible name
          replaces the visible "Tabs" word the compact row no longer has room for. */}
      <nav
        aria-label="Tabs"
        className="shrink-0 bg-chrome px-4"
      >
        {/* -mx-4 px-4: the gutter moves onto the scroller and is cancelled by the negative margin,
            so the last tab scrolls clean off the screen edge while the first still starts on the
            route's 16px gutter. pt/pb-1.5: the room STRIP_TAP_TARGET's reach needs — the tap floor
            is bought with real padding, not just the pseudo-element. items-start keeps every tab's
            TOP on the same line. */}
        <div
          ref={scrollerRef}
          className="-mx-4 flex items-start gap-1 overflow-x-auto px-4 pt-1.5 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* The tab group is its own flex child so the "+" button keeps its own gap from the group
              rather than inheriting the tabs' tighter one. */}
          <div className="flex shrink-0 items-stretch gap-1">
            {allowAll && (
              <Tab label="All" active={selected === null} onClick={() => onSelect(null)} />
            )}
            {wsTabs.map((t) => (
              <Tab
                key={t.tabId}
                label={t.label}
                active={selected === t.tabId}
                ring={t.focused}
                status={worstTriage(agents.filter((a) => a.tabId === t.tabId))}
                onClick={() => onSelect(t.tabId)}
                onLongPress={actionsEnabled ? () => setSheetTab(t) : undefined}
                onTapActive={actionsEnabled ? () => setSheetTab(t) : undefined}
              />
            ))}
          </div>
          {/* 32px drawn, 44x46 hit — a true square, the one shape allowed to keep `rounded-full`.
              self-center: it is a button beside the tabs, not a tab. */}
          <button
            type="button"
            onClick={() => onNewTab(workspaceId)}
            disabled={creatingTab}
            aria-label="New tab"
            aria-busy={creatingTab}
            className={cn(
              STRIP_TAP_TARGET_SQUARE,
              "flex size-8 shrink-0 self-center items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-100",
            )}
          >
            {/* Same box, same icon size, swapped in place — the button never resizes between its
                idle and busy shapes. */}
            {creatingTab ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" />
            )}
          </button>
        </div>
      </nav>

      {actionsEnabled && (
        <TabActionsSheet
          open={sheetTab !== null}
          onClose={() => setSheetTab(null)}
          tab={sheetTab}
          session={session}
          readOnly={readOnly}
          onRenamed={onRenamed}
          onClosed={onClosed}
        />
      )}
    </>
  );
}
