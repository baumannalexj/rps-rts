import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../../src/engine/createEngine.ts';
import { FixedPricing } from '../../src/adapters/pricing/FixedPricing.ts';

test('the same seed produces an identical snapshot after 1000 ticks', () => {
  const a = createEngine({ seed: 42 });
  const b = createEngine({ seed: 42 });
  for (let i = 0; i < 1000; i++) {
    a.step();
    b.step();
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('different seeds are free to diverge over time', () => {
  const a = createEngine({ seed: 1 });
  const b = createEngine({ seed: 2 });
  for (let i = 0; i < 1000; i++) {
    a.step();
    b.step();
  }
  assert.notDeepEqual(a.snapshot(), b.snapshot());
});

test('step(n) matches n calls to step()', () => {
  const a = createEngine({ seed: 9 });
  const b = createEngine({ seed: 9 });
  a.step(50);
  for (let i = 0; i < 50; i++) b.step();
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('swapping in FixedPricing makes every contract quote that exact price', () => {
  const engine = createEngine({ seed: 3, adapters: { pricing: new FixedPricing(2) } });
  engine.step(400);
  const snap = engine.snapshot();
  for (const c of snap.contracts) {
    if (c.rateA + c.rateB > 0) assert.equal(c.price, 2);
  }
});

test('disabling raids leaves no raid events over a long match', () => {
  const engine = createEngine({ seed: 5, config: { raidsOn: false } });
  engine.step(1800);
  const raidEvents = engine.snapshot().events.filter((e) => e.kind === 'raid');
  assert.equal(raidEvents.length, 0);
});

test('rejects an unknown policy id', () => {
  assert.throws(() => createEngine({ seed: 1, policies: { paper: 'nonsense' } }));
});

test('rejects an invalid config patch', () => {
  assert.throws(() => createEngine({ seed: 1, config: { storageCap: -5 } }));
});
