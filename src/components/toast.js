import van from "../core/van.js";
import { mountPortal } from "./portal.js";

const { div } = van.tags;

let toastContainer = null;
let unmountContainer = null;

function getOrCreateContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = div({ class: "c-toast-container" });
    unmountContainer = mountPortal(toastContainer);
  }
  return toastContainer;
}

/**
 * Shows an ultra-lightweight toast notification.
 * Auto-cleans and unmounts container from body when empty (zero memory leak).
 * Zero extra DOM nodes: message text is rendered directly without wrapping <span>.
 */
export function showToast(message, type = "info", duration = 3000) {
  const container = getOrCreateContainer();

  const toastEl = div(
    {
      class:
        `c-toast ${type === "success" ? "is-success" : type === "error" ? "is-error" : ""}`.trim(),
    },
    message,
  );

  container.append(toastEl);

  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
    // If container is empty, unmount it to prevent lingering DOM nodes
    if (toastContainer && toastContainer.childNodes.length === 0) {
      if (unmountContainer) {
        unmountContainer();
        unmountContainer = null;
      }
      toastContainer = null;
    }
  }, duration);
}
