import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";

import { StatusDetailSheet } from "./status-detail-sheet";

// The connection banner's red row truncates, so this sheet is the one place the whole message can
// be read — and copied out for a report or a search.
describe("StatusDetailSheet", () => {
  it("renders closed as nothing, open as a dialog with the whole message", () => {
    const { rerender } = render(
      <StatusDetailSheet open={false} onClose={() => {}} title="Connection error" message="the whole message" />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <StatusDetailSheet open onClose={() => {}} title="Connection error" message="the whole message" />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("the whole message");
  });

  it("copies the full message and flips the button to confirmation", async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: (s: string) => (writes.push(s), Promise.resolve()) },
      configurable: true,
    });
    render(
      <StatusDetailSheet open onClose={() => {}} title="Connection error" message="copy me whole" />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(writes).toEqual(["copy me whole"]);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
