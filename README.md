# CacheBench — Competitive Skill Assessment

An in-memory LRU cache library + demo CLI, built as a competitive engineering
assessment: clear spec, 17 automated tests, honest runtime benchmarks, a
measured optimization, and a full evaluation report.

This commit is the **v1 baseline**: array-based implementation, O(n) per
operation. The optimized v2 (Map-based, O(1)) follows in the next commit;
the diff between the two commits is the optimization, measured.

## Spec

`LRUCache(capacity)` — capacity must be a non-negative integer.

| Method | Behavior |
|---|---|
| `get(key)` | Value or `undefined`; marks the key most-recently-used. |
| `put(key, value)` | Insert or update; update refreshes recency; evicts LRU when over capacity. |
| `has(key)` | Boolean; does NOT affect recency. |
| `delete(key)` | Removes the key; `true` if it was present. |
| `clear()` | Empties the cache and resets stats. |
| `size` / `keys()` | Entry count; keys ordered LRU → MRU. |
| `stats()` | `{ hits, misses, evictions, size, capacity }`. |

Capacity 0 holds nothing (every put is immediately evicted and counted).
Keys are compared with strict equality.

## Layout

```
src/
  lru-cache-v1.js   Baseline: array-based, O(n) per operation
  index.js          Entry point
  cli.js            Demo: memoizes slow fibonacci with the cache
tests/
  lru-cache.test.js 17 cases (runs against every available implementation)
bench/
  benchmark.js      Deterministic workloads, 1 warmup + 5 measured runs
results/
  test-results-v1.txt
  benchmark-results-v1.json
```

## Run

```sh
node --test tests/lru-cache.test.js   # tests (no dependencies)
node bench/benchmark.js               # benchmarks
node src/cli.js v1                    # demo CLI
```

## Baseline results (Node v24.22.1, linux/x64)

Tests: **17/17 pass**.

| Workload (50k ops, capacity 1000) | v1 mean | v1 ops/sec |
|---|---|---|
| sequential-put | 423.27 ms | 118,127 |
| mixed 70% get / 30% put | 332.84 ms | 150,223 |
| hot-get | 204.07 ms | 245,014 |

Raw numbers: [results/benchmark-results-v1.json](results/benchmark-results-v1.json).

## License

MIT — see [LICENSE](LICENSE).
