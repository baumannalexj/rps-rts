import type { ContractSnapshot, FactionId, FactionSnapshot, MetricsSample } from '@rps/contracts';
import type { ChartData, ChartSeries } from '../charts/ChartData.ts';
import { contractLineStyle, FACTION_ORDER, factionToken } from './palette.ts';
import { pairLabel } from './ContractRowPresenter.ts';

export type FactionChartKey = 'output' | 'army' | 'worth';
export type ChartKey = FactionChartKey | 'contractFlow';

export interface ChartSpec {
  readonly key: ChartKey;
  readonly title: string;
  readonly unit: string;
}

export const CHART_SPECS: readonly ChartSpec[] = [
  { key: 'output', title: 'Native output', unit: 'units / s' },
  { key: 'army', title: 'Army', unit: 'soldiers' },
  { key: 'worth', title: 'Net worth', unit: 'stock + extractors' },
  { key: 'contractFlow', title: 'Contract flow', unit: 'units / s, both directions' },
];

export class ChartSeriesPresenter {
  factionSeries(
    history: readonly MetricsSample[],
    key: FactionChartKey,
    factions: readonly FactionSnapshot[],
  ): ChartData {
    const ids = orderedFactionIds(factions);
    const names = new Map(factions.map((f) => [f.id, f.name] as const));
    const series: ChartSeries[] = ids.map((id) => ({
      id,
      label: names.get(id) ?? id,
      colorToken: factionToken(id),
      dash: [],
      values: history.map((h) => h[key][id] ?? 0),
    }));
    return { times: history.map((h) => h.tick), series };
  }

  contractSeries(
    history: readonly MetricsSample[],
    contracts: readonly ContractSnapshot[],
    factions: readonly FactionSnapshot[],
  ): ChartData {
    const byId = new Map(factions.map((f) => [f.id, f] as const));
    const known = new Set(contracts.map((c) => c.id));
    const series: ChartSeries[] = contracts.map((c, i) => {
      const style = contractLineStyle(c.id, c.a, c.b, i);
      return {
        id: c.id,
        label: pairLabel(byId.get(c.a), byId.get(c.b), c.a, c.b),
        colorToken: style.colorToken,
        dash: style.dash,
        values: history.map((h) => h.contractFlow[c.id] ?? 0),
      };
    });
    // Contracts that appear in history but not in the snapshot (should be rare) still get a line.
    const last = history[history.length - 1];
    if (last) {
      for (const id of Object.keys(last.contractFlow)) {
        if (known.has(id)) continue;
        const style = contractLineStyle(id, 'paper', 'paper', series.length);
        series.push({ id, label: id, colorToken: style.colorToken, dash: style.dash, values: history.map((h) => h.contractFlow[id] ?? 0) });
      }
    }
    return { times: history.map((h) => h.tick), series };
  }

  present(
    key: ChartKey,
    history: readonly MetricsSample[],
    factions: readonly FactionSnapshot[],
    contracts: readonly ContractSnapshot[],
  ): ChartData {
    return key === 'contractFlow'
      ? this.contractSeries(history, contracts, factions)
      : this.factionSeries(history, key, factions);
  }
}

function orderedFactionIds(factions: readonly FactionSnapshot[]): FactionId[] {
  if (factions.length === 0) return [...FACTION_ORDER];
  return [...factions].sort((a, b) => FACTION_ORDER.indexOf(a.id) - FACTION_ORDER.indexOf(b.id)).map((f) => f.id);
}
