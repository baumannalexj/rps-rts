import type { TickContext, TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Every `interval` ticks the negotiator re-prices and re-sizes contracts. */
export class NegotiationPhase implements TickPhase {
  readonly name = 'negotiation';
  readonly interval: number;

  constructor(interval = 10) {
    this.interval = interval;
  }

  run(world: World, ctx: TickContext): void {
    if (!world.config.tradeOn || world.tick % this.interval !== 0) return;
    const terms = ctx.adapters.negotiator.negotiate(ctx.snapshot(), ctx.adapters.pricing);
    for (const t of terms) {
      const c = world.contracts.find((x) => x.id === t.contractId);
      if (!c || c.inNotice || world.isEmbargoed(c)) continue;
      if (![t.rateA, t.rateB, t.price].every(Number.isFinite)) continue;
      const wasZero = c.rateA + c.rateB < 0.01;
      c.setTerms(t.rateA, t.rateB, t.price);
      if (wasZero && c.rateA + c.rateB > 0.05) {
        const A = world.faction(c.a);
        const B = world.faction(c.b);
        world.record(
          'trade',
          `${A.name}⇄${B.name} contract: ${c.rateA.toFixed(1)} ${A.native}/s for ${c.rateB.toFixed(1)} ${B.native}/s`,
          [A.id, B.id],
        );
      }
    }
  }
}
