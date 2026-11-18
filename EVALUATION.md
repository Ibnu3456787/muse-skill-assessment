# Evaluation Report — Competitive Skill Assessment

Required Work Report format (MUSE Competitive Bounty System, §10). Every
number below comes from a real run on this machine; raw data in `results/`.

## Competition name and category

Competitive Skill Assessment — engineering benchmark (coding). Operator-issued
challenge, 18 Nov 2026: build a small application with a clear spec, ≥15
automated tests, runtime measurement, an identified weakness, an optimized
version, re-run tests, and an honest before/after comparison.

## Evaluation method

- **Correctness:** 17 automated test cases (node:test, zero dependencies),
  run against every available implementation. Same spec, same expectations.
- **Performance:** 3 deterministic workloads (seeded PRNG, seed 42), 50,000
  ops each, capacity 1,000; 1 warmup + 5 measured runs per workload per
  version; wall-clock time via `performance.now()`. Both versions replay the
  exact same operation lists.
- **Environment:** Node v24.22.1, linux/x64, shared VM CPU.

## Main winning strategy

Pick a problem with a measurable complexity gap: an LRU cache where the naive
implementation is O(n) per operation and the optimized one is O(1) amortized.
The optimization is a data-structure change (array → Map with insertion
order), not micro-tuning — so the speedup is structural and reproducible.

## Chosen implementation

- **v1 (baseline):** entries in a plain array, LRU → MRU. Every get/put/has/
  delete does a linear `findIndex` scan; recency refresh is `splice` + `push`;
  eviction is `shift`. O(n) per operation, plus O(n) memmoves.
- **v2 (optimized):** entries in a `Map` (insertion order = LRU → MRU).
  Recency refresh is `delete` + `set`; eviction deletes the first key
  (`map.keys().next()`). O(1) amortized per operation.
- **Demo app:** `src/cli.js` memoizes naive recursive fibonacci with the
  cache (15 calls, capacity 5): 5 computed, 10 cache hits, ~1.9–2.0x faster
  than recomputing every call.

## Alternative approaches considered

- **Doubly-linked list + Map (classic textbook LRU):** same O(1) asymptotics
  as the Map approach, but more code and more pointer bugs for no measured
  gain — Map insertion order already provides the ordering. Rejected.
- **Array + key→index map:** O(1) lookup but stale-index bookkeeping on every
  splice/shift; error-prone, no advantage over Map. Rejected.
- **External cache library / dependency:** rejected — zero dependencies keeps
  the benchmark reproducible anywhere Node runs.

## Tests performed

17 cases per implementation, covering normal cases and edge cases:

1. get on empty cache (miss) · 2. put then get (hit) · 3. put updates + refreshes
   recency · 4. LRU eviction over capacity · 5. get refreshes recency ·
   6. has() does NOT refresh recency · 7. delete present/absent · 8. clear()
   empties + resets stats · 9. size tracking · 10. keys() LRU→MRU order ·
   11. capacity 0 · 12. capacity 1 · 13. invalid capacity throws (negative,
   fractional, string, NaN, missing) · 14. stats over a sequence ·
   15. 1,000 puts, capacity 100 (size + eviction count + LRU set) ·
   16. repeated put of one key · 17. get on evicted key does not resurrect it.

**Results: v1 17/17 pass; full suite 34/34 pass (17 × 2 implementations),
0 failures.** Full output: `results/test-results.txt` (both versions),
`results/test-results-v1.txt` (baseline only).

## Benchmark evidence

Same-run comparison (both versions, identical workloads):

| Workload (50k ops, cap 1000) | v1 mean | v1 ops/sec | v2 mean | v2 ops/sec | Speedup |
|---|---|---|---|---|---|
| sequential-put | 420.31 ms | 118,960 | 41.97 ms | 1,191,353 | **10.01x** |
| mixed 70% get / 30% put | 367.58 ms | 136,023 | 12.08 ms | 4,138,523 | **30.43x** |
| hot-get | 193.52 ms | 258,377 | 8.91 ms | 5,609,817 | **21.72x** |

Per-run detail and the v1-only baseline run:
`results/benchmark-results.md`, `results/benchmark-results.json`,
`results/benchmark-results-v1.json`.

Notes on honesty of the numbers:

- The v1-only baseline run (423.27 / 332.84 / 204.07 ms) differs slightly
  from the v1 numbers in the same-run comparison above — normal run-to-run
  variance on a shared VM. The comparison uses same-run numbers only.
- Variance is visible: v1 mixed ranged 324–466 ms across 5 runs. The speedup
  (10–30x) is far larger than the variance, so the conclusion is robust, but
  the absolute millisecond figures are machine-specific.

## Known weaknesses

**v1 (baseline):** O(n) scans on every operation; `splice`/`shift` add O(n)
memmoves; runtime degrades linearly with capacity — at capacity 10,000 it
would be roughly 10x slower again. Correct, but not competitive.

**v2 (optimized):**

- Every `get` does `delete` + `set` (two Map operations) to refresh recency.
  A doubly-linked list would do it in one pointer move; not measured as a
  bottleneck at this scale.
- No TTL / expiry support; no persistence; no memory-bound eviction.
- Object keys compare by identity only (Map semantics); the spec documents
  strict-equality keys.
- `clear()` resets stats (documented choice, not a bug — but a user expecting
  cumulative stats would be surprised).
- Single-threaded assumptions (fine for Node, not for a shared-memory port).

**Benchmark limits:** 5 runs on a shared VM CPU; only 3 workloads; no memory
profiling; no capacity-10k stress run. Speedups are relative to this machine.

**Test gaps:** no object-key test, no large-capacity stress test, no
memory/leak test, no concurrency test.

## Submission compliance status

- Source code: `src/` (v1 + v2 + CLI demo). ✅
- Test results: `results/test-results.txt`, `results/test-results-v1.txt`. ✅
- Benchmark results: `results/benchmark-results.json` + `.md` + `-v1.json`. ✅
- Git diff (v1 → v2): https://github.com/Ibnu3456787/muse-skill-assessment/compare/b8c7a2f1c78c6736e3c4db04b4d8d3071d3a960d...main
- Evaluation report: this file. ✅
- No fabricated numbers: every figure is from a real run; raw outputs are in
  `results/`. No secrets in the repository.

## Next improvement priorities

1. TTL support (per-entry expiry) + tests.
2. Memory benchmark: heap per 10k entries, v1 vs v2.
3. Capacity-10k stress test + benchmark to confirm the O(n) vs O(1) gap
   widens as predicted.
4. Profile whether `delete` + `set` on `get` matters at 1M+ ops; if it does,
   implement the doubly-linked-list variant and benchmark it against v2.
5. Re-run the full benchmark on a quiet machine with more iterations to
   tighten the confidence intervals.

## Verdict

The optimization is real and measured: same spec, same 17 tests passing on
both versions, 10–30x faster on every workload. The baseline was correct but
slow; the optimized version is correct and fast. That is the whole point of
the exercise — and the numbers, not the claims, say so.
