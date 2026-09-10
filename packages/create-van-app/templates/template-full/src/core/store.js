import van from "./van.js";

/**
 * Global Auth Store
 * Module-scoped van.state persists across page transitions without re-initialization.
 */
const user = van.state(null);
const isLoading = van.state(false);
const isAuthenticated = van.derive(() => user.val !== null);

export const authStore = {
  get user() {
    return user;
  },
  get isLoading() {
    return isLoading;
  },

  // Derived reactive property (singleton)
  get isAuthenticated() {
    return isAuthenticated;
  },


  // Actions
  login: async (name = "Taro") => {
    isLoading.val = true;
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulated async request
    user.val = {
      name,
      role: "Admin",
      loggedInAt: new Date().toLocaleTimeString(),
    };
    isLoading.val = false;
  },

  logout: () => {
    user.val = null;
  },
};

/**
 * createStore
 * Lightweight store factory for reactive global or feature-level state.
 */
export function createStore(initialState = {}, actionsFactory = () => ({})) {
  const state = {};
  for (const [key, value] of Object.entries(initialState)) {
    state[key] = van.state(value);
  }

  const actions = actionsFactory(state);

  return {
    state,
    ...actions,
  };
}
