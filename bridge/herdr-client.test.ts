import { describe, expect, test } from "bun:test";

import { keysForHerdr } from "./herdr-client.ts";

describe("keysForHerdr", () => {
  test("spells Shift+Tab as the terminal BackTab sequence", () => {
    expect(keysForHerdr(["shift+Tab"])).toEqual(["Escape", "[", "Z"]);
    expect(keysForHerdr(["SHIFT+TAB"])).toEqual(["Escape", "[", "Z"]);
  });

  test("preserves every other key and the order of a composed queue", () => {
    const keys = ["a", "Tab", "ctrl+Tab", "shift+Enter", "shift+Tab", "Enter"];

    expect(keysForHerdr(keys)).toEqual([
      "a",
      "Tab",
      "ctrl+Tab",
      "shift+Enter",
      "Escape",
      "[",
      "Z",
      "Enter",
    ]);
    expect(keys).toEqual(["a", "Tab", "ctrl+Tab", "shift+Enter", "shift+Tab", "Enter"]);
  });
});
