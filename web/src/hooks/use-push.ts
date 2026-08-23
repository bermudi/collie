import { useCallback, useEffect, useState } from "react";

import {
  disablePush,
  enablePush,
  getPushState,
  isPushDisabledByUser,
  shouldAutoRepairPush,
  type EnableResult,
  type PushState,
} from "@/lib/push";

// On mount, repair Web Push only when the browser ALREADY holds a grant and the user did not turn it
// off in Settings. The first permission request belongs to the Settings tap — Firefox requires that
// user gesture, and no browser should get an unsolicited prompt on page load. The subscribe flow
// lives in lib/push so the explicit control and this repair path share one implementation.
export function usePushSetup() {
  useEffect(() => {
    const userDisabled = isPushDisabledByUser();
    const permission = typeof Notification === "undefined" ? undefined : Notification.permission;
    if (!shouldAutoRepairPush(userDisabled, permission)) return;
    let cancelled = false;
    void (async () => {
      try {
        await enablePush();
      } catch (e) {
        if (!cancelled) console.warn("[push] setup skipped:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}

// Settings-page controller: the current push state plus an enable/disable action that refreshes it.
export function usePushControl() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setState(await getPushState());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEnabled = useCallback(
    async (enabled: boolean): Promise<EnableResult> => {
      setBusy(true);
      try {
        if (enabled) {
          const res = await enablePush();
          await refresh();
          return res;
        }
        await disablePush();
        await refresh();
        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  return { state, busy, setEnabled };
}
