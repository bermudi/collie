import { act, render, waitFor } from "@testing-library/react";

import { ViewportFrame } from "./viewport-frame";

class FakeVisualViewport extends EventTarget {
  height: number;
  offsetTop = 0;
  scale = 1;

  constructor(height: number) {
    super();
    this.height = height;
  }
}

describe("ViewportFrame", () => {
  const original = window.visualViewport;

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: original,
    });
  });

  it("repairs a stale dvh frame when Android reports the restored visual viewport", async () => {
    const viewport = new FakeVisualViewport(412.2);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });

    const { container } = render(
      <ViewportFrame>
        <div>herd</div>
      </ViewportFrame>,
    );
    const frame = container.querySelector<HTMLElement>("[data-viewport-frame]");
    expect(frame).toHaveStyle({ height: "412.2px" });

    act(() => {
      viewport.height = 780;
      viewport.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(frame).toHaveStyle({ height: "780px" }));
  });

  it("includes scale-1 viewport panning but leaves pinch zoom to the CSS fallback", async () => {
    const viewport = new FakeVisualViewport(700);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });

    const { container } = render(<ViewportFrame>herd</ViewportFrame>);
    const frame = container.querySelector<HTMLElement>("[data-viewport-frame]");

    act(() => {
      viewport.offsetTop = 40;
      viewport.dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(frame).toHaveStyle({ height: "740px" }));

    act(() => {
      viewport.scale = 2;
      viewport.height = 350;
      viewport.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(frame?.style.height).toBe(""));
    expect(frame).toHaveClass("h-[100dvh]");
  });

  it("drops a stale inline height when the browser reports an invalid sample", async () => {
    const viewport = new FakeVisualViewport(500);
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });

    const { container } = render(<ViewportFrame>herd</ViewportFrame>);
    const frame = container.querySelector<HTMLElement>("[data-viewport-frame]");
    expect(frame).toHaveStyle({ height: "500px" });

    act(() => {
      viewport.height = 0;
      viewport.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(frame?.style.height).toBe(""));
  });

  it("keeps the 100dvh fallback when VisualViewport is unavailable", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });

    const { container } = render(<ViewportFrame>herd</ViewportFrame>);
    const frame = container.querySelector<HTMLElement>("[data-viewport-frame]");
    expect(frame).toHaveClass("h-[100dvh]");
    expect(frame?.style.height).toBe("");
  });
});
