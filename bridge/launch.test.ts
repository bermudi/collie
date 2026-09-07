import { describe, expect, test } from "bun:test";

import { AuditLog } from "./audit.ts";
import type { HerdrClient } from "./herdr-client.ts";
import { launch } from "./server.ts";
import type { Launcher } from "./types.ts";

// POST /api/launch is a pre-declared workspace create: the client names a row in launchers.toml and
// the bridge, never the client, supplies the command line. The allowlist check happens BEFORE herdr
// is touched — that ordering is the whole security story of the route, and these tests pin it.

const ROWS: Launcher[] = [
  { command: "rumen-peek", label: "Runs & quota", cwd: "/home/op" },
  { command: "tail -f /var/log/quota.log", label: "Quota log", cwd: "/var/log" },
];

const getLaunchers = async () => ROWS;

function fakeClient(opts: { sendFails?: boolean } = {}): HerdrClient & {
  created: number;
  closed: string[];
  typed: { paneId: string; text: string }[];
} {
  const state = { created: 0, closed: [] as string[], typed: [] as { paneId: string; text: string }[] };
  const client = {
    get created() {
      return state.created;
    },
    get closed() {
      return state.closed;
    },
    get typed() {
      return state.typed;
    },
    async createWorkspace(_opts: { cwd: string; label?: string }) {
      state.created += 1;
      return {
        paneId: "w9:p1",
        workspaceId: "w9",
        workspaceLabel: "Runs & quota",
        tabId: "w9:t1",
        cwd: "/home/op",
      };
    },
    async closePane(paneId: string) {
      state.closed.push(paneId);
    },
    async sendPaneText(paneId: string, text: string) {
      if (opts.sendFails) throw new Error("socket gone");
      state.typed.push({ paneId, text });
    },
    async sendPaneKeys(_paneId: string, _keys: string[]) {
      if (opts.sendFails) throw new Error("socket gone");
    },
  } as unknown as HerdrClient & typeof state;
  return client;
}

const audit = () => new AuditLog(() => {}, { now: () => 0 });

function req(command: unknown): Request {
  return new Request("http://localhost/api/launch", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

describe("launch — allowlisted workspace create", () => {
  test("an undeclared command is a 400 and herdr is never touched", async () => {
    const client = fakeClient();
    const res = await launch(client, req("rm -rf /tmp/x"), audit(), null, "main", getLaunchers);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "not a declared launcher" });
    expect(client.created).toBe(0);
  });

  test("an empty command is a bad body, before the allowlist is even read", async () => {
    const client = fakeClient();
    let rowsRead = 0;
    const res = await launch(
      client,
      req("  "),
      audit(),
      null,
      "main",
      async () => {
        rowsRead += 1;
        return ROWS;
      },
    );
    expect(res.status).toBe(400);
    expect(rowsRead).toBe(0);
    expect(client.created).toBe(0);
  });

  test("a declared row creates the Space in the row's cwd and types the row's command", async () => {
    const client = fakeClient();
    // Point the row at a dir that exists so resolvePaneCwd passes — the test's own tmp dir.
    const dir = process.env.TMPDIR ?? "/tmp";
    const rows: Launcher[] = [{ command: "c", label: "L", cwd: dir }];
    const res = await launch(client, req("c"), audit(), null, "main", async () => rows);
    expect(await res.json()).toEqual({
      ok: true,
      pane: {
        paneId: "w9:p1",
        workspaceId: "w9",
        workspaceLabel: "Runs & quota",
        tabId: "w9:t1",
        cwd: "/home/op",
      },
    });
    expect(client.created).toBe(1);
    expect(client.typed).toEqual([{ paneId: "w9:p1", text: "c" }]);
    expect(client.closed).toEqual([]);
  });

  test("a failed send rolls the half-born Space back and reports the send error", async () => {
    const client = fakeClient({ sendFails: true });
    const dir = process.env.TMPDIR ?? "/tmp";
    const rows: Launcher[] = [{ command: "c", label: "L", cwd: dir }];
    const res = await launch(client, req("c"), audit(), null, "main", async () => rows);
    expect(await res.json()).toEqual({ ok: false, error: "socket gone" });
    expect(client.created).toBe(1);
    expect(client.closed).toEqual(["w9:p1"]);
  });

  test("a row pointing at a deleted dir fails before any Space is created", async () => {
    const client = fakeClient();
    const rows: Launcher[] = [{ command: "c", label: "L", cwd: "/nonexistent-dir-xyz" }];
    const res = await launch(client, req("c"), audit(), null, "main", async () => rows);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
    expect(client.created).toBe(0);
  });
});
