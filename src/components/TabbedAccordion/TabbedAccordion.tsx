import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import {
  TAB_HEADER_Z_INDEX_STEP,
  TAB_HEADER_Z_INDEX_TOP,
} from "./tabbedAccordion.constants";
import { resolveTabsProp } from "./tabbedAccordion.resolveTabs";
import { tabbedAccordionTheme } from "./tabbedAccordion.theme";
import type { TabbedAccordionProps } from "./tabbedAccordion.types";
import StickyTabSection from "./StickyTabSection";
import { gapMaskZIndexForSectionIndex, tabbedAccordionRootSx } from "./mui";
import { useTabbedAccordionController } from "./useTabbedAccordionController";

export type { TabConfig, TabbedAccordionProps } from "./tabbedAccordion.types";

/**
 * Sticky headers inside `.shellScroll`: each header `top` is the sum of previous strip heights plus section gaps.
 * All tabs share the same structure (button + Collapse), without Accordion, for generic N.
 */
export default function TabbedAccordion({
  scrollContainerRef,
  tabs: tabsProp,
}: TabbedAccordionProps) {
  const tabs = resolveTabsProp(tabsProp);
  const tabCount = tabs.length;

  const {
    expanded,
    stickyTopPx,
    handleTabHeaderClick,
    bindSummaryRef,
    bindPanelWrapRef,
  } = useTabbedAccordionController({ scrollContainerRef, tabs });

  return (
    <ThemeProvider theme={tabbedAccordionTheme}>
      <CssBaseline />
      <Box sx={tabbedAccordionRootSx}>
        {tabs.map((tab, index) => (
          <StickyTabSection
            key={tab.label}
            tab={tab}
            sectionIndex={index}
            isLastSection={index === tabCount - 1}
            expanded={expanded[index] ?? false}
            stickyTopPx={stickyTopPx[index] ?? 0}
            nextSectionStickyTopPx={stickyTopPx[index + 1] ?? 0}
            headerZIndex={TAB_HEADER_Z_INDEX_TOP - index * TAB_HEADER_Z_INDEX_STEP}
            gapMaskZIndex={gapMaskZIndexForSectionIndex(index)}
            onHeaderClick={() => handleTabHeaderClick(index)}
            setSummaryRef={bindSummaryRef(index)}
            setPanelWrapRef={bindPanelWrapRef(index)}
          />
        ))}
      </Box>
    </ThemeProvider>
  );
}
