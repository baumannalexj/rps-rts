import type { TickPhase } from '../TickPhase.ts';
import type { World } from '../../domain/World.ts';

/** Streams goods along every contract (limited by what the sender holds) and counts down notices. */
export class TradeFlowPhase implements TickPhase {
  readonly name = 'trade-flow';

  run(world: World): void {
    if (!world.config.tradeOn) return;
    for (const c of world.contracts) {
      const A = world.faction(c.a);
      const B = world.faction(c.b);
      if (c.tickNotice()) world.record('trade', `${A.name}–${B.name} contract ended`, [A.id, B.id]);
      const sendA = Math.min(c.rateA, A.bank.get(A.native));
      const sendB = Math.min(c.rateB, B.bank.get(B.native));
      A.bank.withdraw(A.native, sendA);
      B.bank.deposit(A.native, sendA);
      B.bank.withdraw(B.native, sendB);
      A.bank.deposit(B.native, sendB);
    }
  }
}
