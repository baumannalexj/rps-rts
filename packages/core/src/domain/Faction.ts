/** Mutable faction state inside the engine. Leaves the engine only as a FactionSnapshot. */
import type { FactionId, FactionSnapshot, PolicyId, ResourceBundle, ResourceId } from '@rps/contracts';
import { Bank } from './Bank.ts';
import { offNative, type FactionDefinition } from './Resources.ts';

export interface FactionInit {
  readonly policyId: PolicyId;
  readonly bank?: number | Partial<ResourceBundle>;
  readonly extractors?: number;
  readonly soldiers?: number;
}

/** Weight of the newest sample in the smoothed efficiency. */
const EFFICIENCY_SMOOTHING = 0.05;

export class Faction {
  readonly id: FactionId;
  readonly name: string;
  readonly native: ResourceId;
  readonly offNative: readonly ResourceId[];
  readonly bank: Bank;
  policyId: PolicyId;
  extractors: number;
  soldiers: number;
  efficiency = 1;
  efficiencyAvg = 1;
  wasted = 0;
  raidCooldown = 0;
  /** Total goods kept from raids / lost to raids. */
  looted = 0;
  lost = 0;
  private hasEfficiencySample = false;
  private readonly embargoes = new Map<FactionId, number>();

  constructor(def: FactionDefinition, init: FactionInit) {
    this.id = def.id;
    this.name = def.name;
    this.native = def.native;
    this.offNative = offNative(def.native);
    this.bank = new Bank(init.bank ?? 120);
    this.policyId = init.policyId;
    this.extractors = init.extractors ?? 3;
    this.soldiers = init.soldiers ?? 6;
  }

  /** Stores this tick's extractor efficiency and updates the smoothed average (first sample seeds it). */
  recordEfficiency(eff: number): void {
    this.efficiency = eff;
    this.efficiencyAvg = this.hasEfficiencySample
      ? this.efficiencyAvg * (1 - EFFICIENCY_SMOOTHING) + eff * EFFICIENCY_SMOOTHING
      : eff;
    this.hasEfficiencySample = true;
  }

  embargo(against: FactionId, ticks: number): void {
    if (ticks > 0) this.embargoes.set(against, ticks);
  }

  isEmbargoing(against: FactionId): boolean {
    return (this.embargoes.get(against) ?? 0) > 0;
  }

  /** End-of-tick countdowns: raid cooldown and embargo timers. */
  tickCooldowns(): void {
    if (this.raidCooldown > 0) this.raidCooldown--;
    for (const [k, v] of this.embargoes) {
      if (v - 1 <= 0) this.embargoes.delete(k);
      else this.embargoes.set(k, v - 1);
    }
  }

  toSnapshot(): FactionSnapshot {
    return {
      id: this.id,
      name: this.name,
      native: this.native,
      policyId: this.policyId,
      bank: this.bank.toBundle(),
      flows: this.bank.flows(),
      extractors: this.extractors,
      soldiers: this.soldiers,
      efficiency: this.efficiency,
      efficiencyAvg: this.efficiencyAvg,
      wasted: this.wasted,
      raidCooldown: this.raidCooldown,
      embargoes: [...this.embargoes].map(([against, ticksLeft]) => ({ against, ticksLeft })),
    };
  }
}
