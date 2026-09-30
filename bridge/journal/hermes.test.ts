import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, realpath, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NO_CURSOR } from "./cursor.ts";
import { FIRST_TAIL_ROWS } from "./files.ts";
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

// The rule against `unknown` parameters wants the shape named: a rejected promise's payload is
// unknown BY TYPE, so the parse happens here, once, exactly like the adapter's own reason().
function messageOf<T>(error: T): string {
  return error instanceof Error ? error.message : String(error);
}

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

// The schema live-verified on this host (2026-04 data): 13 columns, none of the four optional
// ones. This fixture is why the review finding could never happen again — the adapter must read
// THIS shape, not just the one its own SELECT describes.
const createTablesV6 = (db: Database): void => {
  db.run(
    "create table sessions (id text primary key, source text, started_at real, parent_session_id text)",
  );
  db.run(
    "create table messages (id integer primary key autoincrement, session_id text not null, role text not null, content text, tool_call_id text, tool_calls text, tool_name text, timestamp real, token_count integer, finish_reason text, reasoning text, reasoning_details text, codex_reasoning_items text)",
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
          {
            kind: "tool",
            name: "terminal",
            summary: "pwd",
            id: "call-1",
            call: { kind: "other", name: "terminal", summary: "pwd" },
          },
        ],
      },
      {
        uuid: "3",
        ts: "1970-01-01T00:00:03.000Z",
        role: "note",
        parts: [{ kind: "tool", name: "terminal", summary: "", id: "call-1", result: { text: "/home/you" } }],
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
describe("HermesTranscriptSource — several roots", () => {  async function fixture() {
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

// The review round found a real ~/.hermes/state.db whose `messages` table carries NONE of the
// four optional columns — and the adapter's fixed SELECT failed inside a swallowed catch, reading
// as "no history" forever. These pins hold the adapter to both observed shapes and to failing
// LOUDLY on a shape it does not know.
describe("HermesTranscriptSource — the live-verified v6 schema", () => {
  async function v6Fixture() {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-v6-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    createTablesV6(db);
    db.run("insert into sessions values (?, 'tui', 1, null)", [PARENT]);
    db.run("insert into sessions values (?, 'tui', 2, ?)", [SID, PARENT]);
    db.run("insert into messages (session_id, role, content, timestamp) values (?, 'user', 'the real question', 10)", [PARENT]);
    db.run("insert into messages (session_id, role, content, timestamp, tool_name) values (?, 'tool', 'the real result', 20, 'terminal')", [PARENT]);
    db.run("insert into messages (session_id, role, content, timestamp, reasoning) values (?, 'assistant', 'the real answer', 30, 'reasoned here')", [SID]);
    db.close();
    return { base, root };
  }

  test("reads a database whose messages table has none of the optional columns", async () => {
    const { base, root } = await v6Fixture();
    const src = new HermesTranscriptSource(root);
    const key = await src.resolve({ kind: "id", value: SID });
    expect(key).toBe(`${join(root, "state.db")}#${SID}`);
    const { text, complete } = await src.load(key!);
    expect(complete).toBe(true);
    const entries = parseHermesTranscript(text);
    expect(entries.map((e) => e.uuid)).toEqual(["1", "2", "3"]); // lineage: parent rows first
    expect(entries[0]!.parts[0]).toEqual({ kind: "text", text: "the real question" });
    expect(entries[2]!.parts).toEqual([
      { kind: "thinking", text: "reasoned here" },
      { kind: "text", text: "the real answer" },
    ]);
    await rm(base, { recursive: true, force: true });
  });

  test("v6 stat counts the session's own rows", async () => {
    const { base, root } = await v6Fixture();
    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: SID }))!;
    expect(await src.stat(key)).toEqual({ size: 1, mtimeMs: 30 });
    await rm(base, { recursive: true, force: true });
  });

  test("schema drift in load surfaces as an error, never as an empty page", async () => {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-drift-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    db.run("create table sessions (id text primary key, source text, started_at real, parent_session_id text)");
    // A `messages` table the adapter cannot know: base column `role` renamed. resolve still works
    // (sessions is intact); load must THROW — the swallowed version of this read as "no history".
    db.run(
      "create table messages (id integer primary key, session_id text, kind text, content text, timestamp real)",
    );
    db.run("insert into sessions values (?, 'tui', 1, null)", [SID]);
    db.close();
    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: SID }))!;
    // Awaited explicitly, with the failure named: an unawaited rejects expectation can pass under
    // bun's forgiving runner, and "some error" is weaker than the drift we mean.
    const outcome = await src.load(key!).then(
      () => "resolved",
      messageOf,
    );
    expect(outcome).toContain("no such column");
    await rm(base, { recursive: true, force: true });
  });
});

// The read-only promise is a red line of this adapter (it reads another agent's database), so it
// is pinned twice: a resolve against a root with no database must not CREATE one (a read-write
// open of a missing file creates it), and a database the process cannot write must still read.
describe("HermesTranscriptSource — the read-only open", () => {
  test("resolve on a root with no database creates nothing", async () => {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-roc-")));
    await mkdir(join(base, "data"), { recursive: true });
    expect(await new HermesTranscriptSource(join(base, "data")).resolve({ kind: "id", value: SID })).toBeNull();
    expect(await stat(join(base, "data", "state.db")).then(() => true, () => false)).toBe(false);
    await rm(base, { recursive: true, force: true });
  });

  test("a database chmodded 0444 still resolves and loads — the open is readonly", async () => {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-0444-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    createTables(db);
    db.run("insert into sessions values (?, 'tui', 1, null)", [SID]);
    db.run("insert into messages (id, session_id, role, content, timestamp) values (1, ?, 'user', 'still readable', 1)", [SID]);
    db.close();
    await chmod(join(root, "state.db"), 0o444);
    const src = new HermesTranscriptSource(root);
    const key = await src.resolve({ kind: "id", value: SID });
    expect(key).not.toBeNull();
    const loaded = await src.load(key!);
    expect(parseHermesTranscript(loaded.text)[0]?.parts[0]).toEqual({ kind: "text", text: "still readable" });
    await rm(base, { recursive: true, force: true });
  });

  // The one test that pins the FLAG itself. The two above are carried by other machinery: the
  // no-create test is enforced by the containment pre-guard (a missing file never reaches
  // withDb), and bun silently downgrades a read-write open of a 0444 file to read-only — the
  // 0444 test stays green with the flag removed. This one does not: after resolve, the database
  // vanishes; a READ-ONLY open answers null ("gone") and creates nothing, while a read-write
  // open would resurrect an empty state.db on the operator's disk and then throw on it.
  test("a stale key whose database vanished does not resurrect it", async () => {
    const base = await realpath(await mkdtemp(join(tmpdir(), "collie-hermes-gone-")));
    const root = join(base, "data");
    await mkdir(root, { recursive: true });
    const db = new Database(join(root, "state.db"));
    createTables(db);
    db.run("insert into sessions values (?, 'tui', 1, null)", [SID]);
    db.close();
    const src = new HermesTranscriptSource(root);
    const key = (await src.resolve({ kind: "id", value: SID }))!;
    await rm(join(root, "state.db"));
    expect(await src.stat(key)).toBeNull();
    const stillThere = await stat(join(root, "state.db")).then(() => true, () => false);
    expect(stillThere).toBe(false);
    await rm(base, { recursive: true, force: true });
  });
});

// The live read. Hermes' cursor is `max(messages.id)`, so this is where the two things that cursor
// CAN and CANNOT see are pinned: a new row arrives, and a row whose mutable state changed does not.
describe("HermesTranscriptSource — readSince", () => {
  const SCHEMA = [
    "create table sessions (id text primary key, source text, started_at real, parent_session_id text)",
    "create table messages (id integer primary key, session_id text, role text, content text, tool_call_id text, tool_calls text, tool_name text, timestamp real, reasoning text, reasoning_content text, active integer default 1, compacted integer default 0, display_kind text)",
  ] as const;

  /** A temp `state.db` holding one session, plus the two verbs these tests drive it with. */
  async function lab(parent: string | null = null) {
    const root = await mkdtemp(join(tmpdir(), "collie-hermes-since-"));
    const db = new Database(join(root, "state.db"));
    for (const ddl of SCHEMA) db.run(ddl);
    db.run("insert into sessions (id, source, started_at, parent_session_id) values (?, 'tui', 1, ?)", [SID, parent]);
    return {
      root,
      db,
      session: (id: string, p: string | null = null) =>
        db.run("insert into sessions (id, source, started_at, parent_session_id) values (?, 'tui', 1, ?)", [id, p]),
      say: (id: number, text: string, session = SID) =>
        db.run("insert into messages (id, session_id, role, content, timestamp) values (?, ?, 'user', ?, ?)", [
          id,
          session,
          text,
          id,
        ]),
      clean: async () => {
        db.close();
        await rm(root, { recursive: true, force: true });
      },
    };
  }

  const texts = (lines: readonly string[]) =>
    lines.map((line) => parseHermesTranscript(line)[0]?.parts[0]).map((part) => (part?.kind === "text" ? part.text : null));

  test("a first read takes the turns and says the answer replaces nothing", async () => {
    const f = await lab();
    f.say(1, "older turn");
    f.say(2, "newer turn");
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });

    const first = await src.readSince(key!, NO_CURSOR);
    expect(texts(first.lines)).toEqual(["older turn", "newer turn"]);
    expect(first.reset).toBe(true);

    await f.clean();
  });

  test("a resume carries only the rows written since", async () => {
    const f = await lab();
    f.say(1, "older turn");
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });
    const first = await src.readSince(key!, NO_CURSOR);

    f.say(2, "newer turn");
    const next = await src.readSince(key!, first.cursor);
    expect(texts(next.lines)).toEqual(["newer turn"]);
    expect(next.reset).toBe(false);

    await f.clean();
  });

  test("a tick where nothing was written reads no rows and keeps the position", async () => {
    const f = await lab();
    f.say(1, "older turn");
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });
    const first = await src.readSince(key!, NO_CURSOR);

    const again = await src.readSince(key!, first.cursor);
    expect(again.lines).toEqual([]);
    expect(again.cursor).toBe(first.cursor);
    expect(again.reset).toBe(false);

    await f.clean();
  });

  // The hole, pinned rather than papered over. `active` is mutable per row, so a turn can leave the
  // conversation without any id moving, and an id cursor is blind to it by construction. The live
  // window's answer is a reset, which is a layer above this one; what belongs here is the truth.
  test("a row that stops being active is invisible to an id cursor", async () => {
    const f = await lab();
    f.say(1, "older turn");
    f.say(2, "newer turn");
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });
    const first = await src.readSince(key!, NO_CURSOR);
    expect(first.lines).toHaveLength(2);

    f.db.run("update messages set active = 0 where id = 2");
    const after = await src.readSince(key!, first.cursor);
    expect(after.lines).toEqual([]);
    // A whole read DOES see it, which is what a reset gets the caller.
    const whole = parseHermesTranscript((await src.load(key!)).text);
    expect(whole.map((e) => (e.parts[0]?.kind === "text" ? e.parts[0].text : null))).toEqual(["older turn"]);

    await f.clean();
  });

  test("a first read is bounded by rows, so a long session is not composed to be thrown away", async () => {
    const f = await lab();
    for (let id = 1; id <= FIRST_TAIL_ROWS + 5; id++) f.say(id, `turn ${id}`);
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });

    const first = await src.readSince(key!, NO_CURSOR);
    expect(first.lines).toHaveLength(FIRST_TAIL_ROWS);
    // The NEWEST rows, in the order they were written.
    expect(texts(first.lines).at(0)).toBe("turn 6");
    expect(texts(first.lines).at(-1)).toBe(`turn ${FIRST_TAIL_ROWS + 5}`);

    // And the read after it resumes from the newest row, not from the window's edge.
    f.say(FIRST_TAIL_ROWS + 6, "one more");
    const next = await src.readSince(key!, first.cursor);
    expect(texts(next.lines)).toEqual(["one more"]);

    await f.clean();
  });

  // `fromStart` needs BOTH bounds to have stood down: the row limit did not bite, and the byte clip
  // dropped nothing. It is what the live window turns into "load older" (journal/live.ts § hasOlder),
  // so a wrong reading either offers turns that do not exist or hides turns that do.
  test("a short session's first read claims the start; a long one's does not", async () => {
    const short = await lab();
    short.say(1, "only turn");
    const one = new HermesTranscriptSource(short.root);
    const shortKey = await one.resolve({ kind: "id", value: SID });
    const shortRead = await one.readSince(shortKey!, NO_CURSOR);
    expect(shortRead.reset).toBe(true);
    expect(shortRead.fromStart).toBe(true);
    // And a resume after it never claims the start, whatever it carries.
    short.say(2, "another");
    expect((await one.readSince(shortKey!, shortRead.cursor)).fromStart).toBe(false);
    await short.clean();

    const long = await lab();
    for (let id = 1; id <= FIRST_TAIL_ROWS + 5; id++) long.say(id, `turn ${id}`);
    const two = new HermesTranscriptSource(long.root);
    const longKey = await two.resolve({ kind: "id", value: SID });
    const longRead = await two.readSince(longKey!, NO_CURSOR);
    expect(longRead.reset).toBe(true);
    expect(longRead.fromStart).toBe(false);
    await long.clean();
  });

  test("a first read carries the ancestors a fork inherited", async () => {
    const f = await lab("20260101_000000_parent");
    f.session("20260101_000000_parent", null);
    f.say(1, "in the parent", "20260101_000000_parent");
    f.say(2, "in the fork");
    const src = new HermesTranscriptSource(f.root);
    const key = await src.resolve({ kind: "id", value: SID });

    expect(texts((await src.readSince(key!, NO_CURSOR)).lines)).toEqual(["in the parent", "in the fork"]);

    await f.clean();
  });

  test("a key it cannot split reports nothing new", async () => {
    expect(await new HermesTranscriptSource("/nope").readSince("/not-a-key", NO_CURSOR)).toEqual({
      lines: [],
      cursor: NO_CURSOR,
      reset: false,
      fromStart: false,
    });
  });
});

// Hermes' `tool_calls` column is an OpenAI-shaped array, so the structured call comes from
// `function.arguments` and nothing else: the `tool` row that answers a call records only its text.
describe("parseHermesTranscript: the structured tool call", () => {
  /** One OpenAI-shaped entry of hermes' `tool_calls` column. `id` is absent on purpose in the test
   *  that pins an id-less call, so it is optional here rather than a second builder. */
  interface ToolCallRow {
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: unknown };
  }

  const assistantCall = (calls: ToolCallRow[]) =>
    JSON.stringify({ id: 2, role: "assistant", tool_calls: JSON.stringify(calls), timestamp: 2 });

  const firstTool = (text: string) => {
    const part = parseHermesTranscript(text).flatMap((e) => e.parts).find((p) => p.kind === "tool");
    // SAFETY: `find` on the `kind === "tool"` predicate returns that branch or nothing; the throw
    // rules out nothing, so the narrowing below is what the predicate already proved.
    if (part === undefined || part.kind !== "tool") throw new Error("no tool part in the rows");
    return part;
  };

  test("a read carries its path and its id", () => {
    const part = firstTool(
      assistantCall([{ id: "call-9", function: { name: "read_file", arguments: '{"path":"/src/a.ts"}' } }]),
    );
    expect(part.id).toBe("call-9");
    expect(part.call).toEqual({ kind: "read", path: "/src/a.ts" });
    // The one-line form is unchanged by the classification beside it.
    expect(part.summary).toBe("/src/a.ts");
  });

  test("an already-parsed arguments object classifies the same way", () => {
    // Hermes writes `arguments` as a JSON string, but a row carrying the object itself still reads.
    const part = firstTool(assistantCall([{ function: { name: "bash", arguments: { command: "ls -la" } } }]));
    expect(part.call).toEqual({ kind: "execute", command: "ls -la" });
  });

  test("a call with no id leaves the id absent rather than empty", () => {
    const part = firstTool(assistantCall([{ function: { name: "grep", arguments: '{"pattern":"todo"}' } }]));
    expect("id" in part).toBe(false);
    expect(part.call).toEqual({ kind: "search", query: "todo" });
  });

  test("Hermes' own tool names fall through to other, still carrying the summary", () => {
    const part = firstTool(assistantCall([{ function: { name: "terminal", arguments: '{"command":"pwd"}' } }]));
    expect(part.call).toEqual({ kind: "other", name: "terminal", summary: "pwd" });
  });

  test("a tool row keeps its id and carries no structured call", () => {
    // The row holds no input, and no column says what the call did — so a `call` here could only
    // invent an empty path or command. Absent is the honest answer, and `isError` stays absent too.
    const rows = parseHermesTranscript(
      JSON.stringify({
        id: 3,
        role: "tool",
        tool_call_id: "call-9",
        tool_name: "read_file",
        content: "const a = 1",
        timestamp: 3,
      }),
    );
    expect(rows[0]?.parts).toEqual([
      { kind: "tool", name: "read_file", summary: "", id: "call-9", result: { text: "const a = 1" } },
    ]);
  });

  test("a tool row with no tool_call_id leaves the id absent", () => {
    const rows = parseHermesTranscript(
      JSON.stringify({ id: 4, role: "tool", tool_name: "terminal", content: "done", timestamp: 4 }),
    );
    expect(rows[0]?.parts).toEqual([{ kind: "tool", name: "terminal", summary: "", result: { text: "done" } }]);
  });
});
