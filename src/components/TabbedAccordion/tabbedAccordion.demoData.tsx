import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import type { TabConfig } from "./tabbedAccordion.types";

/** Tab 1: small circles (`ReactNode` rows) instead of plain text. */
export const DEMO_TAB1_ROW: readonly ReactNode[] = Array.from(
  { length: 20 },
  (_, i) => {
    const hue = (i * 37) % 360;
    return (
      <Box
        key={i}
        component="span"
        aria-hidden
        title={`Demo item ${i + 1}`}
        sx={{
          display: "inline-block",
          width: 14,
          height: 14,
          borderRadius: "50%",
          bgcolor: `hsl(${hue} 65% 52%)`,
          mr: 1,
          mb: 0.25,
          verticalAlign: "middle",
        }}
      />
    );
  },
);

/**
 * Demo names for tabs 2–3. Replace with `tabs` from your API or app state in production.
 */
export const DEMO_TAB_GROUPS: readonly [readonly string[], readonly string[]] = [
  [
    "Beatrice Lemos",
    "Michael Macedo",
    "Natalie Neves",
    "Alexander Oliveira",
    "Patricia Pires",
    "Richard Queen",
    "Sarah Rivers",
    "Timothy Sequeira",
    "Uma Tavares",
    "Victor Ulrich",
    "Wilma Zanetti",
    "Adrian Azenha",
    "Brian Borges",
    "Cathy Cruz",
    "Danielle Domingos",
    "Edward Estrella",
    "Philippe Fonseca",
    "Grant Gil",
    "Helen Horta",
    "Ian Innocente",
  ],
  [
    "Williams Abreu",
    "Xenia Barros",
    "Yago Calder",
    "Zara Dennis",
    "Alan Esteves",
    "Berta Freitas",
    "Cesar Gusmao",
    "Dalila Horta",
    "Erica Inacio",
    "Fabricio Jacques",
    "Gilda Krieger",
    "Horacio Lopes",
    "Isabel Mota",
    "James Noronha",
    "Kelly Oliva",
    "Lucio Peralta",
    "Martha Quental",
    "Nuno Rebelo",
    "Odete Salvado",
    "Paula Tereno",
  ],
];

/** Demo config with three tabs (labels + rows); use as reference or pass via `tabs`. */
export const DEFAULT_TAB_CONFIG: TabConfig[] = [
  { label: "Tab 1", row: DEMO_TAB1_ROW, maxItems: 20 },
  { label: "Tab 2", row: DEMO_TAB_GROUPS[0], maxItems: 15 },
  { label: "Tab 3", row: DEMO_TAB_GROUPS[1] },
];
