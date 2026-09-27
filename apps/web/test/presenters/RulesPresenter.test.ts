import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatKnobValue, RulesPresenter, stepDecimals } from '../../src/presenters/RulesPresenter.ts';
import { TEST_CONFIG, TEST_SCHEMA } from '../support/FakeSimulationPort.ts';

const p = new RulesPresenter();

test('splits schema into knobs and toggles with current values', () => {
  const v = p.present(TEST_SCHEMA, { ...TEST_CONFIG, raidsOn: false });
  assert.deepEqual(v.knobs.map((k) => k.key), ['extractorRate', 'upkeep', 'storageCap']);
  assert.equal(v.knobs[0]?.output, '2/s');
  assert.equal(v.knobs[0]?.label, 'Extractor output');
  assert.deepEqual(v.toggles.map((t) => [t.key, t.checked]), [['tradeOn', true], ['raidsOn', false]]);
});

test('knob values lose float noise but keep step precision', () => {
  assert.equal(stepDecimals(0.005), 3);
  assert.equal(stepDecimals(50), 0);
  assert.equal(stepDecimals(1e-7), 7);
  assert.equal(formatKnobValue(0.1 + 0.2, 0.1, '/s'), '0.3/s');
  assert.equal(formatKnobValue(0.035, 0.005, '/s'), '0.035/s');
  assert.equal(formatKnobValue(1.5, 0.1, '×'), '1.5×');
});

test('patchFor parses, clamps and rejects unknown keys', () => {
  assert.deepEqual(p.patchFor(TEST_SCHEMA, 'extractorRate', '2.3'), { extractorRate: 2.3 });
  assert.deepEqual(p.patchFor(TEST_SCHEMA, 'extractorRate', '99'), { extractorRate: 5 });
  assert.deepEqual(p.patchFor(TEST_SCHEMA, 'tradeOn', false), { tradeOn: false });
  assert.equal(p.patchFor(TEST_SCHEMA, 'nope', '1'), null);
  assert.equal(p.patchFor(TEST_SCHEMA, 'upkeep', 'abc'), null);
});
