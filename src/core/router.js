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
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const cleanHash = rawHash || "/";
  const questionIdx = cleanHash.indexOf("?");

  let pathname;
  let search = "";

  if (questionIdx !== -1) {
    pathname = cleanHash.slice(0, questionIdx);
    search = cleanHash.slice(questionIdx);
  } else {
    pathname = cleanHash;
  }

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
  const pairs = queryStr.split("&");
  for (const pair of pairs) {
    if (!pair) {
      continue;
    }
    const [rawKey, rawVal = ""] = pair.split("=");
    try {
      const key = decodeURIComponent(rawKey.replaceAll("+", " "));
      const val = decodeURIComponent(rawVal.replaceAll("+", " "));
      result[key] = val;
    } catch {
      result[rawKey] = rawVal;
    }
  }
  return result;
}

// Pre-compilation pattern cache to eliminate regex compilation overhead during transitions
const patternCache = new Map();

/**
 * Compile route pattern (/users/:id) into regex and key list
 */
export function compilePattern(pattern) {
  if (patternCache.has(pattern)) {
    return patternCache.get(pattern);
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
  return Object.entries(routes).map(([pattern, component]) => ({
    pattern,
    component,
  }));
}

/**
 * Match a pathname against the route table and extract dynamic params
 */
export function matchRoute(routeTable, currentPathname) {
  const normalized = normalizeRoutes(routeTable);

  for (const { pattern, component } of normalized) {
    const { regex, keys } = compilePattern(pattern);
    const match = currentPathname.match(regex);

    if (match) {
      const params = {};
      keys.forEach((key, index) => {
        try {
          params[key] = decodeURIComponent(match[index + 1]);
        } catch {
          params[key] = match[index + 1];
        }
      });
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
  for (const { pattern } of normalized) {
    compilePattern(pattern);
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
