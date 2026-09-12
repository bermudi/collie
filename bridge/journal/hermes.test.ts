import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  HermesTranscriptSource,
  hermesKey,
  isHermesSessionId,
  parseHermesTranscript,
  splitHermesKey,
} from "./hermes.ts";

// Fixtures create a real state.db with the schema the adapter queries, so resolve/stat/load run
// real SQL — the only way to pin the lineage walk and the containment check, which only mean
// anything against real paths. The database is opened read-write HERE (the fixture is the agent
// writing its log); the adapter under test must only ever read it.

const SID = "20260909_154520_9e0b91";
const OTHER = "20260909_999999_ffffffff";
const PARENT = "20260909_150000_aaa000";
const CHILD = "20260909_160000_bbb111";

const createTables = (db: Database): void => {
  db.run(
    "create table sessions (id text primary key, source text, started_at real, parent_session_id text)",
  );
  db.run(
    "create table messages (id integer primary key, session_id text, role text, content text, tool_call_id text, tool_calls text, tool_name text, timestamp real, reasoning text, reasoning_content text, active integer default 1, compacted integer default 0, display_kind text)",
  );
};

describe("isHermesSessionId", () => {
  test.each([
    ["a reported session id", SID, true],
    ["another real one", "20251231_235959_z0z0z0", true],
    ["a traversal attempt", "../../state.db", false],
    ["an id with a path glued on", `${SID}/../x`, false],
    ["an underscored lookalike", "2026_bad", false],
    ["the wrong shape", "state.db", false],
    ["empty", "", false],
  ])("%s → %s", (_label, value, expected) => {
    expect(isHermesSessionId(value)).toBe(expected);
  });
});

// The virtual key is this adapter's answer to "one database, many sessions" — the store caches by
// whatever resolve() returns, so the session id has to be IN it.
describe("the virtual key", () => {
  test("round-trips a db path and a session id", () => {
    const key = hermesKey("/home/you/.hermes/state.db", SID);
    expect(key).toBe(`/home/you/.hermes/state.db#${SID}`);
    expect(splitHermesKey(key)).toEqual({ dbPath: "/home/you/.hermes/state.db", sessionId: SID });
  });

  test("splits at the LAST '#', so a directory containing one still works", () => {
    const key = hermesKey("/data/weird#dir/state.db", SID);
    expect(splitHermesKey(key)).toEqual({ dbPath: "/data/weird#dir/state.db", sessionId: SID });
  });

  test("a key without a valid session id is not ours", () => {
    expect(splitHermesKey("/nope/state.db#not-a-session")).toBeNull();
    expect(splitHermesKey(`#${SID}`)).toBeNull();
    expect(splitHermesKey("/nope/state.db")).toBeNull();
  });
});

describe("parseHermesTranscript", () => {
  test("renders user, assistant, reasoning, tool call, and tool result rows", () => {
    const text = [
      JSON.stringify({ id: 1, role: "user", content: "show history", timestamp: 1 }),
      JSON.stringify({
        id: 2,
        role: "assistant",
        content: "I will inspect it.",
        reasoning: "Need read-only history.",
        tool_calls: JSON.stringify([
          { id: "call-1", function: { name: "terminal", arguments: '{"command":"pwd"}' } },
        ]),
        timestamp: 2,
      }),
      JSON.stringify({
        id: 3,
        role: "tool",
        tool_call_id: "call-1",
        tool_name: "terminal",
        content: "/home/you",
        timestamp: 3,
      }),
    ].join("\n");

    expect(parseHermesTranscript(text)).toEqual([
      { uuid: "1", ts: "1970-01-01T00:00:01.000Z", role: "user", parts: [{ kind: "text", text: "show history" }] },
      {
        uuid: "2",
        ts: "1970-01-01T00:00:02.000Z",
        role: "assistant",
        parts: [
          { kind: "thinking", text: "Need read-only history." },
          { kind: "text", text: "I will inspect it." },
          { kind: "tool", name: "terminal", summary: "pwd" },
        ],
      },
      {
        uuid: "3",
        ts: "1970-01-01T00:00:03.000Z",
        role: "note",
        parts: [{ kind: "tool", name: "terminal", summary: "", result: { text: "/home/you" } }],
      },
    ]);
  });

  // rowEntry drops rows Hermes itself hides: `display_kind: "hidden"`, and rows that are neither
  // active nor compacted (superseded by a compaction).
  test("a hidden row and a neither-active-nor-compacted row render nothing", () => {
    const text = [
      JSON.stringify({ id: 1, role: "user", content: "whisper", timestamp: 1, display_kind: "hidden" }),
      JSON.stringify({ id: 2, role: "user", content: "superseded", timestamp: 2, active: 0, compacted: 0 }),
    ].join("\n");
    expect(parseHermesTranscript(text)).toEqual([]);
  });

  // Same rule as every other adapter: an unmodelled role is plumbing, and rendering it as speech
  // would put words in the operator's mouth.
  test("an unmodelled role renders nothing", () => {
    expect(
      parseHermesTranscript(JSON.stringify({ id: 1, role: "system", content: "hello", timestamp: 1 })),
    ).toEqual([]);
  });

  test("a line that is not message-shaped, or not json, is skipped rather than thrown on", () => {
    const text = [
      "[]",
      "null",
      '{"no":"shape"}',
      '{"id":1,"role":"us',
      JSON.stringify({ id: 2, role: "user", content: "real", timestamp: 2 }),
    ].join("\n");
    const entries = parseHermesTranscript(text);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.uuid).toBe("2");
  });

  test("ansi escapes are stripped — nothing downstream interprets them", () => {
    const entries = parseHermesTranscript(
      JSON.stringify({ id: 1, role: "user", content: "\x1b[2mdim\x1b[0m text", timestamp: 1 }),
    );
    expect(entries[0]!.parts).toEqual([{ kind: "text", text: "dim text" }]);
  });
});

describe("HermesTranscriptSource", () => {
  /**
   * data/state.db            the real database (root = base/data)
   *   sessions: SID          messages: the readable, the plumbing, and the hidden/superseded
   * outside/state.db         a database no root may reach
   * tricky/state.db → ../outside/state.db   the right name, the wrong file
   */
  async function fixture() {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    createTables(db);
    db.run("insert into sessions values (?, 'tui', 1, null)", [SID]);
    const msg = (
      id: number,
      role: string,
      content: string,
      timestamp: number,
      cols: { reasoning?: string; active?: number; compacted?: number; display_kind?: string } = {},
    ) =>
      db.run(
        "insert into messages (id, session_id, role, content, timestamp, reasoning, active, compacted, display_kind) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          SID,
          role,
          content,
          timestamp,
          cols.reasoning ?? null,
          cols.active ?? 1,
          cols.compacted ?? 0,
          cols.display_kind ?? null,
        ],
      );
    msg(1, "user", "older turn", 1);
    msg(2, "assistant", "done", 2, { reasoning: "thinking out loud" });
    msg(3, "system", "plumbing", 3);
    msg(4, "user", "hidden whisper", 4, { display_kind: "hidden" });
    msg(5, "user", "superseded", 5, { active: 0, compacted: 0 });
    db.close();

    const outside = join(base, "outside");
    await mkdir(outside, { recursive: true });
    const outer = new Database(join(outside, "state.db"));
    createTables(outer);
    outer.run("insert into sessions values (?, 'tui', 1, null)", [SID]);
    outer.close();
    const tricky = join(base, "tricky");
    await mkdir(tricky, { recursive: true });
    await symlink(join(outside, "state.db"), join(tricky, "state.db"));

    return { base, root, tricky };
  }

  test("resolves and reads one session from state.db read-only", async () => {
    const { base, root } = await fixture();
    const src = new HermesTranscriptSource(root);
    const key = await src.resolve({ kind: "id", value: SID });
    expect(key).toBe(`${join(root, "state.db")}#${SID}`);
    const loaded = await src.load(key!);
    expect(parseHermesTranscript(loaded.text)[0]?.parts[0]).toEqual({ kind: "text", text: "older turn" });
    await rm(base, { recursive: true, force: true });
  });

  test.each([
    ["a path ref — hermes only ever reports an id", { kind: "path", value: "/etc/passwd" } as const],
    ["a malformed id", { kind: "id", value: "../../state.db" } as const],
    ["a session that is not in the database", { kind: "id", value: OTHER } as const],
  ])("refuses %s", async (_label, ref) => {
    const { base, root } = await fixture();
    expect(await new HermesTranscriptSource(root).resolve(ref)).toBeNull();
    await rm(base, { recursive: true, force: true });
  });

  test("a missing database resolves to null, not a throw", async () => {
    const src = new HermesTranscriptSource(join(tmpdir(), "collie-hermes-nope"));
    expect(await src.resolve({ kind: "id", value: SID })).toBeNull();
  });

  // The containment rule in files.ts is absolute even for a CONSTANT filename: `state.db` itself
  // can be a symlink, and then the fixed name points at another user's file.
  test("a state.db that symlinks out of the root fails containment", async () => {
    const { base, tricky } = await fixture();
    expect(await new HermesTranscriptSource(tricky).resolve({ kind: "id", value: SID })).toBeNull();
    await rm(base, { recursive: true, force: true });
  });

  test("stat counts a session's own rows and takes the newest timestamp", async () => {
    const { base, root } = await fixture();
    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: SID }))!;
    expect(await src.stat(key)).toEqual({ size: 5, mtimeMs: 5 });
    await rm(base, { recursive: true, force: true });
  });

  test("stat of a non-key is null", async () => {
    expect(await new HermesTranscriptSource("/nope").stat("/not-a-key")).toBeNull();
  });

  test("load composes the session oldest-first, dropping plumbing and hidden rows", async () => {
    const { base, root } = await fixture();
    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: SID }))!;
    const { text, complete, size, mtimeMs } = await src.load(key);
    expect(complete).toBe(true);
    expect(size).toBe(5);
    expect(mtimeMs).toBe(5);
    const entries = parseHermesTranscript(text);
    expect(entries.map((e) => [e.uuid, e.role])).toEqual([
      ["1", "user"],
      ["2", "assistant"],
    ]);
    expect(entries[1]!.parts).toEqual([
      { kind: "thinking", text: "thinking out loud" },
      { kind: "text", text: "done" },
    ]);
    await rm(base, { recursive: true, force: true });
  });

  test("load of a non-key is empty rather than a throw", async () => {
    expect(await new HermesTranscriptSource("/nope").load("/not-a-key")).toEqual({
      text: "",
      complete: true,
      size: 0,
      mtimeMs: 0,
    });
  });
});

// Hermes compaction CHAINS sessions: the compressed prefix stays in the parent session and the
// child continues from it. composeLines walks `parent_session_id` (bounded at 32 hops) and orders
// ancestors before descendants — depth DESC, not by row id — so the transcript reads
// chronologically across the chain even when the child's row ids are lower.
describe("HermesTranscriptSource — compressed parent sessions", () => {
  test("a child's transcript loads its parent's rows first", async () => {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-lineage-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    createTables(db);
    db.run("insert into sessions values (?, 'tui', 1, null)", [PARENT]);
    db.run("insert into sessions values (?, 'tui', 2, ?)", [CHILD, PARENT]);
    db.run("insert into messages (id, session_id, role, content, timestamp) values (1, ?, 'user', 'continue', 30)", [CHILD]);
    db.run("insert into messages (id, session_id, role, content, timestamp) values (2, ?, 'user', 'older question', 10)", [PARENT]);
    db.run("insert into messages (id, session_id, role, content, timestamp) values (3, ?, 'assistant', 'older answer', 20)", [PARENT]);
    db.close();

    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: CHILD }))!;
    const { text, size } = await src.load(key);
    // stat/meta stays the session's OWN row count — the lineage walk is load-time only.
    expect(size).toBe(1);
    const entries = parseHermesTranscript(text);
    expect(entries.map((e) => [e.uuid, e.role])).toEqual([
      ["2", "user"],
      ["3", "assistant"],
      ["1", "user"],
    ]);
    await rm(base, { recursive: true, force: true });
  });
});

// One root per Hermes home; several are searched in order and the first holding the session wins
// (the multi-home case of issue #92). The virtual key already carries the database path, so
// stat/load need no change — only resolve had to learn to ask more than one database.
describe("HermesTranscriptSource — several roots", () => {
  async function fixture() {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-roots-")));
    const first = join(base, "first");
    const second = join(base, "second");
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    for (const [dir, id] of [
      [first, SID],
      [second, OTHER],
    ] as const) {
      const db = new Database(join(dir, "state.db"));
      createTables(db);
      db.run("insert into sessions values (?, 'tui', 1, null)", [id]);
      db.close();
    }
    return { base, first, second };
  }

  test("resolves a session from whichever database holds it", async () => {
    const { base, first, second } = await fixture();
    const src = new HermesTranscriptSource([first, second]);
    expect(await src.resolve({ kind: "id", value: SID })).toBe(`${join(first, "state.db")}#${SID}`);
    expect(await src.resolve({ kind: "id", value: OTHER })).toBe(`${join(second, "state.db")}#${OTHER}`);
    await rm(base, { recursive: true, force: true });
  });

  test("a root with no database is skipped, not fatal", async () => {
    const { base, second } = await fixture();
    const src = new HermesTranscriptSource([join(base, "nothing-here"), second]);
    expect(await src.resolve({ kind: "id", value: OTHER })).toBe(`${join(second, "state.db")}#${OTHER}`);
    await rm(base, { recursive: true, force: true });
  });

  test("a single root string behaves exactly as before", async () => {
    const { base, first } = await fixture();
    const src = new HermesTranscriptSource(first);
    expect(await src.resolve({ kind: "id", value: OTHER })).toBeNull();
    await rm(base, { recursive: true, force: true });
  });
});
