/** Builds the whole screen's view model from a SimulationPort. Pure apart from reading the port. */
import type { FactionId, PolicyDescriptor, SimulationPort } from '@rps/contracts';
import type { ChartData } from '../charts/ChartData.ts';
import { ChartSeriesPresenter, CHART_SPECS, type ChartKey } from '../presenters/ChartSeriesPresenter.ts';
import { ContractRowPresenter, type ContractRowView } from '../presenters/ContractRowPresenter.ts';
import { presentControlBar, type ControlBarView } from '../presenters/ControlBarPresenter.ts';
import { EventLogPresenter, type EventLogView } from '../presenters/EventLogPresenter.ts';
import { FactionCardPresenter, type FactionCardView } from '../presenters/FactionCardPresenter.ts';
import { RulesPresenter, type RulesView } from '../presenters/RulesPresenter.ts';
import { FACTION_ORDER } from '../presenters/palette.ts';

export interface AppView {
  readonly controls: ControlBarView;
  readonly factions: readonly FactionCardView[];
  readonly charts: Readonly<Record<ChartKey, ChartData>>;
  readonly contracts: readonly ContractRowView[];
  readonly log: EventLogView;
  readonly rules: RulesView;
}

export interface StaticView {
  readonly policies: readonly PolicyDescriptor[];
  readonly factionIds: readonly FactionId[];
}

export class AppPresenter {
  readonly port: SimulationPort;
  private readonly cards = new FactionCardPresenter();
  private readonly rows = new ContractRowPresenter();
  private readonly log = new EventLogPresenter();
  private readonly chartSeries = new ChartSeriesPresenter();
  private readonly rules = new RulesPresenter();

  constructor(port: SimulationPort) {
    this.port = port;
  }

  presentStatic(): StaticView {
    const ids = this.port.getSnapshot().factions.map((f) => f.id);
    return {
      policies: this.port.listPolicies(),
      factionIds: ids.length > 0 ? sortFactions(ids) : [...FACTION_ORDER],
    };
  }

  present(): AppView {
    const snap = this.port.getSnapshot();
    const history = this.port.getHistory();
    const clock = this.port.getClock();
    const factions = [...snap.factions].sort((a, b) => FACTION_ORDER.indexOf(a.id) - FACTION_ORDER.indexOf(b.id));
    const charts = {} as Record<ChartKey, ChartData>;
    for (const spec of CHART_SPECS) {
      charts[spec.key] = this.chartSeries.present(spec.key, history, factions, snap.contracts);
    }
    return {
      controls: presentControlBar(clock, snap.tick, snap.seed),
      factions: factions.map((f) => this.cards.present(f, snap.config)),
      charts,
      contracts: this.rows.presentAll(snap.contracts, factions),
      log: this.log.present(snap.events),
      rules: this.rules.present(this.port.getConfigSchema(), snap.config),
    };
  }
}

function sortFactions(ids: readonly FactionId[]): FactionId[] {
  return [...ids].sort((a, b) => FACTION_ORDER.indexOf(a) - FACTION_ORDER.indexOf(b));
}
