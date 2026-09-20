import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewSpaceSheet } from "./new-space-sheet";
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
