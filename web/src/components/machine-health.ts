import { t } from "@/lib/i18n";
import type { MachineRow } from "@/lib/types";

// A MACHINE ROW'S health word and its tone. Upstream derives these beside the crew formation
// diagram (`components/crew-formation.tsx`), where an unreachable member's `linkState` splits the
// word into reconnecting versus needs-attention. Pup carries no crew (ADR 9004) and the machines
// rows carry no link state — a machine is answering or it is not — so the split has nothing to
// read here. `incompatible` and `conflicted` are crew-protocol states that cannot occur on a solo
// bridge; they keep the unreachable word and tone rather than being invented out of nothing.

/** The word for a machine row's health, translated. */
export function healthWord(m: Pick<MachineRow, "health">): string {
  return m.health === "reachable" ? t("machines.health.reachable") : t("machines.health.unreachable");
}

/**
 * The tone for the health WORD: green is fine, and a machine that is not answering stays plain —
 * a page where everything shouts says nothing. Never `status-working` for `reachable`: that token
 * means "needs attention".
 */
export function healthTone(m: Pick<MachineRow, "health">): string {
  return m.health === "reachable" ? "text-status-done" : "text-muted-foreground";
}
