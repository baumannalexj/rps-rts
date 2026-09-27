/**
 * Whole-match behavior checks against the JS prototype (sim-core.js) this engine ports.
 * These pin down emergent outcomes, not implementation details.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../../src/engine/createEngine.ts';

test('an all-merchant match settles into a healthy, fully-traded economy', () => {
  const engine = createEngine({
    seed: 42,
    policies: { paper: 'merchant', scissors: 'merchant', rock: 'merchant' },
  });
  engine.step(1200);
  const snap = engine.snapshot();
  for (const f of snap.factions) {
    assert.ok(f.efficiencyAvg > 0.9, `${f.id} efficiency ${f.efficiencyAvg} should be > 0.9`);
  }
  for (const c of snap.contracts) {
    assert.equal(c.status, 'live', `${c.id} should be live`);
  }
});

test('a raid embargoes the raider, and the embargo lapses once raiding stops', () => {
  const engine = createEngine({
    seed: 42,
    policies: { paper: 'warlord', scissors: 'warlord', rock: 'warlord' },
    config: { raidGrace: 0, embargoTicks: 150 },
  });
  let sawEmbargo = false;
  for (let i = 0; i < 600 && !sawEmbargo; i++) {
    engine.step();
    if (engine.snapshot().factions.some((f) => f.embargoes.length > 0)) sawEmbargo = true;
  }
  assert.ok(sawEmbargo, 'expected at least one embargo to occur');

  // Stop new raids from renewing the embargo, then let the timer run out on its own.
  engine.dispatch({ type: 'update-config', patch: { raidsOn: false } });
  engine.step(151);
  const stillEmbargoed = engine.snapshot().factions.some((f) => f.embargoes.length > 0);
  assert.equal(stillEmbargoed, false, 'the embargo should clear once its timer runs out with no new raids');
});

test('an idle faction keeps existing contracts but does not grow them', () => {
  const engine = createEngine({ seed: 42 });
  engine.step(300);
  const before = engine.snapshot().contracts.find((c) => c.a === 'scissors' || c.b === 'scissors');
  const beforeFlow = before ? before.rateA + before.rateB : 0;

  engine.dispatch({ type: 'set-policy', faction: 'scissors', policyId: 'idle' });
  engine.step(300);
  const after = engine.snapshot().contracts.find((c) => c.a === 'scissors' || c.b === 'scissors');
  const afterFlow = after ? after.rateA + after.rateB : 0;

  assert.ok(afterFlow <= beforeFlow + 0.05, 'an idle faction should not expand its trade');
});
