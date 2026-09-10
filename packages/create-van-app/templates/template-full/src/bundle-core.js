/**
 * Core Bundle Entry (Model C Revision Runtime)
 * Contains:
 *  - VanJS Core (reactive state, dom builder)
 *  - Hash Router
 *  - Safe Position Engine (Flip & Clamp)
 *  - Event Utilities (Touch/Click/Escape/Back)
 *  - Portal Engine
 *  - Portal Modal
 *  - Safe Popover
 *  - Lightweight Tabs & Accordion
 *  - Lightweight Toast
 *  - Stack Layout Components (@nkzw/stack inspired)
 */
export { default as van, state, derive, tags } from "./core/van.js";
export {
  currentRoute,
  routeState,
  navigate,
  Link,
  matchRoute,
  parseQuery,
  compilePattern,
  RouterView,
  setRouterMode,
  getRouterMode,
} from "./core/router.js";
export { authStore, createStore } from "./core/store.js";
export { placeSafePopover } from "./utils/position.js";
export { onSafeTap, onSafeBackKey, onOutsideTap } from "./utils/events.js";
export { mountPortal } from "./components/portal.js";
export { openModal } from "./components/modal.js";
export { attachPopover } from "./components/popover.js";
export { createTabs, createAccordionItem } from "./components/tabs.js";
export { showToast } from "./components/toast.js";
export { Stack, HStack, VStack } from "./components/stack.js";
