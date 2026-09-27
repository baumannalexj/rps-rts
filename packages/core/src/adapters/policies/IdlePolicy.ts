import type { Command } from '@rps/contracts';
import { ThresholdGovernor } from './ThresholdGovernor.ts';

/** A player who left: takes no actions; existing contracts are honored but never grown. */
export class IdlePolicy extends ThresholdGovernor {
  constructor() {
    super({
      id: 'idle',
      label: 'Idle (player left)',
      description: 'Takes no actions. Existing contracts are honored but never grown.',
      margin: 1.0,
      soldierBase: 0,
      soldierPerExt: 0,
      raidRatio: Infinity,
      passiveTrader: true,
    });
  }

  override decide(): readonly Command[] {
    return [];
  }
}
