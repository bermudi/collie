import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// The connection banner's red row truncates by design (it can never wrap to a second line), so a
// long cause — "Can't reach Collie — last seen 14:32" plus whatever the tunnel adds — reads cut
// off with no way to see the rest (upstream 747afaa). Tapping the row's expand control opens this:
// the whole message, plus a copy button so the exact wording can be pasted into a report or a
// search. Amber/green never open it — they are ambient/passing, with nothing to diagnose.
export function StatusDetailSheet({
  open,
  onClose,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  /** Short label for the sheet header — the banner's tone in words, e.g. "Connection error". */
  title: string;
  /** The full, untruncated message. */
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    // Clipboard is best-effort here: the message is already fully visible, so a denial still
    // leaves the operator with everything — select-and-copy by hand. `?.()` is the whole
    // feature detection (insecure contexts simply lack the API).
    await navigator.clipboard?.writeText(message).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message}</p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onCopy} className="gap-1.5">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </BottomSheet>
  );
}
