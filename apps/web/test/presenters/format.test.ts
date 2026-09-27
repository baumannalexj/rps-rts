import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtAxis, fmtCompact, fmtNum, fmtPercent, fmtTime, initial } from '../../src/presenters/format.ts';

test('fmtTime renders m:ss and floors fractions', () => {
  assert.equal(fmtTime(0), '0:00');
  assert.equal(fmtTime(65), '1:05');
  assert.equal(fmtTime(600), '10:00');
  assert.equal(fmtTime(59.9), '0:59');
  assert.equal(fmtTime(-3), '0:00');
});

test('fmtNum drops decimals from 100 up', () => {
  assert.equal(fmtNum(1.234), '1.2');
  assert.equal(fmtNum(99.94), '99.9');
  assert.equal(fmtNum(150.6), '151');
  assert.equal(fmtNum(-250.2), '-250');
  assert.equal(fmtNum(2, 2), '2.00');
});

test('fmtCompact uses k from 1000', () => {
  assert.equal(fmtCompact(999.4), '999');
  assert.equal(fmtCompact(1234), '1.2k');
});

test('fmtAxis mirrors prototype axis labels', () => {
  assert.equal(fmtAxis(0), '0');
  assert.equal(fmtAxis(25), '25');
  assert.equal(fmtAxis(2.5), '2.5');
  assert.equal(fmtAxis(2500), '2.5k');
});

test('fmtPercent and initial', () => {
  assert.equal(fmtPercent(0.756), '76%');
  assert.equal(initial('water'), 'W');
  assert.equal(initial(''), '');
});
