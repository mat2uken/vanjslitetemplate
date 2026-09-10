/**
 * Embedded & Mobile Event Utilities
 * Handles touch/click unification, Light Dismiss, and Smart TV / STB Remote Back keys.
 */

/**
 * Attaches a safe tap/click listener avoiding 300ms delay & ghost clicks.
 */
export function onSafeTap(element, handler) {
  let touchHandled = false;

  const onTouchEnd = (e) => {
    touchHandled = true;
    handler(e);
    setTimeout(() => {
      touchHandled = false;
    }, 400);
  };

  const onClick = (e) => {
    if (!touchHandled) {
      handler(e);
    }
  };

  element.addEventListener("touchend", onTouchEnd, { passive: true });
  element.addEventListener("click", onClick);

  return () => {
    element.removeEventListener("touchend", onTouchEnd);
    element.removeEventListener("click", onClick);
  };
}

/**
 * Listens for Escape key and Smart TV / STB Remote Back keys:
 * - ESC (key === 'Escape' || keyCode === 27)
 * - Tizen TV Back (keyCode 10009)
 * - webOS TV Back (keyCode 461)
 * - Android TV Back (key === 'GoBack' || keyCode 4)
 */
const BACK_KEY_SET = new Set(["Escape", "GoBack", 27, 10_009, 461, 4]);

export function onSafeBackKey(handler) {
  const onKeyDown = (e) => {
    if (BACK_KEY_SET.has(e.key) || BACK_KEY_SET.has(e.keyCode)) {
      e.preventDefault();
      handler(e);
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
  };
}

/**
 * Detects outside taps/clicks to dismiss popovers or dropdowns.
 */
export function onOutsideTap(elements, onOutside) {
  const elementsArray = Array.isArray(elements) ? elements : [elements];

  const onDocumentEvent = (e) => {
    const target = e.target;
    const isInside = elementsArray.some((el) => el && (el === target || el.contains(target)));
    if (!isInside) {
      onOutside(e);
    }
  };

  const timer = setTimeout(() => {
    document.addEventListener("click", onDocumentEvent, true);
    document.addEventListener("touchend", onDocumentEvent, true);
  }, 10);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("click", onDocumentEvent, true);
    document.removeEventListener("touchend", onDocumentEvent, true);
  };
}
