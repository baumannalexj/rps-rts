import type { ControlBarView } from '../presenters/ControlBarPresenter.ts';
import { parseSeed, SPEEDS } from '../presenters/ControlBarPresenter.ts';
import { h, isActive, setAttr, setText } from './dom.ts';

export interface ControlBarCallbacks {
  onTogglePlay(): void;
  onStep(): void;
  onSpeed(ticksPerSecond: number): void;
  onRestart(seed: number): void;
}

export class ControlBar {
  readonly root: HTMLElement;
  private readonly play: HTMLButtonElement;
  private readonly speedButtons: readonly HTMLButtonElement[];
  private readonly seed: HTMLInputElement;
  private readonly clock: HTMLElement;
  private lastSeed: number | null = null;

  constructor(parent: HTMLElement, cb: ControlBarCallbacks) {
    this.play = h('button', { class: 'primary', type: 'button', text: 'Pause' });
    this.play.addEventListener('click', () => cb.onTogglePlay());
    const step = h('button', { type: 'button', title: 'Advance 10 ticks', 'aria-label': 'Advance 10 seconds', text: '+10s' });
    step.addEventListener('click', () => cb.onStep());

    this.speedButtons = SPEEDS.map((s) => {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': `Speed ${s.label}, ${s.ticksPerSecond} ticks per second`, text: s.label });
      b.addEventListener('click', () => cb.onSpeed(s.ticksPerSecond));
      return b;
    });
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Speed' }, this.speedButtons);

    this.seed = h('input', { id: 'seed', type: 'number', value: '42', inputmode: 'numeric' });
    const seedLabel = h('label', { class: 'inline', for: 'seed' }, ['Seed ', this.seed]);
    const restart = h('button', { type: 'button', text: 'Restart match' });
    restart.addEventListener('click', () => cb.onRestart(parseSeed(this.seed.value)));
    this.seed.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') cb.onRestart(parseSeed(this.seed.value));
    });

    this.clock = h('span', { text: '0:00' });
    const clockBox = h('div', { class: 'clock mono', role: 'timer', 'aria-label': 'Game time' }, [this.clock, h('small', { text: 'game time', 'aria-hidden': 'true' })]);

    const brand = h('div', { class: 'brand' }, [
      h('h1', { text: 'RPS Economy Sim' }),
      h('p', { text: 'Three factions, one resource triangle. Every income and cost is a flow per second.' }),
    ]);
    const ctrls = h('div', { class: 'ctrls' }, [this.play, step, seg, seedLabel, restart]);
    this.root = h('header', { class: 'bar' }, [brand, ctrls, clockBox]);
    parent.append(this.root);
  }

  /** Seed currently typed in the seed box. */
  seedValue(): number {
    return parseSeed(this.seed.value);
  }

  update(view: ControlBarView): void {
    setText(this.clock, view.clock);
    setText(this.play, view.playLabel);
    SPEEDS.forEach((s, i) => {
      const b = this.speedButtons[i];
      if (b) setAttr(b, 'aria-pressed', String(s.ticksPerSecond === view.activeSpeed));
    });
    // Reflect the match seed after restarts, but never overwrite what the user is typing.
    if (view.seed !== this.lastSeed && !isActive(this.seed)) {
      this.seed.value = String(view.seed);
      this.lastSeed = view.seed;
    }
  }

  destroy(): void {
    this.root.remove();
  }
}
