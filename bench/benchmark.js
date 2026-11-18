'use strict';

/**
 * Benchmark harness — measures wall-clock runtime of v1 vs v2 on identical,
 * deterministic workloads.
 *
 * - Seeded PRNG (mulberry32) so both versions run the EXACT same operations.
 * - 1 warmup iteration + 5 measured iterations per workload per version.
 * - Reports mean / min / max milliseconds and ops/sec.
 * - Writes results/benchmark-results.json (raw numbers) and prints a table.
 *
 * Run: node bench/benchmark.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { LRUCacheV1, LRUCacheV2 } = require('../src/index');

const OPS = 50000;
const CAPACITY = 1000;
const ITERATIONS = 5;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build the operation list ONCE per workload; both versions replay it.
function buildWorkloads() {
  const rnd = mulberry32(42);
  const sequentialPut = [];
  for (let i = 0; i < OPS; i++) sequentialPut.push(['put', `k${i}`, i]);

  const mixed = [];
  for (let i = 0; i < OPS; i++) {
    const key = `k${Math.floor(rnd() * 2000)}`;
    if (rnd() < 0.7) mixed.push(['get', key]);
    else mixed.push(['put', key, i]);
  }

  const hotGet = [];
  for (let i = 0; i < CAPACITY; i++) hotGet.push(['put', `k${i}`, i]);
  for (let i = 0; i < OPS; i++) hotGet.push(['get', `k${Math.floor(rnd() * 100)}`]);

  return [
    { name: 'sequential-put (50k distinct puts)', ops: sequentialPut },
    { name: 'mixed 70% get / 30% put (2k key space)', ops: mixed },
    { name: 'hot-get (1k prefill + 50k gets on 100 hot keys)', ops: hotGet },
  ];
}

function runOnce(Ctor, ops) {
  const cache = new Ctor(CAPACITY);
  const t0 = performance.now();
  for (const [op, key, value] of ops) {
    if (op === 'put') cache.put(key, value);
    else cache.get(key);
  }
  return performance.now() - t0;
}

function stats(times) {
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    mean_ms: +mean.toFixed(2),
    min_ms: +Math.min(...times).toFixed(2),
    max_ms: +Math.max(...times).toFixed(2),
    ops_per_sec: Math.round(OPS / (mean / 1000)),
    runs_ms: times.map((t) => +t.toFixed(2)),
  };
}

function main() {
  const impls = [{ name: 'v1 (array, O(n))', Ctor: LRUCacheV1 }];
  if (LRUCacheV2) impls.push({ name: 'v2 (Map, O(1))', Ctor: LRUCacheV2 });

  const workloads = buildWorkloads();
  const results = {
    env: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      ops_per_workload: OPS,
      capacity: CAPACITY,
      iterations: ITERATIONS,
      warmup: 1,
      seed: 42,
      generated_at: new Date().toISOString(),
    },
    workloads: {},
  };

  for (const w of workloads) {
    console.log(`\n== ${w.name} ==`);
    results.workloads[w.name] = {};
    for (const { name, Ctor } of impls) {
      runOnce(Ctor, w.ops); // warmup (JIT)
      const times = [];
      for (let i = 0; i < ITERATIONS; i++) times.push(runOnce(Ctor, w.ops));
      const s = stats(times);
      results.workloads[w.name][name] = s;
      console.log(
        `  ${name}: mean ${s.mean_ms} ms (min ${s.min_ms}, max ${s.max_ms}) — ${s.ops_per_sec.toLocaleString()} ops/sec`,
      );
    }
    const names = Object.keys(results.workloads[w.name]);
    if (names.length === 2) {
      const [a, b] = names;
      const speedup =
        results.workloads[w.name][a].mean_ms / results.workloads[w.name][b].mean_ms;
      console.log(`  speedup v2 vs v1: ${speedup.toFixed(1)}x`);
      results.workloads[w.name].speedup_v2_vs_v1 = +speedup.toFixed(2);
    }
  }

  const outPath = path.join(__dirname, '..', 'results', 'benchmark-results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nRaw results written to ${outPath}`);
}

main();
