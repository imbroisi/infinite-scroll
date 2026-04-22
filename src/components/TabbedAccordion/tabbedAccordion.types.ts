import type { ReactNode, RefObject } from "react";

export type TabConfig = {
  label: string;
  /** Panel rows: text, markup, or any React nodes. Keys use index if you need stable identity across reordering, extend the data model. */
  row: readonly ReactNode[];
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
