import { render, screen } from "@testing-library/react";

import { SectionLabel } from "./section-label";

describe("SectionLabel", () => {
  it("renders the label as a span the eye sees, so a wrapper can point aria-labelledby at it", () => {
    render(<SectionLabel id="spaces-label">Spaces</SectionLabel>);
    const label = screen.getByText("Spaces");
    expect(label.id).toBe("spaces-label");
    expect(label.tagName).toBe("SPAN");
  });

  it("sits beside the row by default — the treatment every existing call site expects", () => {
    render(<SectionLabel>Controls</SectionLabel>);
    // inline owns its weight; above must NOT (a whole-line label doesn't need it).
    expect(screen.getByText("Controls")).toHaveClass("font-semibold");
    expect(screen.getByText("Controls")).not.toHaveClass("mb-1");
  });

  it("goes above the row on request: smaller, unbolded, no leading slack", () => {
    // leading-none is the deliberate divergence: at text-[10px] the inherited 1.5 leading drew a
    // 15px line box for 10px of type — +53px across the three strips, all above the fold on a phone.
    render(<SectionLabel placement="above">Panes</SectionLabel>);
    expect(screen.getByText("Panes")).toHaveClass("leading-none", "mb-1", "block");
    expect(screen.getByText("Panes")).not.toHaveClass("font-semibold");
  });
});
