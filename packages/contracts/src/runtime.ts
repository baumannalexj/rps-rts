/**
 * Application port: the ONLY thing a view depends on.
 * Adapters: LocalSimulationPort (in-page, today), later a Web Worker port
 * or a WebSocket port talking to a server. The view never knows which.
 */
import type { FactionId, PolicyId } from './ids.ts';
import type { ConfigFieldDescriptor, SimConfig } from './config.ts';
import type { MetricsSample, WorldSnapshot } from './snapshot.ts';
import type { PolicyDescriptor } from './ports.ts';

export type Unsubscribe = () => void;

export interface ClockState {
  readonly running: boolean;
  /** Game ticks simulated per real second. */
  readonly ticksPerSecond: number;
}

export interface ResetOptions {
  readonly seed?: number;
  readonly policies?: Partial<Record<FactionId, PolicyId>>;
  /** Ticks to simulate immediately so charts have data. */
  readonly prewarmTicks?: number;
}

export interface SimulationPort {
  getSnapshot(): WorldSnapshot;
  /** Oldest first, bounded length. */
  getHistory(): readonly MetricsSample[];
  getClock(): ClockState;
  /** Called after state changes (at most once per animation frame). */
  subscribe(listener: () => void): Unsubscribe;

  play(): void;
  pause(): void;
  stepBy(ticks: number): void;
  setSpeed(ticksPerSecond: number): void;
  reset(options?: ResetOptions): void;

  updateConfig(patch: Partial<SimConfig>): void;
  setPolicy(faction: FactionId, policyId: PolicyId): void;

  listPolicies(): readonly PolicyDescriptor[];
  getConfigSchema(): readonly ConfigFieldDescriptor[];
}

/** Injected into runtime adapters so they're testable without real timers. */
export interface FrameScheduler {
  request(callback: (nowMs: number) => void): number;
  cancel(handle: number): void;
  now(): number;
}
