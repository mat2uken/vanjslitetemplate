import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheStore } from "../src/lib/cache.js";
import { triggerManualRevalidation } from "../src/lib/events.js";
import { createResource, createSWRResource } from "../src/lib/swrResource.js";

describe("SWR & Async Resource Handlers (src/lib/swrResource.js)", () => {
  let testCache;

  beforeEach(() => {
    testCache = new CacheStore();
  });

  describe("createResource", () => {
    it("manages loading, data, and error state transitions", async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: "1", name: "Alice" });
      const resource = createResource(fetcher);

      expect(resource.loading.val).toBe(false);
      expect(resource.data.val).toBeNull();
      expect(resource.error.val).toBeNull();

      const p = resource.execute("1");
      expect(resource.loading.val).toBe(true);

      const result = await p;
      expect(result).toEqual({ id: "1", name: "Alice" });
      expect(resource.loading.val).toBe(false);
      expect(resource.data.val).toEqual({ id: "1", name: "Alice" });
    });

    it("cancels previous flight on rapid consecutive execute() calls", async () => {
      let abortedCount = 0;
      const fetcher = vi.fn().mockImplementation(async ({ signal }) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve("done"), 50);
          signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            abortedCount++;
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });

      const resource = createResource(fetcher);
      const p1 = resource.execute();
      const p2 = resource.execute();

      await Promise.allSettled([p1, p2]);
      expect(abortedCount).toBe(1);
    });
  });

  describe("createSWRResource", () => {
    it("renders fresh data and sets states", async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: "42", title: "PoC" });
      const swr = createSWRResource(fetcher, { cacheStore: testCache });

      expect(swr.loading.val).toBe(false);

      const promise = swr.execute("poc-42", 42);
      expect(swr.loading.val).toBe(true);

      const res = await promise;
      expect(res).toEqual({ id: "42", title: "PoC" });
      expect(swr.loading.val).toBe(false);
      expect(swr.data.val).toEqual({ id: "42", title: "PoC" });
      expect(testCache.getData("poc-42")).toEqual({ id: "42", title: "PoC" });
    });

    it("immediately returns fresh cache with ZERO latency and NO network fetch", async () => {
      testCache.set("user-1", { id: "1", name: "Cached User" });

      const fetcher = vi.fn().mockResolvedValue({ id: "1", name: "Fresh User" });
      const swr = createSWRResource(fetcher, { ttl: 60_000, cacheStore: testCache });

      const data = await swr.execute("user-1", "1");

      // Immediate synchronous return
      expect(data).toEqual({ id: "1", name: "Cached User" });
      expect(swr.data.val).toEqual({ id: "1", name: "Cached User" });
      expect(swr.loading.val).toBe(false);
      expect(swr.isValidating.val).toBe(false);
      // Fetcher should NOT have been called
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("displays stale cache immediately while revalidating in background", async () => {
      testCache.set("user-1", { id: "1", name: "Stale User" });
      const entry = testCache.get("user-1");
      entry.timestamp = Date.now() - 30_000; // Expired

      const fetcher = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20));
        return { id: "1", name: "Revalidated User" };
      });

      const swr = createSWRResource(fetcher, { ttl: 10_000, cacheStore: testCache });

      const execPromise = swr.execute("user-1", "1");

      // Immediate stale rendering
      expect(swr.data.val).toEqual({ id: "1", name: "Stale User" });
      expect(swr.loading.val).toBe(false);
      expect(swr.isValidating.val).toBe(true);

      await execPromise;

      expect(swr.data.val).toEqual({ id: "1", name: "Revalidated User" });
      expect(swr.isValidating.val).toBe(false);
    });

    it("deduplicates concurrent requests for the same key", async () => {
      let callCount = 0;
      const fetcher = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 20));
        return { count: callCount };
      });

      const swr1 = createSWRResource(fetcher, { cacheStore: testCache });
      const swr2 = createSWRResource(fetcher, { cacheStore: testCache });

      const [res1, res2] = await Promise.all([
        swr1.execute("shared-key"),
        swr2.execute("shared-key"),
      ]);

      expect(res1).toEqual({ count: 1 });
      expect(res2).toEqual({ count: 1 });
      expect(callCount).toBe(1);
    });

    it("revalidates automatically on revalidation event trigger", async () => {
      testCache.set("auto-key", { val: 1 });
      const fetcher = vi.fn().mockResolvedValue({ val: 2 });

      const swr = createSWRResource(fetcher, {
        cacheStore: testCache,
        revalidateOnFocus: true,
      });

      await swr.execute("auto-key");
      expect(fetcher).toHaveBeenCalledTimes(0); // Cache was fresh

      triggerManualRevalidation("focus");
      await new Promise((r) => setTimeout(r, 10));

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(swr.data.val).toEqual({ val: 2 });

      swr.destroy();
    });

    it("cleans up resources and cancels controllers on destroy()", async () => {
      const fetcher = vi.fn().mockImplementation(async ({ signal }) => {
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });

      const swr = createSWRResource(fetcher, { cacheStore: testCache });
      const promise = swr.execute("test-destroy");

      swr.destroy();
      await promise;

      expect(swr.loading.val).toBe(false);
    });
  });
});
