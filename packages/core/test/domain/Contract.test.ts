import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Contract, MIN_LIVE_FLOW } from '../../src/domain/Contract.ts';

test('idFor and involves identify the pair', () => {
  const c = new Contract('paper', 'rock');
  assert.equal(c.id, Contract.idFor('paper', 'rock'));
  assert.equal(c.involves('paper'), true);
  assert.equal(c.involves('scissors'), false);
});

test('rejects a contract with itself', () => {
  assert.throws(() => new Contract('paper', 'paper'));
});

test('isFlowing reflects MIN_LIVE_FLOW and status reports none/live', () => {
  const c = new Contract('paper', 'rock');
  assert.equal(c.status(false), 'none');
  c.setTerms(MIN_LIVE_FLOW, 0, 1);
  assert.equal(c.isFlowing, true);
  assert.equal(c.status(false), 'live');
});

test('an embargoed contract reports embargoed even while flowing', () => {
  const c = new Contract('paper', 'rock');
  c.setTerms(2, 3, 1.5);
  assert.equal(c.status(true), 'embargoed');
});

test('cancel starts a wind-down and tickNotice ends it after N ticks', () => {
  const c = new Contract('paper', 'rock');
  c.setTerms(2, 3, 1);
  assert.equal(c.cancel(2), true);
  assert.equal(c.status(false), 'winding-down');
  assert.equal(c.tickNotice(), false);
  assert.equal(c.tickNotice(), true, 'ends on the tick notice reaches zero');
  assert.equal(c.rateA, 0);
  assert.equal(c.rateB, 0);
  assert.equal(c.status(false), 'none');
});

test('cancel with zero notice ends immediately', () => {
  const c = new Contract('paper', 'rock');
  c.setTerms(2, 3, 1);
  assert.equal(c.cancel(0), true);
  assert.equal(c.isFlowing, false);
});

test('cancel is a no-op when not flowing or already winding down', () => {
  const c = new Contract('paper', 'rock');
  assert.equal(c.cancel(5), false);
  c.setTerms(1, 1, 1);
  c.cancel(5);
  assert.equal(c.cancel(5), false, 'already in notice');
});

test('setTerms clamps negative rates to zero', () => {
  const c = new Contract('paper', 'rock');
  c.setTerms(-3, 4, 1);
  assert.equal(c.rateA, 0);
  assert.equal(c.rateB, 4);
});

test('toSnapshot mirrors id, endpoints and status', () => {
  const c = new Contract('paper', 'rock');
  c.setTerms(2, 3, 1.5);
  const snap = c.toSnapshot(false);
  assert.equal(snap.id, 'paper:rock');
  assert.equal(snap.a, 'paper');
  assert.equal(snap.b, 'rock');
  assert.equal(snap.price, 1.5);
  assert.equal(snap.status, 'live');
});
