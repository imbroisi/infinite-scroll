import { describe, expect, it } from "vitest";

import { STICKY_FALLBACK_HEADER_HEIGHT_PX } from "./tabbedAccordion.constants";
import { tabSectionMarginBottomPx } from "./tabbedAccordion.theme";
import { buildInitialStickyTopPx } from "./stickyLayout";

describe("buildInitialStickyTopPx", () => {
  it("returns empty array for non-positive tab counts", () => {
    expect(buildInitialStickyTopPx(0)).toEqual([]);
    expect(buildInitialStickyTopPx(-1)).toEqual([]);
  });

  it("starts at 0 and stacks approx header height plus section gap", () => {
    const gap = tabSectionMarginBottomPx;
    const approx = STICKY_FALLBACK_HEADER_HEIGHT_PX;
    expect(buildInitialStickyTopPx(1)).toEqual([0]);
    expect(buildInitialStickyTopPx(2)).toEqual([0, approx + gap]);
    expect(buildInitialStickyTopPx(3)).toEqual([
      0,
      approx + gap,
      2 * (approx + gap),
    ]);
  });
});
