// Chrome stripping for opencode — trims the agent's own TUI composer off the tail so
// the app's composer/statusline supersede it, and re-surfaces the two things the strip
// would otherwise destroy (the Build status and a stranded draft).
//
// Opencode vs omp/grok/claude:
//   Opencode paints a left-border box with heavy vertical "┃" and a bottom border "╹▀▀"
//   with Build status as an inner row, and a hint row "~/build/... shift+tab ..." below.
//   No top border, no rounded corners. The draft lives on "┃  <text>  " inner rows,
//   wrapping onto continuation "┃  ..." rows. The logo (█ blocks) and blank padding
//   above are NOT chrome and must survive the strip: they are the "glitch" the task
//   names — 22 blank top rows + logo remain as raw.

import type { StyledLine } from "../../blocks";
import {
  composerInnerText,
  isBlank,
  isBuildInner,
  isComposerBottom,
  isComposerHint,
  isPlaceholder,
  isVersionRow,
  lastNonBlankIndex,
  lineText,
  rstrip,
} from "./markers";

// Opencode's hint is 1 row directly below the box; version in fresh-idle sits 19 blanks
// further down. The version is not part of the hint run — we skip it for locating so the
// bottom border stays within a tight tail window and composerPrompt remains bound.
const MAX_HINT_ROWS = 8;

// A long draft wraps onto continuation rows inside the box. Cap is defense-in-depth.
const MAX_DRAFT_ROWS = 100;

/** The composer box located at the buffer's tail. Every index is into original lines. */
export interface ComposerBox {
  /** First "┃" inner row (top padding). */
  top: number;
  /** The "╹▀▀" bottom border row. */
  bottom: number;
  /** EXCLUSIVE end of hint/version run below the box (bottom+1 when none). */
  hintEnd: number;
}

/**
 * Locate opencode's composer at the tail, or null. Bottom-up; every step can only reject.
 *
 *     ┃  <draft>                      (b) contiguous ┃ run, includes Build row
 *     ┃  Build · ...                  (b) last inner before bottom
 *     ╹▀▀▀▀...                        (a) bottom border — the anchor
 *     ~/build/... shift+tab ...       (a) hint/version rows, blanks allowed
 */
export function locateComposer(lines: StyledLine[]): ComposerBox | null {
  const texts = lines.map((l) => rstrip(lineText(l)));
  let end = lastNonBlankIndex(texts);
  if (end < 0) return null;
  // Version chip sits 19 blanks beyond the hint in fresh-idle. It is not part of the
  // hint run — skip it for the tail anchor so the bottom border stays within the tight
  // window and composerPrompt remains bound. The strip still discards the version because
  // it slices up to `top`.
  if (isVersionRow(texts[end]!)) {
    let prev = end - 1;
    while (prev >= 0 && isBlank(texts[prev]!)) prev--;
    if (prev >= 0 && isComposerHint(texts[prev]!)) end = prev;
    // else keep original end (Version-only tail without hint is not a composer tail)
  }

  // (a) Bottom border, and hint run below it.
  // Find the last bottom border in the buffer (tail-most). Don't anchor to `end`
  // which may be a far footer (Tip / cwd) 20+ rows below the box — we only
  // require the hint to be directly below the bottom, not that bottom is near `end`.
  let bottom = -1;
  for (let k = texts.length - 1; k >= 0; k--) {
    if (isComposerBottom(texts[k]!)) {
      bottom = k;
      break;
    }
  }
  if (bottom < 0) return null;
  // Hint run directly below bottom (blanks allowed, up to MAX_HINT_ROWS).
  let hintEnd = bottom + 1;
  let hintSeen = false;
  for (let row = bottom + 1; row < texts.length && row - bottom <= MAX_HINT_ROWS; row++) {
    const t = texts[row]!;
    if (isBlank(t)) continue;
    if (composerInnerText(t) !== null) return null;
    if (isComposerHint(t) || isVersionRow(t)) {
      hintSeen = true;
      hintEnd = row + 1;
      // Continue to allow blanks between hint and version, but stop after first hint block.
      // Keep scanning to include a trailing version row if present within window.
      continue;
    }
    if (hintSeen) break; // first non-hint after we've seen hint → end of hint run
    // No hint yet and this is unknown non-blank directly under box → not a composer tail
    // But tolerate Tip / cwd far below: if first non-blank under box is not hint, still
    // accept bottom as composer if we haven't seen hint yet? No — require hint directly below.
    return null;
  }
  if (!hintSeen) {
    // No hint found directly below bottom → not a composer (e.g. mid-turn)
    return null;
  }

  // (b) Contiguous inner rows walking up from bottom.
  let i = bottom - 1;
  let count = 0;
  while (i >= 0 && count < MAX_DRAFT_ROWS && composerInnerText(texts[i]!) !== null) {
    i--;
    count++;
  }
  const top = i + 1;
  if (top >= bottom) return null;
  // Need at least one inner row; top must be inner.
  if (composerInnerText(texts[top]!) === null) return null;

  return { top, bottom, hintEnd };
}

/**
 * Return lines with the composer (and hint/version run) removed from the tail.
 * Unchanged input is SAME REFERENCE, so callers can treat `result === lines` as "no chrome".
 */
export function stripChrome(lines: StyledLine[]): StyledLine[] {
  const texts = lines.map((l) => rstrip(lineText(l)));
  let end = lines.length;
  while (end > 0 && isBlank(texts[end - 1]!)) end--;
  if (end === 0) return lines.length === 0 ? lines : lines.slice(0, 0);

  const box = locateComposer(lines);
  if (box !== null) {
    end = box.top;
    while (end > 0 && isBlank(texts[end - 1]!)) end--;
  }
  return end === lines.length ? lines : lines.slice(0, end);
}

// Helper to slice a StyledLine to inner content (after "┃"), keeping styling.
function sliceInner(line: StyledLine): StyledLine {
  const text = lineText(line);
  const rst = rstrip(text);
  const idx = rst.indexOf("┃");
  if (idx === -1) return { segments: [] };
  const rawStart = idx + 1;
  let contentStart = rawStart;
  // Skip up to 2 spaces that opencode paints as gutter.
  while (contentStart < rst.length && rst[contentStart] === " " && contentStart - rawStart < 2) contentStart++;
  const contentEnd = rst.length; // rstrip already removed trailing padding
  let at = 0;
  const out: typeof line.segments = [];
  for (const seg of line.segments) {
    const segStart = at;
    const segEnd = at + seg.text.length;
    at = segEnd;
    const from = Math.max(segStart, contentStart);
    const to = Math.min(segEnd, contentEnd);
    if (to > from) {
      out.push({ ...seg, text: seg.text.slice(from - segStart, to - segStart) });
    }
    if (at >= contentEnd) break;
  }
  // If content is empty (blank inner), return empty
  const joined = out.map((s) => s.text).join("").trim();
  if (joined === "") return { segments: [] };
  return { segments: out };
}

function trimStyledLine(line: StyledLine): StyledLine {
  const text = rstrip(lineText(line));
  const trimmed = text.trim();
  if (trimmed === "") return { segments: [] };
  const start = text.indexOf(trimmed);
  const end = start + trimmed.length;
  let at = 0;
  const out: typeof line.segments = [];
  for (const seg of line.segments) {
    const segStart = at;
    const segEnd = at + seg.text.length;
    at = segEnd;
    const from = Math.max(segStart, start);
    const to = Math.min(segEnd, end);
    if (to > from) out.push({ ...seg, text: seg.text.slice(from - segStart, to - segStart) });
    if (at >= end) break;
  }
  return { segments: out };
}

/**
 * Opencode's status: the Build row inside the box plus the hint row below it.
 * stripChrome peels both, so this re-surfaces them as app chrome.
 * Returns 0-2 styled rows: Build (if found) and hint (if present).
 */
export function extractStatusLines(lines: StyledLine[]): StyledLine[] {
  const box = locateComposer(lines);
  if (box === null) return [];
  const texts = lines.map((l) => rstrip(lineText(l)));
  const out: StyledLine[] = [];

  // Find Build row inside box
  for (let i = box.top; i < box.bottom; i++) {
    const inner = composerInnerText(texts[i]!);
    if (inner !== null && isBuildInner(inner)) {
      const sliced = sliceInner(lines[i]!);
      if (sliced.segments.length > 0) out.push(sliced);
      break;
    }
  }

  // Find hint row below bottom (first hint)
  for (let i = box.bottom + 1; i < box.hintEnd; i++) {
    const t = texts[i]!;
    if (isBlank(t)) continue;
    if (isComposerHint(t)) {
      const trimmed = trimStyledLine(lines[i]!);
      if (trimmed.segments.length > 0) out.push(trimmed);
      break;
    }
  }

  // Fallback: if no Build found but box exists, return empty? That's okay — status may be just hint.
  // If neither found, return empty (no status).
  return out;
}

/**
 * The user's draft stranded in the composer: inner rows excluding blank padding and Build.
 * Joins wrapped rows with single space (opencode soft-wraps at word boundaries).
 * Placeholder → null. Null also when no composer.
 */
export function extractInputDraft(lines: StyledLine[]): string | null {
  const box = locateComposer(lines);
  if (box === null) return null;
  const texts = lines.map((l) => rstrip(lineText(l)));

  const parts: string[] = [];
  for (let i = box.top; i < box.bottom; i++) {
    const inner = composerInnerText(texts[i]!)!;
    const trimmed = rstrip(inner).trim();
    if (trimmed === "") continue;
    if (isBuildInner(inner)) continue;
    if (isPlaceholder(trimmed)) continue;
    parts.push(trimmed);
  }
  const draft = parts.join(" ").trim();
  return draft === "" ? null : draft;
}

/** Whether opencode's free-text composer is on screen at the tail. */
export function hasComposer(lines: StyledLine[]): boolean {
  return locateComposer(lines) !== null;
}

/** Whether typing would reach the composer (same as hasComposer for opencode Tier-1). */
export function composerReady(lines: StyledLine[]): boolean {
  return locateComposer(lines) !== null;
}

const BRIDGE_PROMPT_TAIL_LINES = 6;

/**
 * The composer's prompt row bound as expected_prompt for the pre-clear sweep.
 * For opencode we bind to the bottom border row (╹▀▀...), which is the most distinctive
 * line at the tail and the line the sweep will erase. Null when too much sits below
 * the box for the bridge's tail window.
 */
export function composerPrompt(lines: StyledLine[]): string | null {
  const box = locateComposer(lines);
  if (box === null) return null;
  if (box.hintEnd - box.bottom - 1 > BRIDGE_PROMPT_TAIL_LINES - 1) return null;
  const row = rstrip(lineText(lines[box.bottom]!));
  return row.length === 0 ? null : row;
}
