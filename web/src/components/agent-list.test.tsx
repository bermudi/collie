import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AgentList } from "./agent-list";
import type { AgentStatus, AgentView } from "@/lib/types";

function agent(
  paneId: string,
  status: AgentStatus,
  over: Partial<AgentView> = {},
): AgentView {
  return {
    paneId,
    workspaceId: "w0",
    workspaceLabel: "proj",
    workspaceNumber: 1,
    tabId: "w0:t1",
    agent: "claude",
    status,
    cwd: "/home/k/proj",
    focused: false,
    // The pane's title names it, so the one name rule's third rung answers with the paneId and
    // rows are distinguishable in assertions the way real panes are on screen.
    terminalTitle: paneId,
    ...over,
  };
}

/** Section headings, in the order they render. Queried by role, because "needs you" is also the
 *  blocked STATUS_LABEL on every row's badge — matching on text alone catches both. */
const headings = () =>
  screen.getAllByRole("heading").map((el) => el.textContent?.toLowerCase() ?? "");

/** The dashboard's rows in the order they render, as their name-line text. */
const rowNames = () =>
  screen
    .getAllByRole("button")
    .map((el) => el.querySelector('[data-slot="agent-row-title"]')?.textContent ?? "")
    .filter((t) => t.length > 0);

describe("AgentList — the two questions, in order", () => {
  const herd = [
    agent("blocked", "blocked", { lastActiveAt: 500, lastSeenAt: 1 }),
    agent("unseen", "done", { lastActiveAt: 400, lastSeenAt: 1 }),
    agent("busy", "working", { lastActiveAt: 300, lastSeenAt: 1 }),
    agent("old", "idle", { lastActiveAt: 1, lastSeenAt: 200 }),
  ];

  it("renders what needs you first, then everything else under its workspace", () => {
    render(<AgentList agents={herd} onOpen={vi.fn()} />);
    expect(headings()).toEqual([
      expect.stringContaining("needs you"),
      expect.stringContaining("ready · unseen"),
      // One group per workspace — not Working/Recent. The fixture herd is all in "proj".
      expect.stringContaining("proj"),
    ]);
    // Urgent rows first, then the workspace group's rows, in the bridge's order.
    expect(rowNames()).toEqual(["blocked", "unseen", "busy", "old"]);
  });

  it("leads every row with the pane's NAME, with the place beneath (upstream 6e8eeafc)", () => {
    render(
      <AgentList
        agents={[agent("p1", "idle", { paneLabel: "release notes", tabLabel: "checks" })]}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("release notes")).toBeTruthy();
    // Line 2: the place, space › tab — never the name again, never the cwd.
    expect(screen.getByText("proj")).toBeTruthy();
    expect(screen.getByText("checks")).toBeTruthy();
  });

  it("reads a numbered tab as 'tab N' on the row's second line, in the lighter ink", () => {
    render(<AgentList agents={[agent("p1", "idle", { tabLabel: "2" })]} onOpen={vi.fn()} />);
    expect(screen.getByText("tab 2")).toBeTruthy();
  });

  it("lists an urgent pane ONCE — pulled out of its workspace group, not copied (upstream 64b6f499)", () => {
    render(
      <AgentList
        agents={[
          agent("urgent", "blocked", { workspaceId: "w0", workspaceNumber: 1 }),
          agent("calm", "idle", { workspaceId: "w0", workspaceNumber: 1 }),
        ]}
        onOpen={vi.fn()}
      />,
    );
    expect(rowNames()).toEqual(["urgent", "calm"]);
    // The group's count says what is LISTED under the heading — one pane, not two.
    expect(screen.getByText("1 pane")).toBeTruthy();
  });

  it("groups by workspace in the multiplexer's own numbering, rows keeping the bridge order", () => {
    render(
      <AgentList
        agents={[
          agent("second-a", "idle", { workspaceId: "w2", workspaceLabel: "beta", workspaceNumber: 2 }),
          agent("first", "idle", { workspaceId: "w1", workspaceLabel: "alpha", workspaceNumber: 1 }),
          agent("second-b", "idle", { workspaceId: "w2", workspaceLabel: "beta", workspaceNumber: 2 }),
        ]}
        onOpen={vi.fn()}
      />,
    );
    expect(headings()).toEqual([expect.stringContaining("alpha"), expect.stringContaining("beta")]);
    expect(rowNames()).toEqual(["first", "second-a", "second-b"]);
  });

  it("a shell joins its tab's group after the agents, not a pen of its own", () => {
    render(
      <AgentList
        agents={[agent("agent", "idle")]}
        shellPanes={[agent("sh", "idle", { kind: "shell", agent: "shell" })]}
        onOpen={vi.fn()}
      />,
    );
    expect(rowNames()).toEqual(["agent", "sh"]);
    expect(headings()).toEqual([expect.stringContaining("proj")]);
  });

  it("marks a Ready · unseen row with the unread dot (upstream 10cd0557)", () => {
    render(<AgentList agents={[agent("unseen", "done", { lastActiveAt: 9, lastSeenAt: 1 })]} onOpen={vi.fn()} />);
    expect(screen.getByRole("img", { name: "unseen" })).toBeTruthy();
  });

  it("pulls an unread idle completion out of its workspace until it is seen (upstream #222)", () => {
    // Herdr 0.9's API reports a finished turn as `idle`, not `done` — the unread path takes both.
    const finished = agent("finished", "idle", { lastActiveAt: 200, lastSeenAt: 100 });
    const { rerender } = render(<AgentList agents={[finished]} onOpen={vi.fn()} />);
    expect(headings()).toEqual([expect.stringContaining("ready · unseen")]);
    expect(rowNames()).toEqual(["finished"]);
    expect(screen.getByRole("img", { name: "unseen" })).toBeTruthy();

    rerender(<AgentList agents={[{ ...finished, lastSeenAt: 300 }]} onOpen={vi.fn()} />);
    expect(headings()).toEqual([expect.stringContaining("proj")]);
    expect(rowNames()).toEqual(["finished"]);
    expect(screen.queryByRole("img", { name: "unseen" })).not.toBeTruthy();
  });

  it("says so when nothing needs you, rather than leaving an absence to interpret", () => {
    render(<AgentList agents={[agent("busy", "working")]} onOpen={vi.fn()} />);
    expect(screen.getByText(/nothing needs you/i)).toBeTruthy();
  });

  it("stays quiet about it when something DOES need you", () => {
    render(<AgentList agents={[agent("blocked", "blocked")]} onOpen={vi.fn()} />);
    expect(screen.queryByText(/nothing needs you/i)).toBeNull();
  });

  it("drops the status pill inside the sections — the heading and the dot already say it", () => {
    render(<AgentList agents={herd} onOpen={vi.fn()} />);
    // The status word survives for screen readers, as sr-only text on the row — not as a visible pill.
    expect(screen.getAllByText("needs you").some((el) => el.className.includes("sr-only"))).toBe(
      true,
    );
  });

  it("opens the pane behind a tapped row", async () => {
    const onOpen = vi.fn();
    render(<AgentList agents={[agent("p1", "idle", { paneLabel: "tap me" })]} onOpen={onOpen} />);
    await userEvent.click(screen.getByText("tap me"));
    expect(onOpen).toHaveBeenCalledWith("p1");
  });
});

describe("AgentList — placeholders", () => {
  it("shows the herd-empty placeholder, and suppresses it when asked", () => {
    const { rerender } = render(<AgentList agents={[]} bridge="connected" onOpen={vi.fn()} />);
    expect(screen.getByText("No agents running.")).toBeTruthy();
    rerender(<AgentList agents={[]} bridge="connected" onOpen={vi.fn()} emptyState={false} />);
    expect(screen.queryByText("No agents running.")).toBeNull();
  });

  it("says it's waiting when the bridge is down, rather than 'no agents'", () => {
    render(<AgentList agents={[]} bridge="disconnected" onOpen={vi.fn()} />);
    expect(screen.getByText("Waiting for Herdr…")).toBeTruthy();
  });

  it("never claims an empty herd on a stale render", () => {
    render(<AgentList agents={[]} error onOpen={vi.fn()} />);
    expect(screen.getByText("Disconnected")).toBeTruthy();
    expect(screen.queryByText("No agents running.")).toBeNull();
  });

  it("dates the disconnected placeholder when the cache can date it", () => {
    render(<AgentList agents={[]} error lastSeenAt={1_000} onOpen={vi.fn()} />);
    expect(screen.getByText(/last seen/)).toBeTruthy();
  });

  it("says only 'Disconnected' when it cannot date the data", () => {
    render(<AgentList agents={[]} error onOpen={vi.fn()} />);
    expect(screen.queryByText(/last seen/)).toBeNull();
  });
});
