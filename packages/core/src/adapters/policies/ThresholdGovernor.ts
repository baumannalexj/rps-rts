/**
 * Rule-based governor: keep an army sized to the economy, grow extractors when inputs
 * allow, and raid the richest faction that is weak enough.
 */
import type {
  Command,
  FactionSnapshot,
  GovernorContext,
  GovernorPolicy,
  PolicyId,
  SimConfig,
} from '@rps/contracts';
import { costOf, extractorCost, soldierCost, type Cost } from '../../domain/Cost.ts';
import { bundleTotal, matchupMultiplier } from '../../domain/Resources.ts';
import type { TradeStance } from './TradeStance.ts';

export interface ThresholdGovernorParams {
  readonly id: PolicyId;
  readonly label: string;
  readonly description: string;
  /** Trade margin: how much above running needs the faction asks for. */
  readonly margin: number;
  readonly soldierBase: number;
  readonly soldierPerExt: number;
  /** Minimum attack/defense ratio before raiding. Infinity = never raid. */
  readonly raidRatio: number;
  readonly passiveTrader?: boolean;
  /** Soldiers trained per decision. */
  readonly batch?: number;
  /** Seconds of extractor input that must be in stock before building another. */
  readonly runwaySeconds?: number;
  /** Smoothed efficiency required before building another extractor. */
  readonly minEfficiencyToBuild?: number;
}

function canAfford(self: FactionSnapshot, cost: Cost): boolean {
  for (const [r, need] of Object.entries(cost)) {
    if (need !== undefined && self.bank[r as keyof FactionSnapshot['bank']] < need) return false;
  }
  return true;
}

export abstract class ThresholdGovernor implements GovernorPolicy, TradeStance {
  readonly id: PolicyId;
  readonly label: string;
  readonly description: string;
  readonly tradeMargin: number;
  readonly passiveTrader: boolean;
  readonly soldierBase: number;
  readonly soldierPerExt: number;
  readonly raidRatio: number;
  readonly batch: number;
  readonly runwaySeconds: number;
  readonly minEfficiencyToBuild: number;

  constructor(params: ThresholdGovernorParams) {
    this.id = params.id;
    this.label = params.label;
    this.description = params.description;
    this.tradeMargin = params.margin;
    this.passiveTrader = params.passiveTrader ?? false;
    this.soldierBase = params.soldierBase;
    this.soldierPerExt = params.soldierPerExt;
    this.raidRatio = params.raidRatio;
    this.batch = params.batch ?? 5;
    this.runwaySeconds = params.runwaySeconds ?? 45;
    this.minEfficiencyToBuild = params.minEfficiencyToBuild ?? 0.85;
  }

  decide(ctx: GovernorContext): readonly Command[] {
    const { self, world } = ctx;
    const config = world.config;
    const commands: Command[] = [];
    let soldiers = self.soldiers;

    const build = this.decideBuild(self, config);
    if (build) {
      commands.push(build);
      if (build.type === 'train-soldiers') soldiers += build.count;
    }
    const raid = this.decideRaid(ctx, soldiers);
    if (raid) commands.push(raid);
    return commands;
  }

  targetSoldiers(self: FactionSnapshot): number {
    return this.soldierBase + this.soldierPerExt * self.extractors;
  }

  protected decideBuild(self: FactionSnapshot, config: SimConfig): Command | null {
    if (self.soldiers < this.targetSoldiers(self) && canAfford(self, soldierCost(self.native, this.batch, config))) {
      return { type: 'train-soldiers', faction: self.id, count: this.batch };
    }
    const base = extractorCost(self.native, config);
    const eachOff = config.extractorCost * 0.4 + config.inputNeed * (self.extractors + 1) * this.runwaySeconds;
    const withRunway = costOf(self.native, base[self.native] ?? 0, eachOff);
    if (
      self.extractors < config.maxExtractors &&
      canAfford(self, withRunway) &&
      self.efficiencyAvg > this.minEfficiencyToBuild
    ) {
      return { type: 'build-extractor', faction: self.id };
    }
    return null;
  }

  protected decideRaid(ctx: GovernorContext, soldiers: number): Command | null {
    const { self, world } = ctx;
    const config = world.config;
    if (!config.raidsOn || world.tick < config.raidGrace || self.raidCooldown > 0) return null;
    if (!Number.isFinite(this.raidRatio)) return null;
    let best: FactionSnapshot | null = null;
    let bestScore = 0;
    for (const t of world.factions) {
      if (t.id === self.id) continue;
      const atk = soldiers * matchupMultiplier(self.id, t.id, config.rpsBonus);
      const def = t.soldiers * matchupMultiplier(t.id, self.id, config.rpsBonus) * 1.2 + 2;
      if (atk / def < this.raidRatio) continue;
      const score = bundleTotal(t.bank) * (atk / def);
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best ? { type: 'raid', faction: self.id, target: best.id } : null;
  }
}
