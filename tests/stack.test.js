import { describe, expect, it } from "vitest";
import { HStack, Stack, VStack } from "../src/components/stack.js";

describe("Stack Layout Components (@nkzw/stack inspired)", () => {
  it("renders default vertical stack with embedded-safe classes", () => {
    const el = Stack({ spacing: 8 }, "Item 1", "Item 2");
    expect(el.className).toContain("c-stack");
    expect(el.className).toContain("u-flex-col");
    expect(el.className).toContain("u-space-y-sm");
    expect(el.style.display).toBe("flex");
    expect(el.style.flexDirection).toBe("column");
    expect(el.childNodes.length).toBe(2);
  });

  it("renders horizontal stack (HStack) with alignment and justify", () => {
    const el = HStack({ align: "center", justify: "between", spacing: 16 }, "Left", "Right");
    expect(el.className).toContain("u-flex-row");
    expect(el.className).toContain("u-space-x-lg");
    expect(el.style.alignItems).toBe("center");
    expect(el.style.justifyContent).toBe("space-between");
  });

  it("renders VStack with direct children without explicit props object", () => {
    const el = VStack("Line 1", "Line 2");
    expect(el.className).toContain("u-flex-col");
    expect(el.childNodes.length).toBe(2);
  });
});
