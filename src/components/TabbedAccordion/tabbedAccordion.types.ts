import type { RefObject } from "react";

export type TabConfig = {
  label: string;
  row: readonly string[];
  /** Se definido, só mostra os primeiros N itens. */
  maxItems?: number;
};

export type TabbedAccordionProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /**
   * Lista de abas (rótulo + linhas). Se omitida ou vazia, usa-se o fallback importado (ex.: demo).
   * Para mudar N em runtime, use `key` no pai para remontar.
   */
  tabs?: readonly TabConfig[];
};
