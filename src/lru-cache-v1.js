'use strict';

/**
 * LRU Cache — v1 (naive implementation).
 *
 * Stores entries in a plain array ordered LRU -> MRU. Every lookup is a
 * linear scan: get/put/has/delete are all O(n) where n = number of entries.
 * This is the baseline version; v2 replaces the array with a Map.
 *
 * Spec (shared by v1 and v2):
 * - constructor(capacity): capacity must be a non-negative integer.
 * - get(key): returns the value or undefined; marks the key most-recently-used.
 * - put(key, value): inserts or updates; updating refreshes recency; evicts
 *   the least-recently-used entry when over capacity.
 * - has(key): boolean, does NOT affect recency.
 * - delete(key): removes the key, returns true if it was present.
 * - clear(): empties the cache and resets stats.
 * - size: current number of entries. keys(): keys ordered LRU -> MRU.
 * - stats(): { hits, misses, evictions, size, capacity }.
 * - Capacity 0 holds nothing: every put is immediately evicted (counted).
 * - Keys are compared with strict equality (===).
 */

function assertCapacity(capacity) {
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 0) {
    throw new TypeError('capacity must be a non-negative integer');
  }
}

class LRUCacheV1 {
  constructor(capacity) {
    assertCapacity(capacity);
    this.capacity = capacity;
    this.entries = []; // LRU -> MRU
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get size() {
    return this.entries.length;
  }

  get(key) {
    const i = this.entries.findIndex((e) => e.key === key);
    if (i === -1) {
      this.misses++;
      return undefined;
    }
    const [entry] = this.entries.splice(i, 1);
    this.entries.push(entry);
    this.hits++;
    return entry.value;
  }

  put(key, value) {
    const i = this.entries.findIndex((e) => e.key === key);
    if (i !== -1) {
      const [entry] = this.entries.splice(i, 1);
      entry.value = value;
      this.entries.push(entry);
      return;
    }
    this.entries.push({ key, value });
    if (this.entries.length > this.capacity) {
      this.entries.shift();
      this.evictions++;
    }
  }

  has(key) {
    return this.entries.some((e) => e.key === key);
  }

  delete(key) {
    const i = this.entries.findIndex((e) => e.key === key);
    if (i === -1) return false;
    this.entries.splice(i, 1);
    return true;
  }

  clear() {
    this.entries = [];
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  keys() {
    return this.entries.map((e) => e.key);
  }

  stats() {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.size,
      capacity: this.capacity,
    };
  }
}

module.exports = { LRUCacheV1 };
