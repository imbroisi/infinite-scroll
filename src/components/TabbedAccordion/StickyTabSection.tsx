import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { PANEL_TRANSITION_MS } from "./tabbedAccordion.constants";
import type { TabConfig } from "./tabbedAccordion.types";
import { tabSectionMarginBottomPx } from "./tabbedAccordion.theme";
import {
  stickyGapMaskSx,
  summaryChevronBoxSx,
  tabHeaderButtonSx,
  tabListItemSx,
  tabPanelRegionSx,
  tabPanelWrapSx,
  tabTitleTypographySx,
} from "./mui";

export type StickyTabSectionProps = {
  tab: TabConfig;
  sectionIndex: number;
  isLastSection: boolean;
  expanded: boolean;
  stickyTopPx: number;
  /** Next strip’s sticky top (used by the gap mask). */
  nextSectionStickyTopPx: number;
  headerZIndex: number;
  gapMaskZIndex: number;
  onHeaderClick: () => void;
  setSummaryRef: (el: HTMLButtonElement | null) => void;
  setPanelWrapRef: (el: HTMLDivElement | null) => void;
};

export default function StickyTabSection({
  tab,
  sectionIndex: index,
  isLastSection,
  expanded: isExpanded,
  stickyTopPx,
  nextSectionStickyTopPx,
  headerZIndex,
  gapMaskZIndex,
  onHeaderClick,
  setSummaryRef,
  setPanelWrapRef,
}: StickyTabSectionProps) {
  const names =
    tab.maxItems != null ? tab.row.slice(0, tab.maxItems) : [...tab.row];

  return (
    <>
      <Box
        ref={setSummaryRef}
        component="button"
        type="button"
        id={`panel-${index}-header`}
        aria-controls={`panel-${index}-content`}
        aria-expanded={isExpanded}
        onClick={onHeaderClick}
        sx={tabHeaderButtonSx({
          stickyTopPx,
          zIndex: headerZIndex,
        })}
      >
        <Typography component="span" sx={tabTitleTypographySx}>
          {tab.label}
        </Typography>
        <Box aria-hidden sx={summaryChevronBoxSx(isExpanded)}>
          ▾
        </Box>
      </Box>

      <Box ref={setPanelWrapRef} sx={tabPanelWrapSx}>
        <Collapse in={isExpanded} timeout={PANEL_TRANSITION_MS}>
          <Box
            id={`panel-${index}-content`}
            role="region"
            aria-labelledby={`panel-${index}-header`}
            sx={tabPanelRegionSx}
          >
            <List dense disablePadding>
              {names.map((name) => (
                <ListItem key={name} disableGutters sx={tabListItemSx}>
                  <ListItemText primary={name} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </Box>

      {!isLastSection ? (
        <Box
          aria-hidden
          sx={stickyGapMaskSx({
            maskStickyTopPx:
              nextSectionStickyTopPx - tabSectionMarginBottomPx,
            gapPx: tabSectionMarginBottomPx,
            zIndex: gapMaskZIndex,
          })}
        />
      ) : null}
    </>
  );
}
