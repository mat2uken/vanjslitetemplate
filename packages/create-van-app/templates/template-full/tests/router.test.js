import { beforeEach, describe, expect, it } from "vitest";
import {
  currentRoute,
  routeState,
  navigate,
  Link,
  matchRoute,
  parseQuery,
  compilePattern,
  RouterView,
  setRouterMode,
} from "../src/core/router.js";
import van from "../src/core/van.js";

describe("Enhanced Client-Side Router", () => {
  beforeEach(() => {
    setRouterMode("hash");
    window.location.hash = "";
    navigate("/");
  });

  it("initializes to root or current hash", () => {
    expect(currentRoute.val).toBe("/");
    expect(routeState.val.pathname).toBe("/");
  });

  it("updates route state on navigate()", () => {
    navigate("/components");
    expect(window.location.hash).toBe("#/components");
    expect(currentRoute.val).toBe("/components");
    expect(routeState.val.pathname).toBe("/components");
  });

  it("compiles patterns and extracts dynamic path parameters", () => {
    const { regex, keys } = compilePattern("/users/:id/posts/:slug");
    expect(keys).toEqual(["id", "slug"]);
    expect(regex.test("/users/42/posts/hello-world")).toBe(true);
    expect(regex.test("/users/42")).toBe(false);

    const match = "/users/42/posts/hello-world".match(regex);
    expect(match[1]).toBe("42");
    expect(match[2]).toBe("hello-world");
  });

  it("matchRoute matches pattern and extracts decoded params", () => {
    const routes = [
      { pattern: "/", component: () => "Home" },
      { pattern: "/users/:id", component: () => "User" },
      { pattern: "/search/:query", component: () => "Search" },
    ];

    const res1 = matchRoute(routes, "/users/99");
    expect(res1).not.toBeNull();
    expect(res1.params).toEqual({ id: "99" });

    const res2 = matchRoute(routes, "/search/%E3%83%86%E3%82%B9%E3%83%88");
    expect(res2).not.toBeNull();
    expect(res2.params).toEqual({ query: "テスト" });

    const res3 = matchRoute(routes, "/not-found");
    expect(res3).toBeNull();
  });

  it("parseQuery parses query strings into key-value objects safely", () => {
    expect(parseQuery("")).toEqual({});
    expect(parseQuery("?tab=overview&sort=desc")).toEqual({
      tab: "overview",
      sort: "desc",
    });
    expect(parseQuery("name=John+Doe&lang=%E6%97%A5%E6%9C%AC%E8%AA%9E")).toEqual({
      name: "John Doe",
      lang: "日本語",
    });
  });

  it("Link component renders accessible anchor tag and navigates without page reload", () => {
    const linkEl = Link({ to: "/users/42?tab=overview", id: "test-link" }, "User 42");
    expect(linkEl.tagName).toBe("A");
    expect(linkEl.getAttribute("href")).toBe("#/users/42?tab=overview");
    expect(linkEl.textContent).toBe("User 42");

    // Simulate click
    let defaultPrevented = false;
    const clickEvt = new MouseEvent("click", { cancelable: true, bubbles: true });
    linkEl.dispatchEvent(clickEvt);
    defaultPrevented = clickEvt.defaultPrevented;

    expect(defaultPrevented).toBe(true);
    expect(currentRoute.val).toBe("/users/42");
    expect(routeState.val.query).toEqual({ tab: "overview" });
  });

  it("RouterView dynamically renders matching route with injected params and query", async () => {
    const routes = {
      "/": () => van.tags.div("Home Page"),
      "/users/:id": ({ params, query }) =>
        van.tags.div(`User: ${params.id}, Tab: ${query.tab || "none"}`),
      "*": () => van.tags.div("Not Found"),
    };

    const view = RouterView(routes);
    const container = document.createElement("div");
    document.body.append(container);
    van.add(container, view);

    expect(container.textContent).toBe("Home Page");

    navigate("/users/123?tab=settings");
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(container.textContent).toBe("User: 123, Tab: settings");

    navigate("/random-unknown");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(container.textContent).toBe("Not Found");

    document.body.removeChild(container);
  });
});
