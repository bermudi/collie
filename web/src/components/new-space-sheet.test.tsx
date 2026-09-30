import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { NewSpaceSheet } from "./new-space-sheet";
import { server } from "@/test/setup";
import { en } from "@/lib/i18n/messages/en";
import { clearStatus, useStatus } from "@/lib/status";
import type { Scope } from "@/lib/scope";

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

