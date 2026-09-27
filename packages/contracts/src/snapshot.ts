/** Immutable read models. The engine produces them; views and policies consume them. */
import type { ContractId, FactionId, PerFaction, PolicyId, ResourceBundle, ResourceId, Tick } from './ids.ts';
import type { SimConfig } from './config.ts';

export interface ResourceFlow {
  /** Units per tick received (production, trade, conversion, loot). */
  readonly in: number;
  /** Units per tick spent (inputs, trade, upkeep, conversion). */
  readonly out: number;
}

export interface FactionSnapshot {
  readonly id: FactionId;
  readonly name: string;
  readonly native: ResourceId;
  readonly policyId: PolicyId;
  readonly bank: ResourceBundle;
  readonly flows: Readonly<Record<ResourceId, ResourceFlow>>;
  readonly extractors: number;
  readonly soldiers: number;
  /** Extractor input satisfaction this tick, 0..1. */
  readonly efficiency: number;
  /** Smoothed efficiency, 0..1. Use for status displays. */
  readonly efficiencyAvg: number;
  /** Total units lost to storage overflow. */
  readonly wasted: number;
  readonly raidCooldown: number;
  /** Factions this one currently refuses to trade with. */
  readonly embargoes: ReadonlyArray<{ readonly against: FactionId; readonly ticksLeft: number }>;
}

export type ContractStatus = 'none' | 'live' | 'winding-down' | 'embargoed';

/** A two-way streaming swap: a sends a.native to b, b sends b.native to a. */
export interface ContractSnapshot {
  readonly id: ContractId;
  readonly a: FactionId;
  readonly b: FactionId;
  /** Units/tick of a's native flowing a → b. */
  readonly rateA: number;
  /** Units/tick of b's native flowing b → a. */
  readonly rateB: number;
  /** Units of a.native per unit of b.native at last negotiation. */
  readonly price: number;
  readonly noticeTicksLeft: number;
  readonly status: ContractStatus;
}

export type GameEventKind = 'trade' | 'raid' | 'embargo' | 'build' | 'system';

export interface GameEvent {
  readonly tick: Tick;
  readonly kind: GameEventKind;
  readonly text: string;
  readonly factions: readonly FactionId[];
}

export interface WorldSnapshot {
  readonly tick: Tick;
  readonly seed: number;
  readonly config: SimConfig;
  readonly factions: readonly FactionSnapshot[];
  readonly contracts: readonly ContractSnapshot[];
  /** Newest first, bounded length. */
  readonly events: readonly GameEvent[];
}

/** One row of time-series metrics, sampled by the runtime. */
export interface MetricsSample {
  readonly tick: Tick;
  readonly output: PerFaction<number>;
  readonly army: PerFaction<number>;
  readonly worth: PerFaction<number>;
  readonly contractFlow: Readonly<Record<ContractId, number>>;
}
