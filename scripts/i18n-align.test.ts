import { describe, expect, test } from "bun:test";

import { dropKeys, entryOf, keysOf } from "./i18n-align.ts";

describe("keysOf", () => {
  test("reads the two-space dictionary shape", () => {
    const src = `const x = {\n  "a.b": "one",\n  "c": 2,\n};\n`;
    expect(keysOf(src)).toEqual(["a.b", "c"]);
  });
});

describe("dropKeys", () => {
  test("single-line entries vanish, their neighbours stay", () => {
    const src = `{\n  "keep": "yes",\n  "drop": "no",\n  "also.keep": "yes",\n}`;
    expect(dropKeys(src, ["drop"])).toBe(`{\n  "keep": "yes",\n  "also.keep": "yes",\n}`);
  });

  test("an array-valued entry drops with its block", () => {
    const src = `{\n  "before": "x",\n  "crew.list": [\n    "one",\n    "two",\n  ],\n  "after": "y",\n}`;
    expect(dropKeys(src, ["crew.list"])).toBe(`{\n  "before": "x",\n  "after": "y",\n}`);
  });

  test("a multi-line template entry drops to its closing line", () => {
    const src = `{\n  "before": "x",\n  "long.one": \`line\nmore\`,\n  "after": "y",\n}`;
    expect(dropKeys(src, ["long.one"])).toBe(`{\n  "before": "x",\n  "after": "y",\n}`);
  });
});

describe("entryOf", () => {
  test("returns the verbatim entry line", () => {
    const src = `{\n  "a.b": "value",\n}`;
    expect(entryOf(src, "a.b")).toBe(`  "a.b": "value",`);
    expect(entryOf(src, "nope")).toBeNull();
  });
});
