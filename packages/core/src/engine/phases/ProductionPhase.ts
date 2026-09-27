import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Extractors consume off-natives and produce native, at an efficiency limited by the scarcest input. */
export class ProductionPhase implements TickPhase {
  readonly name = 'production';

  run(world: World): void {
    const cfg = world.config;
    for (const f of world.factions) {
      const need = cfg.inputNeed * f.extractors;
      let eff = 1;
      if (need > 0) for (const r of f.offNative) eff = Math.min(eff, f.bank.get(r) / need);
      eff = Math.max(0, Math.min(1, eff));
      f.recordEfficiency(eff);
      for (const r of f.offNative) f.bank.withdraw(r, need * eff);
      f.bank.deposit(f.native, f.extractors * cfg.extractorRate * eff);
    }
  }
}
