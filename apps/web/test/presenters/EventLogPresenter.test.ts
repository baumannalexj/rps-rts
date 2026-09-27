import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameEvent } from '@rps/contracts';
import { EMPTY_LOG_TEXT, EventLogPresenter } from '../../src/presenters/EventLogPresenter.ts';

const ev = (tick: number, text: string): GameEvent => ({ tick, kind: 'raid', text, factions: [] });

test('empty log shows a placeholder', () => {
  const v = new EventLogPresenter().present([]);
  assert.deepEqual(v.items, [{ time: '', text: EMPTY_LOG_TEXT, kind: 'empty' }]);
});

test('formats times, keeps kind and caps length', () => {
  const events = Array.from({ length: 80 }, (_, i) => ev(200 - i, `e${i}`));
  const v = new EventLogPresenter(60).present(events);
  assert.equal(v.items.length, 60);
  assert.deepEqual(v.items[0], { time: '3:20', text: 'e0', kind: 'raid' });
});

test('key changes only when newest event or count changes', () => {
  const p = new EventLogPresenter();
  const a = p.key([ev(5, 'x'), ev(1, 'y')]);
  assert.equal(p.key([ev(5, 'x'), ev(1, 'y')]), a);
  assert.notEqual(p.key([ev(6, 'z'), ev(5, 'x'), ev(1, 'y')]), a);
  assert.notEqual(p.key([ev(5, 'q'), ev(1, 'y')]), a);
});
