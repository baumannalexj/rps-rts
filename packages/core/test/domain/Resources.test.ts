import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offNative, matchupMultiplier, RESOURCES, FACTION_IDS } from '../../src/domain/Resources.ts';

test('offNative excludes exactly the native resource', () => {
  assert.deepEqual(offNative('water'), ['energy', 'carbon']);
  assert.deepEqual(offNative('carbon'), ['water', 'energy']);
});

test('matchupMultiplier follows rock > scissors > paper > rock', () => {
  assert.equal(matchupMultiplier('rock', 'scissors', 1.5), 1.5);
  assert.equal(matchupMultiplier('scissors', 'rock', 1.5), 1 / 1.5);
  assert.equal(matchupMultiplier('scissors', 'paper', 1.5), 1.5, 'scissors beats paper');
  assert.equal(matchupMultiplier('paper', 'scissors', 1.5), 1 / 1.5, 'paper is beaten by scissors');
});

test('every ordered pair in a 3-faction cycle has a relation, none are neutral', () => {
  for (const attacker of FACTION_IDS) {
    for (const defender of FACTION_IDS) {
      if (attacker === defender) continue;
      assert.notEqual(matchupMultiplier(attacker, defender, 1.5), 1, `${attacker} vs ${defender} should not be neutral`);
    }
  }
});

test('RESOURCES and FACTION_IDS are stable, ordered constants', () => {
  assert.deepEqual(RESOURCES, ['water', 'energy', 'carbon']);
  assert.deepEqual(FACTION_IDS, ['paper', 'scissors', 'rock']);
});
