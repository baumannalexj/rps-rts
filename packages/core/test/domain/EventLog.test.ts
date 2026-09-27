import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventLog } from '../../src/domain/EventLog.ts';

const ev = (tick: number, text: string) => ({ tick, kind: 'system' as const, text, factions: [] });

test('push adds newest first', () => {
  const log = new EventLog(10);
  log.push(ev(1, 'first'));
  log.push(ev(2, 'second'));
  const arr = log.toArray();
  assert.equal(arr[0]?.text, 'second');
  assert.equal(arr[1]?.text, 'first');
});

test('drops the oldest event once capacity is exceeded', () => {
  const log = new EventLog(2);
  log.push(ev(1, 'a'));
  log.push(ev(2, 'b'));
  log.push(ev(3, 'c'));
  assert.equal(log.size, 2);
  assert.deepEqual(log.toArray().map((e) => e.text), ['c', 'b']);
});

test('clear empties the log', () => {
  const log = new EventLog(5);
  log.push(ev(1, 'a'));
  log.clear();
  assert.equal(log.size, 0);
});

test('rejects a non-positive capacity', () => {
  assert.throws(() => new EventLog(0));
});
