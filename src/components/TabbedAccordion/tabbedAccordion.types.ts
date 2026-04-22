import type { RefObject } from "react";

export type TabConfig = {
  label: string;
  row: readonly string[];
  /** When set, only the first N row items are shown. */
  maxItems?: number;
};

export type TabbedAccordionProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /**
   * Tab list (label + rows). If omitted or empty, the imported fallback is used (e.g. demo).
   * To change tab count at runtime, pass a `key` on the parent to remount.
   */
  tabs?: readonly TabConfig[];
};
