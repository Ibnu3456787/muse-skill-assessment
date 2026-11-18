'use strict';

/**
 * Demo CLI: memoizes a deliberately slow function (naive recursive
 * fibonacci) with the LRU cache, so the cache is exercised as part of a
 * small application instead of only in unit tests.
 *
 * Usage: node src/cli.js [v1|v2]
 * Defaults to v2 when available, else v1.
 */

const { createCache, LRUCacheV2 } = require('./index');

function slowFib(n) {
  if (n <= 1) return n;
  return slowFib(n - 1) + slowFib(n - 2);
}

function main() {
  const version = process.argv[2] || (LRUCacheV2 ? 'v2' : 'v1');
  const cache = createCache(version, 5);
  // Workload with repeats: the cache should turn repeat calls into hits.
  const inputs = [25, 24, 25, 26, 24, 27, 25, 26, 24, 28, 25, 27, 24, 26, 25];

  const t0 = performance.now();
  let computed = 0;
  for (const n of inputs) {
    let v = cache.get(n);
    if (v === undefined) {
      v = slowFib(n);
      cache.put(n, v);
      computed++;
    }
  }
  const withCacheMs = performance.now() - t0;

  const t1 = performance.now();
  for (const n of inputs) slowFib(n);
  const withoutCacheMs = performance.now() - t1;

  console.log(`LRU cache demo (${version}), capacity 5, ${inputs.length} calls`);
  console.log(`  computed (misses): ${computed}, cache hits: ${cache.stats().hits}`);
  console.log(`  with cache:    ${withCacheMs.toFixed(1)} ms`);
  console.log(`  without cache: ${withoutCacheMs.toFixed(1)} ms`);
  console.log(`  speedup: ${(withoutCacheMs / withCacheMs).toFixed(1)}x`);
  console.log(`  stats: ${JSON.stringify(cache.stats())}`);
}

main();
