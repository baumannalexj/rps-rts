import type { EventLogView } from '../presenters/EventLogPresenter.ts';
import { h } from './dom.ts';

export class EventLog {
  readonly root: HTMLElement;
  private readonly list: HTMLUListElement;
  private key: string | null = null;

  constructor(parent: HTMLElement) {
    this.list = h('ul', { class: 'log', tabindex: 0, 'aria-label': 'Recent events, newest first' });
    this.root = h('section', { class: 'box', 'aria-labelledby': 'log-h' }, [h('h2', { id: 'log-h', text: 'Event log' }), this.list]);
    parent.append(this.root);
  }

  /** Re-renders only when the newest event changes. */
  update(view: EventLogView): void {
    if (view.key === this.key) return;
    this.key = view.key;
    this.list.replaceChildren(
      ...view.items.map((it) =>
        h('li', { class: it.kind }, [h('time', { text: it.time }), h('span', { text: it.text })]),
      ),
    );
  }

  destroy(): void {
    this.root.remove();
  }
}
