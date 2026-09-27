import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bank } from '../../src/domain/Bank.ts';

test('deposit and withdraw track flows and stock', () => {
  const bank = new Bank(10);
  bank.deposit('water', 5);
  bank.withdraw('energy', 3);
  assert.equal(bank.get('water'), 15);
  assert.equal(bank.get('energy'), 7);
  const flows = bank.flows();
  assert.equal(flows.water.in, 5);
  assert.equal(flows.energy.out, 3);
  assert.equal(flows.carbon.in, 0);
});

test('resetFlows zeroes in/out but keeps stock', () => {
  const bank = new Bank(0);
  bank.deposit('water', 4);
  bank.resetFlows();
  assert.equal(bank.get('water'), 4);
  assert.equal(bank.flows().water.in, 0);
});

test('clamp caps overflow and floors negatives, reporting waste', () => {
  const bank = new Bank({ water: 120, energy: -5, carbon: 50 });
  const wasted = bank.clamp(100);
  assert.equal(bank.get('water'), 100);
  assert.equal(bank.get('energy'), 0);
  assert.equal(bank.get('carbon'), 50);
  assert.equal(wasted, 20);
});

test('canAfford and pay only spend when every listed resource is covered', () => {
  const bank = new Bank({ water: 10, energy: 2, carbon: 0 });
  assert.equal(bank.canAfford({ water: 10, energy: 3 }), false);
  assert.equal(bank.pay({ water: 10, energy: 3 }), false);
  assert.equal(bank.get('water'), 10, 'a failed pay must not partially spend');

  assert.equal(bank.canAfford({ water: 5, energy: 2 }), true);
  assert.equal(bank.pay({ water: 5, energy: 2 }), true);
  assert.equal(bank.get('water'), 5);
  assert.equal(bank.get('energy'), 0);
});

test('toBundle and total reflect current stock', () => {
  const bank = new Bank({ water: 1, energy: 2, carbon: 3 });
  assert.deepEqual(bank.toBundle(), { water: 1, energy: 2, carbon: 3 });
  assert.equal(bank.total(), 6);
});
