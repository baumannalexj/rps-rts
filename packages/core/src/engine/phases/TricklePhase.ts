import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Input-free HQ trickle of native plus scavenged off-natives, so nobody dead-stops forever. */
export class TricklePhase implements TickPhase {
  readonly name = 'trickle';

  run(world: World): void {
    const cfg = world.config;
    for (const f of world.factions) {
      f.bank.deposit(f.native, cfg.hqRate);
      for (const r of f.offNative) f.bank.deposit(r, cfg.scavenge);
    }
  }
}
