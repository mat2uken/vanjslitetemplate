import { beforeEach, describe, expect, it } from "vitest";
import { currentRoute, navigate, RouterView } from "../src/core/router.js";
import van from "../src/core/van.js";

describe("Lightweight Hash Router", () => {
  beforeEach(() => {
    window.location.hash = "";
    currentRoute.val = "/";
  });

  it("initializes to root or current hash", () => {
    expect(currentRoute.val).toBe("/");
  });

  it("updates route state on navigate()", () => {
    navigate("/components");
    expect(window.location.hash).toBe("#/components");
    expect(currentRoute.val).toBe("/components");
  });

  it("RouterView dynamically renders matching route component", async () => {
    const routes = {
      "/": () => van.tags.div("Home Page"),
      "/about": () => van.tags.div("About Page"),
    };

    const view = RouterView(routes);
    const container = document.createElement("div");
    document.body.append(container);
    van.add(container, view);

    expect(container.textContent).toBe("Home Page");

    navigate("/about");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.textContent).toBe("About Page");
    document.body.removeChild(container);
  });
});
