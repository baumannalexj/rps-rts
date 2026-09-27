import type { ContractSnapshot, FactionId, FactionSnapshot } from '@rps/contracts';
import { fmtNum, initial } from './format.ts';

export type ContractStatusClass = 'st-live' | 'st-wind' | 'st-none';

export interface ContractRowView {
  readonly id: string;
  readonly pair: string;
  readonly flowA: string;
  readonly flowB: string;
  readonly rate: string;
  readonly statusText: string;
  readonly statusClass: ContractStatusClass;
}

export function pairLabel(a: FactionSnapshot | undefined, b: FactionSnapshot | undefined, fallbackA: string, fallbackB: string): string {
  return `${initial(a?.name ?? fallbackA)}⇄${initial(b?.name ?? fallbackB)}`;
}

export class ContractRowPresenter {
  present(contract: ContractSnapshot, factions: ReadonlyMap<FactionId, FactionSnapshot>): ContractRowView {
    const a = factions.get(contract.a);
    const b = factions.get(contract.b);
    const { statusText, statusClass } = presentContractStatus(contract);
    return {
      id: contract.id,
      pair: pairLabel(a, b, contract.a, contract.b),
      flowA: `${fmtNum(contract.rateA)} ${initial(a?.native ?? '')}`.trimEnd(),
      flowB: `${fmtNum(contract.rateB)} ${initial(b?.native ?? '')}`.trimEnd(),
      rate: contract.price.toFixed(2),
      statusText,
      statusClass,
    };
  }

  presentAll(contracts: readonly ContractSnapshot[], factions: readonly FactionSnapshot[]): ContractRowView[] {
    const byId = new Map(factions.map((f) => [f.id, f] as const));
    return contracts.map((c) => this.present(c, byId));
  }
}

export function presentContractStatus(c: ContractSnapshot): { statusText: string; statusClass: ContractStatusClass } {
  switch (c.status) {
    case 'winding-down':
      return { statusText: `ends ${Math.ceil(c.noticeTicksLeft)}s`, statusClass: 'st-wind' };
    case 'embargoed':
      return { statusText: 'embargo', statusClass: 'st-wind' };
    case 'live':
      return { statusText: 'live', statusClass: 'st-live' };
    default:
      return { statusText: 'none', statusClass: 'st-none' };
  }
}
