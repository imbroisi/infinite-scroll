/**
 * Distance from the top of the scroll container to the top of `el` along the `offsetParent` chain
 * (works with sticky: uses layout position, not painted position).
 */
export function offsetTopWithinScrollRoot(
  scrollRoot: HTMLElement,
  el: HTMLElement,
): number | null {
  let acc = 0;
  let node: HTMLElement | null = el;
  while (node && node !== scrollRoot) {
    acc += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === scrollRoot ? acc : null;
}

/** Quadratic ease-out used by {@link smoothScrollElementTo}. */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Scroll position applied at the first-tab intercept (px). */
export const SCROLL_TOP_FIRST_TAB_INTERCEPT_PX = 0;

/** Duration of programmatic scroll (first-tab intercept / second tab stacked). */
export const SCROLL_PROGRAMMATIC_DURATION_MS = 200;

/**
 * If `|scrollTop − target|` is within this value (px), the scroll is considered aligned:
 * clicking the stacked second tab toggles expand/collapse instead of repeating the scroll.
 */
export const SCROLL_AT_TARGET_TOLERANCE_PX = 8;

/** Animates `element.scrollTop` to `targetTop` over `durationMs` (quadratic ease-out). */
export function smoothScrollElementTo(
  element: HTMLElement,
  targetTop: number,
  durationMs: number,
  onComplete?: () => void,
): void {
  const startTop = element.scrollTop;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 0.5) {
    element.scrollTop = targetTop;
    onComplete?.();
    return;
  }
  const t0 = performance.now();
  function tick(now: number): void {
    const u = Math.min(1, (now - t0) / durationMs);
    element.scrollTop = startTop + delta * easeOutQuad(u);
    if (u < 1) {
      requestAnimationFrame(tick);
    } else {
      element.scrollTop = targetTop;
      onComplete?.();
    }
  }
  requestAnimationFrame(tick);
}
