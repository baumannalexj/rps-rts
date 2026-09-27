import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FactionCardPresenter, meterPercent, presentStatus } from '../../src/presenters/FactionCardPresenter.ts';
import { makeFaction, TEST_CONFIG } from '../support/FakeSimulationPort.ts';

test('status thresholds are strict at 0.75 and 0.3', () => {
  assert.deepEqual(presentStatus(0.76), { kind: 'ok', label: 'Running' });
  assert.deepEqual(presentStatus(0.75), { kind: 'low', label: 'Short' });
  assert.deepEqual(presentStatus(0.31), { kind: 'low', label: 'Short' });
  assert.deepEqual(presentStatus(0.3), { kind: 'dead', label: 'Starved' });
  assert.deepEqual(presentStatus(0), { kind: 'dead', label: 'Starved' });
});

test('meterPercent clamps to 0..100 and survives a zero cap', () => {
  assert.equal(meterPercent(200, 400), 50);
  assert.equal(meterPercent(800, 400), 100);
  assert.equal(meterPercent(-5, 400), 0);
  assert.equal(meterPercent(10, 0), 0);
});

test('presents a card view model', () => {
  const v = new FactionCardPresenter().present(makeFaction('paper', { wasted: 1500, efficiencyAvg: 0.2 }), TEST_CONFIG);
  assert.equal(v.name, 'Paper');
  assert.equal(v.nativeText, 'makes water');
  assert.equal(v.status.label, 'Starved');
  assert.equal(v.extractors, '3');
  assert.equal(v.soldiers, '4');
  assert.equal(v.efficiency, '20%');
  assert.equal(v.wasted, '1.5k');
  assert.deepEqual(v.resources.map((r) => r.id), ['water', 'energy', 'carbon']);
  const [water, energy, carbon] = v.resources;
  assert.equal(water?.isNative, true);
  assert.equal(energy?.isNative, false);
  assert.equal(water?.meterPct, 25);
  assert.equal(energy?.meterPct, 50);
  assert.equal(water?.inText, '+2.5');
  assert.equal(water?.outText, '−1.3');
  assert.equal(carbon?.inText, '+150');
  assert.equal(carbon?.colorToken, '--carbon');
});
