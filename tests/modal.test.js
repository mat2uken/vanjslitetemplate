import { beforeEach, describe, expect, it, vi } from "vitest";
import { openModal } from "../src/components/modal.js";
import van from "../src/core/van.js";

describe("Portal Modal Component", () => {
  beforeEach(() => {
    // Clean up any remaining overlays
    const overlays = document.querySelectorAll(".c-modal-overlay");
    for (const el of overlays) {
      el.remove();
    }
  });

  it("mounts to document.body and auto-focuses OK button", async () => {
    const { close } = openModal({
      title: "Test Modal",
      content: van.tags.p("Modal Content"),
    });

    const overlay = document.querySelector(".c-modal-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay.parentNode).toBe(document.body);
    expect(overlay.textContent).toContain("Test Modal");
    expect(overlay.textContent).toContain("Modal Content");

    close();
    expect(document.querySelector(".c-modal-overlay")).toBeNull();
  });

  it("calls onOk and unmounts when OK button is clicked", () => {
    const onOk = vi.fn();
    openModal({
      title: "Confirm",
      content: "Are you sure?",
      onOk,
    });

    const okBtn = document.querySelector("#modal-ok-btn");
    expect(okBtn).not.toBeNull();
    okBtn.click();

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".c-modal-overlay")).toBeNull();
  });

  it("calls onCancel and unmounts when backdrop overlay is clicked", () => {
    const onCancel = vi.fn();
    openModal({
      title: "Backdrop Test",
      content: "Content",
      onCancel,
    });

    const overlay = document.querySelector(".c-modal-overlay");
    overlay.click();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".c-modal-overlay")).toBeNull();
  });

  it("closes on Escape key and Smart TV remote Back key", () => {
    const onCancel = vi.fn();
    openModal({
      title: "Key Test",
      content: "Content",
      onCancel,
    });

    // Simulate Escape keydown
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".c-modal-overlay")).toBeNull();
  });
});
