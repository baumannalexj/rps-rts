import type { RulesView } from '../presenters/RulesPresenter.ts';
import type { PresetId, PresetSpec } from '../app/actions.ts';
import { h, isActive, setText } from './dom.ts';

export interface RulesPanelCallbacks {
  onNumber(key: string, raw: string): void;
  onToggle(key: string, checked: boolean): void;
  onPreset(id: PresetId): void;
}

interface KnobRefs {
  readonly input: HTMLInputElement;
  readonly output: HTMLOutputElement;
}

/** Controls are generated from the port's config schema on first update, then patched. */
export class RulesPanel {
  readonly root: HTMLElement;
  private readonly knobsHost: HTMLElement;
  private readonly togglesHost: HTMLElement;
  private readonly cb: RulesPanelCallbacks;
  private readonly knobs = new Map<string, KnobRefs>();
  private readonly toggles = new Map<string, HTMLInputElement>();
  private schemaKey = '';

  constructor(parent: HTMLElement, presets: readonly PresetSpec[], cb: RulesPanelCallbacks) {
    this.cb = cb;
    const presetButtons = presets.map((p) => {
      const b = h('button', { type: 'button', text: p.label });
      b.addEventListener('click', () => cb.onPreset(p.id));
      return b;
    });
    this.knobsHost = h('div', { class: 'knobs' });
    this.togglesHost = h('div', { class: 'toggles', role: 'group', 'aria-label': 'Rule toggles' });
    this.root = h('section', { class: 'box', 'aria-labelledby': 'rules-h' }, [
      h('div', { class: 'chart-head' }, [
        h('h2', { id: 'rules-h', text: 'Rules — change live' }),
        h('small', { text: 'Sliders apply to the running match. Restart to replay from tick 0.' }),
      ]),
      h('div', { class: 'presets', role: 'group', 'aria-label': 'Presets' }, presetButtons),
      this.knobsHost,
      this.togglesHost,
    ]);
    parent.append(this.root);
  }

  update(view: RulesView): void {
    const key = [...view.knobs.map((k) => k.key), '/', ...view.toggles.map((t) => t.key)].join(',');
    if (key !== this.schemaKey) this.build(view, key);
    for (const k of view.knobs) {
      const refs = this.knobs.get(k.key);
      if (!refs) continue;
      if (!isActive(refs.input) && Number(refs.input.value) !== k.value) refs.input.value = String(k.value);
      setText(refs.output, k.output);
    }
    for (const t of view.toggles) {
      const input = this.toggles.get(t.key);
      if (input && input.checked !== t.checked) input.checked = t.checked;
    }
  }

  private build(view: RulesView, key: string): void {
    this.schemaKey = key;
    this.knobs.clear();
    this.toggles.clear();
    this.knobsHost.replaceChildren(
      ...view.knobs.map((k) => {
        const id = `k-${k.key}`;
        const input = h('input', { id, type: 'range', min: k.min, max: k.max, step: k.step, value: k.value, 'aria-describedby': `${id}-hint` });
        const output = h('output', { for: id, text: k.output });
        input.addEventListener('input', () => this.cb.onNumber(k.key, input.value));
        this.knobs.set(k.key, { input, output });
        return h('div', { class: 'knob' }, [
          h('label', { for: id, text: k.label }),
          output,
          input,
          h('span', { class: 'hint', id: `${id}-hint`, text: k.hint }),
        ]);
      }),
    );
    this.togglesHost.replaceChildren(
      ...view.toggles.map((t) => {
        const id = `t-${t.key}`;
        const input = h('input', { id, type: 'checkbox', checked: t.checked });
        input.addEventListener('change', () => this.cb.onToggle(t.key, input.checked));
        this.toggles.set(t.key, input);
        return h('label', { for: id, title: t.hint }, [input, ` ${t.label}`]);
      }),
    );
  }

  destroy(): void {
    this.root.remove();
  }
}
