import { ThresholdGovernor } from './ThresholdGovernor.ts';

/** Big army, thin trade margins, raids whenever it has a modest edge. */
export class WarlordPolicy extends ThresholdGovernor {
  constructor() {
    super({
      id: 'warlord',
      label: 'Warlord',
      description: 'Builds a big army and raids whenever it has a modest edge.',
      margin: 1.0,
      soldierBase: 16,
      soldierPerExt: 4.5,
      raidRatio: 1.25,
    });
  }
}
