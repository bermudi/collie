import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SpaceStrip } from "./space-strip";
import type { WorkspaceView } from "@/lib/types";

const ws: WorkspaceView = {
  workspaceId: "w1",
  number: 1,
  label: "anchorgenius",
  focused: false,
  activeTabId: "w1:t1",
  tabCount: 1,
  paneCount: 1,
};

describe("SpaceStrip", () => {
  it("leads with the 'All' chip when not drilled in (no onBack)", () => {
    render(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected={null}
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });

  it("shows a Back button (and no 'All' chip) in the drill-in, returning to the dashboard", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected="w1"
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
        onBack={onBack}
      />,
    );
    expect(screen.queryByRole("button", { name: "All" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("still lets you switch to a sibling space from the drill-in", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected="w2"
        onSelect={onSelect}
        onNewSpace={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "anchorgenius" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("w1");
  });
});

// Wiring pin for `useRevealActive`: with a stubbed layout, selecting a space whose chip sits
// scrolled out of the row carries it into view; a chip already on screen never triggers a scroll.
// (The hook's own geometry math is pinned in `use-reveal-active.test.tsx` — jsdom lays nothing out,
// so only these stubbed cases can prove the strip actually passes its scroller and selection.)
describe("SpaceStrip — reveal the active chip", () => {
  function stubRect(el: HTMLElement, rect: { left: number; right: number }): void {
    el.getBoundingClientRect = (): DOMRect => ({
      ...rect,
      top: 0,
      bottom: 0,
      width: rect.right - rect.left,
      height: 0,
      x: rect.left,
      y: 0,
      toJSON: () => ({}),
    });
  }

  it("scrolls the newly selected space's chip into view on a selection change", () => {
    const { container, rerender } = render(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected={null}
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
      />,
    );
    // SAFETY: SpaceStrip's root element IS the scroller (the strip's own overflow-x-auto row, with
    // the label and chips inside it), so a render never leaves this query unmatched.
    const scroller = container.querySelector<HTMLDivElement>(":scope > div")!;
    Object.defineProperty(scroller, "clientWidth", { value: 100, configurable: true });
    scroller.scrollLeft = 0;
    stubRect(scroller, { left: 0, right: 100 });
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;
    const newlyActive = screen.getByRole("button", { name: "anchorgenius" });
    stubRect(newlyActive, { left: 300, right: 420 }); // well past the scroller's right edge

    rerender(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected="w1"
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
      />,
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0]![0].left).toBeGreaterThan(0);
  });

  it("does not scroll when the newly selected space's chip is already on screen", () => {
    const { container, rerender } = render(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected={null}
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
      />,
    );
    // SAFETY: as above — SpaceStrip's root element IS the scroller.
    const scroller = container.querySelector<HTMLDivElement>(":scope > div")!;
    Object.defineProperty(scroller, "clientWidth", { value: 100, configurable: true });
    scroller.scrollLeft = 0;
    stubRect(scroller, { left: 0, right: 100 });
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;
    const newlyActive = screen.getByRole("button", { name: "anchorgenius" });
    stubRect(newlyActive, { left: 20, right: 80 }); // fully inside the 12px-margined visible range

    rerender(
      <SpaceStrip
        workspaces={[ws]}
        agents={[]}
        selected="w1"
        onSelect={vi.fn()}
        onNewSpace={vi.fn()}
      />,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
