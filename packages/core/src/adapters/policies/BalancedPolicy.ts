import { ThresholdGovernor } from './ThresholdGovernor.ts';

/** Moderate army and trade; raids only with a clear 2:1 edge. */
export class BalancedPolicy extends ThresholdGovernor {
  constructor() {
    super({
      id: 'balanced',
      label: 'Balanced',
      description: 'Moderate army and trade; raids only with a clear 2:1 edge.',
      margin: 1.15,
      soldierBase: 8,
      soldierPerExt: 2.0,
      raidRatio: 2.0,
    });
  }
}
