import { render, screen } from "@testing-library/react";

import { ListGroup } from "./list-group";

describe("ListGroup", () => {
  it("renders its rows as one bordered region with internal hairlines, not a gap list", () => {
    render(
      <ListGroup>
        <div>row a</div>
        <div>row b</div>
      </ListGroup>,
    );
    const group = screen.getByText("row a").parentElement!;
    // The frame the component exists to draw: region edges get --rule, the inside subdivides by --border.
    expect(group).toHaveClass("border", "divide-y");
    expect(group.dataset.slot).toBe("list-group");
  });

  it("renders as a div by default and can be a list or definition list", () => {
    const { container: asDiv } = render(<ListGroup>rows</ListGroup>);
    expect(asDiv.querySelector("div[data-slot='list-group']")).toBeTruthy();

    const { container: asList } = render(
      // eslint-disable-next-line jsx-a11y/aria-props -- not an aria prop; a semantic element swap
      <ListGroup as="ul">rows</ListGroup>,
    );
    expect(asList.querySelector("ul[data-slot='list-group']")).toBeTruthy();
  });

  it("lets a caller extend the frame without replacing it", () => {
    render(<ListGroup className="mx-2">rows</ListGroup>);
    const group = screen.getByText("rows");
    expect(group).toHaveClass("mx-2");
    // The caller's class must not crowd out the defaults — cn merges, it doesn't pick.
    expect(group).toHaveClass("border", "flex", "flex-col");
  });
});
