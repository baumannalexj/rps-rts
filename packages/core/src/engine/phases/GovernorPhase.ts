import type { TickContext, TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/**
 * Each faction's governor decides every `interval` ticks, staggered by faction index so
 * they don't all act on the same tick. Commands go through the engine's dispatch.
 */
export class GovernorPhase implements TickPhase {
  readonly name = 'governor';
  readonly interval: number;
  readonly stagger: number;

  constructor(interval = 10, stagger = 3) {
    this.interval = interval;
    this.stagger = stagger;
  }

  run(world: World, ctx: TickContext): void {
    world.factions.forEach((f, i) => {
      if ((world.tick + i * this.stagger) % this.interval !== 0) return;
      if (!ctx.adapters.policies.has(f.policyId)) return;
      const policy = ctx.adapters.policies.get(f.policyId);
      const snap = ctx.snapshot();
      const self = snap.factions.find((s) => s.id === f.id);
      if (!self) return;
      for (const command of policy.decide({ self, world: snap, rng: ctx.rng })) {
        // Governors may only act for their own faction.
        if ('faction' in command && command.faction !== f.id) continue;
        if (command.type === 'update-config') continue;
        ctx.dispatch(command);
      }
    });
  }
}
