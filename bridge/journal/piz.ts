// piz's journal adapter.
//
// SHAPE OF THE SOURCE (verified against a real on-disk store, 2026-10-27, piz 0.17.0):
//   $ZCODE_STORAGE_DIR/cli/db/db.sqlite        (default storage root: ~/.zcode)
// One SQLite database per storage root — piz is the local ZCode fork, and ZCode descends from
// OpenCode, so the schema is opencode's V1 store in all but name:
//
//   session(id TEXT PK, project_id, parent_id, directory, title, …, time_created, time_updated)
//     — a non-null `parent_id` marks a SUBAGENT session (ids like `sess_subagent_agent_<hex>`)
//   message(id TEXT PK, session_id, time_created, time_updated, data TEXT json, sequence INT)
//   part(id TEXT PK, message_id, session_id, time_created, time_updated, data TEXT json, sequence INT)
//
// Ids are `sess_<uuid>` for root sessions; roles are exactly `user` and `assistant` (77,883
// messages on this host); `sequence` is the authored per-session order (fully populated, unique
// per session, verified 2026-10-27), which is what orders both tables here. Part `data.type` is
// V1's inventory — `text`, `reasoning`, `tool` (callID + state.{status,input,output}),
// `step-start`, `step-finish` — plus three piz rows: `timeline` (runtime bookkeeping such as
// model changes), `file` (attachments) and `compaction` (the `{auto, tail_start_id}` marker; the
// summary itself is an ordinary assistant row, as in V1).
//
// WHAT MAKES THIS NOT THE OPENCODE ADAPTER is the user rows it must not render: ZCode injects
// context as synthetic USER messages — 5,753 of them on this machine, which is why this file
// exists instead of an alias. They are flagged four ways, all verified on the live store:
// `synthetic: true`, `visibility: "model-only"` (top-level, or under `metadata`),
// `semantics.transcriptVisibility: "hidden"` (the literal instruction not to log it), and
// `semantics.origin` other than `"real_user"` (`agent_runtime`, `system`). Rendering one as
// speech would put words in the operator's mouth — the one thing a journal adapter may never do,
// so the drops happen at the message AND at the part level (a synthetic part can ride a real
// message). An assistant row is not origin-checked because `agent_runtime` is every assistant
// row's normal spelling (69,513/69,513).
//
// WHERE HERDR'S ID COMES FROM: piz reports its own session — a live pane record carries
// `agent_session: {source:"piz", agent:"piz", kind:"id", value:"sess_<uuid>"}` (2026-10-27), the
// `session.id` verbatim, so no discovery is needed and none is implemented.
//
// SECURITY (the same rules opencode.ts documents, and for the same reason — this database also
// holds tables this adapter must never read): only `session`, `message` and `part` are queried;
// the database is opened READONLY with bound parameters only; the session id is regex-validated
// before it can reach a query; and the file is the fixed `db.sqlite` inside a configured root,
// passed through `containedRealpath` anyway.
//
// Run `bun scripts/journal-probe.ts` after touching this file — it resolves and parses real
// sessions off the live database, which is the drift check this fork has (P007: no suite).

import { Database } from "bun:sqlite";
import { join } from "node:path";

import type { JsonObject, JsonValue } from "../json.ts";
import { asRecord } from "./cache-probe.ts";
import {
  parseWith,
  createUnknownCounter,
  type KnownTypes,
  NO_CHANGE,
  noQueue,
  notePartType,
  type Reduction,
  type RowReducer,
} from "./reduce.ts";
import {
  type Cursor,
  decodeCursor,
  encodeCursor,
  NO_CURSOR,
  type ReadSince,
} from "./cursor.ts";
import {
  containedRealpath,
  FIRST_TAIL_BYTES,
  FIRST_TAIL_ROWS,
  MAX_TRANSCRIPT_BYTES,
  rootList,
} from "./files.ts";
import { opencodePart } from "./opencode.ts";
import type {
  AgentSessionRef,
  JournalAdapter,
  TranscriptEntry,
  TranscriptPart,
  TranscriptSource,
} from "./types.ts";

/** The one file in the root we ever open. Constant — never built from anything a ref carries. */
const DB_FILE = "db.sqlite";

/**
 * `sess_` + the rest: `sess_<uuid>` roots, `sess_subagent_agent_<hex>` children, and the odd
 * `sess_send-input-steer` plumbing row — all observed live. The charset still refuses `/`, `#`
 * and `..`, though the id only ever rides a parameterized `?` binding: the pattern is a refusal
 * of garbage keys, not a path guard (the db filename is the fixed one).
 */
const SESSION_ID_RE = /^sess_[0-9a-z_-]{4,80}$/i;

export function isPizSessionId(value: string): boolean {
  return SESSION_ID_RE.test(value);
}

/**
 * The adapter's own key format: `<realDbPath>#<sessionId>` — the virtual key opencode.ts
 * documents (one database backs every session, so a bare path would collapse them all onto one
 * TranscriptStore entry). `splitPizKey` is adapter-internal by the same design.
 */
export function pizKey(dbPath: string, sessionId: string): string {
  return `${dbPath}#${sessionId}`;
}

/** `lastIndexOf` because a directory may legitimately contain `#` while a validated id never can. */
export function splitPizKey(key: string): { dbPath: string; sessionId: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0) return null;
  const dbPath = key.slice(0, at);
  const sessionId = key.slice(at + 1);
  return isPizSessionId(sessionId) ? { dbPath, sessionId } : null;
}

/**
 * Open the database read-only and run `fn`, closing it either way. Null on an UNOPENABLE file —
 * the ordinary negative for resolve()'s root walk (a root without its db cannot host the
 * session). `fn`'s own errors PROPAGATE: a query failure in stat/load is schema drift or
 * corruption, and swallowing it here is how a real store once read as "no history" (devin.ts
 * holds the full rationale). The history route answers an error loudly instead of an empty page.
 */
function withDb<T>(dbPath: string, fn: (db: Database) => T): T | null {
  let db: Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    return null;
  }
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

interface CountRow {
  c: number;
  m: number;
}

/** What a session's row counts stand in for, in place of a file's size + mtime. */
type SessionMeta = { size: number; mtimeMs: number };

/**
 * Row COUNT stands in for "size" and the newest `time_updated` for mtime — `part.time_updated`
 * climbs while a reply streams (opencode.ts's measurement on the same schema: +497 ms over five
 * streaming seconds), so a live session invalidates on every poll while a finished one stays
 * cached, exactly the behaviour a file's mtime gives the other adapters.
 */
function sessionMeta(db: Database, sessionId: string): SessionMeta {
  const msg = db
    .query<CountRow, [string]>(
      "select count(*) c, coalesce(max(time_updated),0) m from message where session_id = ?",
    )
    .get(sessionId);
  const part = db
    .query<CountRow, [string]>(
      "select count(*) c, coalesce(max(time_updated),0) m from part where session_id = ?",
    )
    .get(sessionId);
  return {
    size: (msg?.c ?? 0) + (part?.c ?? 0),
    mtimeMs: Math.max(msg?.m ?? 0, part?.m ?? 0),
  };
}

/** Parse a `data` column, or null when it isn't json. The row still renders what it can. */
function parseData(raw: string | null): JsonValue {
  if (typeof raw !== "string") return null;
  try {
    // SAFETY: `JSON.parse` output IS a JsonValue by construction — string/number/boolean/null or
    // an array/object of those. It is re-serialised into the composed line right after this.
    return JSON.parse(raw) as JsonValue;
  } catch {
    return null;
  }
}

interface MessageRow {
  id: string;
  time_created: number;
  /**
   * The clock the live cursor counts: `time_updated` ticks while a reply streams, so "what is
   * new" is "which rows were touched" (opencode.ts § "the live read" — same schema, same answer).
   * Nullable in the schema, so every comparison goes through `coalesce`.
   */
  time_updated: number | null;
  data: string | null;
}

interface PartRow {
  id: string;
  message_id: string;
  /** A part's own clock, which is the one that moves while a reply streams. See {@link MessageRow}. */
  time_updated: number | null;
  data: string | null;
}

/** One composed JSONL line — the text `parse()` reads, once it has parsed to an object at all. */
type PizLine = JsonObject;

/**
 * The columns every read selects, whole-session or live. ONE list rather than one per query,
 * because the composed line must not depend on which read produced it: a live read and a History
 * read of the same turn have to be the same text (opencode.ts § {@link V1_MESSAGE_COLUMNS}).
 */
const MESSAGE_COLUMNS = "id, time_created, time_updated, data";
const PART_COLUMNS = "id, message_id, time_updated, data";

/**
 * The rows as composed lines: one per message, its parts nested.
 *
 * The line format is opencode's V1 line verbatim — `{id, ts, data, parts:[{id, data}]}` — chosen
 * for the same reason: the source produces text, the parser reads text, and no test needs a
 * database to pin the grammar.
 */
function linesFor(messages: readonly MessageRow[], parts: readonly PartRow[]): string[] {
  const byMessage = new Map<string, PartRow[]>();
  for (const p of parts) {
    const list = byMessage.get(p.message_id);
    if (list === undefined) byMessage.set(p.message_id, [p]);
    else list.push(p);
  }

  return messages.map((m) =>
    JSON.stringify({
      id: m.id,
      ts: m.time_created,
      data: parseData(m.data),
      parts: (byMessage.get(m.id) ?? []).map((p) => ({ id: p.id, data: parseData(p.data) })),
    }),
  );
}

/**
 * One `message` row per turn, its `part` rows joined by message id, both ordered by `sequence` —
 * the authored per-session order (fully populated and unique per session on this store), which a
 * wall-clock column cannot promise: two rows may share a millisecond, never a sequence.
 */
function composeLines(db: Database, sessionId: string): string[] {
  const messages = db
    .query<MessageRow, [string]>(
      `select ${MESSAGE_COLUMNS} from message where session_id = ? order by sequence, id`,
    )
    .all(sessionId);
  const parts = db
    .query<PartRow, [string]>(
      `select ${PART_COLUMNS} from part where session_id = ? order by sequence, id`,
    )
    .all(sessionId);
  return linesFor(messages, parts);
}

/**
 * Keep the NEWEST lines that fit under the byte cap — the same "keep the tail" policy `loadTail`
 * applies to a file, applied to composed text instead.
 */
type ClippedText = { text: string; complete: boolean };

function clipToCap(lines: string[]): ClippedText {
  const start = clipStart(lines, MAX_TRANSCRIPT_BYTES);
  return { text: lines.slice(start).join("\n"), complete: start === 0 };
}

/**
 * Index of the oldest line that still fits under `bytes`, counting from the newest back. Split
 * out of {@link clipToCap} for the live read, which keeps the same tail policy at its own
 * smaller bound and needs the LINES rather than one joined text.
 */
function clipStart(lines: readonly string[], bytes: number): number {
  let total = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    total += Buffer.byteLength(lines[i]!) + 1; // +1 for the joining newline
    if (total > bytes) return i + 1;
  }
  return 0;
}

// ── The live read ────────────────────────────────────────────────────────────
//
// The cursor counts `time_updated`, not a row id: this schema MUTATES a part row in place while
// a reply streams, so "what is new" is "which rows were touched". The comparison is `>=` for the
// reason opencode.ts documents — two rows can share a millisecond and `>` would drop one written
// in the cursor's own millisecond for good. A live read therefore re-emits the newest row, and a
// caller holding its half-streamed copy replaces by `uuid` rather than appending.

/** What one live read got out of the database. */
interface SinceRows {
  lines: string[];
  /** The newest `time_updated` among the rows READ, including any the reducer will drop. */
  position: number;
  /** How many message rows the query returned — the LIMIT's own verdict, for `fromStart`. */
  read: number;
}

/** The newest touch across some rows, or `fallback` when none of them carried one. */
function newestTouch(rows: readonly { time_updated: number | null }[], fallback: number): number {
  let newest = fallback;
  for (const row of rows) if ((row.time_updated ?? 0) > newest) newest = row.time_updated ?? 0;
  return newest;
}

/** The messages a cursor has not seen, or the newest `limit` when it holds none. */
function composeSince(db: Database, sessionId: string, at: number | null, limit: number): SinceRows {
  const messages =
    at === null
      ? db
          .query<MessageRow, [string, number]>(
            `select ${MESSAGE_COLUMNS} from message where session_id = ? order by sequence desc, id desc limit ?`,
          )
          .all(sessionId, limit)
          .toReversed()
      : db
          .query<MessageRow, [string, number, string, number, number]>(
            // EITHER end of a message may have moved: the message row's own clock, or one of its
            // parts', which is the one that ticks while the reply streams. The whole message is
            // re-composed with all its parts either way, because a caller replacing a turn by uuid
            // needs the whole turn, not the piece that changed.
            `select ${MESSAGE_COLUMNS} from message where session_id = ?
               and (coalesce(time_updated, 0) >= ?
                    or id in (select message_id from part where session_id = ? and coalesce(time_updated, 0) >= ?))
             order by sequence, id limit ?`,
          )
          .all(sessionId, at, sessionId, at, limit);

  // The parts of exactly the messages selected above — a placeholder per id rather than a second
  // copy of the selection (the ids are already in hand and bounded by `limit`).
  const ids = messages.map((m) => m.id);
  const parts =
    ids.length === 0
      ? []
      : db
          .query<PartRow, string[]>(
            `select ${PART_COLUMNS} from part where session_id = ? and message_id in (${ids.map(() => "?").join(",")}) order by sequence, id`,
          )
          .all(sessionId, ...ids);

  return {
    lines: linesFor(messages, parts),
    position: newestTouch(parts, newestTouch(messages, at ?? 0)),
    read: messages.length,
  };
}

// ── The grammar ──────────────────────────────────────────────────────────────

/**
 * A part ZCode wrote but that is not speech: the message-level injection flags have a part-level
 * spelling (`synthetic: true` on `data`), and a real user message can carry such a block beside
 * its real text — so the drop happens here too, not only at the row. Everything else delegates
 * to `opencodePart`, whose V1 part grammar this store shares exactly: `text`, `reasoning`,
 * `tool`, `patch`, `file` render; `step-start`, `step-finish`, `timeline`, `compaction` decline
 * there by name and are counted as known instead (no invented rendering for bookkeeping rows).
 */
function pizPart(data: JsonValue | undefined): TranscriptPart | null {
  if (data !== null && data !== undefined && typeof data === "object" && !Array.isArray(data) && data.synthetic === true) {
    return null;
  }
  return opencodePart(data);
}

/**
 * Every role and part type this adapter has MET, rendered or dropped (`reduce.ts` § "what a
 * reducer reports about what it could not read"). Measured on 2026-10-27 over the whole local
 * database (77,883 messages, 322,307 parts) — the complete inventory it carries. `rows` is empty
 * BY FORMAT: a composed line is `{id, ts, data, parts}` and has no row-kind field, so `data.role`
 * is the only thing that says what a row is. `timeline`, `file` and `compaction` are piz's extra
 * rows beside V1's five; `patch` is admitted on V1's evidence (none observed here yet — listing
 * it keeps the day it appears from reading as an unknown).
 */
const PIZ_KNOWN: KnownTypes = {
  rows: [],
  roles: ["user", "assistant", "summary"],
  parts: ["text", "reasoning", "tool", "step-start", "step-finish", "patch", "file", "compaction", "timeline"],
};

/** A compaction summary: the assistant message a compaction writes in place of the history. */
function isCompaction(message: JsonObject): boolean {
  return message.mode === "compaction" || message.summary === true;
}

/** ISO timestamp from `data.time.created`, falling back to the message row's `time_created`. */
function isoFrom(time: JsonValue | undefined, fallback: JsonValue | undefined): string {
  const fromTime =
    time !== null && time !== undefined && typeof time === "object" && !Array.isArray(time)
      ? time.created
      : undefined;
  const created =
    typeof fromTime === "number" ? fromTime : typeof fallback === "number" ? fallback : null;
  if (created === null) return "";
  const d = new Date(created);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/**
 * Parse composed piz JSONL into oldest-first turns. PURE — no fs, no clock.
 *
 * `uuid` is the MESSAGE ID: the schema gives every message a stable primary key, so there is
 * nothing to synthesise for paging. Unparseable lines are skipped for the same reason every
 * other adapter skips them — the byte cap clips the head line mid-object by construction.
 */
export function parsePizTranscript(text: string): TranscriptEntry[] {
  return parseWith(createPizReducer(), text);
}

/**
 * The same reading, one row at a time (see `reduce.ts`).
 *
 * STATELESS BY FORMAT, exactly as opencode's V1 lane is and for the same reason: a composed line
 * holds a WHOLE message with its parts, and a tool's result sits on the call's own part
 * (`state.output`) — no row can fold anything into a turn already handed over, so `changed` is
 * always the empty set. What a live window must be built against instead is that THIS SCHEMA
 * MUTATES: the next composition of the same live session carries a message id again with more
 * parts on it, and a stateless reducer emits it twice, both times as `added`. A caller replaces
 * by `uuid`, never appends — opencode.ts's reducer comment states the same contract at length.
 */
export function createPizReducer(): RowReducer {
  const unknown = createUnknownCounter(PIZ_KNOWN);

  function push(line: string): Reduction {
    const entries: TranscriptEntry[] = [];
    if (line.trim() === "") return NO_CHANGE;
    let parsed: JsonValue;
    try {
      // SAFETY: `JSON.parse` output IS a JsonValue by construction — and this line was composed by
      // `composeLines` above, so it is our own JSON.stringify round-tripping.
      parsed = JSON.parse(line) as JsonValue;
    } catch {
      return NO_CHANGE; // a torn row, or the head line a byte cap clipped mid-object
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return NO_CHANGE;
    const row: PizLine = parsed;
    const rawData = row.data;
    const data: JsonObject =
      rawData !== null && rawData !== undefined && typeof rawData === "object" && !Array.isArray(rawData)
        ? rawData
        : {};

    // Roles are matched EXPLICITLY, never "assistant or else user" — an unmodelled role is
    // plumbing, and rendering it as speech would put words in the operator's mouth. `summary`
    // admits the compaction entry `isCompaction` produces below (V1 has no literal summary role
    // either; the day ZCode writes one is the day this reads it).
    // At the READ, not in the branch that declined (`reduce.ts` § `createUnknownCounter`).
    unknown.role(data.role);
    if (data.role !== "user" && data.role !== "assistant" && data.role !== "summary") return NO_CHANGE;
    // Injected context, not speech — the header documents each flag (5,753 rows on this host).
    // `synthetic` and `visibility: "model-only"` (top-level or under `metadata`) mark the same set
    // outright on any role; `transcriptVisibility: "hidden"` is the literal instruction not to log.
    if (data.synthetic === true || data.visibility === "model-only") return NO_CHANGE;
    const metadata = asRecord(data.metadata);
    if (metadata !== null && metadata.visibility === "model-only") return NO_CHANGE;
    const semantics = asRecord(data.semantics);
    if (semantics !== null && semantics.transcriptVisibility === "hidden") return NO_CHANGE;
    // `semantics.origin` discriminates only on USER rows: "real_user" is the pane's typist, while
    // `agent_runtime`/`system` are the runtime writing to itself — and `agent_runtime` is also
    // every assistant row's normal spelling (69,513/69,513), so the check must not apply there.
    if (data.role === "user") {
      const origin = semantics?.origin;
      if (typeof origin === "string" && origin !== "real_user") return NO_CHANGE;
    }
    // V1 writes the compaction's own summary as an ASSISTANT message wearing `mode: "compaction"`
    // (or the older `summary: true`); its prose sits in an ordinary `text` part, and the
    // transcript vocabulary has a role for exactly that (opencode.ts § isCompaction).
    const role = data.role === "assistant" && isCompaction(data) ? "summary" : data.role;

    const parts: TranscriptPart[] = [];
    if (Array.isArray(row.parts)) {
      for (const p of row.parts) {
        if (p === null || typeof p !== "object" || Array.isArray(p)) continue;
        // Counted for EVERY part, before `pizPart`'s answer: a null there means either a part type
        // declined by name or an empty one of a type it renders, and the known list is what tells
        // those from a type nobody has looked at.
        notePartType(unknown, p.data);
        const part = pizPart(p.data);
        if (part !== null) parts.push(part);
      }
    }
    // Every part was bookkeeping (a lone step-start/step-finish/timeline message) — nothing to
    // render, and this format folds nothing, so a row with nothing to show did nothing at all.
    if (parts.length === 0) return NO_CHANGE;

    entries.push({
      uuid: typeof row.id === "string" ? row.id : "",
      ts: isoFrom(data.time, row.ts),
      role,
      parts,
    });
    return { added: entries, changed: NO_CHANGE.changed };
  }

  // No queue in this format's log: see `RowReducer.queued`.
  return { push, unknowns: unknown.tally, queued: noQueue };
}

// ── The source ────────────────────────────────────────────────────────────────

/**
 * SQLite source rooted at piz's `cli/db` dir.
 *
 * Every method takes the virtual key `resolve()` produced (see {@link pizKey}) and splits it,
 * because one database backs every session on the machine.
 */
export class PizTranscriptSource implements TranscriptSource {
  private readonly roots: string[];

  constructor(roots: string | readonly string[]) {
    this.roots = rootList(roots);
  }

  async resolve(ref: AgentSessionRef): Promise<string | null> {
    if (ref.kind !== "id" || !isPizSessionId(ref.value)) return null;
    for (const root of this.roots) {
      // Null here is "no database, or this root's db.sqlite is symlinked out of it" — either way
      // the root has nothing it may serve, and the next one is asked on its own terms.
      const path = await containedRealpath(join(root, DB_FILE), root);
      if (path === null) continue;
      let found: { id: string } | null | undefined;
      try {
        found = withDb(path, (db) =>
          db.query<{ id: string }, [string]>("select id from session where id = ?").get(ref.value),
        );
      } catch {
        // An unreadable sessions table disqualifies this ROOT, not the request — keep walking.
        continue;
      }
      if (found !== null && found !== undefined) return pizKey(path, ref.value);
    }
    return null;
  }

  async stat(key: string): Promise<{ size: number; mtimeMs: number } | null> {
    const parts = splitPizKey(key);
    if (parts === null) return null;
    return withDb(parts.dbPath, (db) => sessionMeta(db, parts.sessionId));
  }

  async load(key: string): Promise<{ text: string; complete: boolean; size: number; mtimeMs: number }> {
    const empty = { text: "", complete: true, size: 0, mtimeMs: 0 };
    const parts = splitPizKey(key);
    if (parts === null) return empty;
    return (
      withDb(parts.dbPath, (db) => {
        const meta = sessionMeta(db, parts.sessionId);
        const clipped = clipToCap(composeLines(db, parts.sessionId));
        return { ...clipped, ...meta };
      }) ?? empty
    );
  }

  /**
   * What is new in this session since `cursor` (see "the live read" above for what it counts).
   *
   * A read that cannot be resumed answers with the newest {@link FIRST_TAIL_ROWS} turns, clipped
   * to {@link FIRST_TAIL_BYTES}, and `reset: true`. An unreadable database or a session that
   * vanished between resolve and read HOLDS the caller's cursor and reports nothing new — the
   * same stance a file whose `stat` lost a race takes.
   */
  async readSince(key: string, cursor: Cursor): Promise<ReadSince> {
    const held: ReadSince = { lines: [], cursor, reset: false, fromStart: false };
    const parts = splitPizKey(key);
    if (parts === null) return { lines: [], cursor: NO_CURSOR, reset: false, fromStart: false };
    const at = decodeCursor(cursor, "updated", key);
    return (
      withDb(parts.dbPath, (db) => {
        const { lines, position, read } = composeSince(
          db,
          parts.sessionId,
          at,
          FIRST_TAIL_ROWS,
        );
        const next = encodeCursor("updated", key, position);
        // The clip only ever applies to a reset. Clipping an INCREMENTAL read would drop rows off
        // the head of the delta while the cursor moved past them; the incremental read is bounded
        // by `limit` instead, and what does not fit arrives next tick.
        if (at !== null) return { lines, cursor: next, reset: false, fromStart: false };
        const start = clipStart(lines, FIRST_TAIL_BYTES);
        // BOTH bounds have to have stood down for this to be the session's start: the row limit
        // did not bite, and the byte clip dropped nothing. Either one biting means an older turn.
        return {
          lines: lines.slice(start),
          cursor: next,
          reset: true,
          fromStart: start === 0 && read < FIRST_TAIL_ROWS,
        };
      }) ?? held
    );
  }
}

/** piz's journal adapter. `agent` matches the Herdr snapshot's `agent` string. */
export function pizJournal(roots: string | readonly string[]): JournalAdapter {
  return {
    agent: "piz",
    source: new PizTranscriptSource(roots),
    parse: parsePizTranscript,
    reducer: createPizReducer,
  };
}
