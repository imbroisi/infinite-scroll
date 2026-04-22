# TabbedAccordion — scroll contract

Short reference for sticky headers + programmatic scroll. Details live in [`useTabbedAccordionController.ts`](./useTabbedAccordionController.ts) (module comment at top).

## Scroll root

The parent passes **`scrollContainerRef`**: it must point to the **scrollable** element whose `scrollTop` moves the accordion (e.g. a wrapper with `overflow: auto` / `scroll`, such as `.shellScroll` in this app). That same node is used for:

- programmatic scroll (`smoothScrollElementTo`, first-tab intercept)
- computing vertical offsets to the second summary header (`offsetTopWithinScrollRoot` / `resolveTotalPxToSecondSummary`)

If the wrong element is wired, sticky `top` values may still update, but scroll targets will be wrong.

## When layout is measured

Inside **`useLayoutEffect`**:

1. **`measure()`** runs once after mount (refs attached).
2. A **`ResizeObserver`** watches each tab’s summary button and panel wrapper; each notification schedules **`measure()`** on the next animation frame (coalesced) so ResizeObserver → `setState` → layout does not thrash.

From that pass we derive sticky header `top` values and refresh **`secondStickyTabScrollTopPxRef`**.

## `secondStickyTabScrollTopPxRef`

A **ref** (not React state) holding the scroll root’s target **`scrollTop` in pixels** so that, when tab 1 and tab 2 behave as **stacked**, scrolling to this value aligns the **second** tab header as intended.

It is computed from the vertical distance to the second summary button, minus the second header height and the section margin (`secondStickyTabScrollTopPxFromLayout`). It is used when the user clicks the **second** tab under that stacked interaction; it is **`0`** if there is only one tab.

Pure math helpers (`stickyMeasure.ts`, `scrollDom.ts`, `stickyLayout.ts`) are covered by unit tests in `*.test.ts` files nearby.

## Storybook

Run `npm run storybook` and open **TabbedAccordion → Sticky scroll (controlled data)**. Use Controls to set tab count, rows per tab, and optional `maxItems` without loading the full app.
