/** MUI `Collapse` transition duration for panels (ms). */
export const PANEL_TRANSITION_MS = 400;

/** Tolerance (px) for the “stacked strips” criterion (gap between headers). */
export const STUCK_HEADER_THRESHOLD_PX = 6;

/**
 * MUI `theme.spacing(n)` unit for spacing between sections (`sx` `mb`) and sticky gap.
 */
export const TAB_SECTION_MARGIN_SPACING_UNIT = 1;

/**
 * Assumed header height before the first DOM measurement (px); used for initial sticky and fallback.
 */
export const STICKY_FALLBACK_HEADER_HEIGHT_PX = 56;

/** Stacking order: first strip header sits highest in z-order. */
export const TAB_HEADER_Z_INDEX_TOP = 1300;

/** Z-index delta between consecutive strip headers. */
export const TAB_HEADER_Z_INDEX_STEP = 100;

/** Base z-index for gap masks between strips (below the following strip). */
export const TAB_GAP_MASK_Z_INDEX_BASE = 1150;

/** Z-index delta between consecutive gap masks. */
export const TAB_GAP_MASK_Z_INDEX_STEP = 100;

/** Maximum content block width (px). */
export const TAB_ACCORDION_CONTENT_MAX_WIDTH_PX = 560;
