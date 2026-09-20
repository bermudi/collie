import { t } from "./i18n";

// ── THE UPDATE BAND, AS A PURE READING ──────────────────────────────────────────────────────────
//
// One top-of-app row carries the whole update subject Pup has, and WHICH of its states is on screen
// is decided here rather than inside the component, so the precedence is pinned by unit tests
// instead of by pulling a DOM apart.
//
// Upstream's reading also carries the collie-update states — the release offer, the run in flight,
// the peers trailing it. Pup updates the host with `collie update` (the check-only monitor), so
// those states have nothing to read and no screen to send a tap to: the solo band is the bundle
// subject and nothing else. The view names and the precedence match upstream's, so a future merge
// lands as a diff against this file and not as a redesign.

export type RibbonView =
  | { kind: "silent" }
  | { kind: "bundle" }
  | { kind: "bundle-installing" };

/** Everything the reading needs. Both are client facts; solo has no poll side to read. */
export interface RibbonInput {
  /** `useSelfUpdate()`'s banner flag — the bundle on screen is behind the bridge. Never re-derived here. */
  bundleStale: boolean;
  /**
   * A new bundle is downloading into the precache right now (`lib/pwa.ts`'s update stage).
   *
   * The 2026-09-12 incident's missing word. The band offered "tap to reload", the operator tapped,
   * and the app went on saying the same thing for the two minutes the download took — so the tap
   * looked ignored and the next one was a reload nobody should have made. A download the operator
   * can see is a download the operator waits out.
   */
  bundleInstalling: boolean;
}

export function ribbonView(input: RibbonInput): RibbonView {
  // THE DOWNLOAD OUTRANKS THE OFFER IT IS THE ANSWER TO (2026-09-12). Same row, same fact, one step
  // further on: this bundle is behind, and the new one is on its way in.
  if (input.bundleStale && input.bundleInstalling) return { kind: "bundle-installing" };

  // A stale bundle is the PWA row exactly as it has always been: the tap reloads THIS PAGE onto a
  // bundle that already exists.
  if (input.bundleStale) return { kind: "bundle" };

  return { kind: "silent" };
}

export function ribbonText(view: RibbonView): string {
  switch (view.kind) {
    case "silent":
      return "";
    case "bundle":
      return t("pwa.updateAvailable");
    case "bundle-installing":
      return t("pwa.updateInstalling");
  }
}
