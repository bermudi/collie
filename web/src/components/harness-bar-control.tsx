import { SlidersHorizontal } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { setHarnessBarEnabled, useHarnessBarEnabled } from "@/lib/harness-bar-pref";

// The harness bar sits with appearance: it is "how this phone draws the chrome around the mirror",
// a standing per-device decision, and it does not belong in the pane's Display dock, which is about
// how the MIRROR looks. (upstream fc8d1be9)
//
// ON by default — the reasoning sits at the default in lib/harness-bar-pref.ts. This row is
// therefore the way OUT of a row the operator can already see, not the way in to one they cannot.
export function HarnessBarControl() {
  const enabled = useHarnessBarEnabled();

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <SlidersHorizontal className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="font-medium">Harness shortcuts</div>
            <p className="text-sm text-muted-foreground">
              A row of the running agent's own commands above the keys.
            </p>
          </div>
        </div>
        <div className="flex h-6 w-11 shrink-0 items-center justify-center">
          <Switch
            checked={enabled}
            onCheckedChange={setHarnessBarEnabled}
            aria-label="Harness shortcuts"
          />
        </div>
      </div>
    </Card>
  );
}
