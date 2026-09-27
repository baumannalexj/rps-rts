/** Always quotes the same price. Useful for experiments and tests. */
import type { PricingModel } from '@rps/contracts';

export class FixedPricing implements PricingModel {
  readonly id = 'fixed';
  readonly price: number;

  constructor(price = 1) {
    if (!(price > 0) || !Number.isFinite(price)) throw new Error('FixedPricing needs a positive finite price');
    this.price = price;
  }

  quote(): number {
    return this.price;
  }
}
