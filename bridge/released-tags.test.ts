// Tests for bridge/released-tags.ts — the own-channel "a tag is not a release" filter.

import { describe, expect, it } from "bun:test";
import type { JsonValue } from "./json.ts";
import {
  githubReleasesUrl,
  parseReleasesResponse,
  readAllReleasedTagNames,
  releasedTagsOnly,
} from "./released-tags.ts";
import { TAG_PAGE_SIZE, TAG_PAGES_MAX, type ApiTag, type TagPage } from "./update.ts";

const okPage = (value: JsonValue): TagPage<never> => ({ ok: true, value });

function pages(map: Record<number, JsonValue>): (url: string) => Promise<TagPage<never>> {
  return async (url) => {
    const page = Number(/[?&]page=(\d+)/.exec(url)?.[1] ?? "1");
    return okPage(map[page] ?? []);
  };
}

const releases = (names: string[]): JsonValue => names.map((tag_name) => ({ tag_name }));

describe("githubReleasesUrl", () => {
  it("pages like /tags, on GitHub or a mirror", () => {
    expect(githubReleasesUrl("o/r")).toBe(`https://api.github.com/repos/o/r/releases?per_page=${TAG_PAGE_SIZE}`);
    expect(githubReleasesUrl("o/r", null, 3)).toContain("&page=3");
    expect(githubReleasesUrl("o/r", "http://127.0.0.1:9")).toContain("http://127.0.0.1:9/repos/o/r/releases");
  });
});

describe("parseReleasesResponse", () => {
  it("keeps tag_name, drops drafts and junk", () => {
    const doc: JsonValue = [
      { tag_name: "v0.56.1", draft: false },
      { tag_name: "v0.57.0-beta.1", prerelease: true },
      { tag_name: "v0.58.0", draft: true },
      { tag_name: 7 },
      "not an object",
      { no_name: true },
    ];
    expect(parseReleasesResponse(doc)).toEqual(["v0.56.1", "v0.57.0-beta.1"]);
  });
  it("answers [] for a non-array document", () => {
    expect(parseReleasesResponse({ not: "a list" })).toEqual([]);
    expect(parseReleasesResponse(null)).toEqual([]);
  });
});

describe("readAllReleasedTagNames", () => {
  it("collects every page until a short one", async () => {
    const full = Array.from({ length: TAG_PAGE_SIZE }, (_, i) => `v0.${i}.0`);
    const seen: string[] = [];
    const fetch = async (url: string) => {
      seen.push(url);
      return pages({ 1: releases(full), 2: releases(["v1.0.0"]) })(url);
    };
    const all = await readAllReleasedTagNames("o/r", null, fetch);
    expect(all.ok).toBe(true);
    if (all.ok) {
      expect(all.names.size).toBe(TAG_PAGE_SIZE + 1);
      expect(all.names.has("v1.0.0")).toBe(true);
    }
    expect(seen.length).toBe(2);
  });
  it("stops after one short page and bounds a never-ending mirror", async () => {
    const one = await readAllReleasedTagNames("o/r", null, pages({ 1: releases(["v0.1.0"]) }));
    expect(one.ok && one.names.has("v0.1.0")).toBe(true);
    const full = releases(Array.from({ length: TAG_PAGE_SIZE }, (_, i) => `v0.${i}.0`));
    let calls = 0;
    await readAllReleasedTagNames("o/r", "http://127.0.0.1:9", async () => (calls++, okPage(full)));
    expect(calls).toBe(TAG_PAGES_MAX);
  });
  it("fails the whole read on the first failed page", async () => {
    const all = await readAllReleasedTagNames("o/r", null, async () => ({
      ok: false as const,
      failure: { status: 500, message: "boom" },
    }));
    expect(all.ok).toBe(false);
  });
});

describe("releasedTagsOnly", () => {
  const tags: ApiTag[] = [
    { name: "v0.56.1", sha: "a" },
    { name: "v1.21.2", sha: "b" },
  ];
  it("drops tags the repo never released", async () => {
    const out = await releasedTagsOnly(async () => tags, async () => new Set(["v0.56.1"]))();
    expect(out.map((t) => t.name)).toEqual(["v0.56.1"]);
  });
  it("passes tags through unfiltered when fetchReleased is null", async () => {
    const out = await releasedTagsOnly(async () => tags, null)();
    expect(out.map((t) => t.name)).toEqual(["v0.56.1", "v1.21.2"]);
  });
  it("fails the composed read when the released set cannot be fetched", async () => {
    await expect(
      releasedTagsOnly(async () => tags, async () => {
        throw new Error("releases down");
      })(),
    ).rejects.toThrow("releases down");
  });
});
