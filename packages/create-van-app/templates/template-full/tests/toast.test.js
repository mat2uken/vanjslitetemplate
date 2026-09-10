import { beforeEach, describe, expect, it } from "vitest";
import { showToast } from "../src/components/toast.js";

describe("Lightweight Toast Component", () => {
  beforeEach(() => {
    const container = document.querySelector(".c-toast-container");
    if (container) {
      container.remove();
    }
  });

  it("renders toast message in portal container and removes after duration", async () => {
    showToast("Hello World Toast", "success", 50);

    const container = document.querySelector(".c-toast-container");
    expect(container).not.toBeNull();
    expect(container.textContent).toContain("Hello World Toast");

    const toast = container.querySelector(".c-toast");
    expect(toast.className).toContain("is-success");

    // Wait for duration timeout
    await new Promise((r) => setTimeout(r, 80));

    expect(container.querySelector(".c-toast")).toBeNull();
  });

  it("supports programmatic dismiss immediately", () => {
    const dismiss = showToast("Dismissable Toast", "info", 5000);

    const container = document.querySelector(".c-toast-container");
    expect(container).not.toBeNull();
    expect(container.textContent).toContain("Dismissable Toast");

    dismiss();

    expect(document.querySelector(".c-toast")).toBeNull();
    expect(document.querySelector(".c-toast-container")).toBeNull();
  });
});
