import van from "../core/van.js";
import { mountPortal } from "./portal.js";

const { div, span } = van.tags;

let toastContainer = null;
let _toastContainerUnmount = null;

function getOrCreateContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = div({ class: "c-toast-container" });
    _toastContainerUnmount = mountPortal(toastContainer);
  }
  return toastContainer;
}

/**
 * Shows an ultra-lightweight toast notification.
 */
export function showToast(message, type = "info", duration = 3000) {
  const container = getOrCreateContainer();

  const toastEl = div(
    { class: `c-toast ${type === "success" ? "is-success" : type === "error" ? "is-error" : ""}` },
    span(message),
  );

  container.append(toastEl);

  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  }, duration);
}
