import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionsRow, type GeneralAction } from "./actions-row";
import { __resetHarnessBar, setHarnessBarEnabled } from "@/lib/harness-bar-pref";
import { Keyboard } from "lucide-react";

// The belt: Collie's controls and the harness's commands on one scrolling band, with the pane
// Switch mark pinned at the right end (upstream fc8d1be9 / 9b530786 / 931f857a, Pup-shaped).

const general: readonly GeneralAction[] = [
  { id: "keys", icon: Keyboard, label: "Keys", onSelect: vi.fn() },
];

function row(over: Partial<Parameters<typeof ActionsRow>[0]> = {}) {
  return (
    <ActionsRow
      general={general}
      agent="claude"
      onRun={vi.fn().mockResolvedValue(true)}
      handle={{ ref: vi.fn(), onClick: vi.fn(), label: "Switch pane" }}
      {...over}
    />
  );
}

describe("ActionsRow — the belt", () => {
  it("stands the belt's scroller at py-1 (40px), with no vertical scroll under a thumb", () => {
    // The belt-shade deck's "Option 6" first dropped STRIP_SCROLLER's own `py-1.5` to `py-0`, the
    // pill's own 32px; the phone read that as too thin, so it stands at `py-1` — 40px — and
    // `overflow-y-hidden` stays paired with it so STRIP_TAP_TARGET's 46px `::before` reach, still
    // wider than the 4px of padding a side, cannot force a vertical scrollbar under a thumb.
    setHarnessBarEnabled(true);
    render(row());
    const scroller = document.querySelector<HTMLElement>(".overflow-x-auto")!;
    expect(scroller.className).toMatch(/(?:^|\s)py-1(?=\s|$)/);
    expect(scroller.className).toMatch(/(?:^|\s)overflow-y-hidden(?=\s|$)/);
  });

  it("renders Collie's controls and the harness's commands on one row", () => {
    setHarnessBarEnabled(true);
    render(row());
    expect(screen.getByRole("button", { name: "Keys" })).toBeInTheDocument();
    // The harness section: the running agent's own commands, in the tinted section.
    expect(screen.getByRole("button", { name: "Model" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Effort" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Harness commands" })).toBeInTheDocument();
  });

  it("hides the harness section for an agent with no bar", () => {
    setHarnessBarEnabled(true);
    render(row({ agent: "grok" }));
    expect(screen.queryByRole("group", { name: "Harness commands" })).toBeNull();
    expect(screen.getByRole("button", { name: "Keys" })).toBeInTheDocument();
  });

  it("hides the harness section when the per-device switch is off", () => {
    setHarnessBarEnabled(false);
    render(row());
    expect(screen.queryByRole("group", { name: "Harness commands" })).toBeNull();
  });

  it("pins the Switch mark at the belt's end — bare icon, named for readers, tap opens the sheet", async () => {
    const onClick = vi.fn();
    render(row({ handle: { ref: vi.fn(), onClick, label: "Switch pane" } }));
    const mark = screen.getByRole("button", { name: "Switch pane" });
    // It draws an icon only — no visible word.
    expect(mark.textContent).toBe("");
    await userEvent.click(mark);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders no Switch mark and no drag surface when no handle is passed", () => {
    render(<ActionsRow general={general} agent="claude" onRun={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Switch pane" })).toBeNull();
  });

  it("sends the harness command bare, on one tap", async () => {
    setHarnessBarEnabled(true);
    const onRun = vi.fn().mockResolvedValue(true);
    render(row({ onRun }));
    await userEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(onRun).toHaveBeenCalledWith("/compact");
  });
});

describe("ActionsRow — nothing to draw", () => {
  it("renders nothing when there are no general actions and no harness items", () => {
    setHarnessBarEnabled(false);
    const { container } = render(<ActionsRow general={[]} agent="claude" onRun={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
