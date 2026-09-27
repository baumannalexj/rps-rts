import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mulberry32, mulberry32Factory } from '../../../src/adapters/random/Mulberry32.ts';

test('same seed produces the same sequence', () => {
  const a = new Mulberry32(42);
  const b = new Mulberry32(42);
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  assert.deepEqual(seqA, seqB);
});

test('different seeds diverge', () => {
  const a = new Mulberry32(1);
  const b = new Mulberry32(2);
  assert.notEqual(a.next(), b.next());
});

test('values stay within [0, 1)', () => {
  const rng = mulberry32Factory(7);
  for (let i = 0; i < 500; i++) {
    const v = rng.next();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});
