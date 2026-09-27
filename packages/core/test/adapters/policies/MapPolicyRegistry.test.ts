import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MapPolicyRegistry } from '../../../src/adapters/policies/MapPolicyRegistry.ts';

test('withDefaults registers merchant, balanced, warlord and idle', () => {
  const registry = MapPolicyRegistry.withDefaults();
  const ids = registry.list().map((p) => p.id).sort();
  assert.deepEqual(ids, ['balanced', 'idle', 'merchant', 'warlord']);
});

test('get throws for an unknown policy and has() reports correctly', () => {
  const registry = MapPolicyRegistry.withDefaults();
  assert.equal(registry.has('merchant'), true);
  assert.equal(registry.has('nonsense'), false);
  assert.throws(() => registry.get('nonsense'));
});

test('registering the same id twice throws', () => {
  const registry = MapPolicyRegistry.withDefaults();
  assert.throws(() => registry.register(registry.get('merchant')));
});
