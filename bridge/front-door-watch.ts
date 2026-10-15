import { fingerprintRoot, handlerName, parseRecord, parseServeStatus, type FrontDoorExec, type FrontDoorFiles } from "./front-door.ts";
import type { PushMessage } from "./push.ts";
import { pushTitle } from "./push-titles.ts";

// ── The front-door watchdog: notice when the door we published disappears ────────────────────────
//
// Collie's tailnet door is ONE LINE in tailscaled's serve config (`bridge/front-door.ts`), and that
// config is a shared, ownerless surface: any local process running `tailscale serve` can rewrite the
// root handler, and one can close the whole listener on its way out. When that happens the bridge is
// green, the journal is quiet, and the phone only says "No connection to the bridge" — the outage is
// invisible to every signal this process has. Seen live on 2026-10-14: t3code's "Tailscale HTTPS"
// replaced the root and later closed the listener, three outages in one day, none of them logged
// here.
//
// So: watch. Once a minute, re-read the live serve config and compare it against the ownership
// record — the same fingerprint teardown checks before removing anything. On a transition into
// "not ours", log loudly and push the phone; the push names the fix (`collie serve`), because the
// fix is deliberately NOT ours to run.
//
// ── POSTURE: watch and shout, never act ──────────────────────────────────────────────────────────
// Publishing is the CLI's act, gated on crew mode; the bridge can only ever take a door DOWN
// (ADR 0001, ADR 0013 — "a peer must never be able to open a door"). Republishing here, even over an
// empty root, would cross that line; over an occupied root it would be t3code's bug with Collie's
// name on it. The occupant may be deliberate, and Collie cannot tell — so the operator decides.
//
// ── ALERT POLICY ─────────────────────────────────────────────────────────────────────────────────
// Edge-triggered: one push per loss, recovery logs and re-arms. The FIRST observation pushes too —
// a bridge that boots into a stolen door must say so, and updates restart the bridge on every
// release, so suppressing the first sight (as `machine-alerts.ts` does for its minutes-long
// episodes) could silence this alert indefinitely. A `tailscale` call that FAILS says nothing about
// the door — tailscaled may simply be restarting — so it changes no state and fires nothing.

/** How often the live serve config is checked. */
export const FRONT_DOOR_WATCH_INTERVAL_MS = 60_000;

export interface FrontDoorWatchDeps {
  /** The ownership record this bridge published (`managedHandlerPath`). */
  handlerFile: string;
  exec: FrontDoorExec;
  files: Pick<FrontDoorFiles, "read">;
  /**
   * Policy, judged fresh on every tick: false disables the watch entirely. The wiring passes
   * `!skipServe && crew mode is not peer && not deposed` — a machine that may hold no door has
   * nothing of ours to watch.
   */
  enabled: () => boolean;
  /** Delivery (the bridge's `push.send`). Called at most once per loss. */
  push: (message: PushMessage) => Promise<void> | void;
  log: { out(line: string): void; warn(line: string): void };
  intervalMs?: number;
}

/** The door as of the last successful read. `unknown` until one good read lands. */
type Observation = "unknown" | "present" | "gone";

export class FrontDoorWatch {
  private state: Observation = "unknown";
  private timer: ReturnType<typeof setInterval> | null = null;
  private recordBroken = false;

  constructor(private readonly deps: FrontDoorWatchDeps) {}

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(
      () => void this.tick(),
      this.deps.intervalMs ?? FRONT_DOOR_WATCH_INTERVAL_MS,
    );
    this.timer.unref();
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  /** One check. Errors never escape: a watchdog that throws is a watchdog that stops watching. */
  async tick(): Promise<void> {
    try {
      await this.check();
    } catch (err) {
      this.deps.log.warn(
        `check failed (watch continues): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async check(): Promise<void> {
    if (!this.deps.enabled()) return;
    const raw = this.deps.files.read(this.deps.handlerFile);
    if (raw === null) {
      // No record, nothing of ours out there (ADR 0001: an unrecorded mapping is by definition not
      // ours). A "gone" state without a record is a stale alarm — drop it quietly.
      if (this.state === "gone") this.deps.log.out("ownership record is gone; nothing of ours to watch");
      this.state = "unknown";
      return;
    }

    let record;
    try {
      record = parseRecord(raw);
    } catch (err) {
      // A record we cannot read is a mapping we cannot prove we own; shouting on a guess is the
      // incident this whole area exists to prevent. Warn ONCE per broken record, not every minute.
      if (!this.recordBroken) {
        this.recordBroken = true;
        this.deps.log.warn(
          `ownership record is unreadable, watch paused until it changes: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return;
    }
    this.recordBroken = false;

    const r = this.deps.exec.capture("tailscale", ["serve", "status", "--json"]);
    if (!r.found || r.code !== 0) return;

    let fingerprint: string;
    try {
      fingerprint = fingerprintRoot(
        parseServeStatus(r.stdout),
        record.hostPort,
        record.port,
        record.path,
      );
    } catch {
      return;
    }

    const expected = `${record.mode}|proxy:${record.proxy}`;
    if (fingerprint === expected) {
      if (this.state === "gone") this.deps.log.out(`front door is back (${handlerName(record)})`);
      this.state = "present";
      return;
    }

    // Absent or replaced — the same shout either way: the door we recorded is not the door the
    // tailnet is being served. Only the log line distinguishes the two. Edge-triggered: while the
    // state stays "gone", every minute is the SAME loss, not a new one — recovery re-arms above.
    if (this.state === "gone") return;
    const detail =
      fingerprint === "absent"
        ? "the handler is gone from tailscale serve"
        : `the handler was replaced (${fingerprint})`;
    this.state = "gone";
    this.deps.log.warn(
      `front door lost (${handlerName(record)}): ${detail} — pushing the phone; the fix is \`collie serve\``,
    );
    await this.deps.push({
      tag: "collie:frontdoor",
      ...pushTitle("frontdoor.gone"),
      body:
        `Another app rewrote tailscale serve; the door ColliePup published on ${handlerName(record)} is gone, ` +
        "so the phone cannot reach this machine. Fix: run collie serve on the host.",
      topic: "collie-frontdoor",
      renotify: true,
    });
  }
}
