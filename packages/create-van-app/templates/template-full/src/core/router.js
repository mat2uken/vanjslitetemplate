import van from "./van.js";

function getHashPath() {
  return window.location.hash.slice(1) || "/";
}

export const currentRoute = van.state(getHashPath());

window.addEventListener("hashchange", () => {
  currentRoute.val = getHashPath();
});

export function navigate(path) {
  if (window.location.hash.slice(1) === path && currentRoute.val === path) {
    return;
  }
  window.location.hash = path;
  currentRoute.val = path;
}

export function RouterView(routes) {
  return () => {
    const path = currentRoute.val;
    const pageFactory = routes[path] || routes["*"] || (() => van.tags.div("Page not found"));
    return pageFactory();
  };
}
