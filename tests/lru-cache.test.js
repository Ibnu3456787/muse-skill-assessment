'use strict';

/**
 * LRU cache test suite — 17 test cases, run against EVERY available
 * implementation (v1 always; v2 when present). Same spec, same expectations:
 * the optimized version must behave identically to the baseline.
 *
 * Run: node --test tests/lru-cache.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { LRUCacheV1, LRUCacheV2 } = require('../src/index');

const impls = [{ name: 'v1', Ctor: LRUCacheV1 }];
if (LRUCacheV2) impls.push({ name: 'v2', Ctor: LRUCacheV2 });

for (const { name, Ctor } of impls) {
  describe(`LRUCache ${name}`, () => {
    it('1. get on an empty cache returns undefined and counts a miss', () => {
      const c = new Ctor(3);
      assert.equal(c.get('a'), undefined);
      assert.equal(c.stats().misses, 1);
      assert.equal(c.stats().hits, 0);
    });

    it('2. put then get returns the value and counts a hit', () => {
      const c = new Ctor(3);
      c.put('a', 1);
      assert.equal(c.get('a'), 1);
      assert.equal(c.stats().hits, 1);
      assert.equal(c.size, 1);
    });

    it('3. put updates an existing key and refreshes its recency', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.put('b', 2);
      c.put('a', 10); // 'a' is now most-recently-used
      assert.equal(c.get('a'), 10);
      c.put('c', 3); // must evict 'b', not 'a'
      assert.equal(c.has('b'), false);
      assert.equal(c.has('a'), true);
      assert.equal(c.size, 2);
    });

    it('4. evicts the least-recently-used entry when over capacity', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.put('b', 2);
      c.put('c', 3);
      assert.equal(c.has('a'), false);
      assert.equal(c.has('b'), true);
      assert.equal(c.has('c'), true);
      assert.equal(c.stats().evictions, 1);
    });

    it('5. get refreshes recency and changes eviction order', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.put('b', 2);
      c.get('a'); // 'a' now MRU, 'b' is LRU
      c.put('c', 3); // evicts 'b'
      assert.equal(c.has('b'), false);
      assert.equal(c.has('a'), true);
      assert.deepEqual(c.keys(), ['a', 'c']);
    });

    it('6. has does NOT refresh recency', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.put('b', 2);
      assert.equal(c.has('a'), true);
      c.put('c', 3); // 'a' still LRU despite has() -> evicted
      assert.equal(c.has('a'), false);
      assert.equal(c.has('b'), true);
    });

    it('7. delete removes present keys (true) and misses absent ones (false)', () => {
      const c = new Ctor(3);
      c.put('a', 1);
      assert.equal(c.delete('a'), true);
      assert.equal(c.delete('a'), false);
      assert.equal(c.size, 0);
      assert.equal(c.get('a'), undefined);
    });

    it('8. clear empties the cache and resets stats', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.get('a');
      c.get('missing');
      c.clear();
      assert.equal(c.size, 0);
      assert.deepEqual(c.keys(), []);
      assert.deepEqual(c.stats(), { hits: 0, misses: 0, evictions: 0, size: 0, capacity: 2 });
    });

    it('9. size tracks entries through puts, evictions and deletes', () => {
      const c = new Ctor(2);
      assert.equal(c.size, 0);
      c.put('a', 1);
      c.put('b', 2);
      assert.equal(c.size, 2);
      c.put('c', 3); // eviction, size stays 2
      assert.equal(c.size, 2);
      c.delete('b');
      assert.equal(c.size, 1);
    });

    it('10. keys() returns keys ordered LRU -> MRU', () => {
      const c = new Ctor(3);
      c.put('a', 1);
      c.put('b', 2);
      c.put('c', 3);
      assert.deepEqual(c.keys(), ['a', 'b', 'c']);
      c.get('a');
      assert.deepEqual(c.keys(), ['b', 'c', 'a']);
    });

    it('11. capacity 0 holds nothing; every put is evicted', () => {
      const c = new Ctor(0);
      c.put('a', 1);
      assert.equal(c.size, 0);
      assert.equal(c.get('a'), undefined);
      assert.equal(c.stats().evictions, 1);
    });

    it('12. capacity 1 evicts on every new distinct put', () => {
      const c = new Ctor(1);
      c.put('a', 1);
      c.put('b', 2);
      assert.equal(c.has('a'), false);
      assert.equal(c.get('b'), 2);
      assert.equal(c.stats().evictions, 1);
      c.put('b', 20); // update, no eviction
      assert.equal(c.get('b'), 20);
      assert.equal(c.stats().evictions, 1);
    });

    it('13. invalid capacity throws (negative, fractional, string, NaN)', () => {
      assert.throws(() => new Ctor(-1), TypeError);
      assert.throws(() => new Ctor(1.5), TypeError);
      assert.throws(() => new Ctor('3'), TypeError);
      assert.throws(() => new Ctor(NaN), TypeError);
      assert.throws(() => new Ctor(), TypeError);
    });

    it('14. stats count hits, misses and evictions over a sequence', () => {
      const c = new Ctor(2);
      c.put('a', 1);
      c.put('b', 2);
      c.get('a'); // hit
      c.get('x'); // miss
      c.get('b'); // hit
      c.put('c', 3); // evicts 'a'
      c.get('a'); // miss (evicted)
      assert.deepEqual(c.stats(), { hits: 2, misses: 2, evictions: 1, size: 2, capacity: 2 });
    });

    it('15. 1000 puts with capacity 100 keep size at 100 with the right LRU set', () => {
      const c = new Ctor(100);
      for (let i = 0; i < 1000; i++) c.put(`k${i}`, i);
      assert.equal(c.size, 100);
      assert.equal(c.stats().evictions, 900);
      assert.equal(c.has('k899'), false);
      assert.equal(c.has('k900'), true);
      assert.equal(c.get('k999'), 999);
      assert.deepEqual(c.keys().slice(0, 2), ['k900', 'k901']);
    });

    it('16. repeated puts of the same key do not grow the size', () => {
      const c = new Ctor(3);
      for (let i = 0; i < 50; i++) c.put('same', i);
      assert.equal(c.size, 1);
      assert.equal(c.get('same'), 49);
      assert.equal(c.stats().evictions, 0);
    });

    it('17. get on an evicted key returns undefined and does not resurrect it', () => {
      const c = new Ctor(1);
      c.put('a', 1);
      c.put('b', 2); // evicts 'a'
      assert.equal(c.get('a'), undefined);
      assert.equal(c.has('a'), false);
      assert.deepEqual(c.keys(), ['b']);
    });
  });
}
