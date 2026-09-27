/**
 * Core-internal extension of GovernorPolicy: how a policy behaves at the negotiating table.
 * Kept out of @rps/contracts; negotiators receive a lookup function instead.
 */
import type { GovernorPolicy, PolicyId, PolicyRegistry } from '@rps/contracts';

export interface TradeStance {
  /** Multiplier on how much a faction asks for above its running needs. */
  readonly tradeMargin: number;
  /** Passive traders only honor or shrink existing contracts (e.g. a player who left). */
  readonly passiveTrader: boolean;
}

export type TradeStanceLookup = (policyId: PolicyId) => TradeStance;

export const NEUTRAL_STANCE: TradeStance = Object.freeze({ tradeMargin: 1, passiveTrader: false });

export function hasTradeStance(policy: GovernorPolicy): policy is GovernorPolicy & TradeStance {
  const p = policy as Partial<TradeStance>;
  return typeof p.tradeMargin === 'number' && typeof p.passiveTrader === 'boolean';
}

/** Builds a stance lookup from any registry; policies without a stance trade neutrally. */
export function stanceLookupFrom(registry: PolicyRegistry): TradeStanceLookup {
  return (policyId) => {
    if (!registry.has(policyId)) return NEUTRAL_STANCE;
    const policy = registry.get(policyId);
    return hasTradeStance(policy)
      ? { tradeMargin: policy.tradeMargin, passiveTrader: policy.passiveTrader }
      : NEUTRAL_STANCE;
  };
}
