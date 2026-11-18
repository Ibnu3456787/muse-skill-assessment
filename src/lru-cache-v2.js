'use strict';

/**
 * LRU Cache — v2 (optimized implementation).
 *
 * Stores entries in a Map, which preserves insertion order. The least-
 * recently-used entry is always the FIRST key in the Map; refreshing recency
 * is delete + set. get/put/has/delete are O(1) amortized.
 *
 * Same public spec as v1 (see lru-cache-v1.js). The two versions are
 * behaviorally identical — the same 17-test suite runs against both.
 */

function assertCapacity(capacity) {
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 0) {
    throw new TypeError('capacity must be a non-negative integer');
  }
}

class LRUCacheV2 {
  constructor(capacity) {
    assertCapacity(capacity);
    this.capacity = capacity;
    this.map = new Map(); // insertion order = LRU -> MRU
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get size() {
    return this.map.size;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return undefined;
    }
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    this.hits++;
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const lruKey = this.map.keys().next().value;
      this.map.delete(lruKey);
      this.evictions++;
    }
  }

  has(key) {
    return this.map.has(key);
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  keys() {
    return [...this.map.keys()];
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

module.exports = { LRUCacheV2 };
