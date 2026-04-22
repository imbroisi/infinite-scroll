import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import * as scrollDom from "./scrollDom";
import {
  cumulativeStickyTopsPx,
  gapIndicatesStuckSections,
  resolveTotalPxToSecondSummary,
  secondStickyTabScrollTopPxFromLayout,
  stickyHeightsFromSummaryElements,
} from "./stickyMeasure";

vi.mock("./scrollDom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./scrollDom")>();
  return {
    ...actual,
    offsetTopWithinScrollRoot: vi.fn(actual.offsetTopWithinScrollRoot),
  };
});

beforeEach(async () => {
  const actual = await vi.importActual<typeof import("./scrollDom")>(
    "./scrollDom",
  );
  vi.mocked(scrollDom.offsetTopWithinScrollRoot).mockImplementation(
    actual.offsetTopWithinScrollRoot,
  );
});

describe("cumulativeStickyTopsPx", () => {
  it("returns [0] for a single tab", () => {
    expect(cumulativeStickyTopsPx([56], 1, 8)).toEqual([0]);
  });

  it("accumulates prior header height plus margin between strips", () => {
    expect(cumulativeStickyTopsPx([48, 52, 40], 3, 8)).toEqual([
      0,
      48 + 8,
      48 + 8 + 52 + 8,
    ]);
  });
});

describe("gapIndicatesStuckSections", () => {
  const margin = 8;
  const threshold = 6;

  it("is true when gap matches section margin (snug)", () => {
    expect(gapIndicatesStuckSections(margin, margin, threshold)).toBe(true);
  });

  it("is true for small positive gaps before headers touch", () => {
    expect(gapIndicatesStuckSections(4, margin, threshold)).toBe(true);
    expect(gapIndicatesStuckSections(0, margin, threshold)).toBe(true);
  });

  it("is true for slight overlap within negative threshold", () => {
    expect(gapIndicatesStuckSections(-4, margin, threshold)).toBe(true);
    expect(gapIndicatesStuckSections(-threshold, margin, threshold)).toBe(
      true,
    );
  });

  it("is false when strips are visibly separated beyond margin", () => {
    expect(gapIndicatesStuckSections(24, margin, threshold)).toBe(false);
  });

  it("is false when overlap exceeds stuck threshold", () => {
    expect(gapIndicatesStuckSections(-10, margin, threshold)).toBe(false);
  });
});

describe("secondStickyTabScrollTopPxFromLayout", () => {
  it("subtracts second header height and section margin from total offset", () => {
    expect(secondStickyTabScrollTopPxFromLayout(400, 52, 8)).toBe(340);
  });

  it("floors at zero when layout total is smaller than header plus margin", () => {
    expect(secondStickyTabScrollTopPxFromLayout(50, 52, 8)).toBe(0);
  });

  it("rounds total before subtracting", () => {
    expect(secondStickyTabScrollTopPxFromLayout(100.6, 40, 8)).toBe(53);
  });
});

describe("stickyHeightsFromSummaryElements", () => {
  it("uses max(1, floor(getBoundingClientRect().height)) when element exists", () => {
    const btn = document.createElement("button");
    btn.getBoundingClientRect = () =>
      ({
        height: 47.8,
      }) as DOMRect;
    Object.defineProperty(btn, "offsetHeight", {
      value: 48,
      configurable: true,
    });

    expect(stickyHeightsFromSummaryElements([btn], 1, 56)).toEqual([47]);
  });

  it("clamps measured height to at least 1px when rect reports zero", () => {
    const btn = document.createElement("button");
    btn.getBoundingClientRect = () =>
      ({
        height: 0,
      }) as DOMRect;
    Object.defineProperty(btn, "offsetHeight", {
      value: 44,
      configurable: true,
    });

    expect(stickyHeightsFromSummaryElements([btn], 1, 56)).toEqual([1]);
  });

  it("uses fallback header height when entry is null", () => {
    expect(stickyHeightsFromSummaryElements([null], 1, 56)).toEqual([56]);
  });
});

describe("resolveTotalPxToSecondSummary", () => {
  it("returns fallback sum when scroll root is null", () => {
    const btn = document.createElement("button");
    expect(resolveTotalPxToSecondSummary(null, btn, 48, 200, 8)).toBe(256);
  });

  it("returns fallback sum when second summary button is null", () => {
    const root = document.createElement("div");
    expect(resolveTotalPxToSecondSummary(root, null, 48, 200, 8)).toBe(256);
  });

  it("uses direct offset chain from scroll root to second button when available", () => {
    const scrollRoot = document.createElement("div");
    const btn = document.createElement("button");
    scrollRoot.append(btn);
    Object.defineProperty(btn, "offsetParent", {
      configurable: true,
      get: () => scrollRoot,
    });
    Object.defineProperty(btn, "offsetTop", {
      configurable: true,
      value: 312,
    });

    expect(resolveTotalPxToSecondSummary(scrollRoot, btn, 48, 200, 8)).toBe(
      312,
    );
  });

  it("falls back to h1 + panel + margin when inner wrapper path yields no finite inner offset", () => {
    const scrollRoot = document.createElement("div");
    const btn = document.createElement("button");

    vi.mocked(scrollDom.offsetTopWithinScrollRoot).mockImplementation(() => null);

    expect(resolveTotalPxToSecondSummary(scrollRoot, btn, 48, 200, 8)).toBe(
      256,
    );
  });

  it("sums inner→button and scrollRoot→inner when direct chain is null but inner exists", () => {
    const scrollRoot = document.createElement("div");
    const inner = document.createElement("div");
    const btn = document.createElement("button");
    scrollRoot.append(inner);

    vi.mocked(scrollDom.offsetTopWithinScrollRoot).mockImplementation(
      (root, el) => {
        if (root === scrollRoot && el === btn) return null;
        if (root === inner && el === btn) return 80;
        if (root === scrollRoot && el === inner) return 20;
        return null;
      },
    );

    expect(resolveTotalPxToSecondSummary(scrollRoot, btn, 48, 200, 8)).toBe(
      100,
    );
  });
});
