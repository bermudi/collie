import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaneMeta } from "./pane-meta";
import { resetCacheClockForTests } from "@/lib/cache-clock";
import type { PaneCache } from "@/lib/types";

// A pane's cache reading, drawn once for the two screens that carry it: the dashboard row's name
// line (`agent-card.tsx`) and the pane header's workspace line (`agent-chat.tsx`). The claims worth
// a test are the ones the copy kept breaking: the row keeps its height when the chip self-hides, and
// the reading is a control only where the surface offers the rule behind it.

const reading = (over: Partial<PaneCache> = {}): PaneCache => ({
  state: "warm",
  expiresAt: Date.now() + 12 * 60_000,
  ttlSeconds: 3600,
  ruleId: "claude.subscription",
  confidence: "documented",
  lastRequestAt: Date.now() - 48 * 60_000,
  ...over,
});

const row = () => document.querySelector<HTMLElement>('[data-slot="pane-meta"]')!;

afterEach(() => {
  resetCacheClockForTests();
});

describe("the row's shape", () => {
  it("is ONE box of the line's own height, whatever the chip has to say", () => {
    // DESIGN.md §2. A reading that arrives on the next poll cannot grow the line the row sits at
    // the end of.
    const full = render(<PaneMeta cache={reading()} />);
    expect(row().className).toMatch(/(?:^|\s)h-3(?=\s|$)/);
    full.unmount();

    // No reading: the chip renders nothing at all and the box still stands.
    render(<PaneMeta cache={undefined} />);
    expect(row().className).toMatch(/(?:^|\s)h-3(?=\s|$)/);
    expect(document.querySelector('[data-slot="cache-chip"]')).toBeNull();
  });

  it("leaves the reading's word at the meta colour", () => {
    // The reading tints its GLYPH alone, so the only coloured thing on the row is the hourglass
    // (DESIGN.md's tint-on-glyph rule). A window the bridge calls expiring: the state's ink is the
    // app's red, the alarm, and it may reach the hourglass and nothing else.
    render(<PaneMeta cache={reading({ state: "expiring" })} />);
    const chip = document.querySelector<HTMLElement>('[data-slot="cache-chip"]')!;
    expect(chip.className).toMatch(/text-muted-foreground/);
    expect(chip.className).not.toMatch(/text-status-blocked/);
    expect(chip.className).not.toMatch(/text-host-/);
    expect(chip.querySelector("svg")?.getAttribute("class")).toMatch(/text-status-blocked/);
  });

  it("stands the reading on the hourglass's foot", () => {
    render(<PaneMeta cache={reading()} />);
    const chip = document.querySelector<HTMLElement>('[data-slot="cache-chip"]')!;
    expect(chip.className).toMatch(/(?:^|\s)items-baseline(?=\s|$)/);
    expect(chip.querySelector("svg")?.getAttribute("class")).toMatch(/text-status-done\/60/);
  });

  it("stands the WHOLE row on one baseline — the glyph's foot and the word", () => {
    // The 2026-09-14 fix aligned the cache chip's own glyph to its own number, and the row carries
    // it: every box on this row is baseline-aligned — the row and the separator span that carries
    // the dot — so the container synthesises one line for all of them.
    render(<PaneMeta cache={reading()} />);
    const baseline = /(?:^|\s)items-baseline(?=\s|$)/;
    expect(row().className).toMatch(baseline);
    expect(row().className).not.toMatch(/(?:^|\s)items-center(?=\s|$)/);
    const dotted = document.querySelector<HTMLElement>("span[class*=\"before:content-\"]")!;
    expect(dotted.className).toMatch(baseline);
    // The row still measures the header's own 12px box, so the line it ends cannot grow.
    expect(row().className).toMatch(/(?:^|\s)h-3(?=\s|$)/);
  });

  it("reaches a 44px tap box without drawing one, when the surface opens the rule", async () => {
    const user = userEvent.setup();
    const onOpenCache = vi.fn();
    render(<PaneMeta cache={reading()} onOpenCache={onOpenCache} />);
    const chip = document.querySelector<HTMLElement>('[data-slot="cache-chip"]')!;
    expect(chip.tagName).toBe("BUTTON");
    // 12px of line plus 16px above and below is 44px. Drawn, the box would be nearly four times the
    // line and would set the surrounding row's height on its own.
    expect(chip.className).toMatch(/before:-inset-y-4/);
    await user.click(chip);
    expect(onOpenCache).toHaveBeenCalledTimes(1);
  });
});

describe("the reading is a control on one screen only", () => {
  it("is a button, with a reachable 44px box, when the surface opens the rule behind it", async () => {
    const user = userEvent.setup();
    const onOpenCache = vi.fn();
    render(<PaneMeta cache={reading()} onOpenCache={onOpenCache} />);
    const chip = document.querySelector<HTMLElement>('[data-slot="cache-chip"]')!;
    expect(chip.tagName).toBe("BUTTON");
    await user.click(chip);
    expect(onOpenCache).toHaveBeenCalledTimes(1);
  });

  it("is a plain span with no callback — the dashboard card is already one button", () => {
    render(<PaneMeta cache={reading()} />);
    const chip = document.querySelector<HTMLElement>('[data-slot="cache-chip"]')!;
    expect(chip.tagName).toBe("SPAN");
  });
});
