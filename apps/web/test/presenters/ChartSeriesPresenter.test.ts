import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChartSeriesPresenter, CHART_SPECS } from '../../src/presenters/ChartSeriesPresenter.ts';
import { makeHistory, makeSnapshot } from '../support/FakeSimulationPort.ts';

const snap = makeSnapshot();
const history = makeHistory(5, 10);
const p = new ChartSeriesPresenter();

test('four charts in prototype order', () => {
  assert.deepEqual(CHART_SPECS.map((s) => s.title), ['Native output', 'Army', 'Net worth', 'Contract flow']);
});

test('faction series are in paper, scissors, rock order with faction colors', () => {
  const d = p.present('output', history, snap.factions, snap.contracts);
  assert.deepEqual(d.times, [10, 11, 12, 13, 14]);
  assert.deepEqual(d.series.map((s) => s.label), ['Paper', 'Scissors', 'Rock']);
  assert.deepEqual(d.series.map((s) => s.colorToken), ['--water', '--energy', '--carbon']);
  assert.deepEqual(d.series[1]?.values, [0, 2, 4, 6, 8]);
  assert.deepEqual(p.present('army', history, snap.factions, snap.contracts).series[1]?.values, [0, 0.5, 1, 1.5, 2]);
});

test('contract series use pair labels and dash styles', () => {
  const d = p.present('contractFlow', history, snap.factions, snap.contracts);
  assert.deepEqual(d.series.map((s) => s.label), ['P⇄S', 'P⇄R', 'S⇄R']);
  assert.deepEqual(d.series.map((s) => s.dash), [[], [4, 3], [1.5, 3]]);
  assert.deepEqual(d.series[0]?.values, [2.25, 2.25, 2.25, 2.25, 2.25]);
});

test('contracts seen only in history still get a line; missing values read as 0', () => {
  const d = p.contractSeries(history, [], snap.factions);
  assert.equal(d.series.length, 3);
  const empty = p.factionSeries([], 'worth', snap.factions);
  assert.deepEqual(empty.times, []);
  assert.equal(empty.series.length, 3);
});
