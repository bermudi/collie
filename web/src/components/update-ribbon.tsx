import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Notice } from "@/components/ui/notice";
import { StripSlot } from "@/components/ui/strip-host";
import { UPDATE } from "@/lib/strip-priority";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";
import { checkForUpdate, getUpdateStage, subscribeUpdateStage } from "@/lib/pwa";
import { useSelfUpdate } from "@/lib/self-update";
import { ribbonText, ribbonView } from "@/lib/update-ribbon";

// ── THE UPDATE BAND ─────────────────────────────────────────────────────────────────────────────
//
// ONE top-of-app row for the bundle subject: this bundle is behind the bridge, and a new bundle is
// downloading into the precache. It sits in the slot `UpdateAvailableBanner` used to occupy in
// `routes/root.tsx`, which it absorbs entirely — there is no second top band for updates.
// Upstream's row also speaks for the collie-update subject (the offer, the run, the peers); Pup
// updates the host with `collie update`, so the solo band is the bundle and nothing else — see
// `lib/update-ribbon.ts`.
//
// ── IT REGISTERS A SLOT; IT DOES NOT DRAW A ROW ──────────────────────────────────────────────
// The pixels live in the ONE band above the header, `ui/strip-host.tsx`, and this component only
// says how loud its fact is: `UPDATE`, the quietest of the four (`lib/strip-priority.ts`). That is
// what ended the band's original fault — this row, the connection bar and the auth refusal each
// reserved the safe-area inset for themselves, on the assumption that each might be the first thing
// on the screen, so any two of them at once paid for the notch twice and left a dead strip above
// the notice. The inset now has one owner and the band has one winner. The losing fact is not lost:
// the update offer keeps its footer line and its `/settings/updates` control.
//
// ── FIXED HEIGHT, IN EVERY STATE ─────────────────────────────────────────────────────────────
// The row is one height whatever it is saying, and only the text changes. A band that grew and
// shrank as the download progressed would reflow the whole route under the operator's thumb mid-
// install, which is the one moment they are least able to tolerate it. That height is
// `ui/notice.tsx`'s `min-h-[33px]` strip floor, shared with every other strip.
//
// ── MOUNTED UNCONDITIONALLY ──────────────────────────────────────────────────────────────────
// `useSelfUpdate()` is a CONTROLLER as well as a flag: it drives the bundle auto-reload for the
// app's lifetime, and it only runs while something mounts it. So this component mounts always and
// returns null when it has nothing to say — exactly the invariant the banner it replaced carried.
//
// ── THE BAND NEVER STARTS AN UPDATE ──────────────────────────────────────────────────────────
// The one thing it can tap, `checkForUpdate()`, reloads THIS PAGE onto a bundle that is already
// built — it changes nothing on the host.
//
// ── THE DOWNLOAD ROW IS A CLOSE, NOT A DISMISSAL ─────────────────────────────────────────────
// Closing it declines nothing, so it is held in this component and never posted anywhere: the
// install carries on and the controller swap still reloads this page. Upstream's row has one more
// state that dismisses (the release offer, told to the bridge); solo has none.
export function UpdateRibbon() {
  useLocale();
  // The self-updater's own flag. Reading it here is also what MOUNTS the controller — see the header.
  const bundleStale = useSelfUpdate();
  // The service worker's own progress (`lib/pwa.ts`). With no run behind it this band is the only
  // surface that shows it, and it shows it as one word: a download is happening, wait for it
  // (2026-09-12).
  const stage = useSyncExternalStore(subscribeUpdateStage, getUpdateStage, getUpdateStage);
  // THE DOWNLOAD ROW, PUT DOWN FOR THIS DOCUMENT ONLY (2026-09-12). Nothing was declined, the
  // install goes on, and the controller swap still reloads this page when it lands.
  const [downloadHidden, setDownloadHidden] = useState(false);

  // A CLOSE COVERS ONE DOWNLOAD, NOT EVERY FUTURE ONE. The stage leaving `installing` is the end of
  // the worker that was closed over, so the next `updatefound` raises the row again rather than
  // inheriting a decision made about a different bundle.
  useEffect(() => {
    if (stage !== "installing") setDownloadHidden(false);
  }, [stage]);

  const view = ribbonView({
    bundleStale,
    bundleInstalling: stage === "installing",
  });
  if (view.kind === "silent") return null;
  // Closed for this document, and the row stays gone: a band that came straight back as
  // "tap to update" would be the nag the close refused.
  if (view.kind === "bundle-installing" && downloadHidden) return null;

  // A DOWNLOAD IS A THING IN FLIGHT, so it wears the spinner (2026-09-12). It is the one bundle
  // state that does: the reload row is a standing offer, and a spinner on an offer would say
  // something was already running.
  //
  // A RELOAD IS NOT AN OFFER (M20/05). `bundle` says "the bundle on this screen is behind, reload
  // it", and `RefreshCw` is the reload mark, not the up-arrow a new version wears. Never spinning:
  // nothing is in flight until the tap.
  const skin =
    view.kind === "bundle-installing"
      ? ({ Icon: Loader2, spin: true, tone: "caution" } as const)
      : ({ Icon: RefreshCw, spin: false, tone: "caution" } as const);

  // `announce="status"` and nothing beside it: `role="status"` carries its own politeness, and an
  // `aria-live` next to it is the double announcement `ui/notice.tsx` makes inexpressible.
  const shared = {
    tone: skin.tone,
    variant: "strip",
    announce: "status",
    icon: <skin.Icon className={skin.spin ? "animate-spin" : undefined} />,
    children: ribbonText(view),
  } as const;

  // THE DOWNLOAD ROW: A CLOSE AND NOTHING ELSE (2026-09-12). It carries no action button and no
  // whole-surface tap, because there is nothing for a tap to do while a worker is on its way in —
  // the old tap reached `checkForUpdate()`, which finds that worker and keeps waiting. What the
  // operator needs on a dead link is the other door: put the row down, keep using the app on
  // screen, and let the controller swap reload the page if the download ever lands.
  if (view.kind === "bundle-installing") {
    return (
      <StripSlot priority={UPDATE}>
        <Notice
          {...shared}
          dismissLabel={t("updateRibbon.hideNotice")}
          onDismiss={() => setDownloadHidden(true)}
        />
      </StripSlot>
    );
  }

  return (
    <StripSlot priority={UPDATE}>
      <Notice {...shared} onActivate={() => void checkForUpdate()} />
    </StripSlot>
  );
}
