import van from "../core/van.js";
import { mountPortal } from "./portal.js";
import { onSafeBackKey } from "../utils/events.js";

const { button, div, h3, p } = van.tags;

/**
 * Creates and displays a Portal-based Modal.
 * Guaranteed compatibility with Cobalt/Webf/Lynx without <dialog> dependency.
 */
export function openModal({
  cancelText = "Cancel",
  content,
  okText = "OK",
  onCancel,
  onOk,
  title = "Information",
}) {
  let unmountPortalFn = null;
  let removeKeyHandler = null;

  function cleanup() {
    if (removeKeyHandler) {
      removeKeyHandler();
      removeKeyHandler = null;
    }
    if (unmountPortalFn) {
      unmountPortalFn();
      unmountPortalFn = null;
    }
  }

  function close() {
    cleanup();
    if (onCancel) {
      onCancel();
    }
  }

  function handleOk() {
    cleanup();
    if (onOk) {
      onOk();
    }
  }

  const okBtn = button(
    {
      class: "c-btn c-btn-primary",
      id: "modal-ok-btn",
      onclick: handleOk,
    },
    okText,
  );

  // Backdrop overlay
  const overlay = div(
    {
      class: "c-modal-overlay",
      onclick: (e) => {
        if (e.target === overlay) {
          close();
        }
      },
    },
    div(
      { class: "c-modal-dialog" },
      // Header
      div(
        { class: "c-modal-header" },
        h3({ style: "margin: 0; font-size: 16px;" }, title),
        button(
          {
            class: "c-btn c-btn-sm",
            onclick: close,
            style: "border: none; background: transparent; font-size: 16px; cursor: pointer;",
          },
          "✕",
        ),
      ),
      // Body
      div(
        { class: "c-modal-body" },
        typeof content === "string" ? p({ style: "margin: 0 0 8px 0;" }, content) : content,
      ),
      // Footer
      div(
        { class: "c-modal-footer u-space-x" },
        cancelText
          ? button(
              {
                class: "c-btn",
                onclick: close,
              },
              cancelText,
            )
          : null,
        okBtn,
      ),
    ),
  );

  unmountPortalFn = mountPortal(overlay);
  removeKeyHandler = onSafeBackKey(close);

  // Auto focus OK button for Smart TV / Keyboard navigation (zero-lookup direct focus)
  setTimeout(() => {
    okBtn.focus();
  }, 30);

  return { close };
}
