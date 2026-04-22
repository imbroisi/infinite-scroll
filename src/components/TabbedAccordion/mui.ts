import type { SxProps, Theme } from "@mui/material/styles";

import {
  TAB_ACCORDION_CONTENT_MAX_WIDTH_PX,
  TAB_GAP_MASK_Z_INDEX_BASE,
  TAB_GAP_MASK_Z_INDEX_STEP,
  TAB_SECTION_MARGIN_SPACING_UNIT,
} from "./tabbedAccordion.constants";

/** Root container (centered max width). */
export const tabbedAccordionRootSx: SxProps<Theme> = {
  maxWidth: TAB_ACCORDION_CONTENT_MAX_WIDTH_PX,
  mx: "auto",
  mt: 0,
};

/** Sticky header for each tab (`top` / `zIndex` come from measurement). */
export function tabHeaderButtonSx(args: {
  stickyTopPx: number;
  zIndex: number;
}): SxProps<Theme> {
  const { stickyTopPx, zIndex } = args;
  return {
    position: "sticky",
    top: stickyTopPx,
    zIndex,
    isolation: "isolate",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    px: 2,
    py: 1.25,
    minHeight: 48,
    boxSizing: "border-box",
    border: "none",
    margin: 0,
    mb: 0,
    cursor: "pointer",
    font: "inherit",
    color: "inherit",
    textAlign: "left",
    bgcolor: "background.paper",
    borderBottom: 1,
    borderColor: "divider",
    borderRadius: 1,
    overflow: "hidden",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
  };
}

export const tabTitleTypographySx: SxProps<Theme> = {
  fontWeight: 700,
};

/** Chevron beside the header label. */
export function summaryChevronBoxSx(open: boolean): SxProps<Theme> {
  return {
    display: "inline-flex",
    opacity: 0.85,
    transition: "transform 0.2s",
    transform: open ? "rotate(0deg)" : "rotate(-90deg)",
  };
}

/** Panel wrapper around `Collapse` (spacing between sections). */
export const tabPanelWrapSx: SxProps<Theme> = {
  mb: TAB_SECTION_MARGIN_SPACING_UNIT,
  position: "relative",
  zIndex: 0,
};

/** Listed content region (`role="region"`). */
export const tabPanelRegionSx: SxProps<Theme> = {
  px: 2,
  pb: 1,
  pt: 0,
};

export const tabListItemSx: SxProps<Theme> = {
  py: 0.25,
};

/**
 * Opaque strip between sticky headers to hide content in the gap.
 * `maskStickyTopPx` is the mask’s sticky top in px (already `nextHeaderTop − gap`).
 */
export function stickyGapMaskSx(args: {
  maskStickyTopPx: number;
  gapPx: number;
  /** `TAB_GAP_MASK_Z_INDEX_BASE − index * TAB_GAP_MASK_Z_INDEX_STEP` */
  zIndex: number;
}): SxProps<Theme> {
  const { maskStickyTopPx, gapPx, zIndex } = args;
  return {
    position: "sticky",
    top: maskStickyTopPx,
    height: gapPx,
    mt: `${-gapPx}px`,
    mb: 0,
    flexShrink: 0,
    bgcolor: "background.paper",
    zIndex,
    pointerEvents: "none",
  };
}

/** Gap-mask z-index between tab `index` and `index + 1`. */
export function gapMaskZIndexForSectionIndex(index: number): number {
  return TAB_GAP_MASK_Z_INDEX_BASE - index * TAB_GAP_MASK_Z_INDEX_STEP;
}
