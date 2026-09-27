import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Share of the unpaid fraction of the army that deserts each tick. */
export const DESERTION_RATE = 0.02;

/** Soldiers eat off-natives; any shortfall makes some of them desert. */
export class UpkeepPhase implements TickPhase {
  readonly name = 'upkeep';

  run(world: World): void {
    const cfg = world.config;
    for (const f of world.factions) {
      const up = cfg.upkeep * f.soldiers;
      let paid = 1;
      if (up > 0) for (const r of f.offNative) paid = Math.min(paid, f.bank.get(r) / up);
      paid = Math.max(0, Math.min(1, paid));
      for (const r of f.offNative) f.bank.withdraw(r, up * paid);
      if (paid < 1 && f.soldiers > 0) {
        f.soldiers = Math.max(0, f.soldiers - f.soldiers * (1 - paid) * DESERTION_RATE);
      }
    }
  }
}
