/** One step of the tick pipeline. Phases are swappable and testable on their own. */
import type { AdapterSet, Command, CommandResult, RandomSource, WorldSnapshot } from '@rps/contracts';
import type { World } from '../domain/World.ts';

export interface TickContext {
  readonly adapters: AdapterSet;
  readonly rng: RandomSource;
  /** Applies a command through the same validation path as external callers. */
  dispatch(command: Command): CommandResult;
  /** Snapshot of the world as it is right now (mid-tick). */
  snapshot(): WorldSnapshot;
}

export interface TickPhase {
  readonly name: string;
  run(world: World, ctx: TickContext): void;
}
