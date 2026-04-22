import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  PANEL_TRANSITION_MS,
  SCROLL_AT_TARGET_TOLERANCE_PX,
  SCROLL_PROGRAMMATIC_DURATION_MS,
  SCROLL_TOP_FIRST_TAB_INTERCEPT_PX,
  STUCK_HEADER_THRESHOLD_PX,
  STICKY_FALLBACK_HEADER_HEIGHT_PX,
  TAB_ACCORDION_CONTENT_MAX_WIDTH_PX,
  TAB_GAP_MASK_Z_INDEX_BASE,
  TAB_GAP_MASK_Z_INDEX_STEP,
  TAB_HEADER_Z_INDEX_STEP,
  TAB_HEADER_Z_INDEX_TOP,
  TAB_SECTION_MARGIN_SPACING_UNIT,
} from "./tabbedAccordion.constants";
import { DEFAULT_TAB_CONFIG } from "./tabbedAccordion.demoData";
import {
  tabSectionMarginBottomPx,
  tabbedAccordionTheme,
} from "./tabbedAccordion.theme";
import {
  offsetTopWithinScrollRoot,
  smoothScrollElementTo,
} from "./tabbedAccordion.scroll";
import type { TabbedAccordionProps, TabConfig } from "./tabbedAccordion.types";

export type { TabConfig, TabbedAccordionProps } from "./tabbedAccordion.types";

function buildInitialStickyTopPx(tabCount: number): number[] {
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

function resolveTabsProp(
  tabsProp: TabbedAccordionProps["tabs"],
): readonly TabConfig[] {
  return tabsProp != null && tabsProp.length > 0 ? tabsProp : DEFAULT_TAB_CONFIG;
}

/**
 * Sticky em `.shellScroll`: cada cabeçalho `top = soma(altura faixas anteriores + margem entre faixas)`.
 * Todas as abas partilham a mesma estrutura (botão + Collapse), sem Accordion, para N genérico.
 */
export default function TabbedAccordion({
  scrollContainerRef,
  tabs: tabsProp,
}: TabbedAccordionProps) {
  const tabs = resolveTabsProp(tabsProp);
  const tabCount = tabs.length;

  const [expanded, setExpanded] = useState<boolean[]>(() =>
    resolveTabsProp(tabsProp).map((_, i) => i === 0),
  );

  const summaryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelWrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [stickyTopPx, setStickyTopPx] = useState<number[]>(() =>
    buildInitialStickyTopPx(resolveTabsProp(tabsProp).length),
  );
  /**
   * Alvo em px para `scrollTop` quando a 2.ª faixa está “colada” e aplicamos scroll programático
   * (derivado do layout: offset até ao 2.º cabeçalho − margem − altura desse cabeçalho).
   */
  const secondStickyTabScrollTopPxRef = useRef(0);

  useLayoutEffect(() => {
    /** Evita cascata ResizeObserver → setState → layout → RO (travava a UI). */
    let rafId: number | null = null;

    const measure = () => {
      const summaries = summaryRefs.current;
      const stickyHeights: number[] = [];
      for (let i = 0; i < tabCount; i++) {
        const el = summaries[i];
        const hOff = Math.round(el?.offsetHeight ?? 0);
        const stickyHi =
          el != null
            ? Math.max(1, Math.floor(el.getBoundingClientRect().height))
            : hOff || STICKY_FALLBACK_HEADER_HEIGHT_PX;
        stickyHeights.push(stickyHi);
      }

      const tops: number[] = [0];
      let accTop = 0;
      for (let i = 1; i < tabCount; i++) {
        accTop += stickyHeights[i - 1] + tabSectionMarginBottomPx;
        tops.push(accTop);
      }
      setStickyTopPx((prev) =>
        prev.length === tops.length && prev.every((v, i) => v === tops[i])
          ? prev
          : tops,
      );

      const h1 = stickyHeights[0] ?? Math.round(summaries[0]?.offsetHeight ?? 0);
      const h2 = stickyHeights[1] ?? Math.round(summaries[1]?.offsetHeight ?? 0);

      const sc = scrollContainerRef.current;
      const btn2 = summaries[1];
      const wrap = panelWrapRefs.current[0];
      const panelH = Math.round(wrap?.offsetHeight ?? 0);
      const marginBelowPanel = wrap != null ? tabSectionMarginBottomPx : 0;

      if (tabCount < 2) {
        secondStickyTabScrollTopPxRef.current = 0;
        return;
      }

      let total: number;
      const chain =
        sc && btn2 ? offsetTopWithinScrollRoot(sc, btn2) : null;
      if (chain != null && Number.isFinite(chain)) {
        total = Math.round(chain);
      } else if (sc && btn2) {
        const inner = sc.firstElementChild as HTMLElement | null;
        if (inner) {
          const innerToBtn = offsetTopWithinScrollRoot(inner, btn2);
          const scrollToInner = offsetTopWithinScrollRoot(sc, inner);
          if (innerToBtn != null && Number.isFinite(innerToBtn)) {
            total = Math.round(innerToBtn + (scrollToInner ?? 0));
          } else {
            total = h1 + panelH + marginBelowPanel;
          }
        } else {
          total = h1 + panelH + marginBelowPanel;
        }
      } else {
        total = h1 + panelH + marginBelowPanel;
      }
      secondStickyTabScrollTopPxRef.current = Math.max(
        0,
        Math.round(total) - h2 - tabSectionMarginBottomPx,
      );
    };

    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    measure();

    const ro = new ResizeObserver(scheduleMeasure);
    for (let i = 0; i < tabCount; i++) {
      const b = summaryRefs.current[i];
      const p = panelWrapRefs.current[i];
      if (b) ro.observe(b);
      if (p) ro.observe(p);
    }

    return () => {
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollContainerRef, tabCount]);

  /**
   * Aba 2 “colada” à Aba 1 quando o espaço vertical entre as faixas é ≤ `tabSectionMarginBottomPx`
   * (até esse intervalo antes de encostar; gap ~0 continua incluído).
   */
  function isAba2StuckBelowAba1(): boolean {
    const btn1 = summaryRefs.current[0];
    const btn2 = summaryRefs.current[1];
    if (!btn1 || !btn2) return false;
    const r1 = btn1.getBoundingClientRect();
    const r2 = btn2.getBoundingClientRect();
    const gapPx = Math.round(r2.top - r1.bottom);
    const maxGap = tabSectionMarginBottomPx;
    const minGap = -STUCK_HEADER_THRESHOLD_PX;
    return gapPx <= maxGap && gapPx >= minGap;
  }

  /**
   * Ajuste de scroll (Aba 1 intercept ou alvo ao clicar Aba 2) só quando **Aba 2 aberta** e **colada** na Aba 1.
   * Aba 2 fechada ou não colada → sem esse processamento.
   */
  function shouldApplyAba2ColadaScrollProcessing(expandedAba2: boolean): boolean {
    return expandedAba2 && isAba2StuckBelowAba1();
  }

  /** Scroll no intercept da 1.ª aba ({@link SCROLL_TOP_FIRST_TAB_INTERCEPT_PX}px). */
  function applyAba1InterceptScrollConstant() {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    smoothScrollElementTo(
      sc,
      SCROLL_TOP_FIRST_TAB_INTERCEPT_PX,
      SCROLL_PROGRAMMATIC_DURATION_MS,
    );
  }

  /** Índices 0 e 1 mantêm o comportamento especial de scroll (intercept / colada); resto só expande. */
  function handleTabHeaderClick(tabIndex: number) {
    if (
      tabIndex === 0 &&
      expanded[0] &&
      shouldApplyAba2ColadaScrollProcessing(expanded[1])
    ) {
      applyAba1InterceptScrollConstant();
      return;
    }
    if (tabIndex === 1 && shouldApplyAba2ColadaScrollProcessing(expanded[1])) {
      const sc = scrollContainerRef.current;
      if (!sc) return;
      const target = Math.max(0, secondStickyTabScrollTopPxRef.current);
      const maxScroll = Math.max(0, sc.scrollHeight - sc.clientHeight);
      const dest = Math.min(target, maxScroll);
      const alreadyAtScrollTarget =
        Math.abs(sc.scrollTop - dest) <= SCROLL_AT_TARGET_TOLERANCE_PX;
      if (alreadyAtScrollTarget) {
        setExpanded((prev) => {
          const next = [...prev];
          next[1] = !next[1];
          return next;
        });
        return;
      }
      smoothScrollElementTo(
        sc,
        dest,
        SCROLL_PROGRAMMATIC_DURATION_MS,
        () => {
          const m = Math.max(0, sc.scrollHeight - sc.clientHeight);
          sc.scrollTop = Math.min(
            Math.max(0, secondStickyTabScrollTopPxRef.current),
            m,
          );
        },
      );
      return;
    }
    setExpanded((prev) => {
      const next = [...prev];
      next[tabIndex] = !next[tabIndex];
      return next;
    });
  }

  const summaryChevron = (open: boolean) => (
    <Box
      aria-hidden
      sx={{
        display: "inline-flex",
        opacity: 0.85,
        transition: "transform 0.2s",
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
      }}
    >
      ▾
    </Box>
  );

  return (
    <ThemeProvider theme={tabbedAccordionTheme}>
      <CssBaseline />
      <Box
        sx={{
          maxWidth: TAB_ACCORDION_CONTENT_MAX_WIDTH_PX,
          mx: "auto",
          mt: 0,
        }}
      >
        {tabs.map((tab, index) => {
          const names =
            tab.maxItems != null
              ? tab.row.slice(0, tab.maxItems)
              : [...tab.row];
          const stickyTop = stickyTopPx[index] ?? 0;
          const headerZ =
            TAB_HEADER_Z_INDEX_TOP - index * TAB_HEADER_Z_INDEX_STEP;

          return (
            <Fragment key={tab.label}>
              <Box
                ref={(el) => {
                  summaryRefs.current[index] = el as HTMLButtonElement | null;
                }}
                component="button"
                type="button"
                id={`panel-${index}-header`}
                aria-controls={`panel-${index}-content`}
                aria-expanded={expanded[index] ?? false}
                onClick={() => handleTabHeaderClick(index)}
                sx={{
                  position: "sticky",
                  top: stickyTop,
                  zIndex: headerZ,
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
                }}
              >
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {tab.label}
                </Typography>
                {summaryChevron(expanded[index] ?? false)}
              </Box>

              <Box
                ref={(el) => {
                  panelWrapRefs.current[index] = el as HTMLDivElement | null;
                }}
                sx={{
                  mb: TAB_SECTION_MARGIN_SPACING_UNIT,
                  position: "relative",
                  zIndex: 0,
                }}
              >
                <Collapse in={expanded[index] ?? false} timeout={PANEL_TRANSITION_MS}>
                  <Box
                    id={`panel-${index}-content`}
                    role="region"
                    aria-labelledby={`panel-${index}-header`}
                    sx={{ px: 2, pb: 1, pt: 0 }}
                  >
                    <List dense disablePadding>
                      {names.map((name) => (
                        <ListItem key={name} disableGutters sx={{ py: 0.25 }}>
                          <ListItemText primary={name} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </Box>

              {index < tabCount - 1 ? (
                <Box
                  aria-hidden
                  sx={{
                    position: "sticky",
                    top:
                      (stickyTopPx[index + 1] ?? 0) -
                      tabSectionMarginBottomPx,
                    height: tabSectionMarginBottomPx,
                    mt: `${-tabSectionMarginBottomPx}px`,
                    mb: 0,
                    flexShrink: 0,
                    bgcolor: "background.paper",
                    zIndex:
                      TAB_GAP_MASK_Z_INDEX_BASE -
                      index * TAB_GAP_MASK_Z_INDEX_STEP,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
            </Fragment>
          );
        })}
      </Box>
    </ThemeProvider>
  );
}
