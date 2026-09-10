import van from "../core/van.js";

const { button, div, span } = van.tags;

/**
 * Lightweight Tabs Component driven by van.state
 * Uses O(1) Map lookup for instant content resolution without repeated array scans.
 * @param {Array<{id: string, label: string, content: () => HTMLElement}>} tabs
 * @param {string} [defaultTabId]
 */
export function createTabs(tabs, defaultTabId = tabs[0]?.id) {
  const activeTabId = van.state(defaultTabId);
  const tabContentMap = new Map();
  for (let i = 0; i < tabs.length; i++) {
    tabContentMap.set(tabs[i].id, tabs[i].content);
  }

  return div(
    { class: "c-tabs" },
    // Tab Header
    div(
      { class: "c-tabs-header" },
      tabs.map((tab) =>
        button(
          {
            class: () => `c-tabs-btn ${activeTabId.val === tab.id ? "is-active" : ""}`,
            onclick: () => {
              activeTabId.val = tab.id;
            },
          },
          tab.label,
        ),
      ),
    ),
    // Tab Body (O(1) Map lookup)
    div({ class: "c-tabs-content" }, () => {
      const content = tabContentMap.get(activeTabId.val);
      if (!content) {
        return "";
      }
      return typeof content === "function" ? content() : content;
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
      () => span({ style: "font-size: 12px; color: #64748b;" }, isOpen.val ? "▲" : "▼"),
    ),
    () =>
      isOpen.val
        ? div({ style: "padding: 14px 16px; border-top: 1px solid #e2e8f0;" }, content)
        : "",
  );
}
