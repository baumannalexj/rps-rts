import type { FactionId, PolicyDescriptor, PolicyId } from '@rps/contracts';
import type { FactionCardView } from '../presenters/FactionCardPresenter.ts';
import { RESOURCE_ORDER } from '../presenters/FactionCardPresenter.ts';
import { factionToken, resourceToken } from '../presenters/palette.ts';
import { h, isActive, setAttr, setClass, setStyle, setText } from './dom.ts';

export interface FactionCardCallbacks {
  onPolicyChange(faction: FactionId, policyId: PolicyId): void;
}

interface ResourceRefs {
  readonly name: HTMLElement;
  readonly meter: HTMLElement;
  readonly bar: HTMLElement;
  readonly inEl: HTMLElement;
  readonly outEl: HTMLElement;
}

export class FactionCard {
  readonly root: HTMLElement;
  readonly faction: FactionId;
  private readonly name: HTMLElement;
  private readonly native: HTMLElement;
  private readonly pill: HTMLElement;
  private readonly select: HTMLSelectElement;
  private readonly ext: HTMLElement;
  private readonly sol: HTMLElement;
  private readonly eff: HTMLElement;
  private readonly waste: HTMLElement;
  private readonly res: readonly ResourceRefs[];

  constructor(parent: HTMLElement, faction: FactionId, policies: readonly PolicyDescriptor[], cb: FactionCardCallbacks) {
    this.faction = faction;
    this.name = h('h3', { text: faction });
    this.native = h('span', { class: 'native' });
    this.pill = h('span', { class: 'pill', role: 'status' });
    this.select = h(
      'select',
      { id: `policy-${faction}`, 'aria-label': `${faction} governor` },
      policies.map((p) => h('option', { value: p.id, title: p.description, text: p.label })),
    );
    this.select.addEventListener('change', () => cb.onPolicyChange(faction, this.select.value));

    const stat = (label: string): [HTMLElement, HTMLElement] => {
      const b = h('b');
      return [b, h('div', { class: 'stat' }, [b, h('span', { text: label })])];
    };
    const [ext, extBox] = stat('Extractors');
    const [sol, solBox] = stat('Soldiers');
    const [eff, effBox] = stat('Efficiency');
    const [waste, wasteBox] = stat('Wasted');
    this.ext = ext;
    this.sol = sol;
    this.eff = eff;
    this.waste = waste;

    const resRows: HTMLElement[] = [];
    this.res = RESOURCE_ORDER.map((r) => {
      const name = h('span', { class: 'name', text: r });
      const bar = h('i');
      const meter = h('div', { class: 'meter', role: 'meter', 'aria-label': `${r} stock`, 'aria-valuemin': 0, 'aria-valuemax': 100 }, [bar]);
      const inEl = h('span', { class: 'p' });
      const outEl = h('span', { class: 'n' });
      const row = h('div', { class: 'res' }, [name, meter, h('span', { class: 'rate' }, [inEl, ' ', outEl])]);
      row.style.setProperty('--rc', `var(${resourceToken(r)})`);
      resRows.push(row);
      return { name, meter, bar, inEl, outEl };
    });

    const head = h('div', { class: 'fac-head' }, [
      h('div', { class: 'who' }, [this.name, this.native]),
      h('div', { class: 'ctl' }, [this.pill, this.select]),
    ]);
    const stats = h('div', { class: 'stats' }, [extBox, solBox, effBox, wasteBox]);
    this.root = h('article', { class: 'fac', 'aria-label': faction }, [head, stats, ...resRows]);
    this.root.style.setProperty('--c', `var(${factionToken(faction)})`);
    parent.append(this.root);
  }

  update(v: FactionCardView): void {
    setText(this.name, v.name);
    setAttr(this.root, 'aria-label', v.name);
    setAttr(this.select, 'aria-label', `${v.name} governor`);
    setText(this.native, v.nativeText);
    setText(this.pill, v.status.label);
    setClass(this.pill, `pill ${v.status.kind}`);
    if (this.select.value !== v.policyId && !isActive(this.select)) {
      // A governor the registry didn't list (e.g. set by a preset) still needs an option to show.
      if (![...this.select.options].some((o) => o.value === v.policyId)) {
        this.select.append(h('option', { value: v.policyId, text: v.policyId }));
      }
      this.select.value = v.policyId;
    }
    setText(this.ext, v.extractors);
    setText(this.sol, v.soldiers);
    setText(this.eff, v.efficiency);
    setText(this.waste, v.wasted);
    v.resources.forEach((r, i) => {
      const refs = this.res[i];
      if (!refs) return;
      setClass(refs.name, r.isNative ? 'name nat' : 'name');
      const pct = r.meterPct.toFixed(1);
      setStyle(refs.bar, 'width', `${pct}%`);
      setAttr(refs.meter, 'aria-valuenow', pct);
      setAttr(refs.meter, 'title', r.stockTitle);
      setText(refs.inEl, r.inText);
      setText(refs.outEl, r.outText);
    });
  }

  destroy(): void {
    this.root.remove();
  }
}
