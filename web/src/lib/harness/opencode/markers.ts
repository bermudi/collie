// Shared lexing helpers over the parsed StyledLine[] — the primitives opencode's chrome
// stripping leans on. Same methodology as harness/omp/markers.ts etc. and deliberately NOT the
// same code: each adapter's renderer archaeology is different. Opencode's box is a heavy vertical
// ┃ on the left and a ╹▀▀ bottom border, with Build status inside and a hint row below.
// They operate on parsed line text (segment text joined), never raw ANSI bytes.

import { isBlank, lineText } from "../../blocks";

export { isBlank, lineText };

/** Drop TRAILING whitespace only. Opencode pads box rows to terminal width. */
export function rstrip(text: string): string {
  return text.replace(/\s+$/, "");
}

// Bottom border: "╹" + "▀" repeated. Opencode paints the composer box's bottom as heavy
// vertical light? plus upper half blocks. The inner rows are "┃  <content>  ".
// Loose on leading spaces (box is indented).
const COMPOSER_BOTTOM = /^\s*╹▀+\s*$/;

/** True when the line is the composer box's bottom border. */
export function isComposerBottom(text: string): boolean {
  return COMPOSER_BOTTOM.test(rstrip(text));
}

/** Draft/content of bottom border inner? Not used: bottom carries no draft, just rule. */
export function composerBottomText(text: string): string | null {
  return isComposerBottom(text) ? rstrip(text) : null;
}

// Inner rows: heavy vertical bar at indented column, then content.
// Pattern captures everything after "┃" (including leading spaces).
const COMPOSER_INNER = /^\s*┃(.*)$/;

/** The inner content of a "┃ ..." row (may be empty for blank padding), or null when not inner. */
export function composerInnerText(text: string): string | null {
  const m = COMPOSER_INNER.exec(rstrip(text));
  return m === null ? null : m[1]!;
}

// Hint row below the box: contains the cwd and key hints.
// Examples:
//   "~/build/collie:main                       shift+tab agents  ctrl+p commands"
//   "⬝⬝■■■■■■ esc interrupt ... shift+tab agents ..."
//   "~/build/collie:main   8.6K (1%)  ctrl+p commands ..."
// Generic predicate: contains any of the known hint tokens.
const HINT_PATTERN = /shift\+tab|ctrl\+p|agents|commands|esc interrupt|~\/build|tokens/i;

/** True when the row looks like the hint/status line painted below the box. */
export function isComposerHint(text: string): boolean {
  return HINT_PATTERN.test(rstrip(text));
}

// Version chip at the bottom right in fresh-idle: "0.0.0-beta-17823"
const VERSION_PATTERN = /^\s*\d+\.\d+\.\d+.*beta/i;

/** True when the row is the version chip (idle footer). */
export function isVersionRow(text: string): boolean {
  return VERSION_PATTERN.test(rstrip(text));
}

/** Placeholder that marks an empty composer: "Ask anything...". */
export const PLACEHOLDER_PREFIX = "Ask anything";

/** True when inner content is the placeholder (empty composer). */
export function isPlaceholder(text: string): boolean {
  return rstrip(text).trim().startsWith(PLACEHOLDER_PREFIX);
}

/** True when inner content (after "┃") is the Build status row inside the box. */
export function isBuildInner(inner: string): boolean {
  return rstrip(inner).trim().startsWith("Build");
}

/** Index of the last non-blank row in texts, or -1. */
export function lastNonBlankIndex(texts: string[]): number {
  let i = texts.length - 1;
  while (i >= 0 && isBlank(texts[i]!)) i--;
  return i;
}
