/** Rock-paper-scissors raid combat, as in the prototype. */
import type { CombatInput, CombatOutcome, CombatResolver, FactionId, RandomSource, SimConfig } from '@rps/contracts';
import { matchupMultiplier } from '../../domain/Resources.ts';

export interface RpsCombatOptions {
  /** Defender strength multiplier (home advantage). */
  readonly defenderBonus?: number;
  /** Flat defense added on top of soldiers (walls, militia). */
  readonly baseDefense?: number;
  /** Attack roll varies uniformly in [1 - variance, 1 + variance]. */
  readonly variance?: number;
  /** Share of attackers lost at ratio 0 (scaled by 1 - ratio). */
  readonly attackerLossRate?: number;
  /** Share of defenders lost at ratio 1 (scaled by ratio). */
  readonly defenderLossRate?: number;
  /** Share of each defender stock taken at ratio 1 (scaled by ratio). */
  readonly lootRate?: number;
  /** Ratio above which one extractor is wrecked (defender keeps at least one). */
  readonly wreckRatio?: number;
}

export class RpsCombatResolver implements CombatResolver {
  readonly id = 'rps';
  readonly defenderBonus: number;
  readonly baseDefense: number;
  readonly variance: number;
  readonly attackerLossRate: number;
  readonly defenderLossRate: number;
  readonly lootRate: number;
  readonly wreckRatio: number;

  constructor(options: RpsCombatOptions = {}) {
    this.defenderBonus = options.defenderBonus ?? 1.2;
    this.baseDefense = options.baseDefense ?? 2;
    this.variance = options.variance ?? 0.15;
    this.attackerLossRate = options.attackerLossRate ?? 0.35;
    this.defenderLossRate = options.defenderLossRate ?? 0.45;
    this.lootRate = options.lootRate ?? 0.35;
    this.wreckRatio = options.wreckRatio ?? 0.65;
  }

  matchup(attacker: FactionId, defender: FactionId, config: SimConfig): number {
    return matchupMultiplier(attacker, defender, config.rpsBonus);
  }

  /** Defense strength of `defender` against `attacker`, before any roll. */
  defense(input: CombatInput): number {
    const { attacker, defender, config } = input;
    return defender.soldiers * this.matchup(defender.id, attacker.id, config) * this.defenderBonus + this.baseDefense;
  }

  resolve(input: CombatInput, rng: RandomSource): CombatOutcome {
    const { attacker, defender, config } = input;
    const roll = 1 - this.variance + rng.next() * 2 * this.variance;
    const atk = attacker.soldiers * this.matchup(attacker.id, defender.id, config) * roll;
    const def = this.defense(input);
    const ratio = atk + def > 0 ? atk / (atk + def) : 0;
    const attackerWon = ratio > 0.5;
    return {
      attackerWon,
      attackerLosses: attacker.soldiers * this.attackerLossRate * (1 - ratio),
      defenderLosses: defender.soldiers * this.defenderLossRate * ratio,
      lootFraction: attackerWon ? this.lootRate * ratio : 0,
      extractorsWrecked: attackerWon && ratio > this.wreckRatio && defender.extractors > 1 ? 1 : 0,
    };
  }
}
