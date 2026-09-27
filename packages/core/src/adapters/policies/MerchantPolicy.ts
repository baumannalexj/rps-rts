import { ThresholdGovernor } from './ThresholdGovernor.ts';

/** Trades generously, keeps a small guard, never raids. */
export class MerchantPolicy extends ThresholdGovernor {
  constructor() {
    super({
      id: 'merchant',
      label: 'Merchant',
      description: 'Trades generously, keeps a small guard and never raids.',
      margin: 1.35,
      soldierBase: 4,
      soldierPerExt: 0.8,
      raidRatio: Infinity,
    });
  }
}
