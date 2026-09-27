import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FixedPricing } from '../../../src/adapters/pricing/FixedPricing.ts';
import type { FactionSnapshot, PricingModel } from '@rps/contracts';

const snap = (over: Partial<FactionSnapshot> = {}): FactionSnapshot =>
  ({
    id: 'paper',
    name: 'Paper',
    native: 'water',
    policyId: 'merchant',
    bank: { water: 0, energy: 0, carbon: 0 },
    flows: {
      water: { in: 0, out: 0 },
      energy: { in: 0, out: 0 },
      carbon: { in: 0, out: 0 },
    },
    extractors: 0,
    soldiers: 0,
    efficiency: 1,
    efficiencyAvg: 1,
    wasted: 0,
    raidCooldown: 0,
    embargoes: [],
    ...over,
  }) as FactionSnapshot;

test('quotes the constructed price regardless of input', () => {
  const pricing: PricingModel = new FixedPricing(2.5);
  assert.equal(pricing.quote({ a: snap(), b: snap({ id: 'rock', native: 'carbon' }), config: {} as never }), 2.5);
});

test('defaults to a price of 1', () => {
  const pricing: PricingModel = new FixedPricing();
  assert.equal(pricing.quote({ a: snap(), b: snap(), config: {} as never }), 1);
});

test('rejects a non-positive or non-finite price', () => {
  assert.throws(() => new FixedPricing(0));
  assert.throws(() => new FixedPricing(-1));
  assert.throws(() => new FixedPricing(Number.NaN));
});
