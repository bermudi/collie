import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkForUpdate, type UpdateStage } from "@/lib/pwa";
import { __resetReloadGuard, holdReload } from "@/lib/reload-guard";
import { __resetSelfUpdate, __setReloadImpl, startSelfUpdate } from "@/lib/self-update";
import { __resetServerBuild, observeServerBuild } from "@/lib/server-build";
import { COLLAPSE_MS } from "@/components/ui/collapse";
import { StripHost } from "@/components/ui/strip-host";
import { UpdateRibbon } from "./update-ribbon";

// The ONE update band. The reading behind it is pinned in `lib/update-ribbon.test.ts`; this file is
// about the row that reaches the screen — its words, its tap, its dismiss, and what it does and does
// NOT own now that the band above the header owns the row it appears in.
//
// THE COMPONENT DRAWS NOTHING WHERE IT SITS. It registers a `StripSlot` and `ui/strip-host.tsx`
// paints the winner, so every case here mounts the real host — a ribbon rendered without one is
// silent by design, and asserting against that would be asserting against the wrong thing.
//
// The bundle states are driven through the REAL self-updater, the way the real poll drives it: a
// build id that is not ours, observed twice (the hysteresis), with or without a reload hold.
//
// Upstream's suite for this component also pins the collie-update rows — the offer, the run, the
// peers, the version dismissal. Pup's band is the bundle subject only (see the lib header), so
// those describes have no row to reach and are upstream's to pin.
//
// The update STAGE is part of this seam too (2026-09-12): the band reads `lib/pwa.ts`'s own store to
// know a new bundle is downloading. A box rather than a constant, so the one case about the download
// row can set it; `vi.hoisted` because a mock factory may not reach an ordinary module variable.

/**
 * The box the stub reads. Named, so the stage is the module's own type and not a widened string.
 *
 * It carries the real module's SUBSCRIPTION too, not just its value: the band drops the download
 * row on a close and raises it again for the next worker, and "the next worker" is nothing but the
 * stage leaving `installing` and coming back. A no-op subscribe could not express that.
 */
interface StageBox {
  current: UpdateStage;
  listeners: Set<() => void>;
  set: (next: UpdateStage) => void;
}
const pwaStage = vi.hoisted((): StageBox => {
  const listeners = new Set<() => void>();
  const box: StageBox = {
    current: "idle",
    listeners,
    set: (next: UpdateStage) => {
      box.current = next;
      for (const listener of listeners) listener();
    },
  };
  return box;
});
vi.mock("@/lib/pwa", () => ({
  checkForUpdate: vi.fn(),
  getUpdateStage: () => pwaStage.current,
  subscribeUpdateStage: (listener: () => void) => {
    pwaStage.listeners.add(listener);
    return () => pwaStage.listeners.delete(listener);
  },
}));

// BUILD.id under vitest is "test" (vitest.config `define`). Any other id reads as stale.
const NEWER_BUILD = "1.5.0+new.1";

/** The band under the real host, the way `routes/root.tsx` mounts it: the feature registers, the
 *  host paints. No router: the solo band's only tap acts, it never navigates. */
async function renderBand() {
  const result = render(
    <StripHost>
      <UpdateRibbon />
    </StripHost>,
  );
  await act(async () => {});
  return result;
}

/** The band's collapsing row. Absent entirely until something has registered at least once. */
function collapse(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[data-slot="collapse"]');
}

/**
 * The strip on screen, or null when the band holds nothing.
 *
 * Scoped through the collapse and addressed by `data-slot`, NOT by `role="status"`: the host keeps
 * two permanent empty live regions (one polite, one assertive) so that a strip appearing is a change
 * inside a region that already existed, and `role="status"` therefore matches one of those as
 * readily as the notice you meant.
 */
function band(container: HTMLElement): HTMLElement | null {
  return collapse(container)?.querySelector<HTMLElement>('[data-slot="notice"]') ?? null;
}

/**
 * Let the band finish closing.
 *
 * "Gone" is a later moment than the tap: the row's exit belongs to the band, which keeps painting
 * the last strip while `ui/collapse.tsx` closes over it, so the words the operator just put down
 * slide away instead of blinking out. What happens ON THE TAP is that the band is told to close —
 * asserted directly, as `data-state`.
 */
async function settleBand(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, COLLAPSE_MS + 32));
  });
}

/** Drive the self-updater to CONFIRMED-stale. With a hold it shows a row; without one it reloads. */
function confirmStaleBundle(): void {
  observeServerBuild(NEWER_BUILD);
  observeServerBuild(NEWER_BUILD);
}

let stop: () => void;
beforeEach(() => {
  vi.clearAllMocks();
  pwaStage.current = "idle";
  pwaStage.listeners.clear();
  sessionStorage.clear();
  __resetServerBuild();
  __resetReloadGuard();
  __resetSelfUpdate();
  __setReloadImpl(() => {}); // jsdom's location.reload throws; the real path is asserted separately
  stop = startSelfUpdate();
});
afterEach(() => {
  stop();
});

describe("update ribbon states — the row on screen", () => {
  it("renders nothing at all when there is nothing to say", async () => {
    const { container } = await renderBand();
    expect(band(container)).toBeNull();
  });
});

describe("pwa path unchanged", () => {
  it("with no Collie update running, the band is the same PWA row it has always been", async () => {
    const user = userEvent.setup();
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    await renderBand();
    expect(
      screen.getByRole("button", { name: "New version — tap to update" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New version — tap to update" }));
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it("says the new version is DOWNLOADING while a worker is on its way in (2026-09-12)", async () => {
    // The incident's missing word. The band offered "tap to update", the operator tapped, and for
    // the two minutes the download took the row went on saying the same thing — so the tap read as
    // ignored and the next one was a reload that landed on a shell about to be deleted.
    pwaStage.current = "installing";
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    await renderBand();
    expect(screen.getByText("Downloading the new version…")).toBeInTheDocument();
    expect(screen.queryByText("New version — tap to update")).not.toBeInTheDocument();
  });

  it("the download row carries a named close, and the close puts it down", async () => {
    // The counsel finding on the 2026-09-12 fix: a worker that never leaves `installing` — a dead
    // link — is waited on forever and on purpose, since reloading early is the incident. So the row
    // that says so must be closable, or the operator reads "Downloading" with no way out over an
    // app that is running perfectly well underneath.
    const user = userEvent.setup();
    pwaStage.current = "installing";
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    const { container } = await renderBand();
    await user.click(screen.getByRole("button", { name: "Hide this notice" }));
    await settleBand();
    expect(band(container)).toBeNull();
  });

  it("a LATER worker raises the row again — a close covers one download, not every one", async () => {
    const user = userEvent.setup();
    pwaStage.current = "installing";
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    await renderBand();
    await user.click(screen.getByRole("button", { name: "Hide this notice" }));
    await settleBand();
    expect(screen.queryByText("Downloading the new version…")).not.toBeInTheDocument();

    // That worker is over and a second `updatefound` starts another. The close was about the first.
    await act(async () => {
      pwaStage.set("idle");
    });
    await act(async () => {
      pwaStage.set("installing");
    });
    expect(screen.getByText("Downloading the new version…")).toBeInTheDocument();
  });
});

describe("a reload prompt does not look like an offer (M20/05)", () => {
  /** The band's leading icon, by the class lucide stamps on every one of its svgs. */
  function icon(container: HTMLElement): string | null {
    const svg = band(container)?.querySelector("svg");
    return svg === null || svg === undefined
      ? null
      : (svg.getAttribute("class")?.match(/lucide-[a-z-]+/)?.[0] ?? null);
  }

  it("a stale BUNDLE asks for a reload, and wears the reload mark", async () => {
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    const { container } = await renderBand();
    expect(icon(container)).toBe("lucide-refresh-cw");
  });

  it("a download wears the spinner, because something is in flight", async () => {
    pwaStage.current = "installing";
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    const { container } = await renderBand();
    expect(icon(container)).toBe("lucide-loader-circle");
  });
});

describe("auto-reload unless held", () => {
  it("with nothing held the app reloads itself and the band never asks for a tap", async () => {
    const reload = vi.fn();
    __setReloadImpl(reload);
    confirmStaleBundle();
    const { container } = await renderBand();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(band(container)).toBeNull(); // the band did not turn an auto-reload into a tap
  });

  it("with a hold active the band offers the tap the self-updater was going to offer anyway", async () => {
    const reload = vi.fn();
    __setReloadImpl(reload);
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    await renderBand();
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText("New version — tap to update")).toBeInTheDocument();
  });

  it("the reload row's tap takes the same path the footer button does", async () => {
    const user = userEvent.setup();
    holdReload("an-open-composer-draft");
    confirmStaleBundle();
    await renderBand();
    // The row's tap target is the whole-row overlay button (Notice's new shape), addressed by its
    // accessible name — jsdom does no hit-testing, so clicking the text node itself finds nothing.
    await user.click(screen.getByRole("button", { name: "New version — tap to update" }));
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });
});
