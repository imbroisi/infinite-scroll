/** Transição MUI `Collapse` dos painéis. */
export const PANEL_TRANSITION_MS = 400;

/** Tolerância (px) no critério “faixas coladas” (intervalo entre cabeçalhos). */
export const STUCK_HEADER_THRESHOLD_PX = 6;

/** Scroll aplicado no intercept da 1.ª aba (px). */
export const SCROLL_TOP_FIRST_TAB_INTERCEPT_PX = 0;

/** Duração do scroll programático (intercept / 2.ª aba colada). */
export const SCROLL_PROGRAMMATIC_DURATION_MS = 200;

/**
 * Se `|scrollTop − alvo|` ≤ este valor (px), considera-se já alinhado:
 * o clique na 2.ª aba colada faz expand/collapse em vez de repetir o scroll.
 */
export const SCROLL_AT_TARGET_TOLERANCE_PX = 8;

/**
 * Unidade MUI `theme.spacing(n)` para margem entre secções (`sx` `mb`) e intervalo sticky.
 */
export const TAB_SECTION_MARGIN_SPACING_UNIT = 1;

/**
 * Altura de cabeçalho assumida antes da 1.ª medição (px), para sticky inicial e fallback.
 */
export const STICKY_FALLBACK_HEADER_HEIGHT_PX = 56;

/** Empilhamento: cabeçalho da 1.ª faixa (mais alto). */
export const TAB_HEADER_Z_INDEX_TOP = 1300;

/** Diferença de z-index entre faixas consecutivas. */
export const TAB_HEADER_Z_INDEX_STEP = 100;

/** Base do z-index das máscaras de gap entre faixas (abaixo da faixa seguinte). */
export const TAB_GAP_MASK_Z_INDEX_BASE = 1150;

/** Diferença de z-index entre máscaras de gap consecutivas. */
export const TAB_GAP_MASK_Z_INDEX_STEP = 100;

/** Largura máxima do bloco de conteúdo (px). */
export const TAB_ACCORDION_CONTENT_MAX_WIDTH_PX = 560;
