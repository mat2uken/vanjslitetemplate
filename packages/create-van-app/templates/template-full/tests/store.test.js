import { beforeEach, describe, expect, it } from "vitest";
import { authStore, createStore } from "../src/core/store.js";

describe("Global State Management (Store)", () => {
  beforeEach(() => {
    authStore.logout();
  });

  it("initializes with unauthenticated user state", () => {
    expect(authStore.user.val).toBeNull();
    expect(authStore.isAuthenticated.val).toBe(false);
    expect(authStore.isLoading.val).toBe(false);
  });

  it("logs in user and derives isAuthenticated reactivity", async () => {
    const loginPromise = authStore.login("Alice");
    expect(authStore.isLoading.val).toBe(true);

    await loginPromise;
    expect(authStore.isLoading.val).toBe(false);
    expect(authStore.user.val).not.toBeNull();
    expect(authStore.user.val.name).toBe("Alice");
    expect(authStore.user.val.role).toBe("Admin");
    expect(authStore.isAuthenticated.val).toBe(true);
  });

  it("logs out user cleanly", async () => {
    await authStore.login("Bob");
    expect(authStore.isAuthenticated.val).toBe(true);

    authStore.logout();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(authStore.user.val).toBeNull();
    expect(authStore.isAuthenticated.val).toBe(false);
  });

  it("createStore factory generates independent reactive state and custom actions", () => {
    const counterStore = createStore({ count: 0, title: "Test Counter" }, (state) => ({
      increment: () => state.count.val++,
      reset: () => (state.count.val = 0),
      setTitle: (newTitle) => (state.title.val = newTitle),
    }));

    expect(counterStore.state.count.val).toBe(0);
    expect(counterStore.state.title.val).toBe("Test Counter");

    counterStore.increment();
    counterStore.increment();
    expect(counterStore.state.count.val).toBe(2);

    counterStore.setTitle("Updated Title");
    expect(counterStore.state.title.val).toBe("Updated Title");

    counterStore.reset();
    expect(counterStore.state.count.val).toBe(0);
  });
});
