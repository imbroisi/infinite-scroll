/**
 * Distância do topo do contentor rolável até ao topo de `el`, pela cadeia `offsetParent`
 * (vale para sticky: usa posição de layout, não a pintada).
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

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Anima `element.scrollTop` até `targetTop` em `durationMs` (ease-out quadrático). */
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
