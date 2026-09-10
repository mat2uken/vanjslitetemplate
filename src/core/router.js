import van from "./van.js";

const { a, div } = van.tags;

/**
 * Router Mode Configuration
 * "hash": Safe across all embedded engines (Cobalt/Webf/Lynx/Servo), file://, and static hosts.
 * "history": Standard History API (pushState/popstate) for HTML5 push-state web servers.
 */
let routerMode = "hash";

export function setRouterMode(mode) {
  if (mode === "hash" || mode === "history") {
    routerMode = mode;
    updateRoute();
  }
}

export function getRouterMode() {
  return routerMode;
}

/**
 * Parse current browser location based on router mode
 */
function parseLocation() {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "", hash: "" };
  }

  if (routerMode === "history") {
    return {
      pathname: window.location.pathname || "/",
      search: window.location.search || "",
      hash: window.location.hash || "",
    };
  }

  // Hash mode: parses "#/users/42?tab=overview"
  const hash = window.location.hash;
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const target = cleanHash || "/";
  const questionIdx = target.indexOf("?");

  let pathname = questionIdx === -1 ? target : target.slice(0, questionIdx);
  const search = questionIdx === -1 ? "" : target.slice(questionIdx);

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  return {
    pathname,
    search,
    hash: "",
  };
}

/**
 * Parse query string (?key=val&sort=asc) into key-value object.
 * Zero-copy string slicing with indexOf('=') avoids intermediate array allocations.
 * Embedded-safe: Does not require modern URLSearchParams.
 */
export function parseQuery(search = "") {
  if (!search) {
    return {};
  }
  const queryStr = search.startsWith("?") ? search.slice(1) : search;
  if (!queryStr) {
    return {};
  }

  const result = {};
  for (const pair of queryStr.split("&")) {
    if (!pair) {
      continue;
    }
    const eqIdx = pair.indexOf("=");
    const rawKey = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
    const rawVal = eqIdx === -1 ? "" : pair.slice(eqIdx + 1);
    try {
      result[decodeURIComponent(rawKey.replaceAll("+", " "))] = decodeURIComponent(
        rawVal.replaceAll("+", " "),
      );
    } catch {
      result[rawKey] = rawVal;
    }
  }
  return result;
}

// Route normalization cache to eliminate repeated Object.entries allocations
const routesCache = new WeakMap();

// Pre-compilation pattern cache to eliminate regex compilation overhead during transitions
const patternCache = new Map();

/**
 * Compile route pattern (/users/:id) into regex and key list
 */
export function compilePattern(pattern) {
  const cached = patternCache.get(pattern);
  if (cached) {
    return cached;
  }

  if (pattern === "*") {
    const wildcardCompiled = { regex: /^.*$/, keys: [] };
    patternCache.set(pattern, wildcardCompiled);
    return wildcardCompiled;
  }

  const keys = [];
  // Escape regex specials except ":"
  const regexPattern = pattern
    .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    .replaceAll(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });

  const compiled = { regex: new RegExp(`^${regexPattern}$`), keys };
  patternCache.set(pattern, compiled);
  return compiled;
}

function normalizeRoutes(routes) {
  if (Array.isArray(routes)) {
    return routes;
  }
  const cached = routesCache.get(routes);
  if (cached) {
    return cached;
  }
  const normalized = Object.entries(routes).map(([pattern, component]) => ({
    pattern,
    component,
  }));
  routesCache.set(routes, normalized);
  return normalized;
}

/**
 * Match a pathname against the route table and extract dynamic params
 * Uses regex.exec() and standard loop for maximum V8 engine performance without callback closures.
 */
export function matchRoute(routeTable, currentPathname) {
  const normalized = normalizeRoutes(routeTable);

  for (let i = 0; i < normalized.length; i++) {
    const { pattern, component } = normalized[i];
    const { regex, keys } = compilePattern(pattern);
    const match = regex.exec(currentPathname);

    if (match) {
      const params = {};
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const val = match[k + 1];
        try {
          params[key] = decodeURIComponent(val);
        } catch {
          params[key] = val;
        }
      }
      return { component, params, pattern };
    }
  }
  return null;
}

// Reactive location states
const initialLoc = parseLocation();
const initialQuery = parseQuery(initialLoc.search);

export const routeState = van.state({
  pathname: initialLoc.pathname,
  search: initialLoc.search,
  query: initialQuery,
  hash: initialLoc.hash,
});

// Backwards-compatible currentRoute string state
export const currentRoute = van.state(initialLoc.pathname);

function updateRoute() {
  const loc = parseLocation();
  const query = parseQuery(loc.search);

  routeState.val = {
    pathname: loc.pathname,
    search: loc.search,
    query,
    hash: loc.hash,
  };
  currentRoute.val = loc.pathname;
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", updateRoute);
  window.addEventListener("hashchange", updateRoute);
}

/**
 * Programmatic navigation
 */
export function navigate(to) {
  if (!to || typeof window === "undefined") {
    return;
  }

  const isTargetHash = to.startsWith("#");
  const cleanTarget = isTargetHash ? to.slice(1) : to;
  const formattedPath = cleanTarget.startsWith("/") ? cleanTarget : `/${cleanTarget}`;

  if (routerMode === "hash") {
    const hashTarget = `#${formattedPath}`;
    if (window.location.hash !== hashTarget) {
      window.location.hash = hashTarget;
    }
  } else {
    if (window.location.pathname + window.location.search !== formattedPath) {
      window.history.pushState({}, "", formattedPath);
    }
  }

  updateRoute();
}

/**
 * SPA Link Component
 * Renders an accessible <a> tag that handles click transitions without page reloads.
 */
export function Link(props = {}, ...children) {
  const { to, onclick, class: className, ...rest } = props;

  const computeHref = () => {
    if (!to) {
      return "#";
    }
    const cleanTo = to.startsWith("#") ? to.slice(1) : to;
    const formatted = cleanTo.startsWith("/") ? cleanTo : `/${cleanTo}`;
    return routerMode === "hash" ? `#${formatted}` : formatted;
  };

  return a(
    {
      href: computeHref,
      class: className,
      onclick: (e) => {
        // Let middle-clicks / new-tab keyboard shortcuts pass through natively
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        if (onclick) {
          onclick(e);
        }
        navigate(to);
      },
      ...rest,
    },
    ...children,
  );
}

/**
 * RouterView Component
 * Evaluates route matching reactively whenever routeState.val changes.
 * Automatically injects { params, query } into matched components.
 */
export function RouterView(
  routes,
  fallback = () => div({ class: "c-card" }, "404: ページが見つかりません"),
) {
  const normalized = normalizeRoutes(routes);

  // Pre-compile all route patterns on mount
  for (let i = 0; i < normalized.length; i++) {
    compilePattern(normalized[i].pattern);
  }

  return () => {
    const { pathname, search, query } = routeState.val;
    const matched = matchRoute(normalized, pathname);

    if (!matched) {
      return fallback({ pathname, search, query });
    }

    return matched.component({ params: matched.params, query });
  };
}
