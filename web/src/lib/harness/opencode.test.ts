import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseAnsi } from "../ansi";
import { splitLines } from "../blocks";
import { opencodeAdapter } from "./opencode";
import { describeAdapterConformance } from "./conformance";

const PANES_DIR = join(import.meta.dirname, "..", "..", "fixtures", "panes");

const allOpencodeFixtures = readdirSync(PANES_DIR)
  .filter((f) => f.startsWith("opencode--") && f.endsWith(".txt"))
  .sort();
const allClaudeFixtures = readdirSync(PANES_DIR)
  .filter((f) => f.startsWith("claude--") && f.endsWith(".txt"))
  .sort();
const allCodexFixtures = readdirSync(PANES_DIR)
  .filter((f) => f.startsWith("codex--") && f.endsWith(".txt"))
  .sort();
const allGrokFixtures = readdirSync(PANES_DIR)
  .filter((f) => f.startsWith("grok--") && f.endsWith(".txt"))
  .sort();
const allOmpFixtures = readdirSync(PANES_DIR)
  .filter((f) => f.startsWith("omp--") && f.endsWith(".txt"))
  .sort();

// Tier-1: no interactive block kind, so ownFixtures is empty and every opencode capture is neutral.
const ownFixtures: string[] = [];
const neutralFixtures = [...allOpencodeFixtures];

describeAdapterConformance(opencodeAdapter, {
  ownFixtures,
  foreignFixtures: [...allClaudeFixtures, ...allCodexFixtures, ...allGrokFixtures, ...allOmpFixtures],
  neutralFixtures,
});

// Corpus pin: a newly-captured fixture must be filed explicitly.
describe("the opencode corpus", () => {
  const PINNED = [
    "opencode--done.txt",
    "opencode--draft-single.txt",
    "opencode--draft-wrapped.txt",
    "opencode--fresh-idle.txt",
    "opencode--working.txt",
  ];
  it("is exactly the captures this adapter was developed against", () => {
    expect(allOpencodeFixtures).toEqual(PINNED);
  });
  it("declines all — nothing is up-levelled (Tier-1)", () => {
    expect(neutralFixtures).toEqual(PINNED);
    expect(ownFixtures).toEqual([]);
  });
});

describe("opencodeBuildBlocks emits nothing but raw", () => {
  it.each(allOpencodeFixtures)("%s builds only raw blocks", (name) => {
    const blocks = opencodeAdapter.buildBlocks(fixtureLines(name));
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.map((b) => b.kind)).toEqual(blocks.map(() => "raw"));
  });

  it("exposes only read-only surfaces", () => {
    expect(Object.keys(opencodeAdapter).sort()).toEqual(
      [
        "agent",
        "buildBlocks",
        "composerPrompt",
        "composerReady",
        "extractInputDraft",
        "extractStatusLines",
      ].sort(),
    );
  });
});

describe("composerReady — the gate the reply path pre-flights on", () => {
  it.each(allOpencodeFixtures)("%s: the composer is on screen ⇒ true", (name) => {
    expect(opencodeAdapter.composerReady!(fixtureLines(name))).toBe(true);
  });
});

function fixtureLines(name: string) {
  return splitLines(parseAnsi(readFileSync(join(PANES_DIR, name), "utf8")));
}
