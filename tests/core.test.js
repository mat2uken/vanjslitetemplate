import { describe, expect, it } from "vitest";
import isPresent from "@nkzw/core/isPresent.js";
import sortBy from "@nkzw/core/sortBy.js";
import random from "@nkzw/core/random.js";

describe("@nkzw/core utilities integration", () => {
  it("isPresent correctly identifies non-nullish values", () => {
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(0)).toBe(true);
    expect(isPresent("")).toBe(true);
    expect(isPresent(false)).toBe(true);
    expect(isPresent({})).toBe(true);
  });

  it("sortBy sorts array with custom selector", () => {
    const list = [
      { id: 1, val: 30 },
      { id: 2, val: 10 },
      { id: 3, val: 20 },
    ];
    const sorted = sortBy(list, (x) => x.val);
    expect(sorted.map((x) => x.val)).toEqual([10, 20, 30]);
  });

  it("random produces numbers within specified range", () => {
    const val = random(1, 100);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(100);
  });
});
