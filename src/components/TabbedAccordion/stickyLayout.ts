import { STICKY_FALLBACK_HEADER_HEIGHT_PX } from "./tabbedAccordion.constants";
import { tabSectionMarginBottomPx } from "./tabbedAccordion.theme";

/** Initial estimate of sticky `top` per strip before the first DOM measurement. */
export function buildInitialStickyTopPx(tabCount: number): number[] {
  if (tabCount <= 0) return [];
  const gap = tabSectionMarginBottomPx;
  const approx = STICKY_FALLBACK_HEADER_HEIGHT_PX;
  const tops: number[] = [0];
  let acc = 0;
  for (let i = 1; i < tabCount; i++) {
    acc += approx + gap;
    tops.push(acc);
  }
  return tops;
}
