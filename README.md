# CacheBench — Competitive Skill Assessment

An in-memory LRU cache library + demo CLI, built as a competitive engineering
assessment: clear spec, 17 automated tests, honest runtime benchmarks, a
measured optimization, and a full evaluation report.

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
  lru-cache-v2.js   Optimized: Map-based, O(1) amortized (added in commit 2)
  index.js          Entry point (v2 loaded conditionally)
  cli.js            Demo: memoizes slow fibonacci with the cache
tests/
  lru-cache.test.js 17 cases, run against every available implementation
bench/
  benchmark.js      Deterministic workloads, 1 warmup + 5 measured runs
results/
  test-results.txt / test-results-v1.txt
  benchmark-results.json / benchmark-results.md / benchmark-results-v1.json
EVALUATION.md       Full evaluation report (Required Work Report format)
```

## Run

```sh
node --test tests/lru-cache.test.js   # tests (no dependencies)
node bench/benchmark.js               # benchmarks
node src/cli.js v2                    # demo CLI (v1 or v2)
```

## Results (Node v24.22.1, linux/x64)

Tests: **34/34 pass** (17 cases × 2 implementations).

| Workload (50k ops, capacity 1000) | v1 mean | v2 mean | Speedup |
|---|---|---|---|
| sequential-put | 420.31 ms | 41.97 ms | **10.0x** |
| mixed 70% get / 30% put | 367.58 ms | 12.08 ms | **30.4x** |
| hot-get | 193.52 ms | 8.91 ms | **21.7x** |

Full numbers, per-run detail and the honest weaknesses list:
[EVALUATION.md](EVALUATION.md) and [results/benchmark-results.md](results/benchmark-results.md).

## License

MIT — see [LICENSE](LICENSE).
