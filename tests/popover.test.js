import { beforeEach, describe, expect, it } from "vitest";
import { attachPopover } from "../src/components/popover.js";
import van from "../src/core/van.js";

describe("Safe Popover Component", () => {
  let triggerBtn;

  beforeEach(() => {
    // Clean up
    const popovers = document.querySelectorAll(".c-popover");
    for (const el of popovers) {
      el.remove();
    }
    triggerBtn = document.createElement("button");
    triggerBtn.textContent = "Trigger";
    document.body.append(triggerBtn);

    // Mock dimensions
    triggerBtn.getBoundingClientRect = () => ({
      top: 100,
      bottom: 140,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    });
  });

  it("attaches to element and opens on click", () => {
    attachPopover(triggerBtn, van.tags.div("Popover Content"));

    expect(document.querySelector(".c-popover")).toBeNull();

    triggerBtn.click();

    const popover = document.querySelector(".c-popover");
    expect(popover).not.toBeNull();
    expect(popover.textContent).toBe("Popover Content");
    expect(popover.style.position).toBe("fixed");
  });

  it("closes when close function is called inside factory", () => {
    attachPopover(triggerBtn, (close) =>
      van.tags.button({ id: "popover-close-btn", onclick: close }, "Close Inside"),
    );

    triggerBtn.click();
    expect(document.querySelector(".c-popover")).not.toBeNull();

    const closeBtn = document.querySelector("#popover-close-btn");
    closeBtn.click();

    expect(document.querySelector(".c-popover")).toBeNull();
  });

  it("closes on Escape key press", () => {
    attachPopover(triggerBtn, van.tags.div("Content"));
    triggerBtn.click();

    expect(document.querySelector(".c-popover")).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(document.querySelector(".c-popover")).toBeNull();
  });
});
