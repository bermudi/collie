import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { NewSpaceSheet, type BranchOffSetup, type WorktreeRepo } from "./new-space-sheet";
import { createWorktree } from "@/lib/api";
import { BRANCH_OFF_LAUNCHER_KEY } from "@/lib/branch-off";
import { server } from "@/test/setup";
import { en } from "@/lib/i18n/messages/en";
import { clearStatus, useStatus } from "@/lib/status";
import type { Scope } from "@/lib/scope";
import type { Launcher } from "@/lib/types";

// The new-space sheet on a solo install. The one claim that matters: a solo install renders nothing
// but the sheet that always shipped — no host row, and `onCreate` receives no scope override, so the
// create keeps the ambient scope the list was showing.

function mount(props: { onCreate?: (opts: { label?: string; cwd?: string }, at?: Scope) => void; scope?: Scope } = {}) {
  return render(
    <NewSpaceSheet
      open
      onClose={() => {}}
      onCreate={props.onCreate ?? (() => {})}
      scope={props.scope}
    />,
  );
}

describe("NewSpaceSheet — solo", () => {
  it("renders no host row at all", () => {
    mount();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("still offers the create button", () => {
    mount();
    expect(screen.getByRole("button", { name: /create space/i })).toBeEnabled();
  });

  it("passes NO scope override, leaving the ambient one alone", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    mount({ onCreate, scope: { host: "bluefin" } });
    await user.click(screen.getByRole("button", { name: /create space/i }));
    expect(onCreate).toHaveBeenCalledWith({ label: undefined, cwd: undefined }, undefined);
  });
});

// ── Favourite and recent folders (#289, M40/02) ─────────────────────────────────────────────────
// The list is each machine's own, kept by its bridge (`GET /api/folders`, forwarded on `?host=`).
// What the sheet owes it: Favourites then Recent for the machine the picker chose, a tap that fills
// the field and creates nothing, a star that moves a folder between the two, home never drawn, and a
// machine that has no list (an older peer's 404) rendering exactly the sheet that shipped before.

/** The folder body one machine answers. */
function foldersOf(recent: string[], favourites: string[] = [], home = "/home/you") {
  return { recent, favourites, home };
}

/** Answer `GET /api/folders` per machine (`?host=`, absent = the lead), recording every read. */
function serveFolders(byHost: Record<string, ReturnType<typeof foldersOf> | 404>) {
  const reads: string[] = [];
  server.use(
    http.get("/api/folders", ({ request }) => {
      const host = new URL(request.url).searchParams.get("host") ?? "";
      reads.push(host);
      const answer = byHost[host];
      if (answer === undefined || answer === 404) {
        return HttpResponse.json({ error: "not found" }, { status: 404 });
      }
      return HttpResponse.json(answer);
    }),
  );
  return reads;
}

/** The status line, as the floating layer would draw it — to prove a quiet 404 says nothing. */
function StatusProbe() {
  const status = useStatus();
  return status === null ? null : <p data-probe="status">{status.text}</p>;
}

const list = (name: string) => screen.queryByRole("list", { name });
const dirField = () => screen.getByPlaceholderText(en["space.new.dir.placeholder"]);

describe("NewSpaceSheet — folders", () => {
  beforeEach(() => clearStatus());

  it("folders: nothing stored renders the sheet exactly as before", async () => {
    const reads = serveFolders({ "": foldersOf([]) });
    mount();
    await waitFor(() => expect(reads).toEqual([""]));
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText(en["space.new.folders.recent"])).toBeNull();
    expect(screen.queryByText(en["space.new.folders.favourites"])).toBeNull();
  });

  it("folders: lists Favourites, then Recent, each row a name over its shortened path", async () => {
    serveFolders({ "": foldersOf(["/home/you/src/web", "/srv/api"], ["/home/you/notes"]) });
    mount();
    const favourites = await screen.findByRole("list", { name: en["space.new.folders.favourites"] });
    const recent = list(en["space.new.folders.recent"])!;
    // Favourites comes first in the sheet.
    expect(favourites.compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(favourites).getAllByRole("listitem")).toHaveLength(1);
    const rows = within(recent).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("web~/src/web");
    expect(rows[1]).toHaveTextContent("api/srv/api");
    expect(within(recent).getByRole("button", { name: "Use ~/src/web" })).toBeInTheDocument();
  });

  it("folders: sits directly under the Directory field, above the label", async () => {
    serveFolders({ "": foldersOf(["/srv/api"]) });
    mount();
    const recent = await screen.findByRole("list", { name: en["space.new.folders.recent"] });
    const label = screen.getByPlaceholderText(en["space.new.label.placeholder"]);
    expect(dirField().compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(recent.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("folders: home is never drawn, even when the machine's file holds it", async () => {
    serveFolders({ "": foldersOf(["/home/you", "/srv/api"], ["/home/you/"]) });
    mount();
    const recent = await screen.findByRole("list", { name: en["space.new.folders.recent"] });
    expect(within(recent).getAllByRole("listitem")).toHaveLength(1);
    expect(list(en["space.new.folders.favourites"])).toBeNull();
    expect(screen.queryByRole("button", { name: "Use ~" })).toBeNull();
  });

  it("folders: a tap fills the field with the full path, moves to Create, and creates nothing", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    serveFolders({ "": foldersOf(["/home/you/src/web"]) });
    mount({ onCreate });
    await user.click(await screen.findByRole("button", { name: "Use ~/src/web" }));
    expect(dirField()).toHaveValue("/home/you/src/web");
    expect(screen.getByRole("button", { name: /create space/i })).toHaveFocus();
    expect(onCreate).not.toHaveBeenCalled();
    // The create that follows sends the filled folder, and nothing else changed about it.
    await user.click(screen.getByRole("button", { name: /create space/i }));
    expect(onCreate).toHaveBeenCalledWith({ label: undefined, cwd: "/home/you/src/web" }, undefined);
  });

  it("folders: a star moves a Recent folder to Favourites, and an unstar moves it back", async () => {
    const user = userEvent.setup();
    serveFolders({ "": foldersOf(["/srv/api", "/srv/web"]) });
    const sent: unknown[] = [];
    server.use(
      http.post("/api/folders/star", async ({ request }) => {
        // SAFETY: the only caller of this route is `lib/api.ts`'s `starFolder`, which posts exactly
        // `{ folder, starred }` (its `StarFolderBody`); the assertions below read both fields back.
        const body = (await request.json()) as { folder: string; starred: boolean };
        sent.push(body);
        return HttpResponse.json(
          body.starred ? foldersOf(["/srv/web"], ["/srv/api"]) : foldersOf(["/srv/api", "/srv/web"]),
        );
      }),
    );
    mount();
    const star = await screen.findByRole("button", { name: "Add /srv/api to favourites" });
    expect(star).toHaveAttribute("aria-pressed", "false");
    await user.click(star);
    expect(sent).toEqual([{ folder: "/srv/api", starred: true }]);
    const favourites = await screen.findByRole("list", { name: en["space.new.folders.favourites"] });
    const unstar = within(favourites).getByRole("button", { name: "Remove /srv/api from favourites" });
    expect(unstar).toHaveAttribute("aria-pressed", "true");
    expect(within(list(en["space.new.folders.recent"])!).getAllByRole("listitem")).toHaveLength(1);

    await user.click(unstar);
    expect(sent).toEqual([
      { folder: "/srv/api", starred: true },
      { folder: "/srv/api", starred: false },
    ]);
    await waitFor(() =>
      expect(within(list(en["space.new.folders.recent"])!).getAllByRole("listitem")).toHaveLength(2),
    );
  });

  it("folders: a refused star says why and re-reads the list", async () => {
    const user = userEvent.setup();
    const reads = serveFolders({ "": foldersOf(["/srv/api"]) });
    server.use(
      http.post("/api/folders/star", () =>
        HttpResponse.json(
          { error: "/srv/api is not in Recent, so it cannot be starred", code: "folders.unknown", detail: { folder: "/srv/api" } },
          { status: 409 },
        ),
      ),
    );
    render(
      <>
        <StatusProbe />
        <NewSpaceSheet open onClose={() => {}} onCreate={() => {}} />
      </>,
    );
    await user.click(await screen.findByRole("button", { name: "Add /srv/api to favourites" }));
    expect(await screen.findByText(en["apiError.folders.unknown"])).toBeInTheDocument();
    await waitFor(() => expect(reads).toEqual(["", ""]));
  });
});

// "New agent on a branch" (ADR 0089): the same sheet, opened from a pane's ⋯ menu. It opens on the
// worktree side with the pane's repo chosen, a fresh branch typed and an agent picker, and it holds
// ONE create per opening however often the button is tapped.
describe("NewSpaceSheet — New agent on a branch", () => {
  const CLAUDE: Launcher = { command: "claude", label: "Claude" };
  const CODEX: Launcher = { command: "codex --full-auto", label: "Codex" };
  const repos: WorktreeRepo[] = [
    { workspaceId: "w1", repoRoot: "/src/api", label: "api" },
    { workspaceId: "w2", repoRoot: "/src/web", label: "web" },
  ];
  type OnCreate = BranchOffSetup["onCreate"];

  beforeEach(() => localStorage.removeItem(BRANCH_OFF_LAUNCHER_KEY));

  function mountBranchOff(
    onCreate: OnCreate,
    opts: { launchers?: Launcher[]; onClose?: () => void } = {},
  ) {
    const props = (launchers: Launcher[], open = true) => (
      <NewSpaceSheet
        open={open}
        onClose={opts.onClose ?? (() => {})}
        onCreate={() => {}}
        repos={repos}
        branchOff={{ workspaceId: "w2", launchers, onCreate }}
      />
    );
    const view = render(props(opts.launchers ?? [CLAUDE, CODEX]));
    return { ...view, rerenderWith: (launchers: Launcher[], open = true) => view.rerender(props(launchers, open)) };
  }

  const branchField = () => screen.getByDisplayValue<HTMLInputElement>(/^worktree\//u);
  const picker = () => screen.getByRole("combobox", { name: "Agent" });
  const createButton = () => screen.getByRole("button", { name: /^(Create|Creating…)$/u });

  it("opens on the worktree side, on the pane's repo, with a fresh branch typed", () => {
    mountBranchOff(vi.fn(async () => true));
    expect(screen.getByRole("dialog", { name: "New agent on a branch" })).toBeInTheDocument();
    // No tab strip and no host row: a branch-off is a worktree, and the pane fixed the machine.
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Repository" })).toHaveValue("w2");
    expect(branchField().value).toMatch(/^worktree\/[a-z]+-[a-z]+-[0-9a-f]{4}$/u);
  });

  it("keeps the branch editable", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn<OnCreate>(async () => true);
    mountBranchOff(onCreate);
    await user.clear(branchField());
    await user.type(screen.getByPlaceholderText("feature/my-change"), "feature/login");
    await user.click(createButton());
    expect(onCreate).toHaveBeenCalledWith("w2", "feature/login", expect.anything());
  });

  it("offers a plain shell and every launcher row, and defaults to the shell", () => {
    mountBranchOff(vi.fn(async () => true));
    const options = within(picker()).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Shell", "Claude", "Codex"]);
    expect(picker()).toHaveValue("");
  });

  it("defaults to the agent used last time", () => {
    localStorage.setItem(BRANCH_OFF_LAUNCHER_KEY, "codex --full-auto");
    mountBranchOff(vi.fn(async () => true));
    expect(picker()).toHaveValue("codex --full-auto");
  });

  it("picks up the remembered agent when the rows land after the sheet opened", () => {
    localStorage.setItem(BRANCH_OFF_LAUNCHER_KEY, "claude");
    const { rerenderWith } = mountBranchOff(vi.fn(async () => true), { launchers: [] });
    expect(picker()).toHaveValue("");
    rerenderWith([CLAUDE, CODEX]);
    expect(picker()).toHaveValue("claude");
  });

  it("remembers the agent it was asked to start", async () => {
    const user = userEvent.setup();
    mountBranchOff(vi.fn(async () => true));
    await user.selectOptions(picker(), "claude");
    await user.click(createButton());
    expect(localStorage.getItem(BRANCH_OFF_LAUNCHER_KEY)).toBe("claude");
  });

  it("sends the branch, a request id and the launcher's command to the bridge", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      http.post("/api/workspace/:id/worktree", async ({ request, params }) => {
        bodies.push({ id: params.id, body: await request.json() });
        return HttpResponse.json({
          ok: true,
          alreadyOpen: false,
          launcherStarted: true,
          pane: { paneId: "w9:p1", workspaceId: "w9", workspaceLabel: "web-x", tabId: "w9:t1", cwd: "/src/web/x" },
        });
      }),
    );
    const onCreate: OnCreate = async (workspaceId, branch, extras) =>
      (await createWorktree(workspaceId, branch, undefined, extras)).ok;
    mountBranchOff(onCreate);
    const branch = branchField().value;
    await user.selectOptions(picker(), "claude");
    await user.click(createButton());
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      id: "w2",
      body: {
        branch,
        requestId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u),
        launcher: "claude",
      },
    });
  });

  it("sends no launcher for the shell", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn<OnCreate>(async () => true);
    mountBranchOff(onCreate);
    await user.click(createButton());
    expect(onCreate).toHaveBeenCalledWith("w2", expect.any(String), {
      requestId: expect.any(String),
      launcher: undefined,
    });
  });

  it("holds one create however often the button is tapped, and shows it is busy", async () => {
    const user = userEvent.setup();
    let finish: (moved: boolean) => void = () => {};
    const onCreate = vi.fn<OnCreate>(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const onClose = vi.fn();
    mountBranchOff(onCreate, { onClose });
    const button = createButton();
    await user.click(button);
    await user.click(button);
    fireEvent.click(button);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName("Creating…");
    // The sheet stays open while the create runs, and closes once the phone has moved.
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => finish(true));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a retry after a failed create carries the same request id; a new opening mints a new one", async () => {
    const user = userEvent.setup();
    const ids: string[] = [];
    const onCreate = vi.fn<OnCreate>(async (_w, _b, extras) => {
      ids.push(extras.requestId);
      return false;
    });
    const { rerenderWith } = mountBranchOff(onCreate);
    await user.click(createButton());
    await waitFor(() => expect(createButton()).toBeEnabled());
    await user.click(createButton());
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(ids[0]);

    rerenderWith([CLAUDE, CODEX], false);
    rerenderWith([CLAUDE, CODEX], true);
    await user.click(createButton());
    expect(ids).toHaveLength(3);
    expect(ids[2]).not.toBe(ids[0]);
  });
});
