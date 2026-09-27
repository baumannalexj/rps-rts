/** Bounded game log, newest first. */
import type { GameEvent } from '@rps/contracts';

export class EventLog {
  readonly capacity: number;
  private events: GameEvent[] = [];

  constructor(capacity = 80) {
    if (!(capacity > 0)) throw new Error('EventLog capacity must be positive');
    this.capacity = Math.floor(capacity);
  }

  push(event: GameEvent): void {
    this.events.unshift(Object.freeze({ ...event, factions: Object.freeze([...event.factions]) }));
    if (this.events.length > this.capacity) this.events.length = this.capacity;
  }

  get size(): number {
    return this.events.length;
  }

  /** Newest first. Returns a copy; events themselves are frozen. */
  toArray(): readonly GameEvent[] {
    return this.events.slice();
  }

  clear(): void {
    this.events = [];
  }
}
