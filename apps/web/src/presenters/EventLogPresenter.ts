import type { GameEvent, GameEventKind } from '@rps/contracts';
import { fmtTime } from './format.ts';

export interface EventItemView {
  readonly time: string;
  readonly text: string;
  readonly kind: GameEventKind | 'empty';
}

export interface EventLogView {
  /** Changes only when the newest event (or count) changes; the component re-renders only then. */
  readonly key: string;
  readonly items: readonly EventItemView[];
}

export const EVENT_LOG_LIMIT = 60;
export const EMPTY_LOG_TEXT = 'Quiet so far.';

export class EventLogPresenter {
  readonly limit: number;

  constructor(limit: number = EVENT_LOG_LIMIT) {
    this.limit = limit;
  }

  key(events: readonly GameEvent[]): string {
    const first = events[0];
    return `${events.length}:${first ? `${first.tick}:${first.text}` : ''}`;
  }

  present(events: readonly GameEvent[]): EventLogView {
    const items: EventItemView[] = events
      .slice(0, this.limit)
      .map((e) => ({ time: fmtTime(e.tick), text: e.text, kind: e.kind }));
    if (items.length === 0) items.push({ time: '', text: EMPTY_LOG_TEXT, kind: 'empty' });
    return { key: this.key(events), items };
  }
}
