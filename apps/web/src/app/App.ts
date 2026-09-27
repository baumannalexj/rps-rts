/** Wires components to the SimulationPort. Subscribes once and fans each frame out to components. */
import type { FactionId, SimulationPort } from '@rps/contracts';
import { AppActions, PRESETS } from './actions.ts';
import { AppPresenter } from './AppPresenter.ts';
import { CHART_SPECS } from '../presenters/ChartSeriesPresenter.ts';
import { RulesPresenter } from '../presenters/RulesPresenter.ts';
import { ThemeReader } from '../theme/readTheme.ts';
import { ControlBar } from '../components/ControlBar.ts';
import { FactionCard } from '../components/FactionCard.ts';
import { ChartPanel } from '../components/ChartPanel.ts';
import { ContractsTable } from '../components/ContractsTable.ts';
import { EventLog } from '../components/EventLog.ts';
import { RulesPanel } from '../components/RulesPanel.ts';
import { h } from '../components/dom.ts';

export interface MountedApp {
  destroy(): void;
}

export function mountApp(root: HTMLElement, port: SimulationPort): MountedApp {
  const actions = new AppActions(port);
  const presenter = new AppPresenter(port);
  const rules = new RulesPresenter();
  const theme = new ThemeReader();
  const initial = presenter.presentStatic();

  const wrap = h('div', { class: 'wrap' });
  root.replaceChildren(wrap);

  const controls = new ControlBar(wrap, {
    onTogglePlay: () => actions.togglePlay(),
    onStep: () => actions.step(),
    onSpeed: (tps) => actions.setSpeed(tps),
    onRestart: (seed) => actions.restart(seed),
  });

  const factionsHost = h('section', { class: 'factions', 'aria-label': 'Factions' });
  wrap.append(factionsHost);
  const cards = new Map<FactionId, FactionCard>();
  for (const id of initial.factionIds) {
    cards.set(id, new FactionCard(factionsHost, id, initial.policies, {
      onPolicyChange: (f, policy) => actions.setPolicy(f, policy),
    }));
  }

  const chartsHost = h('section', { class: 'charts', 'aria-label': 'Charts' });
  const side = h('aside', { class: 'side' });
  wrap.append(h('div', { class: 'main' }, [chartsHost, side]));
  const charts = CHART_SPECS.map((spec) => ({ key: spec.key, panel: new ChartPanel(chartsHost, spec, theme) }));
  const contracts = new ContractsTable(side);
  const log = new EventLog(side);

  const rulesPanel = new RulesPanel(wrap, PRESETS, {
    onNumber: (key, raw) => {
      const patch = rules.patchFor(port.getConfigSchema(), key, raw);
      if (patch) actions.updateConfig(patch);
    },
    onToggle: (key, checked) => {
      const patch = rules.patchFor(port.getConfigSchema(), key, checked);
      if (patch) actions.updateConfig(patch);
    },
    onPreset: (id) => actions.applyPreset(id, controls.seedValue()),
  });

  const render = (): void => {
    const view = presenter.present();
    controls.update(view.controls);
    for (const card of view.factions) cards.get(card.id)?.update(card);
    for (const c of charts) c.panel.update(view.charts[c.key]);
    contracts.update(view.contracts);
    log.update(view.log);
    rulesPanel.update(view.rules);
  };

  const unsubscribe = port.subscribe(render);
  const offTheme = theme.onChange(() => charts.forEach((c) => c.panel.chart.draw()));
  render();

  return {
    destroy(): void {
      unsubscribe();
      offTheme();
      theme.destroy();
      controls.destroy();
      cards.forEach((c) => c.destroy());
      charts.forEach((c) => c.panel.destroy());
      contracts.destroy();
      log.destroy();
      rulesPanel.destroy();
      wrap.remove();
    },
  };
}
