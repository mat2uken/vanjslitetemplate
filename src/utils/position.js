/**
 * Safe Position Engine (placeSafePopover)
 * High-performance, zero-dependency viewport positioning engine (~25 lines).
 * Features:
 *  - Viewport Flip (switches top/bottom based on available space)
 *  - Viewport Clamp (keeps element within viewport boundaries)
 *  - Embedded safe (relies only on getBoundingClientRect and window dimensions)
 */

const clamp = (val, min, max) => (val < min ? min : val > max ? max : val);

export function placeSafePopover(triggerEl, popoverEl, options = {}) {
  const { margin = 8, offset = 6, placement = "bottom" } = options;

  const tRect = triggerEl.getBoundingClientRect();
  const pRect = popoverEl.getBoundingClientRect();

  const docEl = document.documentElement;
  const vw = window.innerWidth || docEl?.clientWidth || 360;
  const vh = window.innerHeight || docEl?.clientHeight || 640;

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
