/** @rps/core public API. */

// Engine
export { createEngine, resolveAdapters, DEFAULT_POLICIES } from './engine/createEngine.ts';
export { Engine, type EngineParts } from './engine/Engine.ts';
export type { TickContext, TickPhase } from './engine/TickPhase.ts';
export { defaultPhases } from './engine/phases/index.ts';

// Config
export { DEFAULT_CONFIG, CONFIG_SCHEMA, validateConfigPatch } from './config/defaults.ts';

// Adapters
export { defaultAdapters } from './adapters/defaultAdapters.ts';
export { Mulberry32, mulberry32Factory } from './adapters/random/Mulberry32.ts';
export { ScarcityPricing } from './adapters/pricing/ScarcityPricing.ts';
export { FixedPricing } from './adapters/pricing/FixedPricing.ts';
export { BilateralNegotiator } from './adapters/trade/BilateralNegotiator.ts';
export { RpsCombatResolver, type RpsCombatOptions } from './adapters/combat/RpsCombatResolver.ts';
export { ThresholdGovernor, type ThresholdGovernorParams } from './adapters/policies/ThresholdGovernor.ts';
export { MerchantPolicy } from './adapters/policies/MerchantPolicy.ts';
export { WarlordPolicy } from './adapters/policies/WarlordPolicy.ts';
export { BalancedPolicy } from './adapters/policies/BalancedPolicy.ts';
export { IdlePolicy } from './adapters/policies/IdlePolicy.ts';
export { MapPolicyRegistry } from './adapters/policies/MapPolicyRegistry.ts';
export {
  NEUTRAL_STANCE,
  hasTradeStance,
  stanceLookupFrom,
  type TradeStance,
  type TradeStanceLookup,
} from './adapters/policies/TradeStance.ts';

// Runtime
export { createLocalSimulationPort } from './runtime/createLocalSimulationPort.ts';
export { LocalSimulationPort, type LocalSimulationPortOptions } from './runtime/LocalSimulationPort.ts';
export { BrowserFrameScheduler } from './runtime/BrowserFrameScheduler.ts';
export { MetricsRecorder, type MetricsRecorderOptions } from './runtime/MetricsRecorder.ts';

// Domain constants
export {
  RESOURCES,
  FACTION_DEFINITIONS,
  FACTION_IDS,
  BEATS,
  matchupMultiplier,
  offNative,
  type FactionDefinition,
} from './domain/Resources.ts';
