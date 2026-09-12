import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The stuck guard's note (upstream bb095e3a): when the eight-second stuck guard behind "new build,
// tap to update" reloads the page and the phone comes back on the SAME old bundle, the next tap must
// unregister the service worker and reload from the bridge instead of repeating the identical cycle
// — and only while the bridge is still answering the ordinary poll, so an offline install keeps its
// precache.
//
// `pwa.ts` registers a service worker at import time and its reload latches are module state, so
// every page load is a fresh copy through `vi.resetModules()`. A reload is modelled honestly: the
// module (latches included) dies with the page it lived in and a fresh one loads, while
// sessionStorage — which is exactly why the note lives there — survives. BUILD.id under vitest is
// "test" (vitest.config `define`), so any other observed build id reads as provably stale.

const GUARD_RELOAD_KEY = "collie:pwa:guardReload:v1"; // must match pwa.ts

type Handlers = Record<string, () => void>;

interface FakeWorker {
  state: string;
  addEventListener: (type: string, fn: () => void) => void;
  postMessage: (message: { type: string }) => void;
}

function worker(state: string, on: Handlers): FakeWorker {
  return {
    state,
    addEventListener: (type, fn) => {
      on[type] = fn;
    },
    postMessage: () => {},
  };
}

interface LoadOpts {
  installing?: FakeWorker | null;
  // onRegisteredSW never fires: `register()` is still queued behind the wedged update, so the page
  // has no registration object yet even though the origin is perfectly healthy.
  registered?: boolean;
  // An origin with no service worker at all (plain HTTP / insecure context).
  noServiceWorker?: boolean;
  // A custom unregister — a promise that never settles models the wedged per-scope queue.
  unregister?: () => Promise<boolean>;
  // Recorded in call order — pins the caches going first and the unregister behind them.
  log?: string[];
}

/** Load a fresh `pwa.ts` against a stubbed registration, and hand back every seam it wired. */
async function load(opts: LoadOpts = {}) {
  vi.resetModules();
  const reload = vi.fn();
  const regEvents: Handlers = {};
  const swEvents: Handlers = {};
  const registration = {
    installing: opts.installing ?? null,
    waiting: null,
    update: vi.fn(async () => {}),
    unregister: vi.fn(
      opts.unregister ??
        (async (): Promise<boolean> => {
          opts.log?.push("unregister");
          return true;
        }),
    ),
    addEventListener: (type: string, fn: () => void) => {
      regEvents[type] = fn;
    },
  };
  vi.stubGlobal(
    "navigator",
    opts.noServiceWorker === true
      ? {}
      : {
          serviceWorker: {
            controller: {},
            addEventListener: (type: string, fn: () => void) => {
              swEvents[type] = fn;
            },
            getRegistrations: async () => [registration],
          },
        },
  );
  // jsdom's own `location.reload` throws "not implemented", so the whole object is replaced.
  vi.stubGlobal("location", { reload });
  // jsdom has no CacheStorage; stand one in so cases can watch the precache's fate.
  vi.stubGlobal("caches", {
    keys: async () => ["workbox-precache", "collie-font-cache"],
    delete: async (key: string) => {
      opts.log?.push(`delete:${key}`);
    },
  });
  vi.doMock("virtual:pwa-register", () => ({
    registerSW: (o: { onRegisteredSW: (url: string, r: typeof registration) => void }) => {
      if (opts.registered !== false) o.onRegisteredSW("/sw.js", registration);
    },
  }));
  const mod = await import("./pwa");
  return { mod, reload, registration, regEvents, swEvents };
}

/**
 * A poll answers, carrying a build id that is not this bundle's.
 *
 * One call is both of the escape's conditions: the page is provably STALE (the served id differs
 * from the baked one) and the bridge is provably ANSWERING (a header only arrives on a response it
 * sent). That is the shape on the phone too — the chip is on screen because the poll keeps saying
 * so.
 */
async function aPollSaysWeAreStale(): Promise<void> {
  const { observeServerBuild } = await import("./server-build");
  observeServerBuild("a-build-this-bundle-is-not");
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.doUnmock("virtual:pwa-register");
  // The stuck guard's note lives here (GUARD_RELOAD_KEY), and it is meant to survive a reload —
  // so it also survives a test unless a test clears it.
  sessionStorage.clear();
});

describe("the tap after the stuck guard's own reload", () => {
  it("THE CYCLE: the second tap unregisters instead of repeating the guard", async () => {
    const on: Handlers = {};
    const installing = worker("installing", on);
    const h = await load({ installing });
    await aPollSaysWeAreStale();

    // Tap one. A worker is installing, so nothing is forced: the tap waits, and the stuck guard is
    // what eventually reloads the page — on the stale bundle, precache intact, note left behind.
    await h.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(h.registration.unregister).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(GUARD_RELOAD_KEY)).not.toBeNull();

    // The reload is a real navigation: the module dies with the page it lived in. The page that
    // comes back is a fresh copy on the same bundle, still stale — and the note survived it, while
    // the poll keeps answering (which is what the chip on screen means).
    const page2 = await load({ installing: worker("installing", {}) });
    await aPollSaysWeAreStale();

    // Tap two, the one that was worth nothing for three minutes on 2026-09-09. It takes the
    // unregister-then-reload path, so the navigation is answered by the bridge instead of by the
    // wedged precache.
    await page2.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(page2.registration.unregister).toHaveBeenCalledTimes(1);
    expect(page2.reload).toHaveBeenCalledTimes(1);
  });

  it("the caches go first, and the wedged unregister is started but never awaited", async () => {
    // The 2026-09-09 wedge: unregister() is a job on the same per-scope queue as the stuck update,
    // so awaiting it hangs whenever that queue is stuck — precisely the state the escape exists
    // for. The unregister promise here NEVER settles, and the reload must still land.
    const log: string[] = [];
    const h = await load({
      unregister: () => {
        log.push("unregister");
        return new Promise<boolean>(() => {});
      },
      log,
    });
    sessionStorage.setItem(GUARD_RELOAD_KEY, "1");
    await aPollSaysWeAreStale();

    await h.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    // Deleting the caches needs no job and cannot be queued behind one; the unregister is the
    // tidy-up, not the escape.
    expect(log).toEqual(["delete:workbox-precache", "delete:collie-font-cache", "unregister"]);
    expect(h.reload).toHaveBeenCalledTimes(1); // while the unregister above is still pending
  });

  it("a page the guard reloaded onto a bundle that is level does NOT unregister — and the note is spent either way", async () => {
    const h = await load({ installing: worker("installing", {}) });

    // Tap one: the guard reloads and leaves its note.
    await h.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(h.reload).toHaveBeenCalledTimes(1);

    // The page comes back on a bundle that is LEVEL — nothing was observed off the header, so the
    // page is not provably stale. The note alone must not arm the escape: dropping a precache on
    // that evidence buys a reload loop and no update.
    const page2 = await load({ installing: worker("installing", {}) });
    await page2.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(page2.registration.unregister).not.toHaveBeenCalled();
    expect(page2.reload).not.toHaveBeenCalled();

    // And the note did not survive that tap unspent: even with the poll NOW provably stale and the
    // bridge fresh, the escape stays disarmed (the tap takes the ordinary worker path instead).
    await aPollSaysWeAreStale();
    await page2.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(page2.registration.unregister).not.toHaveBeenCalled();
    expect(page2.reload).not.toHaveBeenCalled();
  });

  it("OFFLINE SAFETY: a bridge that stopped answering keeps the precache", async () => {
    // Dropping a precache offline strands the PWA on an error page with nothing cached, which is
    // worse than any stale bundle. So the escape also asks whether the bridge is still there, and
    // the answer is the poll: no header for twenty seconds is no network. The tap then takes the
    // old path — a thrown update(), a plain reload, precache intact.
    const log: string[] = [];
    const h = await load({ installing: worker("installing", {}), log });
    await aPollSaysWeAreStale();
    sessionStorage.setItem(GUARD_RELOAD_KEY, "1");
    h.registration.update.mockRejectedValueOnce(new Error("offline"));

    // The last thing the bridge said was a while ago now, which is what going offline looks like.
    await vi.advanceTimersByTimeAsync(21_000);
    await h.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(h.registration.unregister).not.toHaveBeenCalled();
    expect(log).toEqual([]); // no cache was touched
  });

  it("the escape sits ABOVE the missing-registration check (register() queues behind the wedge too)", async () => {
    // Measured on 2026-09-09: on the page the guard just reloaded, `register()` itself may still be
    // waiting behind the wedged update, so `registration` is undefined on a perfectly healthy
    // origin — and the plain reload there landed on the stale precache again, the same cycle one
    // branch further out. The escape must run first, and it must not need the registration: it
    // asks the browser for the registrations itself, and never queues a second update().
    const h = await load({ registered: false });
    sessionStorage.setItem(GUARD_RELOAD_KEY, "1");
    await aPollSaysWeAreStale();

    await h.mod.checkForUpdate();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.registration.unregister).toHaveBeenCalledTimes(1);
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(h.registration.update).not.toHaveBeenCalled();
  });

  it("the guard leaves its note only when it is really the thing that reloads", async () => {
    // If the worker activates in time (the happy path), the late guard timer must not leave a note
    // on a page that already updated — the same condition `reloadOnce` applies gates the note.
    const on: Handlers = {};
    const installing = worker("installing", on);
    const h = await load({ installing });
    await h.mod.checkForUpdate();
    installing.state = "activated";
    on.statechange?.(); // the fresh worker wins the race against the 8s guard
    expect(h.reload).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(8_000); // the guard fires late, onto an already-reloaded page
    expect(h.reload).toHaveBeenCalledTimes(1); // the latch holds
    expect(sessionStorage.getItem(GUARD_RELOAD_KEY)).toBeNull(); // and no note was left
  });

  it("an origin with no service worker still plain-reloads", async () => {
    const h = await load({ noServiceWorker: true });
    await h.mod.checkForUpdate();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });
});
