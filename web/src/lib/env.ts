
/** True where element resizes can be observed. jsdom has no `ResizeObserver` (upstream 1.9.0). */
export function hasResizeObserver(): boolean {
  return globalThis.ResizeObserver !== undefined;
}
