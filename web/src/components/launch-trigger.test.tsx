import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http, HttpResponse } from "msw";

import { LaunchTrigger } from "./launch-trigger";
import { __resetOperatorCommands, loadOperatorCommands } from "@/lib/operator-config";
import { server } from "@/test/setup";
import type { Launcher } from "@/lib/types";

const ROWS: Launcher[] = [{ command: "rumen-peek", label: "Runs & quota", cwd: "/home/op" }];

function renderTrigger(readOnly = false) {
  const router = createMemoryRouter([
    { path: "/", Component: () => <LaunchTrigger readOnly={readOnly} /> },
  ]);
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  __resetOperatorCommands();
  server.use(http.get("/api/config", () => HttpResponse.json({ launchers: ROWS })));
});

describe("LaunchTrigger", () => {
  it("renders nothing when no launchers are declared", async () => {
    server.use(http.get("/api/config", () => HttpResponse.json({})));
    const { container } = renderTrigger();
    // Let the (empty) config read settle — still nothing to press.
    await loadOperatorCommands();
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the sheet with the rows, and a tap fires the launch", async () => {
    let launched: string | null = null;
    server.use(
      http.post("/api/launch", async ({ request }) => {
        const body = (await request.json()) as { command: string };
        launched = body.command;
        return HttpResponse.json({ ok: false, error: "nope" });
      }),
    );
    const user = userEvent.setup();
    renderTrigger();
    await user.click(await screen.findByRole("button", { name: "Launch" }));
    await user.click(await screen.findByText("Runs & quota"));
    expect(launched).toBe("rumen-peek");
  });

  it("explains read-only instead of offering the rows", async () => {
    const user = userEvent.setup();
    renderTrigger(true);
    await user.click(await screen.findByRole("button", { name: "Launch" }));
    expect(await screen.findByText(/Read-only/)).toBeInTheDocument();
    expect(screen.queryByText("Runs & quota")).toBeNull();
  });
});
