import { type ReactNode, useEffect, useRef } from "react";

/**
 * A viewport-height flex frame whose live height comes from VisualViewport when available.
 *
 * Android Chrome can leave `100dvh` at the keyboard-reduced height after the keyboard or toolbar
 * closes. The page then has a large blank strip while Collie's internal scroller is still clipped
 * to the stale height. VisualViewport reports the restored height correctly, so mirror it onto the
 * frame; `100dvh` remains the no-JS / unsupported-browser fallback.
 */
export function ViewportFrame({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const element = frameRef.current;
    if (!viewport || !element) return;
    // Firefox (Android and desktop) manages the dynamic toolbar correctly via CSS dvh
    // and its VisualViewport is often stale/small, leaving the white gap/header clip
    // seen in w65_p1-mt68ee2y (Firefox tab, no keyboard). Skip the Chrome workaround there.
    if (navigator.userAgent.includes("Firefox")) return;

    let animationFrame = 0;
    const isInputFocused = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el.isContentEditable ||
        el.getAttribute("role") === "textbox"
      );
    };
    const applyHeight = () => {
      const { height, offsetTop, scale } = viewport;
      // VisualViewport is browser input. A transient invalid sample must remove, not retain, an old
      // keyboard-sized override. Pinch zoom also shrinks VisualViewport; overriding in that state
      // would clip the document to the magnified region and break accessible panning.
      if (
        !Number.isFinite(height) ||
        height <= 0 ||
        !Number.isFinite(offsetTop) ||
        !Number.isFinite(scale) ||
        Math.abs(scale - 1) > 0.001
      ) {
        if (element.style.height !== "") element.style.removeProperty("height");
        return;
      }
      // At scale 1 Chrome may pan the visual viewport down to a focused control. The frame starts
      // at layout-viewport zero, so include that offset to keep its bottom at the visible bottom.
      const visibleBottom = height + Math.max(0, offsetTop);
      // Firefox (and stale Chrome dvh) can leave VisualViewport stuck at the keyboard/toolbar
      // height after dismissal — the page then shows a white strip and the header clips the list
      // (w65_p1-mt66huw8). window.innerHeight is the layout viewport and recovers immediately.
      // When no text control is focused the keyboard is not up, so a viewport smaller than the
      // window is stale — use the larger window value instead. When an input IS focused, the
      // keyboard really is covering the bottom, so honour the smaller visual height.
      let effective = visibleBottom;
      if (!isInputFocused()) {
        const winH = window.innerHeight;
        if (Number.isFinite(winH) && winH > 0 && winH > visibleBottom + 24) {
          effective = winH;
        }
      }
      const next = `${effective}px`;
      if (element.style.height !== next) element.style.height = next;
    };
    const scheduleHeight = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(applyHeight);
    };

    applyHeight();
    viewport.addEventListener("resize", scheduleHeight);
    viewport.addEventListener("scroll", scheduleHeight);
    // Chrome normally pairs VisualViewport and window resize events, but keyboard dismissal bugs
    // are exactly where that pairing can drift. These cheap fallback signals repair the frame too.
    window.addEventListener("resize", scheduleHeight);
    window.addEventListener("pageshow", scheduleHeight);
    document.addEventListener("visibilitychange", scheduleHeight);
    // Keyboard show/hide changes focus without always firing a viewport resize (Firefox).
    document.addEventListener("focusin", scheduleHeight);
    document.addEventListener("focusout", scheduleHeight);
    return () => {
      cancelAnimationFrame(animationFrame);
      viewport.removeEventListener("resize", scheduleHeight);
      viewport.removeEventListener("scroll", scheduleHeight);
      window.removeEventListener("resize", scheduleHeight);
      window.removeEventListener("pageshow", scheduleHeight);
      document.removeEventListener("visibilitychange", scheduleHeight);
      document.removeEventListener("focusin", scheduleHeight);
      document.removeEventListener("focusout", scheduleHeight);
    };
  }, []);

  return (
    <div ref={frameRef} className="flex h-[100dvh] flex-col" data-viewport-frame>
      {children}
    </div>
  );
}
