import type { ContractRowView } from '../presenters/ContractRowPresenter.ts';
import { h, setClass, setText } from './dom.ts';

interface RowRefs {
  readonly tr: HTMLTableRowElement;
  readonly cells: readonly HTMLTableCellElement[];
  readonly status: HTMLElement;
}

export class ContractsTable {
  readonly root: HTMLElement;
  private readonly body: HTMLTableSectionElement;
  private readonly rows = new Map<string, RowRefs>();
  private order = '';

  constructor(parent: HTMLElement) {
    const th = (t: string): HTMLTableCellElement => h('th', { scope: 'col', text: t });
    this.body = h('tbody');
    const table = h('table', {}, [
      h('caption', { class: 'sr-only', text: 'Trade contracts between factions' }),
      h('thead', {}, [h('tr', {}, [th('Pair'), th('Flow →'), th('Flow ←'), th('Rate'), th('State')])]),
      this.body,
    ]);
    this.root = h('section', { class: 'box', 'aria-labelledby': 'contracts-h' }, [
      h('h2', { id: 'contracts-h', text: 'Contracts' }),
      table,
      h('p', { class: 'note', text: "Rate is how many units of the first faction's resource buy one unit of the second's." }),
    ]);
    parent.append(this.root);
  }

  update(rows: readonly ContractRowView[]): void {
    const order = rows.map((r) => r.id).join('|');
    if (order !== this.order) this.rebuild(rows);
    for (const r of rows) {
      const refs = this.rows.get(r.id);
      if (!refs) continue;
      const [pair, a, b, rate] = refs.cells;
      if (pair) setText(pair, r.pair);
      if (a) setText(a, r.flowA);
      if (b) setText(b, r.flowB);
      if (rate) setText(rate, r.rate);
      setText(refs.status, r.statusText);
      setClass(refs.status, r.statusClass);
    }
  }

  /** Only when the set of contracts changes; normal frames just patch text. */
  private rebuild(rows: readonly ContractRowView[]): void {
    this.order = rows.map((r) => r.id).join('|');
    const next = new Map<string, RowRefs>();
    for (const r of rows) {
      let refs = this.rows.get(r.id);
      if (!refs) {
        const cells = [h('td'), h('td'), h('td'), h('td')];
        const status = h('span');
        const tr = h('tr', {}, [...cells, h('td', {}, [status])]);
        refs = { tr, cells, status };
      }
      next.set(r.id, refs);
    }
    this.rows.clear();
    for (const [k, v] of next) this.rows.set(k, v);
    this.body.replaceChildren(...[...next.values()].map((r) => r.tr));
  }

  destroy(): void {
    this.root.remove();
  }
}
