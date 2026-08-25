// The opencode adapter — Tier-1 read-only lift.
// Strips the Ask-anything box + Build status + bottom hint off the tail and re-surfaces
// the Build status and a stranded draft. Emits NO interactive block kind, so no tap can
// turn into a keystroke. See HARNESS_CONTRIBUTING.md Tier-1.

import type { Block, StyledLine } from "../../blocks";
import type { HarnessAdapter } from "../types";
import {
  composerPrompt,
  composerReady,
  extractInputDraft,
  extractStatusLines,
  stripChrome,
} from "./chrome";

export function opencodeBuildBlocks(lines: StyledLine[]): Block[] {
  return [{ kind: "raw", lines: stripChrome(lines) }];
}

export { extractStatusLines, extractInputDraft };

export const opencodeAdapter: HarnessAdapter = {
  agent: "opencode",
  buildBlocks: opencodeBuildBlocks,
  extractStatusLines,
  extractInputDraft,
  composerReady,
  composerPrompt,
};
