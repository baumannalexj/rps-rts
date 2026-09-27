import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSeed, presentControlBar, SPEEDS } from '../../src/presenters/ControlBarPresenter.ts';

test('speed menu matches the prototype', () => {
  assert.deepEqual(SPEEDS.map((s) => [s.label, s.ticksPerSecond]), [['1×', 5], ['4×', 20], ['16×', 80], ['64×', 320]]);
});

test('control bar view', () => {
  assert.deepEqual(presentControlBar({ running: true, ticksPerSecond: 80 }, 125, 7), {
    clock: '2:05', playLabel: 'Pause', running: true, activeSpeed: 80, seed: 7,
  });
  const paused = presentControlBar({ running: false, ticksPerSecond: 33 }, 0, 1);
  assert.equal(paused.playLabel, 'Play');
  assert.equal(paused.activeSpeed, null);
});

test('parseSeed falls back to 1', () => {
  assert.equal(parseSeed('42'), 42);
  assert.equal(parseSeed('3.9'), 3);
  assert.equal(parseSeed(''), 1);
  assert.equal(parseSeed('abc'), 1);
  assert.equal(parseSeed('0'), 1);
});
