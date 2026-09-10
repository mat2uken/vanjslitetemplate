import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiBaseUrl, request, setApiBaseUrl } from "../src/api/client.js";

describe("REST API Client (src/api/client.js)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setApiBaseUrl("");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("handles base URL setting and retrieval", () => {
    setApiBaseUrl("https://api.test.com/");
    expect(getApiBaseUrl()).toBe("https://api.test.com");
  });

  it("executes successful GET request and parses JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ id: "123", name: "Alice" }),
    });

    const data = await request("https://api.test.com/users/123");
    expect(data).toEqual({ id: "123", name: "Alice" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.com/users/123",
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("auto-serializes JSON body for POST/PATCH", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
    });

    const payload = { name: "Bob" };
    const res = await request("https://api.test.com/users", {
      method: "POST",
      body: payload,
    });

    expect(res).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.com/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  });

  it("handles 204 No Content safely", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const res = await request("https://api.test.com/users/123", { method: "DELETE" });
    expect(res).toBeNull();
  });

  it("throws ApiError on HTTP failure with status and error data", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ message: "User not found" }),
    });

    await expect(request("https://api.test.com/users/999")).rejects.toThrow(ApiError);
  });

  it("supports timeout cancellation", async () => {
    vi.useFakeTimers();

    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        options.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const promise = request("https://api.test.com/slow", { timeout: 100 });
    vi.advanceTimersByTime(150);

    await expect(promise).rejects.toThrow();
    vi.useRealTimers();
  });
});
