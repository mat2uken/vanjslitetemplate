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

// Singleton frozen empty object to eliminate object allocation for static routes & empty queries
const EMPTY_OBJECT = Object.freeze({});

/**
 * Parse query string (?key=val&sort=asc) into key-value object.
 * Zero-allocation string pointer traversal with indexOf('&') and indexOf('=')
 * completely eliminates intermediate array allocations (no split('&')).
 * Embedded-safe: Does not require modern URLSearchParams.
 */
export function parseQuery(search = "") {
  if (!search) {
    return EMPTY_OBJECT;
  }
  const queryStr = search.startsWith("?") ? search.slice(1) : search;
  if (!queryStr) {
    return EMPTY_OBJECT;
  }

  const result = {};
  let start = 0;
  const len = queryStr.length;

  while (start < len) {
    let nextAmp = queryStr.indexOf("&", start);
    if (nextAmp === -1) {
      nextAmp = len;
    }
    if (nextAmp > start) {
      const eqIdx = queryStr.indexOf("=", start);
      const hasEq = eqIdx !== -1 && eqIdx < nextAmp;
      const rawKey = hasEq ? queryStr.slice(start, eqIdx) : queryStr.slice(start, nextAmp);
      const rawVal = hasEq ? queryStr.slice(eqIdx + 1, nextAmp) : "";
      try {
        result[decodeURIComponent(rawKey.replaceAll("+", " "))] = decodeURIComponent(
          rawVal.replaceAll("+", " "),
        );
      } catch {
        result[rawKey] = rawVal;
      }
    }
    start = nextAmp + 1;
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
    const route = normalized[i];

    // Ultra-fast path: Direct string pointer equality for static routes (bypasses regex engine)
    if (route.pattern === currentPathname) {
      if (!route._staticMatch) {
        route._staticMatch = Object.freeze({
          component: route.component,
          params: EMPTY_OBJECT,
          pattern: route.pattern,
        });
      }
      return route._staticMatch;
    }

    const { regex, keys } = compilePattern(route.pattern);
    const match = regex.exec(currentPathname);

    if (match) {
      if (keys.length === 0) {
        if (!route._staticMatch) {
          route._staticMatch = Object.freeze({
            component: route.component,
            params: EMPTY_OBJECT,
            pattern: route.pattern,
          });
        }
        return route._staticMatch;
      }
      const params = {};
      for (let k = 0; k < keys.length; k++) {
        const val = match[k + 1];
        try {
          params[keys[k]] = decodeURIComponent(val);
        } catch {
          params[keys[k]] = val;
        }
      }
      return { component: route.component, params, pattern: route.pattern };
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
  const current = routeState.val;

  // Skip redundant state updates if location has not changed
  if (
    current.pathname === loc.pathname &&
    current.search === loc.search &&
    current.hash === loc.hash
  ) {
    return;
  }

  const query = parseQuery(loc.search);

  routeState.val = {
    pathname: loc.pathname,
    search: loc.search,
    query,
    hash: loc.hash,
  };
  if (currentRoute.val !== loc.pathname) {
    currentRoute.val = loc.pathname;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", updateRoute);
  window.addEventListener("hashchange", updateRoute);
}

function formatPath(to) {
  if (!to) {
    return "/";
  }
  const clean = to.startsWith("#") ? to.slice(1) : to;
  return clean.startsWith("/") ? clean : `/${clean}`;
}

/**
 * Programmatic navigation
 */
export function navigate(to) {
  if (!to || typeof window === "undefined") {
    return;
  }

  const formattedPath = formatPath(to);

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

  const formatted = to ? formatPath(to) : "";
  const href = to ? (routerMode === "hash" ? `#${formatted}` : formatted) : "#";

  return a(
    {
      href,
      class: className,
      onclick: (e) => {
        // Let middle-clicks / new-tab keyboard shortcuts pass through natively
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        onclick?.(e);
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

  let previousNode = null;

  return () => {
    const { pathname, search, query } = routeState.val;

    // Trigger cleanup on unmount of previous component
    if (previousNode) {
      if (typeof previousNode._cleanup === "function") {
        try {
          previousNode._cleanup();
        } catch {
          // Ignore cleanup errors during unmount to prevent crashing router
        }
      }
      previousNode = null;
    }

    const matched = matchRoute(normalized, pathname);

    if (!matched) {
      previousNode = fallback({ pathname, search, query });
      return previousNode;
    }

    previousNode = matched.component({ params: matched.params, query });
    return previousNode;
  };
}
