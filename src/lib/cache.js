/**
 * High-Performance In-Memory Cache Store with SWR Support
 * Features:
 * - O(1) Map-based storage with LRU-style oldest entry eviction
 * - Single-lookup operations to prevent redundant hashing
 * - In-flight Promise deduplication
 * - Reactive subscription & Optimistic Mutation
 */

const DEFAULT_MAX_ENTRIES = 100;

/**
 * Consistent entry shape factory to preserve V8 hidden classes (monomorphic shape)
 */
function createEntry(data, timestamp, inFlight, subscribers) {
  return {
    data,
    timestamp,
    inFlight,
    subscribers,
  };
}

export class CacheStore {
  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  /**
   * Get cached entry: { data, timestamp, inFlight, subscribers }
   */
  get(key) {
    return this.store.get(key);
  }

  /**
   * Read cached data directly with zero intermediate overhead
   */
  getData(key) {
    return this.store.get(key)?.data;
  }

  /**
   * Check if cache entry is within valid TTL
   */
  isFresh(key, ttl) {
    const entry = this.store.get(key);
    return (
      entry !== undefined &&
      entry.data !== undefined &&
      entry.data !== null &&
      Date.now() - entry.timestamp <= ttl
    );
  }

  /**
   * Store data and notify subscribers
   */
  set(key, data) {
    let entry = this.store.get(key);

    if (entry !== undefined) {
      entry.data = data;
      entry.timestamp = Date.now();
      entry.inFlight = null;
    } else {
      // LRU Eviction: Remove oldest inserted entry if limit reached
      if (this.store.size >= this.maxEntries) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          const oldEntry = this.store.get(oldestKey);
          oldEntry?.subscribers?.clear();
          this.store.delete(oldestKey);
        }
      }

      entry = createEntry(data, Date.now(), null, null);
      this.store.set(key, entry);
    }

    if (entry.subscribers && entry.subscribers.size > 0) {
      entry.subscribers.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Prevent subscriber exceptions from breaking cache writes
        }
      });
    }

    return entry;
  }

  /**
   * Delete entry
   */
  delete(key) {
    const entry = this.store.get(key);
    if (entry) {
      entry.subscribers?.clear();
      this.store.delete(key);
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.store.forEach((entry) => entry.subscribers?.clear());
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }

  /**
   * In-flight deduplication management
   */
  getInFlight(key) {
    return this.store.get(key)?.inFlight;
  }

  setInFlight(key, promise) {
    let entry = this.store.get(key);
    if (entry !== undefined) {
      entry.inFlight = promise;
    } else {
      entry = createEntry(undefined, 0, promise, null);
      this.store.set(key, entry);
    }
  }

  clearInFlight(key) {
    const entry = this.store.get(key);
    if (entry !== undefined) {
      entry.inFlight = null;
    }
  }

  /**
   * Subscribe to data changes for a specific key
   */
  subscribe(key, callback) {
    let entry = this.store.get(key);
    if (entry === undefined) {
      entry = createEntry(undefined, 0, null, new Set());
      this.store.set(key, entry);
    } else if (!entry.subscribers) {
      entry.subscribers = new Set();
    }

    entry.subscribers.add(callback);
    return () => {
      if (entry.subscribers) {
        entry.subscribers.delete(callback);
        if (entry.subscribers.size === 0) {
          entry.subscribers = null;
        }
      }
    };
  }

  /**
   * Mutate cache and notify subscribers
   * Accepts raw value or updater function: (oldData) => newData
   */
  mutate(key, dataOrUpdater) {
    let nextData;
    if (typeof dataOrUpdater === "function") {
      const current = this.getData(key);
      nextData = dataOrUpdater(current);
    } else {
      nextData = dataOrUpdater;
    }

    if (nextData === null || nextData === undefined) {
      this.delete(key);
    } else {
      this.set(key, nextData);
    }
    return nextData;
  }
}

// Global default cache instance
export const globalCache = new CacheStore();

export const mutate = (key, dataOrUpdater) => globalCache.mutate(key, dataOrUpdater);
