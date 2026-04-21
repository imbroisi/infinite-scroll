import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type TabbedAccordionProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
};

const PANEL_TRANSITION_MS = 400;

const TAB_GROUPS: readonly [readonly string[], readonly string[], readonly string[]] =
  [
    [
      "Marina Alcântara",
      "Tomás Bettencourt",
      "Íris Castelo",
      "Otávio Duarte",
      "Luísa Esteves",
      "Henrique Faria",
      "Amélia Gouveia",
      "Duarte Henriques",
      "Constança Inácio",
      "Simão Jordão",
      "Rafael Keller",
      "Leonor Matos",
      "Martinho Nobre",
      "Olívia Ornelas",
      "Pedro Paulino",
      "Queila Ramos",
      "Rodrigo Silvestre",
      "Susana Tavares",
      "Telmo Umbelino",
      "Urano Vilalta",
    ],
    [
      "Beatriz Lemos",
      "Miguel Macedo",
      "Natália Neves",
      "Alexandre Oliveira",
      "Patrícia Pires",
      "Ricardo Queiroz",
      "Sara Ribeiro",
      "Tiago Sequeira",
      "Úrsula Tavares",
      "Vasco Ulrich",
      "Wilma Zanetti",
      "Adriana Azenha",
      "Bruno Borges",
      "Cátia Cruz",
      "Daniela Domingos",
      "Eduardo Estrela",
      "Filipa Fonseca",
      "Gonçalo Gil",
      "Helena Horta",
      "Ivo Inocêncio",
    ],
    [
      "Williams Abreu",
      "Xenia Barros",
      "Yago Caldeira",
      "Zara Dinis",
      "Alan Esteves",
      "Berta Freitas",
      "César Gusmão",
      "Dalila Horta",
      "Érica Inácio",
      "Fabrício Jaques",
      "Gilda Krieger",
      "Horácio Lopes",
      "Isabel Mota",
      "Jaime Noronha",
      "Kelly Oliva",
      "Lúcio Peralta",
      "Marta Quental",
      "Nuno Rebelo",
      "Odete Salvado",
      "Paula Tereno",
    ],
  ];

const TAB_LABELS = ["Aba 1", "Aba 2", "Aba 3"] as const;

/**
 * Distância do topo do contentor rolável até ao topo de `el`, pela cadeia `offsetParent`
 * (vale para sticky: usa posição de layout, não a pintada).
 */
function offsetTopWithinScrollRoot(
  scrollRoot: HTMLElement,
  el: HTMLElement,
): number | null {
  let acc = 0;
  let node: HTMLElement | null = el;
  while (node && node !== scrollRoot) {
    acc += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === scrollRoot ? acc : null;
}

/** px — tolerância ao comparar intervalo entre faixas no critério “coladas”. */
const STUCK_HEADER_THRESHOLD_PX = 6;

/** Scroll fixo no desencostar da Aba 1 (sem cálculo dinâmico deste valor). */
const SCROLL_TOP_ABA1_INTERCEPT_PX = 0;

/** Duração do scroll programático (intercept Aba 1 / clique Aba 2 colada). */
const SCROLL_PROGRAMMATIC_DURATION_MS = 200;

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Anima `element.scrollTop` até `targetTop` em `durationMs` (ease-out quadrático). */
function smoothScrollElementTo(
  element: HTMLElement,
  targetTop: number,
  durationMs: number,
  onComplete?: () => void,
): void {
  const startTop = element.scrollTop;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 0.5) {
    element.scrollTop = targetTop;
    onComplete?.();
    return;
  }
  const t0 = performance.now();
  function tick(now: number): void {
    const u = Math.min(1, (now - t0) / durationMs);
    element.scrollTop = startTop + delta * easeOutQuad(u);
    if (u < 1) {
      requestAnimationFrame(tick);
    } else {
      element.scrollTop = targetTop;
      onComplete?.();
    }
  }
  requestAnimationFrame(tick);
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#121218", paper: "#1a1a22" },
  },
});

/**
 * Igual a `sx={{ mb: TAB_SECTION_MARGIN_SPACING }}` (`spacing(1)` no tema).
 * Também: intervalo sticky entre faixas e critério “coladas” / alvo de scroll da Aba 2.
 */
const TAB_SECTION_MARGIN_SPACING = 1;
const tabSectionMarginBottomPx = Math.round(
  parseFloat(darkTheme.spacing(TAB_SECTION_MARGIN_SPACING)),
);

/**
 * Modelo MUI mínimo para sticky em `.shellScroll`:
 * - Aba 1: sticky top 0 — não “sobe” para fora do topo da área de scroll.
 * - Aba 2: sticky top = altura da Aba 1 + `tabSectionMarginBottomPx` — intervalo antes de encostar.
 * - Aba 3: sticky top = t2 + altura cabeçalho Aba 2 + `tabSectionMarginBottomPx` (mesmo intervalo que 1–2).
 *
 * Cabeçalhos 1 e 2 ficam fora de Accordion para o sticky não ficar limitado ao bloco do Accordion.
 */
export default function TabbedAccordion({
  scrollContainerRef,
}: TabbedAccordionProps) {
  const [expanded, setExpanded] = useState<[boolean, boolean, boolean]>([
    true,
    false,
    false,
  ]);

  const summaryRefAba1 = useRef<HTMLButtonElement>(null);
  /** Painel da Aba 1 (lista); só para debug da altura total header + itens */
  const aba1PanelWrapRef = useRef<HTMLDivElement>(null);
  /** Painel da Aba 2 (lista de itens) — debug altura */
  const aba2PanelWrapRef = useRef<HTMLDivElement>(null);
  const summaryRefAba2 = useRef<HTMLButtonElement>(null);
  const summaryRefAba3 = useRef<HTMLDivElement>(null);

  const [stickyTops, setStickyTops] = useState({
    t2: 56 + tabSectionMarginBottomPx,
    t3: 56 + tabSectionMarginBottomPx + 56 + tabSectionMarginBottomPx,
  });
  /**
   * `scrollTop` ao clicar na Aba 2 colada: total até ao topo da Aba 2 menos altura do cabeçalho da Aba 2
   * (`total − headerAba2`).
   */
  const aba1TotalHeightPxRef = useRef(0);
  const aba1TotalHeightDebugLabelRef = useRef<HTMLSpanElement | null>(null);
  const scrollTopLiveLabelRef = useRef<HTMLSpanElement | null>(null);
  const debugAba2HeaderLabelRef = useRef<HTMLSpanElement | null>(null);
  const debugAba2ItemsLabelRef = useRef<HTMLSpanElement | null>(null);
  const debugAlvoMethodLabelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;

    const updateScrollLabel = () => {
      const label = scrollTopLiveLabelRef.current;
      const v = Math.round(sc.scrollTop);
      if (label && label.textContent !== String(v)) {
        label.textContent = String(v);
      }
    };

    updateScrollLabel();
    sc.addEventListener("scroll", updateScrollLabel, { passive: true });
    return () => sc.removeEventListener("scroll", updateScrollLabel);
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    /** Evita cascata ResizeObserver → setState → layout → RO (travava a UI). */
    let rafId: number | null = null;

    const measure = () => {
      const el1 = summaryRefAba1.current;
      const el2 = summaryRefAba2.current;
      /** Alturas dos cabeçalhos para sticky: `floor(rect.height)` evita `top` maior que o pixel real (faixa “folgada”). */
      const h1 = Math.round(summaryRefAba1.current?.offsetHeight ?? 0);
      const h2 = Math.round(summaryRefAba2.current?.offsetHeight ?? 0);
      const stickyH1 =
        el1 != null
          ? Math.max(1, Math.floor(el1.getBoundingClientRect().height))
          : h1 || 56;
      const stickyH2 =
        el2 != null
          ? Math.max(1, Math.floor(el2.getBoundingClientRect().height))
          : h2 || 56;
      const t2 = stickyH1 + tabSectionMarginBottomPx;
      const t3 = t2 + stickyH2 + tabSectionMarginBottomPx;
      setStickyTops((prev) =>
        prev.t2 === t2 && prev.t3 === t3 ? prev : { t2, t3 },
      );

      const sc = scrollContainerRef.current;
      const btn2 = summaryRefAba2.current;
      const wrap = aba1PanelWrapRef.current;
      const panelH = Math.round(wrap?.offsetHeight ?? 0);
      const marginBelowPanel = wrap != null ? tabSectionMarginBottomPx : 0;

      let total: number;
      let method: "chain" | "chain2" | "sum";
      const chain =
        sc && btn2 ? offsetTopWithinScrollRoot(sc, btn2) : null;
      if (chain != null && Number.isFinite(chain)) {
        total = Math.round(chain);
        method = "chain";
      } else if (sc && btn2) {
        const inner = sc.firstElementChild as HTMLElement | null;
        if (inner) {
          const innerToBtn = offsetTopWithinScrollRoot(inner, btn2);
          const scrollToInner = offsetTopWithinScrollRoot(sc, inner);
          if (innerToBtn != null && Number.isFinite(innerToBtn)) {
            total = Math.round(innerToBtn + (scrollToInner ?? 0));
            method = "chain2";
          } else {
            total = h1 + panelH + marginBelowPanel;
            method = "sum";
          }
        } else {
          total = h1 + panelH + marginBelowPanel;
          method = "sum";
        }
      } else {
        total = h1 + panelH + marginBelowPanel;
        method = "sum";
      }
      /** Alinhado ao sticky `top: t2` (intervalo antes da Aba 1): total − header Aba 2 − mesmo intervalo. */
      aba1TotalHeightPxRef.current = Math.max(
        0,
        Math.round(total) - h2 - tabSectionMarginBottomPx,
      );

      const headerAba2Px = h2;
      const itemsAba2Px = Math.round(aba2PanelWrapRef.current?.offsetHeight ?? 0);

      const setSpan = (
        ref: RefObject<HTMLSpanElement | null>,
        text: string,
      ) => {
        const n = ref.current;
        if (n && n.textContent !== text) n.textContent = text;
      };
      setSpan(aba1TotalHeightDebugLabelRef, String(aba1TotalHeightPxRef.current));
      setSpan(debugAlvoMethodLabelRef, method);
      setSpan(debugAba2HeaderLabelRef, String(headerAba2Px));
      setSpan(debugAba2ItemsLabelRef, String(itemsAba2Px));
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
    const b1 = summaryRefAba1.current;
    const b2 = summaryRefAba2.current;
    const p1 = aba1PanelWrapRef.current;
    const p2 = aba2PanelWrapRef.current;
    if (b1) ro.observe(b1);
    if (b2) ro.observe(b2);
    if (p1) ro.observe(p1);
    if (p2) ro.observe(p2);

    return () => {
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollContainerRef]);

  /**
   * Aba 2 “colada” à Aba 1 quando o espaço vertical entre as faixas é ≤ `tabSectionMarginBottomPx`
   * (até esse intervalo antes de encostar; gap ~0 continua incluído).
   */
  function isAba2StuckBelowAba1(): boolean {
    const btn1 = summaryRefAba1.current;
    const btn2 = summaryRefAba2.current;
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

  /** Apenas aplica {@link SCROLL_TOP_ABA1_INTERCEPT_PX}; nenhum outro cálculo de scroll. */
  function applyAba1InterceptScrollConstant() {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    smoothScrollElementTo(
      sc,
      SCROLL_TOP_ABA1_INTERCEPT_PX,
      SCROLL_PROGRAMMATIC_DURATION_MS,
    );
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

  const debugHud = (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        px: 1.25,
        py: 0.75,
        bgcolor: "rgba(0,0,0,0.82)",
        color: "#93c5fd",
        fontFamily: "ui-monospace, monospace",
        fontSize: 12,
        borderRadius: 1,
        pointerEvents: "none",
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box component="span">
        Alvo scroll (total − header Aba 2):&nbsp;
        <Box component="span" ref={aba1TotalHeightDebugLabelRef}>
          0
        </Box>
        px&nbsp;(
        <Box component="span" ref={debugAlvoMethodLabelRef}>
          —
        </Box>
        )
      </Box>
      <Box component="span">
        Header Aba 2:&nbsp;
        <Box component="span" ref={debugAba2HeaderLabelRef}>
          0
        </Box>
        px
      </Box>
      <Box component="span">
        Itens Aba 2 (painel):&nbsp;
        <Box component="span" ref={debugAba2ItemsLabelRef}>
          0
        </Box>
        px
      </Box>
      <Box component="span">
        scrollTop:&nbsp;
        <Box component="span" ref={scrollTopLiveLabelRef}>
          0
        </Box>
        px
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {createPortal(debugHud, document.body)}
      <Box sx={{ maxWidth: 560, mx: "auto", mt: 0 }}>
        {/* Aba 1 — cabeçalho não pode ficar dentro de um wrapper comum ao painel: limita o sticky quando a Aba 2 encosta */}
        <Box
          ref={summaryRefAba1}
          component="button"
          type="button"
          id="panel-0-header"
          aria-controls="panel-0-content"
          aria-expanded={expanded[0]}
          onClick={() => {
            if (
              expanded[0] &&
              shouldApplyAba2ColadaScrollProcessing(expanded[1])
            ) {
              applyAba1InterceptScrollConstant();
              return;
            }
            setExpanded((prev) => {
              const next: [boolean, boolean, boolean] = [...prev];
              next[0] = !next[0];
              return next;
            });
          }}
          sx={{
            position: "sticky",
            top: 0,
            /** Acima das outras faixas sticky para o clique não cair na Aba 2/3 quando coladas. */
            zIndex: 1300,
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
            {TAB_LABELS[0]}
          </Typography>
          {summaryChevron(expanded[0])}
        </Box>

        <Box
          ref={aba1PanelWrapRef}
          sx={{
            mb: TAB_SECTION_MARGIN_SPACING,
            position: "relative",
            zIndex: 0,
          }}
        >
          <Collapse in={expanded[0]} timeout={PANEL_TRANSITION_MS}>
            <Box
              id="panel-0-content"
              role="region"
              aria-labelledby="panel-0-header"
              sx={{ px: 2, pb: 1, pt: 0 }}
            >
              <List dense disablePadding>
                {TAB_GROUPS[0].slice(0, 20).map((name) => (
                  <ListItem key={name} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText primary={name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Collapse>
        </Box>

        {/* Bloqueia conteúdo a scrollar visível no intervalo sticky (1↔2). */}
        <Box
          aria-hidden
          sx={{
            position: "sticky",
            top: stickyTops.t2 - tabSectionMarginBottomPx,
            height: tabSectionMarginBottomPx,
            mt: `${-tabSectionMarginBottomPx}px`,
            mb: 0,
            flexShrink: 0,
            bgcolor: "background.paper",
            zIndex: 1150,
            pointerEvents: "none",
          }}
        />

        {/* Aba 2 */}
        <Box
          ref={summaryRefAba2}
          component="button"
          type="button"
          id="panel-1-header"
          aria-controls="panel-1-content"
          aria-expanded={expanded[1]}
          onClick={() => {
            if (shouldApplyAba2ColadaScrollProcessing(expanded[1])) {
              const sc = scrollContainerRef.current;
              if (!sc) return;
              const target = Math.max(0, aba1TotalHeightPxRef.current);
              const maxScroll = Math.max(0, sc.scrollHeight - sc.clientHeight);
              const dest = Math.min(target, maxScroll);
              smoothScrollElementTo(
                sc,
                dest,
                SCROLL_PROGRAMMATIC_DURATION_MS,
                () => {
                  const m = Math.max(0, sc.scrollHeight - sc.clientHeight);
                  sc.scrollTop = Math.min(
                    Math.max(0, aba1TotalHeightPxRef.current),
                    m,
                  );
                },
              );
              return;
            }
            setExpanded((prev) => {
              const next: [boolean, boolean, boolean] = [...prev];
              next[1] = !next[1];
              return next;
            });
          }}
          sx={{
            position: "sticky",
            top: stickyTops.t2,
            zIndex: 1200,
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
            {TAB_LABELS[1]}
          </Typography>
          {summaryChevron(expanded[1])}
        </Box>

        <Box
          ref={aba2PanelWrapRef}
          sx={{
            mb: TAB_SECTION_MARGIN_SPACING,
            position: "relative",
            zIndex: 0,
          }}
        >
          <Collapse in={expanded[1]} timeout={PANEL_TRANSITION_MS}>
            <Box
              id="panel-1-content"
              role="region"
              aria-labelledby="panel-1-header"
              sx={{ px: 2, pb: 1, pt: 0 }}
            >
              <List dense disablePadding>
                {TAB_GROUPS[1].slice(0, 15).map((name) => (
                  <ListItem key={name} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText primary={name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Collapse>
        </Box>

        {/* Bloqueia conteúdo a scrollar visível no intervalo sticky (2↔3). */}
        <Box
          aria-hidden
          sx={{
            position: "sticky",
            top: stickyTops.t3 - tabSectionMarginBottomPx,
            height: tabSectionMarginBottomPx,
            mt: `${-tabSectionMarginBottomPx}px`,
            mb: 0,
            flexShrink: 0,
            bgcolor: "background.paper",
            zIndex: 1050,
            pointerEvents: "none",
          }}
        />

        {/* Aba 3 */}
        <Accordion
          expanded={expanded[2]}
          onChange={(_, isExpanded) => {
            setExpanded((prev) => {
              const next: [boolean, boolean, boolean] = [...prev];
              next[2] = isExpanded;
              return next;
            });
          }}
          disableGutters
          slotProps={{
            transition: { timeout: PANEL_TRANSITION_MS },
          }}
          sx={{
            mb: TAB_SECTION_MARGIN_SPACING,
            position: "relative",
            zIndex: 0,
            bgcolor: "background.paper",
            "&:before": { display: "none" },
            borderRadius: 1,
            overflow: "visible",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
          }}
        >
          <AccordionSummary
            ref={summaryRefAba3}
            expandIcon={<span aria-hidden>▾</span>}
            aria-controls="panel-2-content"
            id="panel-2-header"
            sx={{
              position: "sticky",
              top: stickyTops.t3,
              zIndex: 1100,
              isolation: "isolate",
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
            }}
          >
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {TAB_LABELS[2]}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 0 }}>
            <Box id="panel-2-content" sx={{ px: 2, pb: 1 }}>
              <List dense disablePadding>
                {TAB_GROUPS[2].map((name) => (
                  <ListItem key={name} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText primary={name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </ThemeProvider>
  );
}
