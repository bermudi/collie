import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";
import { sendGuardedReply } from "../../reply-action";
import { parseAnsi } from "../../ansi";
import { splitLines } from "../../blocks";
import { composerPrompt, extractInputDraft, extractStatusLines, hasComposer, stripChrome } from "./index";

const dir = join(import.meta.dirname, "../../../fixtures/omp-pi-shape");
const idle = readFileSync(join(dir, "idle.txt"), "utf8");
const parse = (text: string) => splitLines(parseAnsi(text));
const withDraft = (draft: string) => idle.split("\n").map((row, i) => i === 1 ? ` ${draft}` : row).join("\n");

describe("OMP 18.1.13 pi-shaped editor (live captures, 2026-09-07)", () => {
  it("recognises the idle editor and moves its footer into the status strip", () => {
    expect(hasComposer(parse(idle))).toBe(true);
    expect(extractInputDraft(parse(idle))).toBeNull();
    expect(extractStatusLines(parse(idle))).toHaveLength(2);
    expect(stripChrome(parse(idle))).toEqual([]);
  });
  it("extracts Korean and multiline drafts and binds the draft, not just a rule", () => {
    const draft = "한글 전송 테스트\n second line";
    const screen = parse(withDraft(draft));
    expect(extractInputDraft(screen)).toBe("한글 전송 테스트 second line");
    expect(composerPrompt(screen)).toContain("한글 전송 테스트");
  });
  it("submits only after the real Korean draft capture verifies the typed message", async () => {
    const text = "파일이나 도구를 사용하지 말고 COLLIE_E2E_OK 라고만 답해 주세요.";
    const captured = readFileSync(join(dir, "korean-draft.txt"), "utf8");
    expect(extractInputDraft(parse(captured))).toBe(text);
    let screen = idle;
    const calls: Array<{ text: string; submit: boolean }> = [];
    server.use(
      http.get(/\/api\/pane\/[^/]+$/, () => HttpResponse.json({ paneId: "test:p1", text: screen })),
      http.post<never, { text: string; submit: boolean }>(/\/api\/pane\/[^/]+\/reply$/, async ({ request }) => {
        calls.push(await request.json());
        screen = captured;
        return HttpResponse.json({ ok: true });
      }),
    );
    const result = await sendGuardedReply({ paneId: "test:p1", agent: "omp", text, requestedLines: 200, sleep: async () => {} });
    expect(result.status).toBe("sent");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual({ text, submit: false });
    expect(calls[1]).toMatchObject({ text: "", submit: true });
  });
  it("rejects the real model picker and a dialog covering the editor", () => {
    const menu = readFileSync(join(dir, "model-menu.txt"), "utf8");
    expect(hasComposer(parse(menu))).toBe(false);
    expect(hasComposer(parse(`${idle}\n${menu}`))).toBe(false);
    expect(hasComposer(parse(`${idle}\nApprove this action?`))).toBe(false);
  });
  it("excludes an unaccepted Korean inline completion from the live draft", () => {
    const capture = readFileSync(join(dir, "korean-ghost.txt"), "utf8");
    const draft = extractInputDraft(parse(capture));
    expect(draft).toContain("검사 항목 3번째 한글 내용");
    expect(draft).not.toContain("한글 내용을");
    expect(draft?.endsWith("한글 내용")).toBe(true);
  });
  it("rejects unstyled separators and missing or changed borders", () => {
    const plain = parse(idle).map((line) => line.segments.map((s) => s.text).join("")).join("\n");
    expect(hasComposer(parse(plain))).toBe(false);
    expect(hasComposer(parse(idle.split("\n").slice(1).join("\n")))).toBe(false);
    expect(hasComposer(parse(idle.replace("─", "━")))).toBe(false);
  });
});

// The prompt region the pi branch hands the destructive-write binding is bounded to its TRAILING
// rows: the bridge's expected_prompt check is a contiguous match in the screen tail, so the last
// rows carry the binding — and an unbounded ~101-row region on a wide pane would pass the bridge's
// 8192-char cap and fail-closed the submit of exactly the long reply the transport exists for.
describe("pi composerPrompt — the region is bounded for the wire", () => {
  it("keeps the region under the bridge's expected_prompt cap on a tall wide editor", () => {
    // The idle fixture's real styled rules and footer, with 99 wide draft rows spliced in — 99
    // plus the fixture's own draft row is the 101-row span the locator accepts at most.
    const rows = idle.split("\n");
    const wide = Array.from({ length: 99 }, () => ` ${"x".repeat(178)}`);
    const tall = [...rows.slice(0, 1), ...wide, ...rows.slice(1)].join("\n");
    const screen = parse(tall);
    expect(hasComposer(screen)).toBe(true);

    const region = composerPrompt(screen);
    expect(region).not.toBeNull();
    // Comfortably under the bridge's 8192 MAX_EXPECTED_PROMPT_CHARS, and still ends on the rule.
    expect(region!.length).toBeLessThanOrEqual(8192);
    expect(region!.split("\n").length).toBeGreaterThanOrEqual(2);
  });
});
