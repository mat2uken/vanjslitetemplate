import { describe, expect, it, vi } from "vitest";
import { onOutsideTap, onSafeBackKey, onSafeTap } from "../src/utils/events.js";

describe("Safe Events Utility", () => {
  it("onSafeBackKey responds to Escape, Tizen, webOS and Android back keys", () => {
    const handler = vi.fn();
    const cleanup = onSafeBackKey(handler);

    // Escape
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Tizen TV Back (keyCode 10009)
    window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 10009 }));
    expect(handler).toHaveBeenCalledTimes(2);

    // webOS TV Back (keyCode 461)
    window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 461 }));
    expect(handler).toHaveBeenCalledTimes(3);

    // Android TV Back (key GoBack)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "GoBack" }));
    expect(handler).toHaveBeenCalledTimes(4);

    // Ignored other key
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(handler).toHaveBeenCalledTimes(4);

    cleanup();
  });

  it("onSafeTap prevents ghost clicks within debounced window", () => {
    const btn = document.createElement("button");
    document.body.append(btn);

    const handler = vi.fn();
    const cleanup = onSafeTap(btn, handler);

    // Simulate touch event
    btn.dispatchEvent(new CustomEvent("touchend"));
    expect(handler).toHaveBeenCalledTimes(1);

    // Synthetic click immediately following touch should be ignored
    btn.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    btn.remove();
  });

  it("onOutsideTap triggers only when clicking outside specified elements", async () => {
    const insideEl = document.createElement("div");
    const outsideEl = document.createElement("button");
    document.body.append(insideEl, outsideEl);

    const onOutside = vi.fn();
    const cleanup = onOutsideTap(insideEl, onOutside);

    // Wait for event listener registration timeout (10ms)
    await new Promise((r) => setTimeout(r, 20));

    // Click inside
    insideEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onOutside).not.toHaveBeenCalled();

    // Click outside
    outsideEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);

    cleanup();
    insideEl.remove();
    outsideEl.remove();
  });
});
