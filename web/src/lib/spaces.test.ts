import {
  filterSpaces,
  groupPanesByTab,
  nestWorktrees,
  spaceLastSeenMap,
  spaceTriageMap,
} from "./spaces";
import { worstTriage } from "./triage";
import type { AgentStatus, AgentView, TabView, WorkspaceView } from "./types";

function agent(
  partial: Partial<AgentView> & { paneId: string; workspaceId: string; tabId: string },
): AgentView {
  return {
    workspaceLabel: "ws",
    workspaceNumber: 1,
    agent: "claude",
    status: "idle",
    cwd: "/home/you/demo",
    focused: false,
    ...partial,
  };
}

const tab = (tabId: string, workspaceId: string, number: number): TabView => ({
  tabId,
  workspaceId,
  number,
  label: String(number),
  focused: false,
  paneCount: 1,
});

describe("groupPanesByTab", () => {
  const tabs = [tab("w1:t2", "w1", 2), tab("w1:t1", "w1", 1)]; // differs from stable number order

  it("preserves snapshot tab order when grouping panes", () => {
    const a1 = agent({ paneId: "w1:p1", workspaceId: "w1", tabId: "w1:t1" });
    const a2 = agent({ paneId: "w1:p2", workspaceId: "w1", tabId: "w1:t2" });
    const groups = groupPanesByTab("w1", tabs, [a1, a2], []);
    expect(groups.map((g) => g.tabId)).toEqual(["w1:t2", "w1:t1"]);
    expect(groups[0]!.panes).toEqual([a2]);
    expect(groups[1]!.panes).toEqual([a1]);
  });

  it("includes shell panes alongside agents in their tab", () => {
    const a1 = agent({ paneId: "w1:p1", workspaceId: "w1", tabId: "w1:t1" });
    const shell = agent({ paneId: "w1:p2", workspaceId: "w1", tabId: "w1:t1", kind: "shell" });
    const group = groupPanesByTab("w1", tabs, [a1], [shell]).find((item) => item.tabId === "w1:t1");
    expect(group!.panes).toEqual([a1, shell]);
  });

  it("collects panes whose tab isn't listed yet into a trailing '…' group", () => {
    const orphan = agent({ paneId: "w1:p9", workspaceId: "w1", tabId: "w1:tX" });
    const groups = groupPanesByTab("w1", tabs, [orphan], []);
    const last = groups.at(-1)!;
    expect(last.tabId).toBe("w1:other");
    expect(last.label).toBe("…");
    expect(last.panes).toEqual([orphan]);
  });

  it("ignores panes from other workspaces", () => {
    const other = agent({ paneId: "w2:p1", workspaceId: "w2", tabId: "w2:t1" });
    const groups = groupPanesByTab("w1", tabs, [other], []);
    expect(groups.every((g) => g.panes.length === 0)).toBe(true);
  });
});

describe("spaceTriageMap — one classifier for rows and chips", () => {
  const mk = (id: string, ws: string, status: AgentStatus, extra: Partial<AgentView> = {}) =>
    agent({ paneId: id, workspaceId: ws, tabId: `${ws}:t1`, status, ...extra });

  it("keeps the most urgent bucket per workspace and omits spaces with no agent", () => {
    const m = spaceTriageMap([
      mk("w1:p1", "w1", "idle"),
      mk("w1:p2", "w1", "blocked"),
      mk("w2:p1", "w2", "working"),
    ]);
    expect(m.get("w1")).toBe("needs");
    expect(m.get("w2")).toBe("working");
    // Not the same as idle: an empty space has nothing to report.
    expect(m.get("w3")).toBeUndefined();
  });

  it("ranks an unseen-done agent ABOVE a working one — the disagreement this replaced", () => {
    // STATUS_RANK put working (1) ahead of done (4), so the old space row said "working" while the
    // space chip, which already routed through bucketOf, said "ready". Same input, one answer now.
    const m = spaceTriageMap([
      mk("w1:p1", "w1", "working"),
      mk("w1:p2", "w1", "done", { lastActiveAt: 2000, lastSeenAt: 1000 }),
    ]);
    expect(m.get("w1")).toBe("ready");
  });

  it("agrees with worstTriage, which is the point of sharing bucketOf", () => {
    const agents = [
      mk("w1:p1", "w1", "done", { lastActiveAt: 2000, lastSeenAt: 1000 }),
      mk("w1:p2", "w1", "working"),
      mk("w1:p3", "w1", "idle"),
    ];
    expect(spaceTriageMap(agents).get("w1")).toBe(worstTriage(agents));
  });

  it("a done agent you have already seen is not 'ready'", () => {
    const m = spaceTriageMap([mk("w1:p1", "w1", "done", { lastActiveAt: 1000, lastSeenAt: 2000 })]);
    expect(m.get("w1")).toBe("recent");
  });
});

const ws = (workspaceId: string, label: string, number: number): WorkspaceView => ({
  workspaceId,
  number,
  label,
  focused: false,
  activeTabId: `${workspaceId}:t1`,
  tabCount: 1,
  paneCount: 1,
});

describe("nestWorktrees — the spaces list keeps its order and nests worktrees (upstream 6e8eeafc)", () => {
  const wsp = (over: Partial<WorkspaceView> & { workspaceId: string }): WorkspaceView => ({
    number: 1,
    label: over.workspaceId,
    focused: false,
    activeTabId: "",
    tabCount: 1,
    paneCount: 1,
    ...over,
  });

  it("nests a worktree under the space holding its repo, keeping the incoming order", () => {
    const rows = nestWorktrees([
      wsp({ workspaceId: "main", repoRoot: "/repo", isWorktree: false }),
      wsp({ workspaceId: "wt1", repoRoot: "/repo", isWorktree: true }),
      wsp({ workspaceId: "other" }),
    ]);
    expect(rows.map((r) => [r.space.workspaceId, r.depth])).toEqual([
      ["main", 0],
      ["wt1", 1],
      ["other", 0],
    ]);
  });

  it("a group takes the position of its first member — a worktree sent first drags its parent up", () => {
    const rows = nestWorktrees([
      wsp({ workspaceId: "unrelated" }),
      wsp({ workspaceId: "wt1", repoRoot: "/repo", isWorktree: true }),
      wsp({ workspaceId: "main", repoRoot: "/repo", isWorktree: false }),
    ]);
    // The group lands at wt1's own position (index 1), parent first — no row is moved past a row
    // it was sent ahead of.
    expect(rows.map((r) => r.space.workspaceId)).toEqual(["unrelated", "main", "wt1"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 0, 1]);
  });

  it("a worktree whose repo is not open stays at depth 0", () => {
    const rows = nestWorktrees([wsp({ workspaceId: "orphan", repoRoot: "/gone", isWorktree: true })]);
    expect(rows).toEqual([{ space: expect.objectContaining({ workspaceId: "orphan" }), depth: 0 }]);
  });

  it("does not mutate its input", () => {
    const spaces = [wsp({ workspaceId: "wt1", repoRoot: "/repo", isWorktree: true })];
    nestWorktrees(spaces);
    expect(spaces).toHaveLength(1);
  });
});

describe("filterSpaces", () => {
  const spaces = [ws("w1", "moonward_os", 1), ws("w2", "trader", 2), ws("w3", "MOON_probe", 3)];

  it("matches case-insensitively, anywhere in the label", () => {
    expect(filterSpaces(spaces, "moon").map((w) => w.workspaceId)).toEqual(["w1", "w3"]);
    expect(filterSpaces(spaces, "RAD").map((w) => w.workspaceId)).toEqual(["w2"]);
  });

  it("returns everything for an empty or whitespace query", () => {
    expect(filterSpaces(spaces, "")).toHaveLength(3);
    expect(filterSpaces(spaces, "   ")).toHaveLength(3);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterSpaces(spaces, "zzz")).toEqual([]);
  });
});

describe("spaceLastSeenMap", () => {
  it("agrees with spaceLastSeen for every space, in one pass", () => {
    const panes = [
      agent({ paneId: "w1:p1", workspaceId: "w1", tabId: "w1:t1", lastSeenAt: 100 }),
      agent({ paneId: "w1:p2", workspaceId: "w1", tabId: "w1:t1", lastSeenAt: 900 }),
      agent({ paneId: "w2:p1", workspaceId: "w2", tabId: "w2:t1", lastSeenAt: 400 }),
    ];
    const map = spaceLastSeenMap(panes);
    expect(map.get("w1")).toBe(900);
    expect(map.get("w2")).toBe(400);
  });

  it("omits spaces with no panes, which callers read as 0", () => {
    expect(spaceLastSeenMap([]).get("w1")).toBeUndefined();
  });

  it("agrees with a freshly built map, whichever way it is called", () => {
    const panes = [agent({ paneId: "w2:p1", workspaceId: "w2", tabId: "w2:t1", lastSeenAt: 900 })];
    expect(spaceLastSeenMap(panes).get("w2")).toBe(900);
    expect(spaceLastSeenMap([]).size).toBe(0);
  });
});
