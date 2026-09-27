import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Fill level below which the converter kicks in. */
export const SELF_PRODUCTION_THRESHOLD = 0.15;

/** Converts native into a running-low off-native resource at a loss (selfPenalty : 1). */
export class SelfProductionPhase implements TickPhase {
  readonly name = 'self-production';

  run(world: World): void {
    const cfg = world.config;
    if (!cfg.selfProdOn) return;
    for (const f of world.factions) {
      for (const r of f.offNative) {
        if (f.bank.get(r) / cfg.storageCap >= SELF_PRODUCTION_THRESHOLD) continue;
        const make = Math.min(cfg.converterRate, f.bank.get(f.native) / cfg.selfPenalty);
        if (make > 0) {
          f.bank.withdraw(f.native, make * cfg.selfPenalty);
          f.bank.deposit(r, make);
        }
      }
    }
  }
}
