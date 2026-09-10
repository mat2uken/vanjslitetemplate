import { describe, expect, it, vi } from "vitest";
import { CacheStore } from "../src/lib/cache.js";

describe("In-Memory Cache Store (src/lib/cache.js)", () => {
  it("stores and retrieves data with timestamp", () => {
    const cache = new CacheStore();
    cache.set("user-1", { id: "1", name: "Alice" });

    expect(cache.getData("user-1")).toEqual({ id: "1", name: "Alice" });
    expect(cache.get("user-1").timestamp).toBeGreaterThan(0);
  });

  it("evaluates TTL freshness correctly", async () => {
    const cache = new CacheStore();
    cache.set("user-1", { id: "1" });

    expect(cache.isFresh("user-1", 1000)).toBe(true);

    // Expire cache manually
    const entry = cache.get("user-1");
    entry.timestamp = Date.now() - 2000;

    expect(cache.isFresh("user-1", 1000)).toBe(false);
  });

  it("evicts oldest entry when maxEntries is exceeded (LRU behavior)", () => {
    const cache = new CacheStore(3);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.size).toBe(3);

    // Insert 4th item -> "a" should be evicted
    cache.set("d", 4);
    expect(cache.size).toBe(3);
    expect(cache.getData("a")).toBeUndefined();
    expect(cache.getData("b")).toBe(2);
    expect(cache.getData("d")).toBe(4);
  });

  it("handles in-flight deduplication promise states", () => {
    const cache = new CacheStore();
    const fakePromise = Promise.resolve("ok");

    cache.setInFlight("key-1", fakePromise);
    expect(cache.getInFlight("key-1")).toBe(fakePromise);

    cache.clearInFlight("key-1");
    expect(cache.getInFlight("key-1")).toBeNull();
  });

  it("supports reactive subscription and mutate()", () => {
    const cache = new CacheStore();
    const subscriber = vi.fn();

    const unsubscribe = cache.subscribe("user-1", subscriber);

    // Direct mutation
    cache.mutate("user-1", { id: "1", name: "Bob" });
    expect(subscriber).toHaveBeenCalledWith({ id: "1", name: "Bob" });
    expect(cache.getData("user-1")).toEqual({ id: "1", name: "Bob" });

    // Functional mutation (Optimistic update)
    cache.mutate("user-1", (old) => ({ ...old, name: "Charlie" }));
    expect(subscriber).toHaveBeenCalledWith({ id: "1", name: "Charlie" });
    expect(cache.getData("user-1").name).toBe("Charlie");

    // Mutation with null (delete)
    cache.mutate("user-1", null);
    expect(cache.getData("user-1")).toBeUndefined();

    unsubscribe();
    cache.mutate("user-1", { id: "1", name: "Dave" });
    expect(subscriber).toHaveBeenCalledTimes(2);
  });
});
