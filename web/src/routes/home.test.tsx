import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { ROOT_ROUTE_ID, type HomeData } from "@/lib/loaders";
import {
  fixtureAgents,
  fixtureCrewAgents,
  fixtureCrewSessions,
  fixtureCrewShellPanes,
  fixtureCrewTabs,
  fixtureCrewWorkspaces,
  fixtureServers,
  fixtureSessions,
  fixtureShellPanes,
  fixtureTabs,
  fixtureWorkspaces,
} from "@/test/handlers";
import type { SnapshotResponse } from "@/lib/types";
import { withHeaderHost } from "@/test/header-host";
import { HomeRoute } from "./home";

// The dashboard, one machine and several. The point of the pair is that the FIRST one is unchanged:
// a solo install renders no switcher, no chips and no extra affordance, and the multi-host case is
// the same screen with labels — never a per-host split, never a second list.

vi.mock("@/hooks/use-loading-stalled", () => ({ useLoadingStalled: () => false }));

const homeData = (snap: Partial<SnapshotResponse>, scope: HomeData["scope"] = {}): HomeData => ({
  bridge: "connected",
  device: undefined,
  agents: snap.agents ?? [],
  shellPanes: snap.shellPanes ?? [],
  workspaces: snap.workspaces ?? fixtureWorkspaces,
  tabs: snap.tabs ?? fixtureTabs,
  sessions: snap.sessions ?? [],
  servers: snap.servers ?? [],
  ts: snap.ts ?? 0,
  scope,
  viewAll: false,
  snoozedUntil: null,
  update: undefined,
  error: false,
  authError: false,
});

function renderHome(data: HomeData, initialPath?: string) {
  const router = createMemoryRouter(
    [
      {
        id: ROOT_ROUTE_ID,
        path: "/",
        loader: () => data,
        element: withHeaderHost(<HomeRoute />),
      },
      { path: "/pane/:paneId", element: <div data-testid="pane" /> },
    ],
    { initialEntries: [initialPath ?? (data.scope.host ? `/?h=${data.scope.host}` : "/")] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

/** Wait for the herd list to be on screen. The Spaces filter strip (components/agent-list.tsx) is
 *  the one landmark every render with at least one pane produces — there is no "Needs you" heading
 *  to wait on any more, since a pane no longer moves to a section of its own. */
const settled = () => screen.findByRole("navigation", { name: /spaces/i });

/** The `<section>` a workspace heading owns, scoped away from the Spaces strip's own chips, which
 *  now carry the same workspace name a heading does (agent-list.tsx). */
const groupSection = (label: string) => screen.getByRole("heading", { name: label }).closest("section")!;

const url = (router: ReturnType<typeof renderHome>) =>
  router.state.location.pathname + router.state.location.search;

const solo = () =>
  homeData({
    agents: fixtureAgents,
    shellPanes: fixtureShellPanes,
    sessions: fixtureSessions,
  });

describe("the dashboard on ONE machine is untouched", () => {
  it("renders no host switcher and no host chip anywhere", async () => {
    renderHome(solo());
    await settled();
    expect(screen.queryByRole("button", { name: /switch host/i })).not.toBeInTheDocument();
    expect(screen.queryAllByLabelText(/host:/i)).toHaveLength(0);
  });

  it("opens a pane at today's bare URL — no `?h=` is ever produced", async () => {
    const router = renderHome(solo());
    await settled();
    // The row's own text is just its name and its tab now — "webapp" only names the workspace
    // heading (and its Spaces chip), so the row is found through its group instead.
    const [row] = within(groupSection("webapp")).getAllByRole("button");
    await userEvent.click(row!);
    await waitFor(() => expect(url(router)).toBe("/pane/w1%3Ap1"));
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// The space navigator, addressed at a peer (#209). The loader's `ambientSpaces` narrows
// `workspaces`/`tabs` to the host `?h=` names before HomeRoute ever sees them — this fixture mirrors
// that narrowing by hand — so the row on screen is the addressed host's own "moonward", and the
// navigator must key it by that SAME host, not the lead's, to find its blocked agent.
// ─────────────────────────────────────────────────────────────────────────────

describe("the space navigator on a crew, addressed at a peer (#209)", () => {
  it("gives the peer's own space its recency and blocked dot on ?h=<peer>", async () => {
    const peerWorkspace = fixtureCrewWorkspaces.find((w) => w.host === "workshop")!;
    const peerTabs = fixtureCrewTabs.filter((t) => t.host === "workshop");
    renderHome(
      homeData(
        {
          agents: fixtureCrewAgents,
          shellPanes: fixtureCrewShellPanes,
          workspaces: [peerWorkspace],
          tabs: peerTabs,
          sessions: fixtureCrewSessions,
          servers: fixtureServers,
        },
        { host: "workshop" },
      ),
    );
    await settled();
    const spacesBody = document.getElementById("spaces-body");
    if (!spacesBody) throw new Error("the Spaces section did not render");
    const spaceRow = within(spacesBody).getByRole("button", { name: /moonward/i });
    // Keyed on the LEAD instead, this row's status lookup misses entirely and shows no dot at all —
    // the bug this test pins.
    expect(within(spaceRow).getByText(/needs you/i)).toBeInTheDocument();
  });
});

// ── THE WIDENED DASHBOARD ────────────────────────────────────────────────────
//
// One list across every Herdr session on this machine. The hazard it brings is the crew's hazard one
// dimension down: `w1:p1` is a different terminal in every session, and here BOTH of them are on
// screen at once, in the same section, under the same name.
describe("the dashboard across sessions", () => {
  const sessions = [
    { name: "default", isPrimary: true, reachable: true, agents: 1, working: 0, blocked: 1 },
    { name: "work", isPrimary: false, reachable: true, agents: 1, working: 0, blocked: 1 },
  ];
  const blocked = fixtureAgents[0]!; // w1:p1, blocked, in the "webapp" space
  const widened = () =>
    homeData({
      agents: [
        { ...blocked, session: "default" },
        { ...blocked, session: "work" },
      ],
      sessions,
    });
  /** The colliding rows. Two sessions, each numbering its own workspaces from 1, means TWO "webapp"
   *  groups now — one per (host, session, workspaceId) — rather than one shared section, so this
   *  gathers the rows out of both. Scoped away from the space navigator below, which also names
   *  `webapp`, because this test is about how many TERMINALS are listed, not how many spaces. */
  const rows = () => {
    const sections = screen.getAllByRole("heading", { name: "webapp" }).map((h) => h.closest("section")!);
    return sections.flatMap((s) => within(s).getAllByRole("button"));
  };

  it("renders BOTH colliding rows, not one recycled row", async () => {
    // A React key of `paneId` alone silently collapses these two — or worse, recycles one element
    // for the other between polls, so the card you are looking at acquires the other row's onClick.
    renderHome(widened(), "/?all=1");
    await settled();
    expect(rows().length).toBe(2);
  });

  it("opens each row in its OWN session", async () => {
    // THE GUARD, end to end. Both rows say `w1:p1`; the one from `work` must carry `?s=work`, and
    // the primary one must carry no session param at all — today's bare url.
    const router = renderHome(widened(), "/?all=1");
    await settled();
    await userEvent.click(rows()[1]!);
    expect(url(router)).toBe("/pane/w1%3Ap1?s=work");
  });

  it("opens the primary row at today's bare url", async () => {
    const router = renderHome(widened(), "/?all=1");
    await settled();
    await userEvent.click(rows()[0]!);
    expect(url(router)).toBe("/pane/w1%3Ap1");
  });

  it("keeps the space navigator on the ambient session", async () => {
    // The lists widen; the tree does not. Workspace ids collide across sessions too, and the tree
    // keys by `(host, workspaceId)` with no session in it — so an unfiltered widened body would
    // paint the `work` session's panes onto the ambient space of the same number and count them
    // twice. One row per workspace, never one per (workspace × session).
    renderHome(widened(), "/?all=1");
    await settled();
    expect(screen.getAllByLabelText(/1 pane/i).length).toBe(1);
  });
});
