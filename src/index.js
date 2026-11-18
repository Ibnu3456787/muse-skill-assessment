'use strict';

/**
 * Entry point. v2 is loaded conditionally so the v1-only commit of this
 * repository (the baseline) stays runnable on its own.
 */

const { LRUCacheV1 } = require('./lru-cache-v1');

let LRUCacheV2 = null;
try {
  ({ LRUCacheV2 } = require('./lru-cache-v2'));
} catch {
  // v2 not present yet (baseline commit).
}

function createCache(version, capacity) {
  if (version === 'v2') {
    if (!LRUCacheV2) throw new Error('LRUCacheV2 is not available in this checkout');
    return new LRUCacheV2(capacity);
  }
  return new LRUCacheV1(capacity);
}

module.exports = { LRUCacheV1, LRUCacheV2, createCache };
