import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { LaunchStrip } from "./launch-strip";
import { __resetOperatorCommands, loadOperatorCommands } from "@/lib/operator-config";
import { server } from "@/test/setup";
import { http, HttpResponse } from "msw";
import type { Launcher } from "@/lib/types";

const ROWS: Launcher[] = [
  { command: "rumen-peek", label: "Runs & quota", cwd: "/home/op" },
  { command: "tail -f /var/log/quota.log", label: "Quota log", cwd: "/var/log" },
];

function configWith(rows: Launcher[]) {
  server.use(
    http.get("/api/config", () =>
      HttpResponse.json({ launchers: rows, launchersHome: "/home/op" }),
    ),
  );
}

beforeEach(() => {
  __resetOperatorCommands();
});

// The strip fires launches through useSpaceActions, which needs a DATA router
// (useRevalidator + useNavigate reject a plain MemoryRouter).
function renderStrip(open: boolean | null, onOpenChange: (open: boolean) => void = () => {}) {
  const router = createMemoryRouter([
    { path: "/", Component: () => <LaunchStrip open={open} onOpenChange={onOpenChange} /> },
  ]);
  return render(<RouterProvider router={router} />);
}

describe("LaunchStrip", () => {
  it("renders nothing when no launchers are declared", async () => {
    configWith([]);
    const { container } = renderStrip(null);
    await loadOperatorCommands();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows one button per row, label plus command", async () => {
    configWith(ROWS);
    renderStrip(null);
    expect(await screen.findByText("Runs & quota")).toBeInTheDocument();
    expect(screen.getByText("rumen-peek")).toBeInTheDocument();
    expect(screen.getByText("Quota log")).toBeInTheDocument();
  });

  it("shortens a non-home cwd against the host's home, and hides the home suffix", async () => {
    configWith(ROWS);
    renderStrip(null);
    // /var/log is not under /home/op — shown whole. /home/op IS home — no suffix shown.
    expect(await screen.findByText("/var/log")).toBeInTheDocument();
    expect(screen.queryByText("~")).toBeNull();
  });

  it("collapses past the count threshold until chosen", async () => {
    const many: Launcher[] = Array.from({ length: 9 }, (_, i) => ({
      command: `cmd-${i}`,
      label: `Cmd ${i}`,
      cwd: "/home/op",
    }));
    configWith(many);
    const onOpenChange = vi.fn();
    renderStrip(null, onOpenChange);
    expect(await screen.findByText("Launch")).toBeInTheDocument();
    // Collapsed: the header with its count, but no row buttons.
    expect(screen.queryByText("Cmd 0")).toBeNull();
  });

  it("fires the launch on tap", async () => {
    configWith(ROWS);
    let launched: string | null = null;
    server.use(
      http.post("/api/launch", async ({ request }) => {
        const body = (await request.json()) as { command: string };
        launched = body.command;
        return HttpResponse.json({ ok: false, error: "nope" });
      }),
    );
    const user = userEvent.setup();
    renderStrip(true);
    await user.click(await screen.findByText("Runs & quota"));
    expect(launched).toBe("rumen-peek");
  });
});
