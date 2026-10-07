import { describe, expect, test } from "bun:test";

import { manifestLineToRegExp, manifestMatchers, uncovered } from "./check-strip.ts";

describe("manifestLineToRegExp", () => {
  test("an exact path matches itself and nothing else", () => {
    const re = manifestLineToRegExp("CREW_PROTOCOL.md");
    expect(re.test("CREW_PROTOCOL.md")).toBe(true);
    expect(re.test("CREW_PROTOCOL.md.bak")).toBe(false);
  });

  test("a trailing slash is a directory prefix", () => {
    const re = manifestLineToRegExp("bridge/crew/");
    expect(re.test("bridge/crew/lead.ts")).toBe(true);
    expect(re.test("bridge/crew/nested/deep/registry.ts")).toBe(true);
    expect(re.test("bridge/crews.ts")).toBe(false);
  });

  test("a glob star matches within one segment only", () => {
    const re = manifestLineToRegExp(".adr/0011-*.md");
    expect(re.test(".adr/0011-the-pack-protocol-is-the-mux-driver-seam.md")).toBe(true);
    expect(re.test(".adr/0011-x/y.md")).toBe(false);
  });

  test("glob dots are literal", () => {
    const re = manifestLineToRegExp("docs/commands.md");
    expect(re.test("docs/commandsXmd")).toBe(false);
  });
});

describe("manifestMatchers", () => {
  test("comments and blanks are dropped, so prose can live in the file", () => {
    const matchers = manifestMatchers("# why we strip\n\ncli/\n  bridge/stt/  \n");
    expect(matchers).toHaveLength(2);
  });

  test("inline annotations are stripped — a reason may ride the same line as its pattern", () => {
    const matchers = manifestMatchers("cli/   # the CLI surface (ADR 9004)\nCREW_PROTOCOL.md");
    expect(matchers).toHaveLength(2);
    expect(matchers[0]!.test("cli/program.ts")).toBe(true);
  });
});

describe("uncovered — the casualty finder", () => {
  const matchers = manifestMatchers("cli/\nweb/src/lib/stt.ts\n.adr/0029-*.md\n");

  test("covered absences pass", () => {
    expect(uncovered(["cli/program.ts", "web/src/lib/stt.ts", ".adr/0029-voice-input.md"], matchers)).toEqual([]);
  });

  test("an upstream rename onto a Pup delete is exactly what it names", () => {
    // 1.13.x renamed components/update-screen.tsx → routes/updates.tsx; without the manifest
    // line, that absence is silent. Here routes/updates.tsx has no line:
    const casualties = uncovered(["web/src/routes/updates.tsx"], matchers);
    expect(casualties).toEqual(["web/src/routes/updates.tsx"]);
  });

  test("a near-miss prefix is a casualty, not a pass", () => {
    expect(uncovered(["cli2/program.ts"], matchers)).toEqual(["cli2/program.ts"]);
  });
});
