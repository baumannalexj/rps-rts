import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Counts down raid cooldowns and embargo timers. */
export class CooldownPhase implements TickPhase {
  readonly name = 'cooldown';

  run(world: World): void {
    for (const f of world.factions) f.tickCooldowns();
  }
}
