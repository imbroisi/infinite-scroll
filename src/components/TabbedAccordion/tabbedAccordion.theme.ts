import { createTheme } from "@mui/material/styles";
import { TAB_SECTION_MARGIN_SPACING_UNIT } from "./tabbedAccordion.constants";

export const tabbedAccordionTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#121218", paper: "#1a1a22" },
  },
});

export const tabSectionMarginBottomPx = Math.round(
  parseFloat(
    tabbedAccordionTheme.spacing(TAB_SECTION_MARGIN_SPACING_UNIT),
  ),
);
