import { describe, expect, test } from "bun:test";

import { adapterFor, AGENT_ALIASES, buildJournalRegistry, journalAgents } from "./registry.ts";

// The registry is the SINGLE decision site for "which agents have a journal". These tests pin the
// two properties that keep it from rotting: keys come from the adapters themselves, and a hostile
// agent name can't resolve to something that isn't an adapter.

const roots = { claude: ["/c"], codex: ["/x"], pi: ["/p"], opencode: ["/o"], grok: ["/g"] };

describe("buildJournalRegistry", () => {
  test("serves the five verified harnesses", () => {
    expect(journalAgents(buildJournalRegistry(roots))).toEqual([
      "claude",
      "codex",
      "grok",
      "opencode",
      "pi",
    ]);
  });

  test("every key IS its adapter's own agent string — the map can't drift from the adapters", () => {
    const registry = buildJournalRegistry(roots);
    for (const [key, adapter] of Object.entries(registry)) expect(adapter.agent).toBe(key);
  });
});

describe("adapterFor", () => {
  const registry = buildJournalRegistry(roots);

  test.each(["claude", "codex", "pi", "opencode", "grok"])("resolves %s", (agent) => {
    expect(adapterFor(registry, agent)?.agent).toBe(agent);
  });

  test("an agent with no journal is undefined, not a throw", () => {
    expect(adapterFor(registry, "aider")).toBeUndefined();
    expect(adapterFor(registry, undefined)).toBeUndefined();
  });

  // The agent string comes from Herdr, but it ORIGINATES in an agent's own report — so an inherited
  // Object.prototype key must not resolve to a function masquerading as an adapter.
  test.each(["toString", "constructor", "__proto__", "hasOwnProperty"])(
    "%s does not resolve to a non-adapter",
    (key) => {
      expect(adapterFor(registry, key)).toBeUndefined();
    },
  );
});

// ── Aliases: a second NAME for one adapter, never a sixth adapter ────────────────────────────

describe("adapterFor — aliases", () => {
  const registry = buildJournalRegistry(roots);

  // An alias is a second NAME for one adapter, never a sixth adapter — derived from the map so a
  // new pair is covered the day it is added.
  test.each(Object.entries(AGENT_ALIASES))("resolves the %s alias to %s", (alias, canonical) => {
    expect(adapterFor(registry, alias)?.agent).toBe(canonical);
  });

  test("an alias is not itself an adapter key", () => {
    expect(journalAgents(buildJournalRegistry(roots))).not.toContain("omp");
  });
});

// ── The frontend's mirror of this list ───────────────────────────────────────────────────────
//
// Upstream also keeps a hand-mirrored agent list in `web/src/lib/journal-agents.ts` (its doctor
// hints need it); Pup never ported that list, and doesn't need to — Pup's bridge is the single
// decision site: `toPaneWire` consults this registry and strips the answer to a `hasSession`
// presence flag on the wire, so the browser cannot drift from the adapters because it never
// names them. An alias added here reaches the phone with the next snapshot, nothing to mirror.
