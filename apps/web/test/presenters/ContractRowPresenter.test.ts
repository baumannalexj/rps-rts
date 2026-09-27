import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContractRowPresenter, presentContractStatus } from '../../src/presenters/ContractRowPresenter.ts';
import { makeContract, makeFaction } from '../support/FakeSimulationPort.ts';

const factions = [makeFaction('paper'), makeFaction('scissors'), makeFaction('rock')];

test('row shows pair initials, flows with resource initials and price', () => {
  const [row] = new ContractRowPresenter().presentAll([makeContract('paper', 'rock', { rateA: 1.25, rateB: 120, price: 1.5 })], factions);
  assert.deepEqual(row, {
    id: 'paper:rock',
    pair: 'P⇄R',
    flowA: '1.3 W',
    flowB: '120 C',
    rate: '1.50',
    statusText: 'live',
    statusClass: 'st-live',
  });
});

test('status mapping', () => {
  assert.deepEqual(presentContractStatus(makeContract('paper', 'rock', { status: 'winding-down', noticeTicksLeft: 7 })), { statusText: 'ends 7s', statusClass: 'st-wind' });
  assert.deepEqual(presentContractStatus(makeContract('paper', 'rock', { status: 'embargoed' })), { statusText: 'embargo', statusClass: 'st-wind' });
  assert.deepEqual(presentContractStatus(makeContract('paper', 'rock', { status: 'none' })), { statusText: 'none', statusClass: 'st-none' });
});

test('unknown factions fall back to ids', () => {
  const [row] = new ContractRowPresenter().presentAll([makeContract('paper', 'rock')], []);
  assert.equal(row?.pair, 'P⇄R');
  assert.equal(row?.flowA, '1.5');
});
