import { describe, expect, it } from "vitest";
import { placeSafePopover } from "../src/utils/position.js";

describe("Safe Position Engine (placeSafePopover)", () => {
  it("positions popover directly below trigger when space is available", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");

    // Mock bounding client rects
    trigger.getBoundingClientRect = () => ({
      top: 100,
      bottom: 140,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    });

    popover.getBoundingClientRect = () => ({
      top: 0,
      bottom: 80,
      left: 0,
      right: 120,
      width: 120,
      height: 80,
    });

    window.innerWidth = 800;
    window.innerHeight = 600;

    placeSafePopover(trigger, popover, { offset: 10, placement: "bottom" });

    expect(popover.style.position).toBe("fixed");
    // top = trigger.bottom + offset = 140 + 10 = 150
    expect(popover.style.top).toBe("150px");
    // left = trigger.left + (trigger.width - popover.width) / 2 = 100 + (100 - 120) / 2 = 90
    expect(popover.style.left).toBe("90px");
  });

  it("flips popover above trigger when space below is insufficient", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");

    // Trigger near bottom of viewport (innerHeight = 600)
    trigger.getBoundingClientRect = () => ({
      top: 540,
      bottom: 580,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    });

    popover.getBoundingClientRect = () => ({
      top: 0,
      bottom: 100,
      left: 0,
      right: 120,
      width: 120,
      height: 100,
    });

    window.innerWidth = 800;
    window.innerHeight = 600;

    placeSafePopover(trigger, popover, { offset: 10, placement: "bottom" });

    // Flip to top: top = trigger.top - offset - popover.height = 540 - 10 - 100 = 430
    expect(popover.style.top).toBe("430px");
  });

  it("clamps popover left position within viewport margin", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");

    // Trigger placed at far right boundary
    trigger.getBoundingClientRect = () => ({
      top: 100,
      bottom: 140,
      left: 760,
      right: 800,
      width: 40,
      height: 40,
    });

    popover.getBoundingClientRect = () => ({
      top: 0,
      bottom: 60,
      left: 0,
      right: 150,
      width: 150,
      height: 60,
    });

    window.innerWidth = 800;
    window.innerHeight = 600;

    placeSafePopover(trigger, popover, { margin: 10 });

    // Max left = window.innerWidth - popover.width - margin = 800 - 150 - 10 = 640
    expect(popover.style.left).toBe("640px");
  });
});
