import { describe, expect, test } from "vitest";

import { shortenHome } from "./shorten-home";

describe("shortenHome", () => {
  test("exact home becomes ~", () => {
    expect(shortenHome("/home/op", "/home/op")).toBe("~");
  });

  test("a descendant shortens to ~/…", () => {
    expect(shortenHome("/home/op/build/collie", "/home/op")).toBe("~/build/collie");
  });

  test("a different tree is returned unchanged", () => {
    expect(shortenHome("/var/lib/data", "/home/op")).toBe("/var/lib/data");
  });

  test("a shared string prefix without the directory boundary is unchanged", () => {
    // /home/opera is NOT under /home/op — a false "under home" is a worse reading than none.
    expect(shortenHome("/home/opera", "/home/op")).toBe("/home/opera");
  });

  test("empty home (no read yet, or an older bridge) leaves paths whole", () => {
    expect(shortenHome("/home/op/build", "")).toBe("/home/op/build");
  });

  test("a trailing slash on home never doubles one", () => {
    expect(shortenHome("/home/op/build", "/home/op/")).toBe("~/build");
  });
});
