import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  STUCK_HEADER_THRESHOLD_PX,
  STICKY_FALLBACK_HEADER_HEIGHT_PX,
} from "./tabbedAccordion.constants";
import {
  tabSectionMarginBottomPx,
} from "./tabbedAccordion.theme";
import type { TabbedAccordionProps, TabConfig } from "./tabbedAccordion.types";
import {
  SCROLL_AT_TARGET_TOLERANCE_PX,
  SCROLL_PROGRAMMATIC_DURATION_MS,
  SCROLL_TOP_FIRST_TAB_INTERCEPT_PX,
  smoothScrollElementTo,
} from "./scrollDom";
import {
  cumulativeStickyTopsPx,
  gapIndicatesStuckSections,
  resolveTotalPxToSecondSummary,
  secondStickyTabScrollTopPxFromLayout,
  stickyHeightsFromSummaryElements,
} from "./stickyMeasure";
import { buildInitialStickyTopPx } from "./stickyLayout";

type UseTabbedAccordionControllerArgs = {
  scrollContainerRef: TabbedAccordionProps["scrollContainerRef"];
  tabs: readonly TabConfig[];
};

export function useTabbedAccordionController({
  scrollContainerRef,
  tabs,
}: UseTabbedAccordionControllerArgs) {
  const tabCount = tabs.length;

  const [expanded, setExpanded] = useState<boolean[]>(() =>
    tabs.map((_, i) => i === 0),
  );

  const summaryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelWrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [stickyTopPx, setStickyTopPx] = useState<number[]>(() =>
    buildInitialStickyTopPx(tabs.length),
  );

  const secondStickyTabScrollTopPxRef = useRef(0);

  /** Coalesce ResizeObserver work in rAF to avoid observer → setState → layout loops. */
  useLayoutEffect(() => {
    let rafId: number | null = null;

    const measure = () => {
      const summaries = summaryRefs.current;
      const stickyHeights = stickyHeightsFromSummaryElements(
        summaries,
        tabCount,
        STICKY_FALLBACK_HEADER_HEIGHT_PX,
      );

      const tops = cumulativeStickyTopsPx(
        stickyHeights,
        tabCount,
        tabSectionMarginBottomPx,
      );
      setStickyTopPx((prev) =>
        prev.length === tops.length && prev.every((v, i) => v === tops[i])
          ? prev
          : tops,
      );

      const h1 =
        stickyHeights[0] ?? Math.round(summaries[0]?.offsetHeight ?? 0);
      const h2 =
        stickyHeights[1] ?? Math.round(summaries[1]?.offsetHeight ?? 0);

      const sc = scrollContainerRef.current;
      const btn2 = summaries[1];
      const wrap = panelWrapRefs.current[0];
      const panelH = Math.round(wrap?.offsetHeight ?? 0);
      const marginBelowPanel = wrap != null ? tabSectionMarginBottomPx : 0;

      if (tabCount < 2) {
        secondStickyTabScrollTopPxRef.current = 0;
        return;
      }

      const total = resolveTotalPxToSecondSummary(
        sc,
        btn2,
        h1,
        panelH,
        marginBelowPanel,
      );
      secondStickyTabScrollTopPxRef.current = secondStickyTabScrollTopPxFromLayout(
        total,
        h2,
        tabSectionMarginBottomPx,
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

  const isSecondTabStuckBelowFirst = useCallback((): boolean => {
    const btn1 = summaryRefs.current[0];
    const btn2 = summaryRefs.current[1];
    if (!btn1 || !btn2) return false;
    const r1 = btn1.getBoundingClientRect();
    const r2 = btn2.getBoundingClientRect();
    const gapPx = Math.round(r2.top - r1.bottom);
    return gapIndicatesStuckSections(
      gapPx,
      tabSectionMarginBottomPx,
      STUCK_HEADER_THRESHOLD_PX,
    );
  }, []);

  const shouldApplyStuckSecondTabScroll = useCallback(
    (isSecondExpanded: boolean): boolean =>
      isSecondExpanded && isSecondTabStuckBelowFirst(),
    [isSecondTabStuckBelowFirst],
  );

  const applyFirstTabInterceptScroll = useCallback(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    smoothScrollElementTo(
      sc,
      SCROLL_TOP_FIRST_TAB_INTERCEPT_PX,
      SCROLL_PROGRAMMATIC_DURATION_MS,
    );
  }, [scrollContainerRef]);

  const handleTabHeaderClick = useCallback(
    (tabIndex: number) => {
      if (
        tabIndex === 0 &&
        expanded[0] &&
        shouldApplyStuckSecondTabScroll(expanded[1])
      ) {
        applyFirstTabInterceptScroll();
        return;
      }
      if (
        tabIndex === 1 &&
        shouldApplyStuckSecondTabScroll(expanded[1])
      ) {
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
    },
    [
      applyFirstTabInterceptScroll,
      expanded,
      scrollContainerRef,
      shouldApplyStuckSecondTabScroll,
    ],
  );

  const bindSummaryRef = useCallback((index: number) => {
    return (el: HTMLButtonElement | null) => {
      summaryRefs.current[index] = el;
    };
  }, []);

  const bindPanelWrapRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      panelWrapRefs.current[index] = el;
    };
  }, []);

  return {
    expanded,
    stickyTopPx,
    handleTabHeaderClick,
    bindSummaryRef,
    bindPanelWrapRef,
  };
}
