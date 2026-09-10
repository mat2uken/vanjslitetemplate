/**
 * Safe Position Engine (placeSafePopover)
 * High-performance, zero-dependency viewport positioning engine (~25 lines).
 * Features:
 *  - Viewport Flip (switches top/bottom based on available space)
 *  - Viewport Clamp (keeps element within viewport boundaries)
 *  - Embedded safe (relies only on getBoundingClientRect and window size)
 */
import isPresent from "@nkzw/core/isPresent.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function placeSafePopover(triggerEl, popoverEl, options = {}) {
  const { margin = 8, offset = 6, placement = "bottom" } = options;

  const tRect = triggerEl.getBoundingClientRect();
  const pRect = popoverEl.getBoundingClientRect();

  const clientWidth = document.documentElement ? document.documentElement.clientWidth : 0;
  const clientHeight = document.documentElement ? document.documentElement.clientHeight : 0;

  const vw =
    isPresent(window.innerWidth) && window.innerWidth > 0 ? window.innerWidth : clientWidth || 360;
  const vh =
    isPresent(window.innerHeight) && window.innerHeight > 0
      ? window.innerHeight
      : clientHeight || 640;

  // Vertical position with Flip
  let top;
  const spaceBelow = vh - tRect.bottom - offset;
  const spaceAbove = tRect.top - offset;

  if (placement === "bottom") {
    if (spaceBelow >= pRect.height || spaceBelow >= spaceAbove) {
      top = tRect.bottom + offset;
    } else {
      top = tRect.top - offset - pRect.height;
    }
  } else {
    if (spaceAbove >= pRect.height || spaceAbove >= spaceBelow) {
      top = tRect.top - offset - pRect.height;
    } else {
      top = tRect.bottom + offset;
    }
  }

  // Ensure within top/bottom screen boundary
  top = clamp(top, margin, vh - pRect.height - margin);

  // Horizontal position with Clamp
  let left = tRect.left + (tRect.width - pRect.width) / 2;
  left = clamp(left, margin, vw - pRect.width - margin);

  popoverEl.style.position = "fixed";
  popoverEl.style.top = `${Math.round(top)}px`;
  popoverEl.style.left = `${Math.round(left)}px`;
}
