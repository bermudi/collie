// Hermes' local SessionDB journal adapter.
//
// Live-verified against a real on-disk SessionDB (messages: 13 columns, no
// active/compacted/display_kind/reasoning_content — 2026-04 data) and against upstream's newer
// shape that carries those four optional columns. The SELECT is built from what
// `pragma table_info` reports, so both schemas read; a schema that carries NEITHER shape fails
// loudly out of `load` instead of serving an empty page that looks like "no history"
// (see `withDb`). Run `bun scripts/journal-probe.ts hermes` after touching this file — the
// unit fixtures pin the grammar, the probe catches on-disk drift, and this adapter's history is
// exactly why: upstream's own fixture built its table from the adapter's SELECT, so a column
// that never existed passed every test.
//
// Hermes stores sessions in one SQLite database (`~/.hermes/state.db`). The pane supplies the
// session id through Herdr, so this adapter reads exactly that session; it never guesses from the
// newest row. The database is opened read-only and the fixed filename is confined to the configured
// root before opening.

import { Database } from "bun:sqlite";
import { join } from "node:path";

import type { JsonObject, JsonValue } from "../json.ts";
import { containedRealpath, MAX_TRANSCRIPT_BYTES, rootList } from "./files.ts";
import { clamp, MAX_TEXT_CHARS, stripAnsi, summarizeToolInput } from "./text.ts";
import type {
  AgentSessionRef,
  JournalAdapter,
  TranscriptEntry,
  TranscriptPart,
  TranscriptSource,
} from "./types.ts";

const DB_FILE = "state.db";
const SESSION_ID_RE = /^\d{8}_\d{6}_[A-Za-z0-9]+$/;

export function isHermesSessionId(value: string): boolean {
  return SESSION_ID_RE.test(value);
}

export function hermesKey(dbPath: string, sessionId: string): string {
  return `${dbPath}#${sessionId}`;
}

export function splitHermesKey(key: string): { dbPath: string; sessionId: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0) return null;
  const dbPath = key.slice(0, at);
  const sessionId = key.slice(at + 1);
  return isHermesSessionId(sessionId) ? { dbPath, sessionId } : null;
}

function withDb<T>(dbPath: string, fn: (db: Database) => T): T | null {
  let db: Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    // An unopenable database is an ordinary negative for resolve()'s root walk (a root without
    // its db simply cannot host the session). Deliberately silent, same stance as opencode.ts.
    return null;
  }
  try {
    // fn's own errors PROPAGATE: a query failure in stat/load is schema drift or corruption, and
    // swallowing it here is how a real SessionDB once read as "no history". The history route
    // answers an error loudly instead of an empty page.
    return fn(db);
  } finally {
    db.close();
  }
}

interface MessageRow {
  id: number;
  role: string;
  content: string | null;
  tool_call_id: string | null;
  tool_calls: string | null;
  tool_name: string | null;
  timestamp: number;
  reasoning: string | null;
  /** Present only when the on-disk schema carries them (upstream's newer shape); absent in the
   * 13-column schema live-verified on this host — defaults below make the older schema read as
   * "every row is an active message of record". */
  reasoning_content?: string | null;
  active?: number | null;
  compacted?: number | null;
  display_kind?: string | null;
}

function parseJson(raw: string | null): JsonValue {
  if (raw === null) return null;
  try {
    // SAFETY: JSON.parse returns only JSON primitives, arrays, and objects; JsonValue names that exact boundary.
    return JSON.parse(raw) as JsonValue;
  } catch {
    return null;
  }
}

function textPart(raw: string | null): TranscriptPart | null {
  if (typeof raw !== "string") return null;
  const text = stripAnsi(raw);
  return text.trim() === "" ? null : { kind: "text", ...clamp(text, MAX_TEXT_CHARS) };
}

function toolCallPart(raw: JsonValue, fallbackName: string | null): TranscriptPart | null {
  if (raw === null || typeof raw !== "object" || !Array.isArray(raw)) return null;
  for (const call of raw) {
    if (call === null || typeof call !== "object" || Array.isArray(call)) continue;
    const fn = call.function;
    if (fn === null || typeof fn !== "object" || Array.isArray(fn)) continue;
    const name = typeof fn.name === "string" ? fn.name : fallbackName ?? "tool";
    const args = typeof fn.arguments === "string" ? parseJson(fn.arguments) : fn.arguments;
    return { kind: "tool", name, summary: summarizeToolInput(args) };
  }
  return null;
}

function isoTimestamp(value: number): string {
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

type ParsedMessageRow = JsonObject & MessageRow;

function isMessageRow(value: JsonValue): value is ParsedMessageRow {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  // SAFETY: JsonValue object branch is JsonObject by definition; fields are narrowed immediately below.
  const row = value as JsonObject;
  return typeof row.id === "number" && typeof row.role === "string" && typeof row.timestamp === "number";
}

function rowEntry(row: MessageRow): TranscriptEntry | null {
  if ((row.active ?? 1) === 0 && (row.compacted ?? 0) === 0) return null;
  if ((row.display_kind ?? null) === "hidden") return null;

  const parts: TranscriptPart[] = [];
  const reasoning = textPart(row.reasoning ?? row.reasoning_content ?? null);
  if (reasoning !== null && reasoning.kind === "text") {
    const thinking: TranscriptPart = { kind: "thinking", text: reasoning.text };
    if (reasoning.truncated) thinking.truncated = true;
    parts.push(thinking);
  }
  const content = textPart(row.content);
  if (content !== null) parts.push(content);
  const toolCalls = toolCallPart(parseJson(row.tool_calls), row.tool_name);
  if (toolCalls !== null) parts.push(toolCalls);

  if (row.role === "tool") {
    const result = textPart(row.content);
    if (result === null) return null;
    const toolResult = result.kind === "text" && result.truncated
      ? { text: result.text, truncated: true }
      : { text: result.kind === "text" ? result.text : "" };
    return {
      uuid: String(row.id),
      ts: isoTimestamp(row.timestamp),
      role: "note",
      parts: [{ kind: "tool", name: row.tool_name ?? "tool", summary: "", result: toolResult }],
    };
  }
  if (row.role !== "user" && row.role !== "assistant") return null;
  if (parts.length === 0) return null;
  return { uuid: String(row.id), ts: isoTimestamp(row.timestamp), role: row.role, parts };
}

// The columns every observed Hermes schema carries. The four optional ones (upstream's newer
// shape) are probed per-database; the names are whitelisted constants — nothing user-controlled
// ever reaches the SQL text, and ids ride parameterized `?` bindings.
const BASE_COLUMNS = [
  "m.id",
  "m.role",
  "m.content",
  "m.tool_call_id",
  "m.tool_calls",
  "m.tool_name",
  "m.timestamp",
  "m.reasoning",
] as const;
const OPTIONAL_COLUMNS = [
  "m.reasoning_content",
  "m.active",
  "m.compacted",
  "m.display_kind",
] as const;

function messageColumns(db: Database): Set<string> {
  const rows = db.query<{ name: string }, []>("pragma table_info('messages')").all();
  return new Set(rows.map((r) => r.name));
}

function composeLines(db: Database, sessionId: string): string[] {
  const present = messageColumns(db);
  const select = [...BASE_COLUMNS, ...OPTIONAL_COLUMNS.filter((c) => present.has(c.slice(2)))]
    .map((c) => `${c} as "${c.slice(2)}"`)
    .join(", ");
  // The active/compacted filter applies only where those columns exist; the older schema has no
  // such notion and every row is a message of record.
  const lineage =
    "with recursive lineage(id, depth) as (select ? as id, 0 union all select s.parent_session_id, lineage.depth + 1 from sessions s join lineage on s.id = lineage.id where s.parent_session_id is not null and lineage.depth < 32)";
  const filter =
    present.has("active") || present.has("compacted") ? " where m.active = 1 or m.compacted = 1" : "";
  const rows = db
    .query<MessageRow, [string]>(
      `${lineage} select ${select} from messages m join lineage on lineage.id = m.session_id${filter} order by lineage.depth desc, m.id`,
    )
    .all(sessionId);
  return rows.map((row: MessageRow) => JSON.stringify(row));
}

function clipLines(lines: string[]) {
  let bytes = 0;
  let start = 0;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    bytes += Buffer.byteLength(lines[i]!) + 1;
    if (bytes > MAX_TRANSCRIPT_BYTES) {
      start = i + 1;
      break;
    }
  }
  return { text: lines.slice(start).join("\n"), complete: start === 0 };
}

export function parseHermesTranscript(text: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    let raw: JsonValue;
    try {
      // SAFETY: JSON.parse returns only JSON primitives, arrays, and objects; JsonValue names that exact boundary.
      raw = JSON.parse(line) as JsonValue;
    } catch {
      continue;
    }
    if (!isMessageRow(raw)) continue;
    const entry = rowEntry(raw);
    if (entry !== null) entries.push(entry);
  }
  return entries;
}

type SessionMeta = { size: number; mtimeMs: number };

function sessionMeta(db: Database, sessionId: string): SessionMeta {
  const row = db.query<{ count: number; newest: number }, [string]>(
    "select count(*) as count, coalesce(max(timestamp), 0) as newest from messages where session_id = ?",
  ).get(sessionId);
  return { size: row?.count ?? 0, mtimeMs: row?.newest ?? 0 };
}

export class HermesTranscriptSource implements TranscriptSource {
  private readonly roots: string[];

  constructor(roots: string | readonly string[]) {
    this.roots = rootList(roots);
  }

  async resolve(ref: AgentSessionRef): Promise<string | null> {
    if (ref.kind !== "id" || !isHermesSessionId(ref.value)) return null;
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
      if (found !== null && found !== undefined) return hermesKey(path, ref.value);
    }
    return null;
  }
  async stat(key: string): Promise<{ size: number; mtimeMs: number } | null> {
    const parts = splitHermesKey(key);
    if (parts === null) return null;
    return withDb(parts.dbPath, (db) => sessionMeta(db, parts.sessionId));
  }

  async load(key: string): Promise<{ text: string; complete: boolean; size: number; mtimeMs: number }> {
    const empty = { text: "", complete: true, size: 0, mtimeMs: 0 };
    const parts = splitHermesKey(key);
    if (parts === null) return empty;
    return withDb(parts.dbPath, (db) => {
      const meta = sessionMeta(db, parts.sessionId);
      const clipped = clipLines(composeLines(db, parts.sessionId));
      return { ...clipped, ...meta };
    }) ?? empty;
  }
}

export function hermesJournal(roots: string | readonly string[]): JournalAdapter {
  return { agent: "hermes", source: new HermesTranscriptSource(roots), parse: parseHermesTranscript };
}
