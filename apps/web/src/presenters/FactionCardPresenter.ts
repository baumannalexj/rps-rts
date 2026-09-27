import type { FactionId, FactionSnapshot, ResourceId, SimConfig } from '@rps/contracts';
import { fmtCompact, fmtNum, fmtPercent } from './format.ts';
import { resourceToken } from './palette.ts';

export const RESOURCE_ORDER: readonly ResourceId[] = ['water', 'energy', 'carbon'];

export type StatusKind = 'ok' | 'low' | 'dead';

export interface StatusView {
  readonly kind: StatusKind;
  readonly label: 'Running' | 'Short' | 'Starved';
}

export interface ResourceRowView {
  readonly id: ResourceId;
  readonly isNative: boolean;
  readonly colorToken: string;
  /** 0..100 */
  readonly meterPct: number;
  readonly stockTitle: string;
  readonly inText: string;
  readonly outText: string;
}

export interface FactionCardView {
  readonly id: FactionId;
  readonly name: string;
  readonly nativeText: string;
  readonly status: StatusView;
  readonly policyId: string;
  readonly extractors: string;
  readonly soldiers: string;
  readonly efficiency: string;
  readonly wasted: string;
  readonly resources: readonly ResourceRowView[];
}

export const STATUS_OK_ABOVE = 0.75;
export const STATUS_SHORT_ABOVE = 0.3;

export function presentStatus(efficiencyAvg: number): StatusView {
  if (efficiencyAvg > STATUS_OK_ABOVE) return { kind: 'ok', label: 'Running' };
  if (efficiencyAvg > STATUS_SHORT_ABOVE) return { kind: 'low', label: 'Short' };
  return { kind: 'dead', label: 'Starved' };
}

export function meterPercent(stock: number, cap: number): number {
  if (!(cap > 0)) return 0;
  return Math.max(0, Math.min(100, (stock / cap) * 100));
}

export class FactionCardPresenter {
  present(faction: FactionSnapshot, config: SimConfig): FactionCardView {
    return {
      id: faction.id,
      name: faction.name,
      nativeText: `makes ${faction.native}`,
      status: presentStatus(faction.efficiencyAvg),
      policyId: faction.policyId,
      extractors: String(faction.extractors),
      soldiers: faction.soldiers.toFixed(0),
      efficiency: fmtPercent(faction.efficiencyAvg),
      wasted: fmtCompact(faction.wasted),
      resources: RESOURCE_ORDER.map((r) => {
        const flow = faction.flows[r];
        const stock = faction.bank[r];
        return {
          id: r,
          isNative: r === faction.native,
          colorToken: resourceToken(r),
          meterPct: meterPercent(stock, config.storageCap),
          stockTitle: `${r} stock ${stock.toFixed(0)} / ${config.storageCap}`,
          inText: `+${fmtNum(flow.in)}`,
          outText: `−${fmtNum(flow.out)}`,
        };
      }),
    };
  }
}
