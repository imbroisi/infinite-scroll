import { afterEach, describe, expect, it, vi } from "vitest";

import {
  easeOutQuad,
  offsetTopWithinScrollRoot,
  smoothScrollElementTo,
} from "./scrollDom";

describe("easeOutQuad", () => {
  it("maps 0 to 0 and 1 to 1", () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
  });

  it("is increasing on (0,1)", () => {
    expect(easeOutQuad(0.25)).toBeLessThan(easeOutQuad(0.75));
  });
});

describe("offsetTopWithinScrollRoot", () => {
  it("sums offsetTop along offsetParent chain to scroll root", () => {
    const scrollRoot = document.createElement("div");
    const btn = document.createElement("button");
    scrollRoot.append(btn);
    Object.defineProperty(btn, "offsetParent", {
      configurable: true,
      get: () => scrollRoot,
    });
    Object.defineProperty(btn, "offsetTop", {
      configurable: true,
      value: 120,
    });

    expect(offsetTopWithinScrollRoot(scrollRoot, btn)).toBe(120);
  });

  it("accumulates multiple offset ancestors", () => {
    const scrollRoot = document.createElement("div");
    const middle = document.createElement("div");
    const btn = document.createElement("button");
    scrollRoot.append(middle);
    middle.append(btn);

    Object.defineProperty(btn, "offsetParent", {
      configurable: true,
      get: () => middle,
    });
    Object.defineProperty(btn, "offsetTop", {
      configurable: true,
      value: 40,
    });
    Object.defineProperty(middle, "offsetParent", {
      configurable: true,
      get: () => scrollRoot,
    });
    Object.defineProperty(middle, "offsetTop", {
      configurable: true,
      value: 60,
    });

    expect(offsetTopWithinScrollRoot(scrollRoot, btn)).toBe(100);
  });

  it("returns null when offsetParent chain never reaches scroll root", () => {
    const scrollRoot = document.createElement("div");
    const btn = document.createElement("button");
    Object.defineProperty(btn, "offsetParent", {
      configurable: true,
      get: () => null,
    });
    Object.defineProperty(btn, "offsetTop", {
      configurable: true,
      value: 10,
    });

    expect(offsetTopWithinScrollRoot(scrollRoot, btn)).toBe(null);
  });
});

describe("smoothScrollElementTo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets scrollTop immediately when delta is below 0.5px", () => {
    const el = {
      scrollTop: 100,
    } as unknown as HTMLElement;

    const onComplete = vi.fn();
    smoothScrollElementTo(el, 100.2, 200, onComplete);

    expect(el.scrollTop).toBe(100.2);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("invokes onComplete when already at target", () => {
    const el = {
      scrollTop: 50,
    } as unknown as HTMLElement;

    const onComplete = vi.fn();
    smoothScrollElementTo(el, 50, 200, onComplete);

    expect(el.scrollTop).toBe(50);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
