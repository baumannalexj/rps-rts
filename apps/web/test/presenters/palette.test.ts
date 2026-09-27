import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPairKey, contractLineStyle, dashClass, factionToken, resourceToken } from '../../src/presenters/palette.ts';

test('faction colors follow their native resource', () => {
  assert.equal(factionToken('paper'), '--water');
  assert.equal(factionToken('scissors'), '--energy');
  assert.equal(factionToken('rock'), '--carbon');
  assert.equal(resourceToken('energy'), '--energy');
});

test('pair key is order-independent', () => {
  assert.equal(canonicalPairKey('rock', 'paper'), 'paper:rock');
  assert.equal(canonicalPairKey('scissors', 'paper'), 'paper:scissors');
});

test('contract line styles are keyed by pair, not index', () => {
  const pr = contractLineStyle('rock:paper', 'rock', 'paper', 0);
  assert.deepEqual(pr, { colorToken: '--t2', dash: [4, 3] });
  assert.deepEqual(contractLineStyle('x', 'paper', 'scissors', 2).dash, []);
  assert.deepEqual(contractLineStyle('x', 'scissors', 'rock', 0).dash, [1.5, 3]);
});

test('dashClass picks a legend swatch', () => {
  assert.equal(dashClass([]), '');
  assert.equal(dashClass([4, 3]), 'dash');
  assert.equal(dashClass([1.5, 3]), 'dot');
});
