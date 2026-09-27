/** The simulation engine: deterministic, headless, no timers, no DOM. */
import type { FactionId, PerFaction, PolicyId } from './ids.ts';
import type { SimConfig } from './config.ts';
import type { WorldSnapshot } from './snapshot.ts';
import type { Command, CommandResult } from './commands.ts';
import type { AdapterSet } from './ports.ts';

export interface EngineOptions {
  readonly seed: number;
  readonly config?: Partial<SimConfig>;
  readonly policies?: Partial<PerFaction<PolicyId>>;
  readonly adapters?: Partial<AdapterSet>;
}

export interface SimulationEngine {
  readonly tick: number;
  /** Advance one or more ticks. */
  step(ticks?: number): void;
  /** Apply a command immediately (validated). */
  dispatch(command: Command): CommandResult;
  /** Immutable view of the current world. Cheap enough to call every frame. */
  snapshot(): WorldSnapshot;
}

export type EngineFactory = (options: EngineOptions) => SimulationEngine;

export type { FactionId };
