import { describe, expect, test } from "bun:test";

import { executeHerdrInput, planHerdrInput } from "./herdr-client.ts";

describe("planHerdrInput", () => {
  test("sends Shift+Tab as one raw terminal BackTab sequence", () => {
    expect(planHerdrInput(["shift+Tab"])).toEqual([{ kind: "text", text: "\x1b[Z" }]);
    expect(planHerdrInput(["SHIFT+TAB"])).toEqual([{ kind: "text", text: "\x1b[Z" }]);
  });

  test("coalesces adjacent operations while preserving a mixed queue's order", () => {
    const keys = ["a", "Tab", "ctrl+Tab", "shift+Enter", "shift+Tab", "Enter"];

    expect(planHerdrInput(keys)).toEqual([
      { kind: "keys", keys: ["a", "Tab", "ctrl+Tab", "shift+Enter"] },
      { kind: "text", text: "\x1b[Z" },
      { kind: "keys", keys: ["Enter"] },
    ]);
    expect(keys).toEqual(["a", "Tab", "ctrl+Tab", "shift+Enter", "shift+Tab", "Enter"]);
  });

  test("coalesces consecutive Shift+Tabs into one raw write", () => {
    expect(planHerdrInput(["shift+Tab", "SHIFT+TAB"])).toEqual([
      { kind: "text", text: "\x1b[Z\x1b[Z" },
    ]);
  });
});

describe("executeHerdrInput", () => {
  test("stops after a partial failure and marks the queue unsafe to retry", async () => {
    const plan = planHerdrInput(["Down", "shift+Tab", "Enter"]);
    const sent: typeof plan = [];

    const result = executeHerdrInput(plan, (input) => {
      sent.push(input);
      return input.kind === "text"
        ? Promise.reject(new Error("socket closed"))
        : Promise.resolve();
    });

    await expect(result).rejects.toMatchObject({
      name: "PartialKeySendError",
      keysDelivered: true,
      message: "key sequence partially delivered — check the pane before retrying (socket closed)",
    });
    expect(sent).toEqual(plan.slice(0, 2));
  });

  test("preserves an ordinary first-operation failure as safe to retry", async () => {
    const error = new Error("not connected");
    const result = executeHerdrInput(planHerdrInput(["Enter"]), () => Promise.reject(error));

    await expect(result).rejects.toBe(error);
  });
});
