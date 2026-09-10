/**
 * Safe Portal Engine
 * Mounts DOM nodes directly to document.body avoiding stacking context / fixed clipping.
 * Returns an unmount cleanup function to prevent memory leaks on embedded devices.
 */
export function mountPortal(domElement) {
  document.body.append(domElement);

  let unmounted = false;
  return function unmount() {
    if (unmounted) {
      return;
    }
    unmounted = true;
    if (domElement.parentNode) {
      domElement.parentNode.removeChild(domElement);
    }
  };
}
