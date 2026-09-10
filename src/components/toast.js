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

  let timer = null;
  const dismiss = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
    if (toastContainer && toastContainer.childNodes.length === 0) {
      if (unmountContainer) {
        unmountContainer();
        unmountContainer = null;
      }
      toastContainer = null;
    }
  };

  if (duration > 0) {
    timer = setTimeout(dismiss, duration);
  }

  return dismiss;
}
