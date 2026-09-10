import { describe, expect, it } from "vitest";
import { createAccordionItem, createTabs } from "../src/components/tabs.js";
import van from "../src/core/van.js";

describe("Lightweight Tabs and Accordion", () => {
  it("switches tab content on button click", async () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: () => van.tags.div("Content 1") },
      { id: "tab2", label: "Tab 2", content: () => van.tags.div("Content 2") },
    ];

    const tabsEl = createTabs(tabs, "tab1");
    const container = document.createElement("div");
    document.body.append(container);
    van.add(container, tabsEl);

    expect(container.textContent).toContain("Content 1");
    expect(container.textContent).not.toContain("Content 2");

    // Click Tab 2 button
    const buttons = container.querySelectorAll(".c-tabs-btn");
    expect(buttons.length).toBe(2);
    buttons[1].click();

    await new Promise((r) => setTimeout(r, 20));

    expect(container.textContent).toContain("Content 2");
    expect(buttons[1].className).toContain("is-active");

    container.remove();
  });

  it("toggles accordion content open and closed", async () => {
    const accordionEl = createAccordionItem("Accordion Title", "Accordion Detail Content", false);
    const container = document.createElement("div");
    document.body.append(container);
    van.add(container, accordionEl);

    // Initial closed state
    expect(container.textContent).toContain("Accordion Title");
    expect(container.textContent).not.toContain("Accordion Detail Content");

    // Click to open
    const toggleBtn = container.querySelector(".c-btn");
    toggleBtn.click();

    await new Promise((r) => setTimeout(r, 20));
    expect(container.textContent).toContain("Accordion Detail Content");

    // Click to close again
    toggleBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(container.textContent).not.toContain("Accordion Detail Content");

    container.remove();
  });
});
