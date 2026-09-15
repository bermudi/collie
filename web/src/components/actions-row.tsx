import { Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { HarnessBar, useHarnessBarItems } from "@/components/harness-bar";
import { Button } from "@/components/ui/button";
import { OverflowEdges } from "@/components/ui/overflow-edges";
import { SectionLabel } from "@/components/ui/section-label";
import { STRIP_ROW_PILL, STRIP_SCROLLER } from "@/components/ui/labelled-strip";
import { hasResizeObserver } from "@/lib/env";
import type { OperatorCommand } from "@/lib/types";
import { cn } from "@/lib/utils";

// ONE ROW OF ACTIONS, DIRECTLY ABOVE THE INPUT. Collie's own controls first — Keys, Type, Quick,
// Agent, the display gear — then the running harness's own commands in a section of their own. It
// scrolls sideways; nothing wraps and nothing is dropped. (upstream fc8d1be9, 9b530786, 5e7f626c,
// 63513aee, 931f857a, adaa1fb3 and the belt's follow-up fixes, ported as the end state)
//
// IT IS A BELT: ONE FULL-BLEED BAND, NOT TWO FLOATING CAPSULES. The row is a continuous strip that
// runs edge to edge, closed above and below by a hairline, with a quiet ground of its own. Collie's
// controls stand DIRECTLY on that ground with no outline at all; the harness's commands stand in a
// SECTION of the same band — a square-cornered rectangle spanning the belt's full inner height,
// tinted with the harness's brand. One belt, two parts, and the tint boundary is what separates
// them. No divider and no thick left border.
//
// THE GROUND IS AN OPERATOR'S CALL that this row alone takes: a belt IS a fill, and both its
// neighbours are the chrome ground (`--chrome`), so the band's own ground separates from it with a
// faint wash of the foreground (`bg-foreground/6`), which is symmetric across themes by
// construction. The scroller WITHIN the band carries its own faint brand tint (`bg-primary/10`) —
// it is the one thing on this row that PANS under a thumb, so it earns the one wash that says
// "brand" rather than "chrome". The fixed Switch cell takes the composer's own ground, `bg-chrome`:
// it never scrolls, it is the one control that LEAVES the pane rather than acting on it, and
// reading as ONE surface with the composer row under the belt is the point.
//
// THE HAIRLINE IS `--border`, NOT `--rule`. The belt's lower neighbour is the same chrome surface
// it stands on, so that is a component edge inside one surface. No rounded ends anywhere either: a
// belt with rounded corners is a capsule again.
//
// It replaced two separate rows: the Controls row and (upstream) the harness bar sat one above the
// other, each spending a row of a phone's glass on four or five buttons, and the operator read them
// as one thing anyway: "what can I press from here". Merged, the composer gets a row back.
//
// THE BELT'S RIGHT END IS THE SWITCH MARK. A drag up from anywhere on the band opens the pane
// switcher, a sideways drag still scrolls it, and the old 30px handle band above the composer is
// gone. The mark is a bare Layers glyph behind a hairline — no word, no border of its own.
//
// WHY THE GENERAL PART IS FIRST. It is the part that is ALWAYS there. The harness section is absent
// on a bare shell and whenever the operator has the Settings switch off — so leading with it would
// make the row's left edge mean a different thing per pane, and the thumb could not learn one
// position. The left edge is Keys on every pane there is.
//
// EVERY PILL IS AN ICON AND A WORD, IN BOTH PARTS. Two parts that are meant to read as one belt
// cannot hold two different kinds of pill, and the cost was paid in scroll rather than in shape.
//
// The general pills DRAW a short word and ANNOUNCE the full one (`word` vs `label` below): the row
// has one word of room per pill, and "Type into terminal" and "Display settings" are still what a
// screen reader hears and what a test addresses.

/** The row's "on" look — an open dock, an armed mode. `hover:` is pinned to the same tint: without
 *  it, hovering an already-on control repaints it with the ghost variant's hover background and it
 *  reads as switching off under the cursor. */
const ON = "bg-control-on text-control-on-foreground hover:bg-control-on";
const OFF = "text-muted-foreground";

/**
 * The FIRST-PAINT fallback for how much of the belt's right end the pinned Switch block owns, in
 * px — the trailing spacer's width before a `ResizeObserver` has measured the real thing (below).
 * It is the whole pinned span: 32px of control, the 1px hairline on its left, the 8px between the
 * two, the 12px of `pr-3` that keeps it off the screen edge, and the 64px of `pl-16` its own fade
 * leads in over. 32 + 1 + 8 + 12 + 64 = 117.
 *
 * THIS NUMBER IS THE GUESS BEFORE A REAL ONE EXISTS. `useSwitchBlockWidth` below measures the
 * block itself with a `ResizeObserver` and this constant is only its return value's first frame —
 * whatever the block actually draws, at whatever width a font gives it, is the number the scroller
 * gets, so the two cannot drift apart by hand (which is exactly how the last pill once ended up
 * hidden under the block).
 */
const SWITCH_PILL_INSET = 117;

interface SwitchBlockWidth {
  /** Lands on the pinned Switch block's own outer element — see that element's comment for why. */
  ref: (node: HTMLSpanElement | null) => void;
  /** The block's measured width in px, or `null` before the first observation (or with no block
   *  to observe at all). The caller falls back to {@link SWITCH_PILL_INSET} for `null`. */
  width: number | null;
}

function useSwitchBlockWidth(active: boolean): SwitchBlockWidth {
  const [width, setWidth] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // useCallback, keyed on `active`: a bare inline function is a NEW ref every render, and React
  // re-fires a changed ref callback (null, then the node) on every one of those — reconnecting the
  // observer 60 times a second under a re-rendering belt.
  const ref = useCallback(
    (node: HTMLSpanElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || !active || !hasResizeObserver()) return;
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) setWidth(entry.contentRect.width);
      });
      ro.observe(node);
      observerRef.current = ro;
    },
    [active],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref, width: active ? width : null };
}

/**
 * One of Collie's own actions. The composer owns every one of these — what it does, whether it is
 * on, whether it is refused — and this file owns only how it is drawn.
 */
export interface GeneralAction {
  /** Stable, for React's key. Never shown. */
  id: string;
  icon: LucideIcon;
  /** The button's accessible name — what a reader announces and what a test addresses. It is never
   *  shortened for the paint. */
  label: string;
  /** The word the pill DRAWS, when the accessible name is too long to wear: the row shows "Type"
   *  and announces "Type into terminal". Defaults to {@link label}.
   *
   *  It must be a prefix-or-part of `label` and never a different word — a visible word the
   *  accessible name does not contain is the WCAG 2.5.3 failure. */
  word?: string;
  /** Draws the "on" tint: the dock this opens is open, or the mode it arms is armed. */
  on?: boolean;
  /** Set for a control that opens a dock — it becomes `aria-expanded`. */
  expanded?: boolean;
  /** Set for a control that toggles a mode — it becomes `aria-pressed`. */
  pressed?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface ActionsRowProps {
  /** Collie's own actions, in the order the thumb should meet them. */
  general: readonly GeneralAction[];
  /** The focused pane's agent — picks the harness section and its brand colour. */
  agent: string | undefined | null;
  /** The snapshot's `operatorCommands`; the `bar = true` ones replace the shipped bar. */
  mine?: readonly OperatorCommand[];
  /** Bound to `(t) => send(t, false)`. Resolving true drives the harness checkmark. */
  onRun: (text: string) => Promise<boolean>;
  /** Bound to the composer's `locked`. Greys the harness buttons in place. */
  disabled?: boolean;
  /**
   * THE PANE SWITCHER, PINNED AT THE BELT'S RIGHT END. Absent by default, and absent is the whole
   * of the old behaviour: nothing renders and no class on this row changes.
   *
   * THE TWO HALVES LAND ON TWO DIFFERENT ELEMENTS, AND THAT IS THE DESIGN. `ref` goes on the BELT —
   * the outer element, not the pill — so a drag upward from anywhere on the band opens the
   * switcher: a pill, the harness section, the bare ground, the Switch pill itself. `onClick` is
   * the pill's, which is the thing that LOOKS tappable and is the only thing a tap may hit.
   *
   * The anchor is unchanged by any of this: `useSheetPull` measures its node's top edge, and its
   * node is still the belt, so the sheet peeks from the same line it always did.
   *
   * The belt wears `touch-pan-x` for it (`touch-action: pan-x`): the browser keeps the scroller's
   * sideways pan and hands vertical movement to the hook, which then decides per gesture which
   * axis a touch belongs to.
   */
  handle?: {
    /** {@link import("@/hooks/use-sheet-pull").useSheetPull}'s ref — the finger-tracked drag. It
     *  lands on the BELT, not on the pill: the whole band is the drag surface. */
    ref: (node: HTMLElement | null) => void;
    /** The tap, on the SWITCH PILL. Opens the same switcher sheet the drag opens. */
    onClick: () => void;
    /** The button's accessible name — "Switch pane". */
    label: string;
  };
}

export function ActionsRow({ general, agent, mine, onRun, disabled, handle }: ActionsRowProps) {
  const harnessItems = useHarnessBarItems(agent, mine);
  const switchBlock = useSwitchBlockWidth(!!handle);
  const switchInset = switchBlock.width ?? SWITCH_PILL_INSET;

  // Nothing to draw at all. Render nothing rather than an empty scroller, so the row costs no
  // height.
  if (general.length === 0 && harnessItems.length === 0) return null;

  return (
    <div
      data-slot="composer-actions"
      // THE BELT ITSELF, and the ground and the rules go HERE rather than on the scroller inside it:
      // this is the element carrying the `-mx-3` that cancels the dock's `px-3`, so a fill or a rule
      // drawn here runs edge to edge. NO TOP MARGIN AND NO TOP RULE — the composer's chrome block
      // already closes itself against the mirror with its own `border-t border-rule`, so a rule
      // here would paint a second hairline with a strip of empty chrome between them. `mb-1` below
      // stands — that one separates the belt from the input, which has no rule of its own.
      //
      // `relative` so the pinned span below can be laid over this element's own right end.
      //
      // THIS ELEMENT IS THE DRAG SURFACE. `handle.ref` attaches here and not to the pill, so an
      // upward drag anywhere on the band brings the switcher up. With it comes `touch-pan-x`: the
      // browser keeps the sideways pan that scrolls the pills and hands vertical movement to the
      // hook, which arbitrates per gesture.
      ref={handle?.ref}
      className={cn(
        "relative -mx-3 mb-1 flex items-center border-b border-border bg-foreground/6",
        handle && "touch-pan-x",
      )}
    >
      {/* OverflowEdges measures this scroller and fades only the end that still hides something.
          `cue="none"`: the belt's own tint plus the fade already say the row scrolls. `edges="left"`
          with a handle: the Switch block paints its OWN constant 64px fade at the right end, so a
          right mask from THIS primitive would stack a second, scroll-dependent fade on top of it
          and the fade would visibly shrink at the scroll end. A caller with no handle passes no
          `edges` at all — the default is unchanged.
          `pl-3` stays fixed (paired with the `-mx-3` above, the route's own gutter); the scroller
          carries no `paddingRight` — see the trailing spacer for why the room the Switch block
          needs is bought with a real flex child rather than padding.
          `py-0` OVERRIDES `STRIP_SCROLLER`'s OWN `py-1.5` ON THIS SCROLLER ALONE: the belt stands
          at the pill's own height, 32px, rather than the 44px `STRIP_TAP_TARGET` answers for.
          `overflow-y-hidden` is the fix for a bug `py-0` alone would reopen: the `::before` still
          reaches its full hit box, and a 32px scroller has only its own height to absorb that
          reach into — `overflow-x: auto` forces `overflow-y: auto` too, which turns that overflow
          into a real vertical scrollbar under a thumb. This belt alone forces the other axis
          shut. */}
      <OverflowEdges edges={handle ? "left" : "both"} cue="none">
        {(scrollerRef) => (
          <div
            ref={scrollerRef}
            className={cn(STRIP_SCROLLER, "bg-primary/10 pl-3 py-0 overflow-y-hidden", !handle && "pr-3")}
          >
            {general.length > 0 && (
              // The word "Controls" is `sr-only` and load-bearing: in the accessibility tree it is
              // the only thing that names this group at all. Delete it and a reader enters an
              // unnamed run of buttons. The harness section names itself, separately, for the same
              // reason.
              <div
                data-slot="composer-controls"
                role="group"
                aria-labelledby="composer-controls-label"
                // NO BOX OF ITS OWN. Collie's controls stand directly on the belt's ground: no
                // outline, no ground, no padding — a group in the accessibility tree and a flex run
                // in the paint. The harness section is the only thing on this belt that is drawn.
                className="flex shrink-0 items-center gap-1.5"
              >
                <SectionLabel id="composer-controls-label" className="sr-only">
                  Controls
                </SectionLabel>
                {general.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={action.disabled}
                    aria-label={action.label}
                    aria-expanded={action.expanded}
                    aria-pressed={action.pressed}
                    onClick={action.onSelect}
                    className={cn(`${STRIP_ROW_PILL} gap-1.5 text-xs`, action.on === true ? ON : OFF)}
                  >
                    <action.icon className="size-4 shrink-0" />
                    {action.word ?? action.label}
                  </Button>
                ))}
              </div>
            )}
            <HarnessBar agent={agent} mine={mine} onRun={onRun} disabled={disabled} />
            {/* THE TRAILING SPACER — a real flex child, not padding. `paddingRight` on this
                scroller measures wrong in Chrome when the overflowing pill sits two levels down
                (inside the harness section's nested flex); a real child always counts toward
                `scrollWidth`, at any nesting depth. `aria-hidden` because it draws nothing and
                answers nothing; the width tracks `useSwitchBlockWidth` exactly. */}
            {handle && <span aria-hidden className="h-full shrink-0" style={{ width: switchInset }} />}
          </div>
        )}
      </OverflowEdges>
      {/* THE SWITCH PILL, PINNED AT THE BELT'S RIGHT END. It is a SIBLING of the OverflowEdges
          wrapper, and that is load-bearing: a mask applies to its element's whole subtree, so a
          pill inside the wrapper would fade out with the scrolling pills exactly where the belt
          overflows — which is always, once a pill is pinned. `z-10` puts it over the scroller, so a
          pill that pans under the fade cannot take the tap.
          THE FADE IS TWO STACKED LAYERS UNDER ONE MASK, and it has to be two: the scroller it fades
          into carries its own brand tint (`bg-primary/10`), so a single `bg-chrome` patch would
          read as a hole punched in a tinted band. The second layer is the Switch cell's OWN ground,
          `bg-chrome` — the composer's own chrome ground, the same fill the reply row sits on below
          — so the cell reads as ONE surface with the composer rather than as a patch cut into the
          belt. The mask fades both layers in over the first 64px, which is what lets a scrolling
          pill disappear UNDER this one instead of stopping dead against it.
          THIS OUTER SPAN IS `pointer-events-none`, AND NOT JUST THE FADE LAYERS INSIDE IT. A plain
          `<span>` sized by flex still hit-tests over its whole box, padding included — so the 64px
          lead-in, drawn only as a fade, would silently eat taps meant for whatever scrolled
          underneath it. Pointer events are switched back on one element in, on the actual cell
          (hairline + button below), so the Switch pill answers a tap only from ITS OWN drawn cell
          outward — its reach stops at the hairline, the cell's own left edge. */}
      {handle && (
        <span
          ref={switchBlock.ref}
          className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3 pl-16"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-chrome [mask-image:linear-gradient(to_right,transparent,black_4rem)]"
          >
            <span className="absolute inset-0 bg-chrome" />
          </span>
          {/* THE MARK ALONE, BEHIND A HAIRLINE. No word, no border, no ground: what says "the
              scroller ends here" is the hairline on its left — the belt's own rule colour, never a
              heavy edge. The mark keeps the primary colour, which is the whole of what sets this
              control apart from the pills it stands beside.
              THE BOX IS UNCHANGED, and that is the point of keeping `STRIP_ROW_PILL`: 32px drawn,
              46px answered through its `::before`, exactly like every other pill here.
              IT DRAWS NOTHING AND ANNOUNCES "Switch pane", so the accessible name is now the only
              name it has — WCAG 2.5.3 has nothing to reconcile once there is no visible word. */}
          <span className="pointer-events-auto flex items-center self-stretch">
            <span aria-hidden className="mr-2 h-5 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={handle.label}
              aria-haspopup="dialog"
              onClick={handle.onClick}
              // No padding and no border: what is left of the pill is `STRIP_ROW_PILL`'s own box,
              // narrowed on this one pill alone. `w-8 min-w-8` drops `min-w-11`'s 44px floor — the
              // floor every OTHER pill on this belt still stands on — down to 32px: the Switch mark
              // is a single centred icon with no label, so it alone can go narrower than a pill
              // with a word to hold. Both classes are needed — `min-w-11` would otherwise still win
              // against a bare `w-8`.
              className={cn(`${STRIP_ROW_PILL} relative w-8 min-w-8 border-0 px-0 has-[>svg]:px-0`)}
            >
              <Layers className="size-4 shrink-0 text-primary" />
            </Button>
          </span>
        </span>
      )}
    </div>
  );
}
