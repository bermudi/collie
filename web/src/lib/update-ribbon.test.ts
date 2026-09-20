import { describe, expect, test } from "vitest";

import { ribbonView } from "./update-ribbon";

// The reading's precedence, at the level where it is decided. The row these views become is pinned
// in `components/update-ribbon.test.tsx`; this file is the decision itself.
describe("the band's reading — which fact wins the row", () => {
  test("nothing to say is silent", () => {
    expect(ribbonView({ bundleStale: false, bundleInstalling: false })).toEqual({
      kind: "silent",
    });
  });

  test("a stale bundle is the reload row", () => {
    expect(ribbonView({ bundleStale: true, bundleInstalling: false })).toEqual({
      kind: "bundle",
    });
  });

  test("THE DOWNLOAD OUTRANKS THE OFFER IT IS THE ANSWER TO (2026-09-12)", () => {
    expect(ribbonView({ bundleStale: true, bundleInstalling: true })).toEqual({
      kind: "bundle-installing",
    });
  });

  test("an installing stage with nothing stale says nothing — the stage belongs to a stale bundle", () => {
    expect(ribbonView({ bundleStale: false, bundleInstalling: true })).toEqual({
      kind: "silent",
    });
  });
});
