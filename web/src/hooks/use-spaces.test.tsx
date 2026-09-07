import { render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";

import { server } from "@/test/setup";
import { useSpaceActions } from "./use-spaces";

// The hook needs a DATA router (useRevalidator + useNavigate reject a plain MemoryRouter). A route
// element calls the hook and stashes the latest return into the probe, so tests drive it the way
// renderHook would. (The root loader data is absent here — the guard reads readOnly off it, so
// these cases exercise the writable path.)
type Actions = ReturnType<typeof useSpaceActions>;
function renderActions(): { current: Actions } {
  const probe = { current: null as unknown as Actions };
  function HookProbe() {
    probe.current = useSpaceActions();
    return null;
  }
  const router = createMemoryRouter([{ path: "/", Component: HookProbe }]);
  render(<RouterProvider router={router} />);
  return probe;
}

describe("useSpaceActions — one create in flight at a time", () => {
  it("ignores a second tap on the same Space's '+' while the first create is in flight", async () => {
    let posts = 0;
    let release: (() => void) | undefined;
    server.use(
      http.post("/api/tab", async () => {
        posts += 1;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({
          ok: true,
          pane: {
            paneId: "w1:p9",
            workspaceId: "w1",
            workspaceLabel: "webapp",
            tabId: "w1:t9",
            cwd: "/home/you/webapp",
          },
        });
      }),
    );
    const result = renderActions();

    // Two taps before the first round trip resolves: the second must be refused, not queued.
    void result.current.newTab("w1");
    void result.current.newTab("w1");
    await waitFor(() => expect(posts).toBe(1));
    expect(result.current.creatingTab.has("w1")).toBe(true);

    release?.();
    await waitFor(() => expect(result.current.creatingTab.has("w1")).toBe(false));
    expect(posts).toBe(1); // never a second create
  });

  it("keeps a DIFFERENT Space's '+' live while this one is in flight", async () => {
    const posts: string[] = [];
    server.use(
      http.post("/api/tab", async ({ request }) => {
        const body = (await request.json()) as { workspaceId: string };
        posts.push(body.workspaceId);
        return HttpResponse.json({
          ok: true,
          pane: {
            paneId: `${body.workspaceId}:p9`,
            workspaceId: body.workspaceId,
            workspaceLabel: body.workspaceId,
            tabId: `${body.workspaceId}:t9`,
            cwd: "/home/you",
          },
        });
      }),
    );
    const result = renderActions();

    void result.current.newTab("w1");
    void result.current.newTab("w2");
    await waitFor(() => expect(posts).toEqual(["w1", "w2"]));
  });

  it("ignores a second Space create while the first is in flight, globally", async () => {
    let posts = 0;
    let release: (() => void) | undefined;
    server.use(
      http.post("/api/workspace", async () => {
        posts += 1;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({
          ok: true,
          pane: {
            paneId: "w9:p1",
            workspaceId: "w9",
            workspaceLabel: "new-space",
            tabId: "w9:t1",
            cwd: "/home/you",
          },
        });
      }),
    );
    const result = renderActions();

    void result.current.newSpace();
    void result.current.newSpace();
    await waitFor(() => expect(posts).toBe(1));
    expect(result.current.creatingSpace).toBe(true);

    release?.();
    await waitFor(() => expect(result.current.creatingSpace).toBe(false));
    expect(posts).toBe(1);
  });
});
