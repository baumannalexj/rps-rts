/** The deterministic simulation engine: a World, a pipeline of TickPhases and a CommandProcessor. */
import type { AdapterSet, Command, CommandResult, RandomSource, SimulationEngine, WorldSnapshot } from '@rps/contracts';
import type { World } from '../domain/World.ts';
import { CommandProcessor } from './CommandProcessor.ts';
import { defaultPhases } from './phases/index.ts';
import type { TickContext, TickPhase } from './TickPhase.ts';

export interface EngineParts {
  readonly world: World;
  readonly adapters: AdapterSet;
  readonly rng: RandomSource;
  readonly phases?: readonly TickPhase[];
}

export class Engine implements SimulationEngine {
  private readonly world: World;
  private readonly phases: readonly TickPhase[];
  private readonly commands: CommandProcessor;
  private readonly ctx: TickContext;

  constructor(parts: EngineParts) {
    this.world = parts.world;
    this.phases = parts.phases ?? defaultPhases();
    this.commands = new CommandProcessor(parts.world, parts.adapters, parts.rng);
    this.ctx = {
      adapters: parts.adapters,
      rng: parts.rng,
      dispatch: (command) => this.dispatch(command),
      snapshot: () => this.world.toSnapshot(),
    };
  }

  get tick(): number {
    return this.world.tick;
  }

  step(ticks = 1): void {
    const n = Math.max(0, Math.floor(ticks));
    for (let i = 0; i < n; i++) {
      this.world.tick++;
      for (const f of this.world.factions) f.bank.resetFlows();
      for (const phase of this.phases) phase.run(this.world, this.ctx);
    }
  }

  dispatch(command: Command): CommandResult {
    return this.commands.dispatch(command);
  }

  snapshot(): WorldSnapshot {
    return this.world.toSnapshot();
  }
}
