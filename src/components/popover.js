import van from "../core/van.js";
import { mountPortal } from "./portal.js";
import { placeSafePopover } from "../utils/position.js";
import { onOutsideTap, onSafeBackKey } from "../utils/events.js";

const { div } = van.tags;
const EMPTY_OBJECT = Object.freeze({});

/**
 * Creates a Safe Popover attached to a trigger element.
 * Zero dependency on native Popover API or Floating UI.
 */
export function attachPopover(triggerEl, contentOrFactory, options = EMPTY_OBJECT) {
  let isOpen = false;
  let unmountPortalFn = null;
  let removeOutsideTap = null;
  let removeBackKey = null;
  let popoverEl = null;

  function reposition() {
    if (isOpen && popoverEl) {
      placeSafePopover(triggerEl, popoverEl, options);
    }
  }

  function close() {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    removeOutsideTap?.();
    removeOutsideTap = null;
    removeBackKey?.();
    removeBackKey = null;
    window.removeEventListener("resize", reposition);
    window.removeEventListener("scroll", reposition, true);
    if (unmountPortalFn) {
      unmountPortalFn();
      unmountPortalFn = null;
    }
    popoverEl = null;
  }

  function open() {
    if (isOpen) {
      close();
      return;
    }
    isOpen = true;

    const content =
      typeof contentOrFactory === "function" ? contentOrFactory(close) : contentOrFactory;

    popoverEl = div(
      {
        class: "c-popover",
        onclick: (e) => e.stopPropagation(),
      },
      content,
    );

    unmountPortalFn = mountPortal(popoverEl);

    // Initial position calculation
    placeSafePopover(triggerEl, popoverEl, options);

    // Dismissal handlers
    removeOutsideTap = onOutsideTap([triggerEl, popoverEl], close);
    removeBackKey = onSafeBackKey(close);

    // Keep positioned on viewport changes
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
  }

  const onTriggerClick = (e) => {
    e.stopPropagation();
    open();
  };
  triggerEl.addEventListener("click", onTriggerClick);

  function destroy() {
    close();
    triggerEl.removeEventListener("click", onTriggerClick);
  }

  return { close, destroy, open, reposition };
}
