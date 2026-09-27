/**
 * Price from scarcity: each side values a resource by 1 / (0.12 + fill). The price is the
 * geometric mean of both sides' exchange ratios, clamped to [1/cap, cap], where cap is the
 * self-production penalty (nobody pays more than making it themselves) or 6 if that is off.
 */
import type { FactionSnapshot, PriceQuoteInput, PricingModel, ResourceId, SimConfig } from '@rps/contracts';

export class ScarcityPricing implements PricingModel {
  readonly id = 'scarcity';

  static value(f: FactionSnapshot, r: ResourceId, config: SimConfig): number {
    return 1 / (0.12 + f.bank[r] / config.storageCap);
  }

  quote({ a, b, config }: PriceQuoteInput): number {
    const v = ScarcityPricing.value;
    const rA = v(a, b.native, config) / v(a, a.native, config);
    const rB = v(b, b.native, config) / v(b, a.native, config);
    const cap = config.selfProdOn ? config.selfPenalty : 6;
    return Math.max(1 / cap, Math.min(cap, Math.sqrt(rA * rB)));
  }
}
