/**
 * Global Network & Focus Revalidation Event Hub
 * Reference-counted listener lifecycle: attaches to window/document only when subscribers exist.
 * Embedded-friendly: safe guards against missing APIs (Cobalt, Webf, SSR).
 */

const subscribers = new Set();
let lastFocusTime = 0;
const FOCUS_THROTTLE = 5000; // Throttle consecutive focus events within 5000ms

let isAttached = false;

function triggerRevalidate(eventSource) {
  if (subscribers.size === 0 || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return;
  }

  subscribers.forEach((callback) => {
    try {
      callback(eventSource);
    } catch {
      // Prevent single subscriber failure from affecting other subscribers
    }
  });
}

function handleFocus() {
  const now = Date.now();
  const isVisible =
    typeof document === "undefined" ||
    document.visibilityState === undefined ||
    document.visibilityState === "visible";

  if (isVisible && now - lastFocusTime > FOCUS_THROTTLE) {
    lastFocusTime = now;
    triggerRevalidate("focus");
  }
}

function handleOnline() {
  triggerRevalidate("reconnect");
}

function attachGlobalListeners() {
  if (isAttached || typeof window === "undefined") {
    return;
  }
  isAttached = true;

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleFocus);
  }
  window.addEventListener("focus", handleFocus);
  window.addEventListener("online", handleOnline);
}

function detachGlobalListeners() {
  if (!isAttached || typeof window === "undefined") {
    return;
  }
  isAttached = false;

  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleFocus);
  }
  window.removeEventListener("focus", handleFocus);
  window.removeEventListener("online", handleOnline);
}

/**
 * Subscribe to focus or reconnect revalidation events
 * Automatically detaches window listeners when subscriber count drops to 0.
 */
export function subscribeToRevalidation(callback) {
  if (subscribers.size === 0) {
    attachGlobalListeners();
  }

  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      detachGlobalListeners();
    }
  };
}

/**
 * Force manual trigger for testing
 */
export function triggerManualRevalidation(source = "manual") {
  triggerRevalidate(source);
}
