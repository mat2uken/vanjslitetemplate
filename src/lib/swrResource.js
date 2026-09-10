/**
 * Lightweight Asynchronous Resource & SWR Hook for VanJS
 * Zero external libraries, minimal allocations, race-condition free.
 */

import van from "../core/van.js";
import { globalCache } from "./cache.js";
import { subscribeToRevalidation } from "./events.js";

const EMPTY_ARGS = Object.freeze([]);

const DEFAULT_SWR_OPTIONS = Object.freeze({
  ttl: 60_000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  cacheStore: globalCache,
});

/**
 * Basic Async Resource Loader with AbortController
 * Manages data, loading, error states for single-flight asynchronous fetches.
 */
export function createResource(fetcher, initialValue = null) {
  const data = van.state(initialValue);
  const loading = van.state(false);
  const error = van.state(null);

  let activeController = null;

  const execute = async (...args) => {
    // Abort previous flight to prevent race conditions
    if (activeController !== null) {
      activeController.abort();
    }

    if (typeof AbortController !== "undefined") {
      activeController = new AbortController();
    }

    const currentSignal = activeController?.signal;

    if (!loading.val) {
      loading.val = true;
    }
    if (error.val !== null) {
      error.val = null;
    }

    try {
      const result = await fetcher({
        signal: currentSignal,
        args: args.length === 0 ? EMPTY_ARGS : args,
      });

      if (!currentSignal || !currentSignal.aborted) {
        data.val = result;
      }
      return result;
    } catch (error_) {
      if (error_?.name !== "AbortError" && (!currentSignal || !currentSignal.aborted)) {
        error.val = error_;
      }
    } finally {
      if (!currentSignal || !currentSignal.aborted) {
        loading.val = false;
      }
    }
  };

  const reset = () => {
    if (activeController !== null) {
      activeController.abort();
      activeController = null;
    }
    data.val = initialValue;
    loading.val = false;
    error.val = null;
  };

  return {
    data,
    loading,
    error,
    execute,
    reset,
    destroy: reset,
  };
}

/**
 * Advanced SWR (Stale-While-Revalidate) Resource Loader for VanJS
 * Features:
 * - Immediate stale render with zero latency
 * - In-flight deduplication
 * - TTL validation
 * - Auto-revalidation on window focus & network reconnect
 * - Mutation synchronization via cache subscription
 */
export function createSWRResource(fetcher, options = DEFAULT_SWR_OPTIONS) {
  const {
    ttl = 60_000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    cacheStore = globalCache,
  } = options;

  const data = van.state(null);
  const loading = van.state(false);
  const isValidating = van.state(false);
  const error = van.state(null);

  let activeController = null;
  let currentKey = null;
  let currentArgs = [];
  let unsubscribeCache = null;
  let unsubscribeEvents = null;
  let isDestroyed = false;

  const runFetch = async (isBackground) => {
    if (isDestroyed || !currentKey) {
      return;
    }

    if (activeController !== null) {
      activeController.abort();
    }

    if (typeof AbortController !== "undefined") {
      activeController = new AbortController();
    }
    const currentSignal = activeController?.signal;

    if (isBackground) {
      if (!isValidating.val) {
        isValidating.val = true;
      }
    } else {
      if (!loading.val) {
        loading.val = true;
      }
    }
    if (error.val !== null) {
      error.val = null;
    }

    try {
      // Deduplicate simultaneous requests for identical keys
      let flightPromise = cacheStore.getInFlight(currentKey);

      if (!flightPromise) {
        flightPromise = fetcher({
          signal: currentSignal,
          args: currentArgs,
        });
        cacheStore.setInFlight(currentKey, flightPromise);
      }

      const result = await flightPromise;

      if (!isDestroyed && (!currentSignal || !currentSignal.aborted)) {
        cacheStore.set(currentKey, result);
        if (data.val !== result) {
          data.val = result;
        }
      }
      return result;
    } catch (error_) {
      if (
        !isDestroyed &&
        error_?.name !== "AbortError" &&
        (!currentSignal || !currentSignal.aborted)
      ) {
        error.val = error_;
      }
    } finally {
      cacheStore.clearInFlight(currentKey);
      if (activeController?.signal === currentSignal || isDestroyed) {
        if (loading.val) {
          loading.val = false;
        }
        if (isValidating.val) {
          isValidating.val = false;
        }
      }
    }
  };

  const execute = async (key, ...args) => {
    if (isDestroyed) {
      return;
    }

    const isSameKey = currentKey === key;
    currentKey = key;
    currentArgs = args.length === 0 ? EMPTY_ARGS : args;

    // Resubscribe to cache mutations only if key changed
    if (!isSameKey) {
      if (unsubscribeCache !== null) {
        unsubscribeCache();
      }
      unsubscribeCache = cacheStore.subscribe(key, (updatedData) => {
        if (!isDestroyed && data.val !== updatedData) {
          data.val = updatedData;
        }
      });
    }

    const cachedEntry = cacheStore.get(key);
    const hasCache =
      cachedEntry !== undefined && cachedEntry.data !== undefined && cachedEntry.data !== null;
    const isStale = !hasCache || Date.now() - cachedEntry.timestamp > ttl;

    // 1. Immediately display cached data (Zero Latency)
    if (hasCache && data.val !== cachedEntry.data) {
      data.val = cachedEntry.data;
    }

    // 2. If cache is fresh, skip background fetch
    if (hasCache && !isStale) {
      return cachedEntry.data;
    }

    // 3. Fetch from network (background revalidation if cache exists, otherwise blocking loading)
    return await runFetch(hasCache);
  };

  const revalidate = async () => {
    if (isDestroyed || !currentKey || isValidating.val) {
      return;
    }
    return await runFetch(true);
  };

  // Wire automatic event revalidation
  if (revalidateOnFocus || revalidateOnReconnect) {
    unsubscribeEvents = subscribeToRevalidation((source) => {
      if (isDestroyed) {
        return;
      }
      if (source === "focus" && revalidateOnFocus) {
        revalidate();
      } else if (source === "reconnect" && revalidateOnReconnect) {
        revalidate();
      }
    });
  }

  const destroy = () => {
    if (isDestroyed) {
      return;
    }
    isDestroyed = true;
    if (activeController !== null) {
      activeController.abort();
      activeController = null;
    }
    if (unsubscribeCache !== null) {
      unsubscribeCache();
      unsubscribeCache = null;
    }
    if (unsubscribeEvents !== null) {
      unsubscribeEvents();
      unsubscribeEvents = null;
    }
    loading.val = false;
    isValidating.val = false;
  };

  return {
    data,
    loading,
    isValidating,
    error,
    execute,
    revalidate,
    destroy,
  };
}
