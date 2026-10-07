// Devin's journal adapter.
//
// SHAPE OF THE SOURCE (verified against a real on-disk store, 2026-10-08, devin 3000.11):
//   ~/.local/share/devin/cli/sessions.db        ← the ACTIVE store (9 GB on this host)
//   ~/.local/share/devin/cli-next/sessions.db   ← a dormant older channel (dual roots, like pi)
// One SQLite database per root. `sessions` keys sessions by word-pair ids (`morning-faucet` — all
// 1,669 ids on this host are exactly `[a-z0-9]+-[a-z0-9]+`), each row naming the TAIL node of the
// session's current branch in `main_chain_id`. `message_nodes` is an append-only TREE: every row is
// one node (`row_id` insertion counter, `node_id` unique per session, `parent_node_id`), and the
// conversation is the path from the root down to `main_chain_id`. Rewinds and regenerated turns are
// new siblings, never rewrites — the same shape pi's one-log-many-branches has, which is why this
// adapter reads like pi.ts where the other SQLite adapter (hermes.ts) reads like a flat table.
//
//   chat_message = {"message_id", "role": user|assistant|system|tool, "content": <plain text>,
//                   "tool_calls": [{id, name, kind, arguments<object>}]?, "tool_call_id"?,
//                   "metadata": {finish_reason: stop|tool_calls?, …}}
//
// `system` nodes are per-message PREFIX nodes (a system node is the parent of the message it
// prefixes; `metadata.is_system_prefix` marks the same fact at the column level) — dropped here
// exactly as pi's context injection is dropped, by name. An assistant turn spans several nodes
// sharing one `message_id` (one per model generation; `finish_reason` says how each ended), each
// rendered as its own entry. `rendered_commits` (the TUI's own HTML) and `prompt_history` are
// deliberately not read: the first is a display cache, the second a duplicate of user input.
//
// WHY on_chain IS COMPUTED IN SQL, NOT INFERRED. The session row names the current branch, so a
// query can label every node ON or OFF it authoritatively at read time — pi has to infer the branch
// from arrival order because its log carries no such pointer. The label becomes the entry's initial
// `abandoned` flag (types.ts § TranscriptEntry: a view hides it, a `?before=` cursor still resolves
// it). The reducer then keeps pi's chain of parent links so a LIVE window hears about a rewind from
// the row that announces it: a row arriving parented at an ancestor is a rewind, and everything
// after that ancestor left the conversation — flipped in place and named in `changed`, unmarked
// again if the branch is ever rewound BACK onto. Off-chain rows (subagent trees, speculative
// branches) are held in the chain for the walk but never move its leaf, so they cannot poison it.
//
// Run `bun scripts/journal-probe.ts` after touching this file — the unit fixtures pin the grammar,
// the probe catches on-disk drift, and hermes' history is exactly why that pairing exists (upstream
// once built a fixture from the adapter's own SELECT, so a column that never existed passed every
// test). The database is opened read-only and the fixed filename is confined to the configured
// root before opening, exactly as hermes.ts does.

import { Database } from "bun:sqlite";
import { join } from "node:path";

import type { JsonObject, JsonValue } from "../json.ts";
import {
  parseWith,
  createUnknownCounter,
  type KnownTypes,
  NO_CHANGE,
  noQueue,
  type PendingTool,
  reduction,
  rememberPending,
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
import { clamp, MAX_RESULT_CHARS, MAX_TEXT_CHARS, stripAnsi, summarizeToolInput } from "./text.ts";
import { classifyToolCall } from "./tool-call.ts";
import type {
  AgentSessionRef,
  JournalAdapter,
  TranscriptEntry,
  TranscriptPart,
  TranscriptSource,
} from "./types.ts";

const DB_FILE = "sessions.db";
/** Word-pair ids (`morning-faucet`) — every one of the 1,669 on this host is exactly that shape.
 *  Validated before the id reaches a query, though it only ever rides a parameterized `?` binding:
 *  the pattern is a refusal of garbage keys, not a path guard (the db filename is the fixed one). */
const SESSION_ID_RE = /^[a-z0-9]+(-[a-z0-9]+)+$/;

export function isDevinSessionId(value: string): boolean {
  return SESSION_ID_RE.test(value);
}

export function devinKey(dbPath: string, sessionId: string): string {
  return `${dbPath}#${sessionId}`;
}

export function splitDevinKey(key: string): { dbPath: string; sessionId: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0) return null;
  const dbPath = key.slice(0, at);
  const sessionId = key.slice(at + 1);
  return isDevinSessionId(sessionId) ? { dbPath, sessionId } : null;
}

function withDb<T>(dbPath: string, fn: (db: Database) => T): T | null {
  let db: Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    // An unopenable database is an ordinary negative for resolve()'s root walk (a root without its
    // db simply cannot host the session). Deliberately silent, same stance as hermes.ts.
    return null;
  }
  try {
    // fn's own errors PROPAGATE: a query failure in stat/load is schema drift or corruption, and
    // swallowing it here is how a real store once read as "no history". The history route answers
    // an error loudly instead of an empty page.
    return fn(db);
  } finally {
    db.close();
  }
}

function isoTimestamp(value: number): string {
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

// ── The one query, in pieces ───────────────────────────────────────────────────
//
// The whole-session read and the live read must select the SAME columns in the SAME order, because
// the composed line here is literally `JSON.stringify(row)` — a column list that drifted between
// the two would make a History read and a live read of one turn two different texts. So the query
// is assembled from pieces rather than written twice (the discipline hermes.ts established).
//
// `chat_message`'s three fields are read with json_extract inside the database, which MALFORMED JSON
// fails loudly — a torn row is corruption this adapter reports rather than trims. The `on_chain`
// label is the session row's own branch pointer walked to the root: `union` deduplication is not
// needed because the tree is a tree, but the depth bound stands guard against a corrupted cycle
// turning the walk into a loop. The names are whitelisted constants — nothing user-controlled ever
// reaches the SQL text, and ids ride parameterized `?` bindings.

/** The current branch: every node from `main_chain_id` back to the session's root. */
const CHAIN_CTE = `with recursive chain(node_id, depth) as (
    select main_chain_id, 0 from sessions where id = ?
    union all
    select m.parent_node_id, chain.depth + 1
    from message_nodes m join chain on m.node_id = chain.node_id
    where m.session_id = ? and m.parent_node_id is not null and chain.depth < 10000)`;

/** The projected node row both reads compose their lines from. */
const NODE_SELECT = `select mn.row_id as row_id, mn.node_id as node_id, mn.parent_node_id as parent_node_id,
    json_extract(mn.chat_message, '$.role') as role,
    json_extract(mn.chat_message, '$.content') as content,
    json_extract(mn.chat_message, '$.tool_calls') as tool_calls,
    json_extract(mn.chat_message, '$.tool_call_id') as tool_call_id,
    mn.created_at as created_at,
    (mn.node_id in (select node_id from chain)) as on_chain
  from message_nodes mn`;

interface NodeRow {
  row_id: number;
  node_id: number;
  parent_node_id: number | null;
  role: string | null;
  content: string | null;
  /** The `chat_message.tool_calls` array, as JSON text — parsed by the reducer, never by SQL. */
  tool_calls: string | null;
  tool_call_id: string | null;
  created_at: number;
  /** 1 when the node sits on the session's current branch (see CHAIN_CTE), else 0. */
  on_chain: number;
}

/** The CTE's two bindings, then the main query's own — parameter order is the compose site's job. */
type ChainParams = [sessionId: string, sessionIdAgain: string];

function composeLines(db: Database, sessionId: string): string[] {
  const rows = db
    .query<NodeRow, [...ChainParams, string]>(
      `${CHAIN_CTE} ${NODE_SELECT} where mn.session_id = ? order by mn.row_id`,
    )
    .all(sessionId, sessionId, sessionId);
  return rows.map((row) => JSON.stringify(row));
}

/** The newest row_id among some rows, or `fallback` when there were none. */
function newestRowId(rows: readonly NodeRow[], fallback: number): number {
  let newest = fallback;
  for (const row of rows) if (row.row_id > newest) newest = row.row_id;
  return newest;
}

function clipLines(lines: string[]) {
  const start = clipStart(lines, MAX_TRANSCRIPT_BYTES);
  return { text: lines.slice(start).join("\n"), complete: start === 0 };
}

/**
 * Index of the oldest line that still fits under `bytes`, counting from the newest back.
 *
 * Split out of {@link clipLines} for the live read, which keeps the same "keep the tail" policy at
 * its own smaller bound and needs the LINES rather than one joined text.
 */
function clipStart(lines: readonly string[], bytes: number): number {
  let total = 0;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    total += Buffer.byteLength(lines[i]!) + 1;
    if (total > bytes) return i + 1;
  }
  return 0;
}

// ── The grammar ───────────────────────────────────────────────────────────────

function textPart(raw: string | null): TranscriptPart | null {
  if (typeof raw !== "string") return null;
  const text = stripAnsi(raw);
  return text.trim() === "" ? null : { kind: "text", ...clamp(text, MAX_TEXT_CHARS) };
}

/** One row of `chat_message.tool_calls`, once JSON.parse has admitted it is an object at all. */
function toolCallPart(call: JsonObject): TranscriptPart | null {
  const name = typeof call.name === "string" && call.name !== "" ? call.name : "tool";
  // Devin passes `arguments` as a real object (like pi, unlike Hermes' JSON string) — no parse
  // needed, and a non-object `arguments` simply summarises as nothing rather than throwing.
  const args = call.arguments;
  const summary = summarizeToolInput(args);
  const part: Extract<TranscriptPart, { kind: "tool" }> = {
    kind: "tool",
    name,
    summary,
    call: classifyToolCall(name, args, summary),
  };
  // The call's OWN id, not the node row's: a `tool` node answering this call repeats it in
  // `tool_call_id`, so this is the only field that pairs the two. `uuid` already carries the row.
  if (typeof call.id === "string" && call.id !== "") part.id = call.id;
  return part;
}

function toolCallParts(raw: string | null): TranscriptPart[] {
  if (raw === null) return [];
  let parsed: JsonValue;
  try {
    // SAFETY: JSON.parse returns only JSON primitives, arrays, and objects; JsonValue names that exact boundary.
    parsed = JSON.parse(raw) as JsonValue;
  } catch {
    return []; // a torn row; the live read hands back complete lines, so this is drift, not a fragment
  }
  if (!Array.isArray(parsed)) return [];
  const parts: TranscriptPart[] = [];
  for (const call of parsed) {
    if (call === null || typeof call !== "object" || Array.isArray(call)) continue;
    const part = toolCallPart(call);
    if (part !== null) parts.push(part);
  }
  return parts;
}

function isNodeRow(value: JsonValue): value is JsonObject & NodeRow {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  // SAFETY: JsonValue's object branch is JsonObject by definition; the two fields that anchor a
  // node's identity (and that SQL always produces) are narrowed here, the rest at their reads.
  const row = value as JsonObject;
  return typeof row.row_id === "number" && typeof row.node_id === "number";
}

/**
 * Every role this adapter has MET, rendered or dropped (`reduce.ts` § "what a reducer reports about
 * what it could not read"). Anything else is counted and named — the canary's gate reads this, and
 * a devin that grows a fifth role should surface as a named unknown, not as silence.
 *
 * Live-verified against the real store (2026-10-08): exactly these four, over every node of the
 * two newest sessions. `rows` is empty because a node has no type column (hermes' shape), and
 * `parts` is empty because `content` is a plain string with no blocks to count — the format speaks.
 */
const DEVIN_KNOWN: KnownTypes = { rows: [], roles: ["user", "assistant", "system", "tool"], parts: [] };

/**
 * How many nodes of the branch chain a reducer remembers — pi's {@code BRANCH_MAX} verbatim, for
 * its reason: without a bound this is the thing that grows for the life of a session. Eviction is
 * oldest-first and sound because the tree is append-only: every ancestor of a node is older than
 * the node, so the ids that fall off are the ones whose turns the window has already trimmed.
 */
const BRANCH_MAX = 8192;

/** One node of the chain: what it hangs off, and the turns it put on screen. */
interface BranchLink {
  parentId: string | null;
  entries: TranscriptEntry[];
}

export function parseDevinTranscript(text: string): TranscriptEntry[] {
  return parseWith(createDevinReducer(), text);
}

export function createDevinReducer(): RowReducer {
  // toolCall id → the part awaiting its result and the turn it went out in, so a later `tool` node
  // lands on its own call and can name where that call is drawn.
  const pendingTools = new Map<string, PendingTool>();
  // What this reducer met and had no branch for, asked for once per session by the canary.
  const unknown = createUnknownCounter(DEVIN_KNOWN);

  // ── THE BRANCH CHAIN ────────────────────────────────────────────────────────
  // Every node names its parent, and the session's current branch is the path from its tail (the
  // session row's `main_chain_id`) back to a root. A node whose parent is not the current leaf is
  // a rewind, and everything that hung off the old leaf has left the conversation — ANNOUNCED by
  // the row that arrives, which is what makes it expressible in a forward-only reducer at all.
  //
  // The chain holds EVERY node, on-branch or off: a row emitted off-branch may be the ancestor a
  // later rewind lands on, and the walk below must be able to step through it or that rewind would
  // abandon the very turns it came back for. Only ON-CHAIN rows move the leaf, though — a
  // subagent's or a speculative node arriving must never read as the conversation forking.
  const chain = new Map<string, BranchLink>();
  let leaf: string | null = null;

  /** Remember this node, and if it rewound, flip the flags the rewind changed. */
  function link(row: NodeRow, entries: TranscriptEntry[], changed: Set<string>): void {
    const rowId = String(row.node_id);
    const parentId = row.parent_node_id === null ? null : String(row.parent_node_id);
    if (row.on_chain !== 0 && parentId !== leaf) {
      // The path from the new parent back to a root. A parent the chain does not hold (including
      // `null`, a new root) yields an empty path, so everything held has left — which for a tail
      // read that starts mid-conversation is simply the truth about nothing it is holding yet.
      const keep = new Set<string>();
      for (let at = parentId; at !== null && !keep.has(at); at = chain.get(at)?.parentId ?? null) {
        if (!chain.has(at)) break;
        keep.add(at);
      }
      for (const [id, held] of chain) {
        const off = !keep.has(id);
        for (const entry of held.entries) {
          if (off && entry.abandoned !== true) {
            entry.abandoned = true;
            changed.add(entry.uuid);
          } else if (!off && entry.abandoned === true) {
            delete entry.abandoned;
            changed.add(entry.uuid);
          }
        }
      }
    }
    chain.set(rowId, { parentId, entries });
    if (row.on_chain !== 0) leaf = rowId;
    if (chain.size > BRANCH_MAX) {
      const oldest = chain.keys().next().value;
      if (oldest !== undefined) chain.delete(oldest);
    }
  }

  /** What one node puts on screen, folding any result onto the call that asked for it. */
  function draw(
    row: NodeRow,
    uuid: string,
    ts: string,
    entries: TranscriptEntry[],
    changed: Set<string>,
  ): void {
    const role = row.role;
    // At the READ, not in the branch that declined (`reduce.ts` § `createUnknownCounter`): a role
    // this list does not carry must be counted wherever the row ends up, not only where it renders.
    unknown.role(role);

    if (role === "system") {
      // The per-message prefix node: injected context, not speech, and NOT collapsed into `user`
      // (the same refusal pi's system role gets). It is still a LINK in the chain — it is the
      // parent of the very message it prefixes, and dropping it would hole the walk.
      return;
    }

    if (role === "tool") {
      const id = row.tool_call_id ?? "";
      const target = id !== "" ? pendingTools.get(id) : undefined;
      const result = textPart(row.content);
      // `textPart`'s only non-null kind is text; the guard narrows for the reader as much as the
      // checker, because the two reads below want the string and not the part.
      const resultText = result !== null && result.kind === "text" ? clamp(result.text, MAX_RESULT_CHARS) : null;
      if (target !== undefined) {
        pendingTools.delete(id);
        // Devin's node carries no error flag and no refusal marker — nothing to distinguish a
        // failure or a "no" from output, so `result` is the text and nothing else is claimed.
        target.part.result = resultText ?? { text: "" };
        // The mutation landed in a turn that went out nodes ago. Name it.
        changed.add(target.uuid);
      } else if (resultText !== null) {
        // Orphan result (its call fell outside a tail-read window) — kept unattached so the window
        // never silently drops output. `note`, because a tool result is machine output, not speech.
        entries.push({
          uuid,
          ts,
          role: "note",
          parts: [{ kind: "tool", name: "tool", summary: "", result: resultText }],
        });
      }
      return;
    }

    if (role !== "user" && role !== "assistant") return;

    const parts: TranscriptPart[] = [];
    const content = textPart(row.content);
    if (content !== null) parts.push(content);
    // Every call in the array renders — devin issues parallel calls, and hiding all but the first
    // (hermes' single-part reading of the same field) would misreport a two-call turn.
    parts.push(...toolCallParts(row.tool_calls));
    if (parts.length === 0) return;
    entries.push({ uuid, ts, role, parts });
    for (const part of parts) {
      if (part.kind === "tool" && part.id !== undefined) {
        rememberPending(pendingTools, part.id, { part, uuid });
      }
    }
  }

  function push(line: string): Reduction {
    const entries: TranscriptEntry[] = [];
    const changed = new Set<string>();
    if (line.trim() === "") return NO_CHANGE;
    let raw: JsonValue;
    try {
      // SAFETY: JSON.parse returns only JSON primitives, arrays, and objects; JsonValue names that exact boundary.
      raw = JSON.parse(line) as JsonValue;
    } catch {
      return NO_CHANGE; // a torn row, or the head line a byte cap clipped mid-object
    }
    if (!isNodeRow(raw)) return NO_CHANGE;
    const uuid = String(raw.row_id);
    const ts = isoTimestamp(raw.created_at);
    draw(raw, uuid, ts, entries, changed);
    // The SQL's own branch label is the INITIAL flag: at read time the session row already says
    // whether this node is on the current branch, and a node that is not starts life hidden.
    if (raw.on_chain === 0) {
      for (const entry of entries) entry.abandoned = true;
    }
    // Unconditional, and after `draw`: a node that renders nothing is still somebody's parent, so
    // the chain has to hold it or the next rewind would walk past a hole and abandon the live branch.
    link(raw, entries, changed);
    // `reduction` rather than `NO_CHANGE` at the exit, because the folding branches above may have
    // named a turn without adding one, and spelling it this way means a later mutation cannot
    // silently lose its report.
    return reduction(entries, changed);
  }

  // No queue in this format's log: see `RowReducer.queued`.
  return { push, unknowns: unknown.tally, queued: noQueue };
}

// ── The source ────────────────────────────────────────────────────────────────

type SessionMeta = { size: number; mtimeMs: number };

function sessionMeta(db: Database, sessionId: string): SessionMeta {
  const row = db.query<{ count: number; newest: number }, [string]>(
    "select count(*) as count, coalesce(max(created_at), 0) as newest from message_nodes where session_id = ?",
  ).get(sessionId);
  return { size: row?.count ?? 0, mtimeMs: row?.newest ?? 0 };
}

export class DevinTranscriptSource implements TranscriptSource {
  private readonly roots: string[];

  constructor(roots: string | readonly string[]) {
    this.roots = rootList(roots);
  }

  async resolve(ref: AgentSessionRef): Promise<string | null> {
    if (ref.kind !== "id" || !isDevinSessionId(ref.value)) return null;
    for (const root of this.roots) {
      const path = await containedRealpath(join(root, DB_FILE), root);
      if (path === null) continue;
      let found: { id: string } | null | undefined;
      try {
        found = withDb(path, (db) =>
          db.query<{ id: string }, [string]>("select id from sessions where id = ?").get(ref.value),
        );
      } catch {
        // An unreadable sessions table disqualifies this ROOT, not the request — keep walking.
        // The resolve probe is a primary-key point lookup; any failure here is about the root.
        continue;
      }
      if (found !== null && found !== undefined) return devinKey(path, ref.value);
    }
    return null;
  }

  async stat(key: string): Promise<{ size: number; mtimeMs: number } | null> {
    const parts = splitDevinKey(key);
    if (parts === null) return null;
    return withDb(parts.dbPath, (db) => sessionMeta(db, parts.sessionId));
  }

  async load(key: string): Promise<{ text: string; complete: boolean; size: number; mtimeMs: number }> {
    const empty = { text: "", complete: true, size: 0, mtimeMs: 0 };
    const parts = splitDevinKey(key);
    if (parts === null) return empty;
    return withDb(parts.dbPath, (db) => {
      const meta = sessionMeta(db, parts.sessionId);
      const clipped = clipLines(composeLines(db, parts.sessionId));
      return { ...clipped, ...meta };
    }) ?? empty;
  }

  /**
   * What is new in this session since `cursor`.
   *
   * WHAT THE CURSOR COUNTS HERE. `message_nodes.row_id` is the table's insertion counter: unique,
   * never reused, and every append is a greater number — so `max(row_id)` is the whole cursor, and
   * the comparison is `>`, like hermes' id and unlike opencode's `>=` (two devin nodes cannot share
   * a row_id, so there is no same-value row to lose).
   *
   * WHAT THIS CURSOR CANNOT SEE, stated rather than papered over. Which nodes are ON the branch is
   * mutable state the cursor is blind to: a rewind changes it without moving any row_id. The
   * reducer's chain announces the flips a delta can carry (the row that lands on the new branch
   * marks what left it), which covers every rewind that writes — and devin's always write, because
   * rewinding IS writing a new node. The one hole left is a branch that moved with no new row at
   * all, where the window holds its stale turns until something else resets it; that is the live
   * window's business and its verb for it is a reset, the same stance hermes' mutable-row state
   * takes. `Reduction` grows no `removed` (ADR 0073) and should not.
   *
   * A read that cannot be resumed answers with the newest {@link FIRST_TAIL_ROWS} nodes, clipped to
   * {@link FIRST_TAIL_BYTES}, and `reset: true`. An unreadable database holds the caller's cursor
   * and reports nothing new, exactly as a file whose `stat` lost a race does.
   */
  async readSince(key: string, cursor: Cursor): Promise<ReadSince> {
    const held: ReadSince = { lines: [], cursor, reset: false, fromStart: false };
    const parts = splitDevinKey(key);
    if (parts === null) return { lines: [], cursor: NO_CURSOR, reset: false, fromStart: false };
    const at = decodeCursor(cursor, "rowid", key);
    return (
      withDb(parts.dbPath, (db) => {
        // The SAME pieces the whole-session read composes from — one function, both callers, so a
        // History read and a live read of one turn can never be two different texts.
        const rows =
          at === null
            ? db
                .query<NodeRow, [...ChainParams, string, number]>(
                  `${CHAIN_CTE} ${NODE_SELECT} where mn.session_id = ? order by mn.row_id desc limit ?`,
                )
                .all(parts.sessionId, parts.sessionId, parts.sessionId, FIRST_TAIL_ROWS)
                .toReversed()
            : db
                .query<NodeRow, [...ChainParams, string, number, number]>(
                  `${CHAIN_CTE} ${NODE_SELECT} where mn.session_id = ? and mn.row_id > ? order by mn.row_id limit ?`,
                )
                .all(parts.sessionId, parts.sessionId, parts.sessionId, at, FIRST_TAIL_ROWS);
        const lines = rows.map((row) => JSON.stringify(row));
        const next = encodeCursor("rowid", key, newestRowId(rows, at ?? 0));
        // The clip only ever applies to a reset. Clipping an INCREMENTAL read would drop nodes off
        // the head of the delta while the cursor moved past them, which loses a turn for good; the
        // incremental read is bounded by its `limit` instead, and the rest arrives on the next tick.
        if (at !== null) return { lines, cursor: next, reset: false, fromStart: false };
        const start = clipStart(lines, FIRST_TAIL_BYTES);
        // BOTH bounds have to have stood down for this to be the branch's start: the row limit did
        // not bite, and the byte clip dropped nothing. Either one biting means an older node exists.
        // Rows rather than lines is safe here, because this adapter composes one line per node.
        return {
          lines: lines.slice(start),
          cursor: next,
          reset: true,
          fromStart: start === 0 && rows.length < FIRST_TAIL_ROWS,
        };
      }) ?? held
    );
  }
}

export function devinJournal(roots: string | readonly string[]): JournalAdapter {
  return {
    agent: "devin",
    source: new DevinTranscriptSource(roots),
    parse: parseDevinTranscript,
    reducer: createDevinReducer,
  };
}
