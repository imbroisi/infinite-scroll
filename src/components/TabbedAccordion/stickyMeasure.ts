import { STICKY_FALLBACK_HEADER_HEIGHT_PX } from "./tabbedAccordion.constants";
import { offsetTopWithinScrollRoot } from "./scrollDom";

/** Sticky header heights from summary `<button>` elements measured in the DOM. */
export function stickyHeightsFromSummaryElements(
  summaries: readonly (HTMLButtonElement | null)[],
  tabCount: number,
  fallbackHeaderHeightPx: number = STICKY_FALLBACK_HEADER_HEIGHT_PX,
): number[] {
  const stickyHeights: number[] = [];
  for (let i = 0; i < tabCount; i++) {
    const el = summaries[i];
    const hOff = Math.round(el?.offsetHeight ?? 0);
    const stickyHi =
      el != null
        ? Math.max(1, Math.floor(el.getBoundingClientRect().height))
        : hOff || fallbackHeaderHeightPx;
    stickyHeights.push(stickyHi);
  }
  return stickyHeights;
}

/** Cumulative sticky `top` per index (first strip = 0). */
export function cumulativeStickyTopsPx(
  stickyHeights: readonly number[],
  tabCount: number,
  sectionMarginBottomPx: number,
): number[] {
  const tops: number[] = [0];
  let accTop = 0;
  for (let i = 1; i < tabCount; i++) {
    accTop += stickyHeights[i - 1] + sectionMarginBottomPx;
    tops.push(accTop);
  }
  return tops;
}

/**
 * Vertical offset to the second header (`offsetParent` chain or inner-wrapper fallback),
 * mirroring the real scroll container logic.
 */
export function resolveTotalPxToSecondSummary(
  scrollRoot: HTMLElement | null,
  secondSummaryButton: HTMLButtonElement | null,
  h1: number,
  panelH: number,
  marginBelowPanel: number,
): number {
  if (!scrollRoot || !secondSummaryButton) {
    return h1 + panelH + marginBelowPanel;
  }
  const chain = offsetTopWithinScrollRoot(scrollRoot, secondSummaryButton);
  if (chain != null && Number.isFinite(chain)) {
    return Math.round(chain);
  }
  const inner = scrollRoot.firstElementChild as HTMLElement | null;
  if (inner) {
    const innerToBtn = offsetTopWithinScrollRoot(inner, secondSummaryButton);
    const scrollToInner = offsetTopWithinScrollRoot(scrollRoot, inner);
    if (innerToBtn != null && Number.isFinite(innerToBtn)) {
      return Math.round(innerToBtn + (scrollToInner ?? 0));
    }
  }
  return h1 + panelH + marginBelowPanel;
}

/** Target `scrollTop` when the second strip is stacked (programmatic scroll on second-tab click). */
export function secondStickyTabScrollTopPxFromLayout(
  totalPxToSecondSummary: number,
  secondHeaderHeightPx: number,
  sectionMarginBottomPx: number,
): number {
  return Math.max(
    0,
    Math.round(totalPxToSecondSummary) -
      secondHeaderHeightPx -
      sectionMarginBottomPx,
  );
}

/** Whether the first two strips read as “stacked” in the viewport (gap between header rects). */
export function gapIndicatesStuckSections(
  gapPx: number,
  sectionMarginBottomPx: number,
  stuckThresholdPx: number,
): boolean {
  const maxGap = sectionMarginBottomPx;
  const minGap = -stuckThresholdPx;
  return gapPx <= maxGap && gapPx >= minGap;
}
