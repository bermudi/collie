import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NO_CURSOR } from "./cursor.ts";
import {
  createDevinReducer,
  DevinTranscriptSource,
  devinKey,
  isDevinSessionId,
  parseDevinTranscript,
  splitDevinKey,
} from "./devin.ts";

// Fixtures create a real sessions.db with the schema the adapter queries (the shapes probed off the
// real 9 GB store on 2026-10-08), so resolve/stat/load/readSince run real SQL — the only way to pin
// the branch walk and the containment check, which only mean anything against real paths. The
// database is opened read-write HERE (the fixture is devin writing its log); the adapter under test
// must only ever read it. Every message body is synthetic — the real store holds real transcripts,
// and none of it belongs in a fixture.

const SID = "morning-faucet";
const OTHER = "shimmering-field";

const createTables = (db: Database): void => {
  db.run(`create table sessions (id text primary key, working_directory text, backend_type text,
    model text, agent_mode text, created_at integer, last_activity_at integer, title text,
    main_chain_id integer, shell_last_seen_index integer, cogs_json text, workspace_dirs text,
    hidden integer, metadata text)`);
  db.run(`create table message_nodes (row_id integer primary key autoincrement,
    session_id text not null, node_id integer not null, parent_node_id integer, chat_message text not null,
    created_at integer not null, metadata text, unique(session_id, node_id))`);
  db.run("create index idx_message_nodes_session on message_nodes(session_id)");
};

/** One tool call as the fixtures spell it — devin's own array shape, minus what no read touches. */
interface ToolCallSpec {
  id: string;
  name: string;
  kind: string;
  index: number;
  arguments: Record<string, string>;
}

/** The two optional `chat_message` fields the fixtures vary. */
interface ChatExtras {
  tool_calls?: ToolCallSpec[];
  tool_call_id?: string;
}

/** One node's `chat_message`, in the shape devin 3000.11 writes. */
function message(role: string, content: string, extra: ChatExtras = {}): string {
  return JSON.stringify({
    message_id: `msg-${role}-${content.length}`,
    role,
    content,
    metadata: { created_at: "2026-10-08T00:00:00Z" },
    ...extra,
  });
}

interface NodeSpec {
  nodeId: number;
  parent: number | null;
  role: string;
  content: string;
  extra?: ChatExtras;
  ts: number;
}

/** Insert nodes for one session in order; returns nothing — the session row pins the branch tail. */
function insertNodes(db: Database, sessionId: string, nodes: readonly NodeSpec[]): void {
  for (const n of nodes) {
    db.run(
      "insert into message_nodes (session_id, node_id, parent_node_id, chat_message, created_at) values (?, ?, ?, ?, ?)",
      [sessionId, n.nodeId, n.parent, message(n.role, n.content, n.extra), n.ts],
    );
  }
}

/** A plain three-turn conversation with one tool call in the middle, no branching. */
function straightConversation(): readonly NodeSpec[] {
  return [
    { nodeId: 1, parent: null, role: "system", content: "", ts: 100 },
    { nodeId: 2, parent: 1, role: "user", content: "show history", ts: 101 },
    { nodeId: 3, parent: 2, role: "system", content: "", ts: 102 },
    {
      nodeId: 4,
      parent: 3,
      role: "assistant",
      content: "I will inspect it.",
      ts: 103,
      extra: {
        tool_calls: [
          { id: "call-1", name: "read", kind: "function", index: 0, arguments: { file_path: "/tmp/x" } },
        ],
      },
    },
    { nodeId: 5, parent: 4, role: "tool", content: "the log", ts: 104, extra: { tool_call_id: "call-1" } },
    { nodeId: 6, parent: 5, role: "assistant", content: "It is fixed.", ts: 105 },
  ];
}

// A temp dir holding a devin-shaped root: `<root>/sessions.db`.
async function fixtureRoot(): Promise<{ root: string; db: () => Database; clean: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "devin-journal-"));
  let opened: Database | null = null;
  return {
    root,
    db: () => (opened ??= new Database(join(root, "sessions.db"))),
    clean: async () => {
      opened?.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}

describe("isDevinSessionId", () => {
  test.each([
    ["a reported session id", SID, true],
    ["another real one", "zigzag-jester", true],
    ["a three-word id a newer devin may mint", "morning-faucet-tall", true],
    ["words may carry digits", "chip-42beret", true],
    ["a traversal attempt", "../../sessions.db", false],
    ["an id with a path glued on", `${SID}/../x`, false],
    ["underscores are not devin's shape", "20260909_154520", false],
    ["a dot", "chip.beret", false],
    ["empty", "", false],
    ["a lone dash", "-", false],
  ])("%s → %s", (_label, value, expected) => {
    expect(isDevinSessionId(value)).toBe(expected);
  });
});

// The virtual key is this adapter's answer to "one database, many sessions" — the store caches by
// whatever resolve() returns, so the session id has to be IN it.
describe("the virtual key", () => {
  test("round-trips a db path and a session id", () => {
    const key = devinKey("/home/you/.local/share/devin/cli/sessions.db", SID);
    expect(key).toBe(`/home/you/.local/share/devin/cli/sessions.db#${SID}`);
    expect(splitDevinKey(key)).toEqual({
      dbPath: "/home/you/.local/share/devin/cli/sessions.db",
      sessionId: SID,
    });
  });

  test("splits at the LAST '#', so a directory containing one still works", () => {
    const key = devinKey("/data/weird#dir/sessions.db", SID);
    expect(splitDevinKey(key)).toEqual({ dbPath: "/data/weird#dir/sessions.db", sessionId: SID });
  });

  test("a key without a valid session id is not ours", () => {
    expect(splitDevinKey("/nope/sessions.db#notasession")).toBeNull();
    expect(splitDevinKey(`#${SID}`)).toBeNull();
    expect(splitDevinKey("/nope/sessions.db")).toBeNull();
  });
});

describe("parseDevinTranscript", () => {
  // The line shape the source composes: one JSON object per node, on_chain labelled by SQL.
  const line = (row_id: number, node_id: number, parent: number | null, spec: NodeSpec, on_chain = 1) =>
    JSON.stringify({
      row_id,
      node_id,
      parent_node_id: parent,
      role: spec.role,
      content: spec.content,
      tool_calls: spec.extra?.tool_calls === undefined ? null : JSON.stringify(spec.extra.tool_calls),
      tool_call_id: spec.extra?.tool_call_id ?? null,
      created_at: spec.ts,
      on_chain,
    });

  const convo = straightConversation();
  const text = convo
    .map((n, i) => line(i + 1, n.nodeId, n.parent, n))
    .join("\n");

  test("renders user, assistant text, tool call, and folds the result onto its call", () => {
    const entries = parseDevinTranscript(text);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      uuid: "2",
      ts: "1970-01-01T00:01:41.000Z",
      role: "user",
      parts: [{ kind: "text", text: "show history" }],
    });
    // The assistant node renders its text and its call, and the tool node after it folds its
    // result onto that call rather than drawing a row of its own.
    expect(entries[1]?.parts).toHaveLength(2);
    expect(entries[1]?.parts[0]).toEqual({ kind: "text", text: "I will inspect it." });
    expect(entries[1]?.parts[1]).toEqual({
      kind: "tool",
      name: "read",
      summary: "/tmp/x",
      id: "call-1",
      // The shared classifier reads the call's own vocabulary (`read` + `file_path`), so the part
      // carries a structured call rather than an "other" — same as every other adapter's calls.
      call: { kind: "read", path: "/tmp/x" },
      result: { text: "the log" },
    });
    expect(entries[2]).toMatchObject({ uuid: "6", role: "assistant", parts: [{ kind: "text", text: "It is fixed." }] });
  });

  test("a system prefix node renders nothing — it is injected context, not speech", () => {
    const roles = parseDevinTranscript(text).map((e) => e.role);
    expect(roles).not.toContain("system");
  });

  test("every parallel call in one array renders — a two-call turn is not misreported as one", () => {
    const two = line(1, 1, null, {
      nodeId: 1,
      parent: null,
      role: "assistant",
      content: "",
      ts: 1,
      extra: {
        tool_calls: [
          { id: "call-1", name: "read", kind: "function", index: 0, arguments: { file_path: "/tmp/a" } },
          { id: "call-2", name: "grep", kind: "function", index: 1, arguments: { pattern: "x" } },
        ],
      },
    });
    const parts = parseDevinTranscript(two)[0]?.parts ?? [];
    expect(parts.filter((p) => p.kind === "tool")).toHaveLength(2);
  });

  test("an orphan tool result renders as a note, so output is never silently dropped", () => {
    const orphan = line(1, 1, null, {
      nodeId: 1,
      parent: null,
      role: "tool",
      content: "orphan output",
      ts: 1,
      extra: { tool_call_id: "call-gone" },
    });
    expect(parseDevinTranscript(orphan)).toEqual([
      {
        uuid: "1",
        ts: "1970-01-01T00:00:01.000Z",
        role: "note",
        parts: [{ kind: "tool", name: "tool", summary: "", result: { text: "orphan output" } }],
      },
    ]);
  });

  test("a node the branch walk calls off-chain starts life abandoned (hidden, cursor-resolvable)", () => {
    const entries = parseDevinTranscript(
      [line(1, 2, 1, convo[1]!), line(2, 8, 1, { nodeId: 8, parent: 1, role: "user", content: "v2", ts: 106 })].join("\n"),
    );
    expect(entries[0]?.abandoned).toBe(true);
    expect(entries[1]?.abandoned).toBeUndefined();
  });

  test("rubbish lines are skipped, not fatal — a byte cap clips mid-object", () => {
    expect(parseDevinTranscript("")).toEqual([]);
    expect(parseDevinTranscript("not json")).toEqual([]);
    expect(parseDevinTranscript(JSON.stringify({ row_id: 1 }))).toEqual([]); // not a node row
    expect(parseDevinTranscript("42")).toEqual([]);
  });

  test("an unmodelled role is counted, not rendered and not swallowed", () => {
    const future = line(1, 1, null, { nodeId: 1, parent: null, role: "agentHandoff", content: "x", ts: 1 });
    const reducer = createDevinReducer();
    reducer.push(future);
    expect(reducer.unknowns().rows.has("role:agentHandoff")).toBe(true);
    expect(parseDevinTranscript(future)).toEqual([]);
  });
});

// ── The branch chain: rewinds are announced by the row that lands on the new branch ──

describe("the reducer's branch chain", () => {
  const line = (row_id: number, node_id: number, parent: number | null, role: string, content: string, on_chain: number, extra: ChatExtras = {}, ts = 100 + row_id) =>
    JSON.stringify({ row_id, node_id, parent_node_id: parent, role, content, tool_calls: extra.tool_calls === undefined ? null : JSON.stringify(extra.tool_calls), tool_call_id: extra.tool_call_id ?? null, created_at: ts, on_chain });

  test("a row parented at an ancestor abandons what followed, and names it in changed", () => {
    const reducer = createDevinReducer();
    // n1 sys, n2 user, n3 assistant — then a rewind to n2 lands n4 (the edited user message).
    const before = reducer.push(line(1, 1, null, "system", "", 1));
    expect(before.added).toHaveLength(0);
    const user = reducer.push(line(2, 2, 1, "user", "fix the leak", 1));
    expect(user.added).toHaveLength(1);
    const reply = reducer.push(line(3, 3, 2, "assistant", "done", 1));
    expect(reply.added).toHaveLength(1);
    expect(reply.changed).toEqual([]);
    // The rewind: a new system+user pair parented at n1, the old user's own parent.
    const regenerated = reducer.push(line(4, 4, 1, "system", "", 1));
    expect(regenerated.added).toHaveLength(0);
    expect(new Set(regenerated.changed)).toEqual(new Set(["2", "3"]));
    expect(user.added[0]!.abandoned).toBe(true);
    expect(reply.added[0]!.abandoned).toBe(true);
    const userV2 = reducer.push(line(5, 5, 4, "user", "fix the leak differently", 1));
    expect(userV2.added[0]?.abandoned).toBeUndefined();
  });

  test("rewinding BACK onto a marked turn clears the mark", () => {
    const reducer = createDevinReducer();
    reducer.push(line(1, 1, null, "system", "", 1));
    const user = reducer.push(line(2, 2, 1, "user", "v1", 1));
    reducer.push(line(3, 3, 1, "system", "", 1)); // the regenerated branch's prefix
    expect(user.added[0]!.abandoned).toBe(true);
    // Back onto the old branch: a row parented at n2, the marked turn's own tail.
    const back = reducer.push(line(4, 4, 2, "assistant", "resumed", 1));
    expect(back.added[0]?.abandoned).toBeUndefined();
    expect(user.added[0]!.abandoned).toBeUndefined();
    expect(new Set(back.changed)).toEqual(new Set([user.added[0]!.uuid]));
  });

  test("an off-chain row never moves the leaf, so subagent trees cannot read as a fork", () => {
    const reducer = createDevinReducer();
    const user = reducer.push(line(1, 1, null, "user", "hello", 1));
    // A subagent/speculative node arrives OFF the branch, parented at the root.
    const sub = reducer.push(line(2, 2, 1, "assistant", "subagent scratch", 0));
    expect(sub.added[0]?.abandoned).toBe(true);
    expect(user.added[0]!.abandoned).toBeUndefined();
    // The conversation continues from the leaf the subagent never touched.
    const next = reducer.push(line(3, 3, 1, "assistant", "real reply", 1));
    expect(next.changed).toEqual([]);
    expect(next.added[0]?.abandoned).toBeUndefined();
  });
});

// ── The source, against a real database ──────────────────────────────────────

describe("DevinTranscriptSource", () => {
  test("resolve finds the session in the first root that holds it, and misses cleanly otherwise", async () => {
    const f = await fixtureRoot();
    const db = f.db();
    createTables(db);
    insertNodes(db, SID, straightConversation());
    db.run("update sessions set main_chain_id = 6 where id = ?", [SID]);
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 6, 100, 105)", [SID]);

    const source = new DevinTranscriptSource(f.root);
    await expect(source.resolve({ kind: "id", value: SID })).resolves.toBe(devinKey(join(f.root, "sessions.db"), SID));
    await expect(source.resolve({ kind: "id", value: OTHER })).resolves.toBeNull();
    await expect(source.resolve({ kind: "path", value: SID })).resolves.toBeNull();
    await expect(source.resolve({ kind: "id", value: "../../etc" })).resolves.toBeNull();

    await f.clean();
  });

  test("resolve walks the second root (cli-next) when the first holds no such session", async () => {
    const first = await fixtureRoot();
    const second = await fixtureRoot();
    const db = second.db();
    createTables(db);
    insertNodes(db, SID, straightConversation().slice(0, 2));
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 2, 100, 101)", [SID]);

    const source = new DevinTranscriptSource([first.root, second.root]);
    await expect(source.resolve({ kind: "id", value: SID })).resolves.toBe(devinKey(join(second.root, "sessions.db"), SID));
    await first.clean();
    await second.clean();
  });

  test("an unopenable database is an ordinary negative, not a fault", async () => {
    const root = await mkdtemp(join(tmpdir(), "devin-empty-"));
    // No sessions.db at all under this root.
    const source = new DevinTranscriptSource(root);
    await expect(source.resolve({ kind: "id", value: SID })).resolves.toBeNull();
    await rm(root, { recursive: true, force: true });
  });

  test("a database outside the root is not ours to read, whatever it holds", async () => {
    const inside = await fixtureRoot();
    const outside = await fixtureRoot();
    const db = outside.db();
    createTables(db);
    insertNodes(db, SID, straightConversation().slice(0, 2));
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 2, 100, 101)", [SID]);

    const source = new DevinTranscriptSource(inside.root);
    await expect(source.resolve({ kind: "id", value: SID })).resolves.toBeNull();
    await inside.clean();
    await outside.clean();
  });

  test("stat counts the session's nodes and carries its newest timestamp", async () => {
    const f = await fixtureRoot();
    const db = f.db();
    createTables(db);
    insertNodes(db, SID, straightConversation());
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 6, 100, 105)", [SID]);

    const source = new DevinTranscriptSource(f.root);
    const key = await source.resolve({ kind: "id", value: SID });
    expect(key).not.toBeNull();
    await expect(source.stat(key!)).resolves.toEqual({ size: 6, mtimeMs: 105 });
    await f.clean();
  });

  test("load composes the whole session and parse reads the current branch", async () => {
    const f = await fixtureRoot();
    const db = f.db();
    createTables(db);
    const convo = straightConversation();
    insertNodes(db, SID, convo);
    // A rewind: the user edits their message, devin regenerates from the same prefix.
    insertNodes(db, SID, [
      { nodeId: 7, parent: 1, role: "system", content: "", ts: 106 },
      { nodeId: 8, parent: 7, role: "user", content: "show history again", ts: 107 },
      { nodeId: 9, parent: 8, role: "assistant", content: "It is still fixed.", ts: 108 },
    ]);
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 9, 100, 108)", [SID]);

    const source = new DevinTranscriptSource(f.root);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    const { text, complete } = await source.load(key);
    expect(complete).toBe(true);
    const entries = parseDevinTranscript(text);
    // The old branch renders ABANDONED (hidden by views, resolvable by ?before=), the new one visible.
    const visible = entries.filter((e) => e.abandoned !== true);
    expect(visible.map((e) => e.role)).toEqual(["user", "assistant"]);
    expect(visible[0]?.parts[0]).toEqual({ kind: "text", text: "show history again" });
    expect(visible[1]?.parts[0]).toEqual({ kind: "text", text: "It is still fixed." });
    const hidden = entries.filter((e) => e.abandoned === true);
    expect(hidden.map((e) => e.uuid)).toEqual(["2", "4", "6"]);
    await f.clean();
  });

  test("a database whose schema drifted fails loudly out of load, not as an empty page", async () => {
    const f = await fixtureRoot();
    const db = f.db();
    // A pre-refinery devin (or another tool's) database: no message_nodes at all.
    db.run("create table sessions (id text primary key)");
    db.run("insert into sessions (id) values (?)", [SID]);

    const source = new DevinTranscriptSource(f.root);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    // json_extract over a missing table throws inside withDb and PROPAGATES (hermes.ts's stance).
    await expect(source.load(key)).rejects.toThrow();
    await f.clean();
  });
});

describe("readSince", () => {
  async function seeded(initial: readonly NodeSpec[], mainChain: number) {
    const f = await fixtureRoot();
    const db = f.db();
    createTables(db);
    insertNodes(db, SID, initial);
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, ?, 100, 105)", [SID, mainChain]);
    const source = new DevinTranscriptSource(f.root);
    return { f, db, source };
  }

  test("a first read is a bounded reset that claims the start only when it is one", async () => {
    const { f, source } = await seeded(straightConversation(), 6);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    const first = await source.readSince(key, NO_CURSOR);
    expect(first.reset).toBe(true);
    expect(first.fromStart).toBe(true);
    expect(first.lines).toHaveLength(6);

    const again = await source.readSince(key, first.cursor);
    expect(again).toEqual({ lines: [], cursor: first.cursor, reset: false, fromStart: false });
    await f.clean();
  });

  test("an append is a delta of the new nodes, in order, and the cursor advances", async () => {
    const { f, db, source } = await seeded(straightConversation(), 6);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    const first = await source.readSince(key, NO_CURSOR);

    insertNodes(db, SID, [{ nodeId: 7, parent: 6, role: "user", content: "thanks", ts: 106 }]);
    db.run("update sessions set main_chain_id = 7 where id = ?", [SID]);

    const delta = await source.readSince(key, first.cursor);
    expect(delta.reset).toBe(false);
    expect(delta.lines).toHaveLength(1);
    // SAFETY: the delta is one line this test itself composed out of a fixture row; the cast names
    // the two fields it reads off that known shape.
    const row = JSON.parse(delta.lines[0]!) as { role: string; content: string };
    expect(row.role).toBe("user");
    expect(row.content).toBe("thanks");
    await f.clean();
  });

  test("a rewind's delta announces the flip: the new rows arrive, the old turns are named in changed", async () => {
    const { f, db, source } = await seeded(straightConversation(), 6);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    const first = await source.readSince(key, NO_CURSOR);

    // The edit: a regenerated system+user pair parented at the root prefix, branch tail moves.
    insertNodes(db, SID, [
      { nodeId: 7, parent: 1, role: "system", content: "", ts: 106 },
      { nodeId: 8, parent: 7, role: "user", content: "show history again", ts: 107 },
    ]);
    db.run("update sessions set main_chain_id = 8 where id = ?", [SID]);

    const delta = await source.readSince(key, first.cursor);
    expect(delta.lines).toHaveLength(2);

    // Fold the whole conversation through one reducer, as the live window does: the pre-rewind
    // turns it holds must come back marked, which is the only channel a delta has to say so.
    const reducer = createDevinReducer();
    const held = [...first.lines, ...delta.lines].map((l) => reducer.push(l));
    const flipped = new Set(held.flatMap((r) => [...r.changed]));
    expect(flipped).toEqual(new Set(["2", "4", "6"]));
    const visible = held.flatMap((r) => r.added).filter((e) => e.abandoned !== true);
    expect(visible.map((e) => e.uuid)).toEqual(["8"]);
    await f.clean();
  });

  test("an unreadable database holds the cursor and reports nothing new", async () => {
    const f = await fixtureRoot();
    const db = f.db();
    createTables(db);
    insertNodes(db, SID, straightConversation());
    db.run("insert into sessions (id, main_chain_id, created_at, last_activity_at) values (?, 6, 100, 105)", [SID]);
    const source = new DevinTranscriptSource(f.root);
    const key = (await source.resolve({ kind: "id", value: SID }))!;
    const first = await source.readSince(key, NO_CURSOR);
    db.close();
    await chmod(join(f.root, "sessions.db"), 0o000);
    const held = await source.readSince(key, first.cursor).catch(() => null);
    // Permission failures open the db as unopenable: an ordinary negative that holds the cursor.
    expect(held === null || held.lines.length === 0).toBe(true);
    await chmod(join(f.root, "sessions.db"), 0o600);
    await f.clean();
  });

  test("a key that is not ours answers nothing, cursor-less", async () => {
    const source = new DevinTranscriptSource("/nope");
    await expect(source.readSince("/nope/sessions.db#garbage", NO_CURSOR)).resolves.toEqual({
      lines: [],
      cursor: NO_CURSOR,
      reset: false,
      fromStart: false,
    });
  });
});

// The adapter's registration shape — the registry builds FROM this field, so it cannot drift.
test("devinJournal registers under the agent string herdr reports", async () => {
  const { devinJournal } = await import("./devin.ts");
  expect(devinJournal([]).agent).toBe("devin");
});
