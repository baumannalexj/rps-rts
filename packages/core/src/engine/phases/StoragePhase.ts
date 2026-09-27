import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Caps stocks at storageCap (overflow is wasted) and floors them at zero. */
export class StoragePhase implements TickPhase {
  readonly name = 'storage';

  run(world: World): void {
    for (const f of world.factions) f.wasted += f.bank.clamp(world.config.storageCap);
  }
}
