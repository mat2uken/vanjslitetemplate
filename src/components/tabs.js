import van from "../core/van.js";

const { button, div } = van.tags;

/**
 * Lightweight Tabs Component driven by van.state
 * @param {Array<{id: string, label: string, content: () => HTMLElement}>} tabs
 * @param {string} defaultTabId
 */
export function createTabs(tabs, defaultTabId = tabs[0]?.id) {
  const activeTabId = van.state(defaultTabId);

  return div(
    { class: "c-tabs" },
    // Tab Header
    div(
      { class: "c-tabs-header" },
      tabs.map((tab) =>
        button(
          {
            class: () => `c-tabs-btn ${activeTabId.val === tab.id ? "is-active" : ""}`,
            onclick: () => (activeTabId.val = tab.id),
          },
          tab.label,
        ),
      ),
    ),
    // Tab Body (dynamically evaluates active content)
    div({ class: "c-tabs-content" }, () => {
      const current = tabs.find((t) => t.id === activeTabId.val);
      return current
        ? typeof current.content === "function"
          ? current.content()
          : current.content
        : "";
    }),
  );
}

/**
 * Lightweight Accordion Item driven by van.state
 */
export function createAccordionItem(title, content, defaultOpen = false) {
  const isOpen = van.state(defaultOpen);

  return div(
    { class: "c-card", style: "margin-bottom: 8px; padding: 0; overflow: hidden;" },
    button(
      {
        class: "c-btn",
        onclick: () => (isOpen.val = !isOpen.val),
        style:
          "width: 100%; border: none; border-radius: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #f8fafc; font-weight: 600;",
      },
      title,
      () => van.tags.span({ style: "font-size: 12px; color: #64748b;" }, isOpen.val ? "▲" : "▼"),
    ),
    () =>
      isOpen.val
        ? div({ style: "padding: 14px 16px; border-top: 1px solid #e2e8f0;" }, content)
        : "",
  );
}
