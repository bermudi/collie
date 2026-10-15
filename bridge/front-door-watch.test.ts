import { describe, expect, test } from "bun:test";

import { formatRecord } from "./front-door.ts";
import type { PushMessage } from "./push.ts";
import {
  FRONT_DOOR_WATCH_INTERVAL_MS,
  FrontDoorWatch,
  type FrontDoorWatchDeps,
} from "./front-door-watch.ts";

// The watchdog's transition rules, driven entirely through fakes.
//
// SAFETY: every `tailscale` call in this file goes through a fake Exec. Nothing here may reach the
// real tailnet — the real wiring is `bridge/index.ts`'s, and the real call reads a status document.

const RECORD = formatRecord({
  mode: "https",
  port: 443,
  hostPort: "box.tail.ts.net:443",
  proxy: "http://127.0.0.1:8080",
  path: "/",
});

/** The status JSON tailscaled prints, for a root handler pointing at `proxy` (`null` = no handler). */
const statusFor = (proxy: string | null): string =>
  JSON.stringify({
    TCP: { "443": { HTTPS: true } },
    Web:
      proxy === null
        ? {}
        : { "box.tail.ts.net:443": { Handlers: { "/": { Proxy: proxy } } } },
  });
const OURS = statusFor("http://127.0.0.1:8080");
const STOLEN = statusFor("http://127.0.0.1:3773");
const GONE = statusFor(null);

interface Harness {
  watch: FrontDoorWatch;
  captures: number;
  pushes: PushMessage[];
  warns: string[];
  outs: string[];
  setRecord(raw: string | null): void;
  setStatus(raw: string): void;
  setFail(fail: boolean): void;
  disable(): void;
}

type WatchHarnessState = {
  captures: number;
  pushes: PushMessage[];
  warns: string[];
  outs: string[];
  record: string | null;
  status: string;
  statusFails: boolean;
  enabledFlag: boolean;
};

function makeWatch(): Harness {
  const h: WatchHarnessState = {
    captures: 0,
    pushes: [],
    warns: [],
    outs: [],
    record: RECORD,
    status: OURS,
    statusFails: false,
    enabledFlag: true,
  };
  const deps: FrontDoorWatchDeps = {
    handlerFile: "/config/tailscale-managed-handler",
    exec: {
      which: () => "/usr/bin/tailscale",
      capture: () => {
        h.captures += 1;
        if (h.statusFails) return { code: 1, stdout: "", stderr: "boom", found: true };
        return { code: 0, stdout: h.status, stderr: "", found: true };
      },
    },
    files: { read: () => h.record },
    enabled: () => h.enabledFlag,
    push: (message) => {
      h.pushes.push(message);
    },
    log: {
      out: (line) => h.outs.push(line),
      warn: (line) => h.warns.push(line),
    },
  };
  return {
    watch: new FrontDoorWatch(deps),
    get captures() {
      return h.captures;
    },
    get pushes() {
      return h.pushes;
    },
    get warns() {
      return h.warns;
    },
    get outs() {
      return h.outs;
    },
    setRecord(raw) {
      h.record = raw;
    },
    setStatus(raw) {
      h.status = raw;
    },
    setFail(fail) {
      h.statusFails = fail;
    },
    disable() {
      h.enabledFlag = false;
    },
  };
}

describe("FrontDoorWatch", () => {
  test("interval is one minute", () => {
    expect(FRONT_DOOR_WATCH_INTERVAL_MS).toBe(60_000);
  });

  test("a missing ownership record is silence: no tailscale call, no push", async () => {
    const t = makeWatch();
    t.setRecord(null);
    await t.watch.tick();
    expect(t.captures).toBe(0);
    expect(t.pushes).toHaveLength(0);
  });

  test("first sight with the door up: baseline, no push", async () => {
    const t = makeWatch();
    await t.watch.tick();
    expect(t.captures).toBe(1);
    expect(t.pushes).toHaveLength(0);
  });

  test("first sight with the door already gone pushes once", async () => {
    const t = makeWatch();
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
    expect(t.pushes[0]?.titleCode).toBe("frontdoor.gone");
    expect(t.pushes[0]?.tag).toBe("collie:frontdoor");
    expect(t.pushes[0]?.renotify).toBe(true);
    expect(t.pushes[0]?.body).toContain("collie serve");
    expect(t.warns).toHaveLength(1);
  });

  test("a loss after presence pushes exactly once", async () => {
    const t = makeWatch();
    await t.watch.tick();
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
  });

  test("staying gone does not re-push", async () => {
    const t = makeWatch();
    t.setStatus(GONE);
    await t.watch.tick();
    await t.watch.tick();
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
  });

  test("a replaced handler is a loss, and names the usurper in the log", async () => {
    const t = makeWatch();
    await t.watch.tick();
    t.setStatus(STOLEN);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
    expect(t.warns[0]).toContain("https:443");
  });

  test("recovery logs without pushing and re-arms the watch", async () => {
    const t = makeWatch();
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
    t.setStatus(OURS);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
    expect(t.outs.some((l) => l.includes("back"))).toBe(true);
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(2);
  });

  test("a failing tailscale call says nothing about the door", async () => {
    const t = makeWatch();
    await t.watch.tick();
    t.setFail(true);
    await t.watch.tick();
    await t.watch.tick();
    expect(t.pushes).toHaveLength(0);
    // ... and when the call recovers, the still-missing door is a fresh loss, not a stale one.
    t.setFail(false);
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
  });

  test("the enabled gate no-ops before any tailscale call", async () => {
    const t = makeWatch();
    t.disable();
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.captures).toBe(0);
    expect(t.pushes).toHaveLength(0);
  });

  test("an unreadable record warns once, never pushes, and resumes when it heals", async () => {
    const t = makeWatch();
    t.setRecord("garbage\n");
    await t.watch.tick();
    await t.watch.tick();
    expect(t.warns).toHaveLength(1);
    expect(t.pushes).toHaveLength(0);
    t.setRecord(RECORD);
    t.setStatus(OURS);
    await t.watch.tick();
    expect(t.warns).toHaveLength(1);
  });

  test("the record vanishing mid-watch resets the baseline without a push", async () => {
    const t = makeWatch();
    t.setStatus(GONE);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
    t.setRecord(null);
    await t.watch.tick();
    t.setRecord(RECORD);
    t.setStatus(OURS);
    await t.watch.tick();
    expect(t.pushes).toHaveLength(1);
  });
});
