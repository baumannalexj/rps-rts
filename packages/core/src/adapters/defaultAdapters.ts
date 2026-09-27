import type { AdapterSet } from '@rps/contracts';
import { RpsCombatResolver } from './combat/RpsCombatResolver.ts';
import { MapPolicyRegistry } from './policies/MapPolicyRegistry.ts';
import { stanceLookupFrom } from './policies/TradeStance.ts';
import { ScarcityPricing } from './pricing/ScarcityPricing.ts';
import { mulberry32Factory } from './random/Mulberry32.ts';
import { BilateralNegotiator } from './trade/BilateralNegotiator.ts';

/** The standard adapter bundle. Each call returns fresh instances. */
export function defaultAdapters(): AdapterSet {
  const policies = MapPolicyRegistry.withDefaults();
  return {
    policies,
    pricing: new ScarcityPricing(),
    negotiator: new BilateralNegotiator(stanceLookupFrom(policies)),
    combat: new RpsCombatResolver(),
    rngFactory: mulberry32Factory,
  };
}
