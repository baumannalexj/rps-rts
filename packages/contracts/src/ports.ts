/**
 * Strategy ports (SPI). Each is a swappable adapter the engine calls into.
 * Implementations must be pure with respect to their inputs plus the given RandomSource,
 * so matches stay deterministic for a seed.
 */
import type { ContractId, FactionId, PolicyId } from './ids.ts';
import type { SimConfig } from './config.ts';
import type { FactionSnapshot, WorldSnapshot } from './snapshot.ts';
import type { Command } from './commands.ts';

export interface RandomSource {
  /** Uniform float in [0, 1). */
  next(): number;
}

export interface PolicyDescriptor {
  readonly id: PolicyId;
  readonly label: string;
  readonly description: string;
}

/** An AI governor (or a human-input shim). Called every `decisionInterval` ticks. */
export interface GovernorPolicy extends PolicyDescriptor {
  decide(ctx: GovernorContext): readonly Command[];
}

export interface GovernorContext {
  readonly self: FactionSnapshot;
  readonly world: WorldSnapshot;
  readonly rng: RandomSource;
}

export interface PolicyRegistry {
  get(id: PolicyId): GovernorPolicy;
  has(id: PolicyId): boolean;
  list(): readonly PolicyDescriptor[];
}

export interface PriceQuoteInput {
  readonly a: FactionSnapshot;
  readonly b: FactionSnapshot;
  readonly config: SimConfig;
}

/** Returns units of a.native per unit of b.native. */
export interface PricingModel {
  readonly id: string;
  quote(input: PriceQuoteInput): number;
}

export interface ContractTerms {
  readonly contractId: ContractId;
  readonly rateA: number;
  readonly rateB: number;
  readonly price: number;
}

/** Decides streaming rates for every contract. Returns only contracts whose terms change. */
export interface TradeNegotiator {
  readonly id: string;
  negotiate(world: WorldSnapshot, pricing: PricingModel): readonly ContractTerms[];
}

export interface CombatInput {
  readonly attacker: FactionSnapshot;
  readonly defender: FactionSnapshot;
  readonly config: SimConfig;
}

export interface CombatOutcome {
  readonly attackerWon: boolean;
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  /** Fraction of each defender stock taken, 0..1 (raider keeps config.raidEfficiency of it). */
  readonly lootFraction: number;
  readonly extractorsWrecked: number;
}

export interface CombatResolver {
  readonly id: string;
  /** Relative strength multiplier of attacker vs defender from faction matchup. */
  matchup(attacker: FactionId, defender: FactionId, config: SimConfig): number;
  resolve(input: CombatInput, rng: RandomSource): CombatOutcome;
}

/** Everything swappable in one bundle. Engine options take a Partial of this. */
export interface AdapterSet {
  readonly policies: PolicyRegistry;
  readonly pricing: PricingModel;
  readonly negotiator: TradeNegotiator;
  readonly combat: CombatResolver;
  readonly rngFactory: (seed: number) => RandomSource;
}
