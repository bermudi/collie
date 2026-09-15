import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { commandsFor } from "@/lib/agent-commands";
import { barFor, BAR_AGENTS, CAPTURE_SOURCED } from "@/lib/harness-bar";
import type { OperatorCommand } from "@/lib/types";

// The bar's two invariants, as tests rather than as sentences in a spec. A phrase does not fail a
// build; these do. (upstream fc8d1be9 — Pup's labels are literals, and omp's Tree row ships
// commented out until this repo holds an omp--tree.txt capture.)

/** The repo root, so an `evidence` path can be checked exactly as it is written in the table. */
const REPO = join(import.meta.dirname, "..", "..", "..");

function op(row: Partial<OperatorCommand> & { command: string }): OperatorCommand {
  const out: OperatorCommand = {
    command: row.command,
    description: row.description ?? "Custom command",
    takesArg: row.takesArg ?? false,
    argHint: row.argHint ?? "",
    confirm: row.confirm ?? false,
    bar: row.bar ?? false,
  };
  if (row.agent !== undefined) out.agent = row.agent;
  if (row.barLabel !== undefined) out.barLabel = row.barLabel;
  return out;
}

describe("the shipped bar", () => {
  it("every bar command is a catalog command", () => {
    for (const agent of BAR_AGENTS) {
      const catalog = new Set(commandsFor(agent).map((c) => c.command));
      for (const item of barFor(agent)) {
        expect(catalog, `${agent} bar names ${item.command}`).toContain(item.command);
      }
    }
  });

  it("names a bar for exactly the four harnesses the redesign drove from a phone", () => {
    expect(BAR_AGENTS.toSorted()).toEqual(["claude", "codex", "omp", "pi"]);
  });

  it("gives Claude Model, Effort, Compact and Resume, in that order", () => {
    expect(barFor("claude").map((i) => i.id)).toEqual(["model", "effort", "compact", "resume"]);
  });

  it("gives Codex Model, Compact and Resume, and no Effort button", () => {
    // Codex's own /model picker sets the model AND the reasoning effort, so the one button reaches
    // both dials and there is nothing for a second one to do.
    expect(barFor("codex").map((i) => i.id)).toEqual(["model", "compact", "resume"]);
  });

  it("gives pi Tree and no Effort, because pi has no effort command", () => {
    expect(barFor("pi").map((i) => i.id)).toEqual(["model", "compact", "tree", "resume"]);
  });

  it("gives omp Model, Compact and Resume; Tree waits on a capture this repo holds", () => {
    // omp being a pi fork is not evidence that /tree works there — the row stays commented out in
    // lib/harness-bar.ts until `omp--tree.txt` exists in the corpus (upstream cc38c2de's rule).
    expect(barFor("omp").map((i) => i.id)).toEqual(["model", "compact", "resume"]);
  });

  it("renders nothing for an agent with no bar, and for no agent at all", () => {
    for (const agent of ["grok", "opencode", "agy", "antigravity", "bash", "", undefined, null]) {
      expect(barFor(agent), `${String(agent)} has no bar`).toEqual([]);
    }
  });

  it("reaches a bar through the catalog's own agent ladder", () => {
    expect(barFor("claude-code").map((i) => i.id)).toEqual(barFor("claude").map((i) => i.id));
    expect(barFor("  CLAUDE ").map((i) => i.id)).toEqual(barFor("claude").map((i) => i.id));
  });

  it("sends every command bare, so the harness's own picker is what offers the arguments", () => {
    // THE RULE THIS FILE EXISTS TO KEEP. A bar item carries no argument list: Collie would have to
    // track a list the harness owns and changes without telling us, and `/model` paints Claude's own
    // picker in the mirror anyway. One tap, no list of ours to go stale.
    for (const agent of BAR_AGENTS) {
      for (const item of barFor(agent)) {
        expect(item.command, `${agent}/${item.id}`).toMatch(/^\/\S+$/);
      }
    }
  });
});

describe("evidence", () => {
  it("names a capture that exists on disk", () => {
    for (const agent of BAR_AGENTS) {
      for (const item of barFor(agent)) {
        if (item.evidence === undefined) continue;
        expect(
          existsSync(join(REPO, item.evidence)),
          `${agent}/${item.id} cites a missing capture: ${item.evidence}`,
        ).toBe(true);
      }
    }
  });

  it("is carried by every row of a capture-sourced harness", () => {
    for (const agent of CAPTURE_SOURCED) {
      const bar = barFor(agent);
      expect(bar.length, `${agent} has a bar`).toBeGreaterThan(0);
      for (const item of bar) {
        expect(item.evidence, `${agent}/${item.id} needs a capture`).toBeDefined();
      }
    }
  });

  it("is claimed on the one doc-sourced row a live capture vouches for", () => {
    // Claude's catalog comes from a published page, so only its Model item cites a capture — the
    // menu capture that proves /model reaches Claude's model picker.
    const cited = barFor("claude").filter((i) => i.evidence !== undefined);
    expect(cited.map((i) => i.id)).toEqual(["model"]);
    expect(cited[0]?.evidence).toBe("web/src/fixtures/panes/claude--menu-model-picker.txt");
  });
});

describe("the operator's bar rows", () => {
  it("replace the shipped bar for the panes they address", () => {
    const mine = [op({ agent: "claude", command: "/statusline", bar: true, barLabel: "Status" })];
    expect(barFor("claude", mine)).toEqual([
      {
        id: "op:/statusline",
        label: "Status",
        command: "/statusline",
        confirm: false,
        operator: true,
      },
    ]);
  });

  it("leave the palette alone — a bar row never blanks the Agent palette (ADR 0018 per surface)", () => {
    const mine = [op({ agent: "claude", command: "/statusline", bar: true })];
    // commandsFor still answers the shipped catalog for the pane.
    expect(commandsFor("claude").some((c) => c.command === "/compact")).toBe(true);
    expect(barFor("claude", mine).some((i) => i.command === "/compact")).toBe(false);
  });

  it("inherit a shipped dangerous command's confirm as a floor", () => {
    // omp's /new is dangerous in the shipped catalog; an operator bar row naming it keeps the
    // two-tap confirm even with `confirm = false`.
    const mine = [op({ agent: "omp", command: "/new", bar: true, confirm: false })];
    expect(barFor("omp", mine)[0]?.confirm).toBe(true);
  });

  it("fall back to the shipped bar when no bar row addresses the pane", () => {
    const mine = [op({ agent: "claude", command: "/statusline" })]; // palette-only row
    expect(barFor("claude", mine).map((i) => i.id)).toEqual(
      barFor("claude").map((i) => i.id),
    );
  });

  it("default the label to the command's own word when bar_label is absent", () => {
    const mine = [op({ agent: "claude", command: "/statusline", bar: true })];
    expect(barFor("claude", mine)[0]?.label).toBe("statusline");
  });
});
