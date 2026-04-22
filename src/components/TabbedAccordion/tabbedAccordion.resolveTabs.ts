import { DEFAULT_TAB_CONFIG } from "./tabbedAccordion.demoData";
import type { TabbedAccordionProps, TabConfig } from "./tabbedAccordion.types";

export function resolveTabsProp(
  tabsProp: TabbedAccordionProps["tabs"],
): readonly TabConfig[] {
  return tabsProp != null && tabsProp.length > 0 ? tabsProp : DEFAULT_TAB_CONFIG;
}
