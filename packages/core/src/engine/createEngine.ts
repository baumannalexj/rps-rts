/** EngineFactory: merges defaults with the given options and builds an Engine. */
import type { AdapterSet, EngineOptions, FactionId, PerFaction, PolicyId, SimulationEngine } from '@rps/contracts';
import { defaultAdapters } from '../adapters/defaultAdapters.ts';
import { stanceLookupFrom } from '../adapters/policies/TradeStance.ts';
import { BilateralNegotiator } from '../adapters/trade/BilateralNegotiator.ts';
import { DEFAULT_CONFIG, validateConfigPatch } from '../config/defaults.ts';
import { World } from '../domain/World.ts';
import { Engine } from './Engine.ts';

export const DEFAULT_POLICIES: PerFaction<PolicyId> = Object.freeze({
  paper: 'merchant',
  scissors: 'warlord',
  rock: 'balanced',
});

/** Fills missing adapters with defaults; a custom policy registry gets a negotiator that knows its stances. */
export function resolveAdapters(partial: Partial<AdapterSet> = {}): AdapterSet {
  const base = defaultAdapters();
  const policies = partial.policies ?? base.policies;
  return {
    policies,
    pricing: partial.pricing ?? base.pricing,
    negotiator:
      partial.negotiator ?? (partial.policies ? new BilateralNegotiator(stanceLookupFrom(policies)) : base.negotiator),
    combat: partial.combat ?? base.combat,
    rngFactory: partial.rngFactory ?? base.rngFactory,
  };
}

export function createEngine(options: EngineOptions): SimulationEngine {
  const adapters = resolveAdapters(options.adapters);
  const configError = validateConfigPatch(options.config ?? {});
  if (configError) throw new Error(configError);
  const policies: Record<FactionId, PolicyId> = { ...DEFAULT_POLICIES };
  for (const [id, policyId] of Object.entries(options.policies ?? {})) {
    if (policyId === undefined) continue;
    if (!adapters.policies.has(policyId)) throw new Error(`Unknown policy: ${policyId}`);
    policies[id as FactionId] = policyId;
  }
  const seed = options.seed >>> 0;
  const world = new World({ seed, config: { ...DEFAULT_CONFIG, ...definedOnly(options.config ?? {}) }, policies });
  return new Engine({ world, adapters, rng: adapters.rngFactory(seed) });
}

function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
