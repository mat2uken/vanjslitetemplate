import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouterView, navigate, setRouterMode } from "../src/core/router.js";
import van from "../src/core/van.js";

const { div } = van.tags;

describe("RouterView Component Cleanup Lifecycle", () => {
  beforeEach(() => {
    setRouterMode("hash");
    window.location.hash = "";
    navigate("/");
  });

  it("automatically calls _cleanup() on previous component when navigating to another route", () => {
    const page1Cleanup = vi.fn();
    const page2Cleanup = vi.fn();

    const Page1 = () => {
      const node = div({ id: "page-1" }, "Page 1");
      node._cleanup = page1Cleanup;
      return node;
    };

    const Page2 = () => {
      const node = div({ id: "page-2" }, "Page 2");
      node._cleanup = page2Cleanup;
      return node;
    };

    const routes = {
      "/": Page1,
      "/page-2": Page2,
    };

    const viewFn = RouterView(routes);

    // Initial mount on "/"
    const node1 = viewFn();
    expect(node1.id).toBe("page-1");
    expect(page1Cleanup).not.toHaveBeenCalled();

    // Navigate to "/page-2"
    navigate("/page-2");
    const node2 = viewFn();
    expect(node2.id).toBe("page-2");
    expect(page1Cleanup).toHaveBeenCalledTimes(1);
    expect(page2Cleanup).not.toHaveBeenCalled();

    // Navigate back to "/"
    navigate("/");
    const node3 = viewFn();
    expect(node3.id).toBe("page-1");
    expect(page2Cleanup).toHaveBeenCalledTimes(1);
  });
});
