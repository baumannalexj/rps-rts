/** SimulationPort that runs the engine in-page on a frame loop. */
import type {
  AdapterSet,
  ClockState,
  ConfigFieldDescriptor,
  EngineFactory,
  FactionId,
  FrameScheduler,
  MetricsSample,
  PolicyDescriptor,
  PolicyId,
  PolicyRegistry,
  ResetOptions,
  SimConfig,
  SimulationEngine,
  SimulationPort,
  Unsubscribe,
  WorldSnapshot,
} from '@rps/contracts';
import { CONFIG_SCHEMA } from '../config/defaults.ts';
import { MetricsRecorder } from './MetricsRecorder.ts';

export interface LocalSimulationPortOptions {
  readonly scheduler: FrameScheduler;
  readonly engineFactory: EngineFactory;
  /** Used for listPolicies(); should be the same registry the engine uses. */
  readonly policyRegistry: PolicyRegistry;
  readonly seed: number;
  readonly prewarmTicks: number;
  readonly policies?: Partial<Record<FactionId, PolicyId>>;
  readonly adapters?: Partial<AdapterSet>;
  readonly config?: Partial<SimConfig>;
  readonly ticksPerSecond?: number;
  readonly running?: boolean;
  readonly configSchema?: readonly ConfigFieldDescriptor[];
  /** Longest real frame gap honored, so a background tab doesn't cause a huge catch-up. */
  readonly maxFrameMs?: number;
}

export class LocalSimulationPort implements SimulationPort {
  private readonly scheduler: FrameScheduler;
  private readonly engineFactory: EngineFactory;
  private readonly policyRegistry: PolicyRegistry;
  private readonly adapters: Partial<AdapterSet> | undefined;
  private readonly configSchema: readonly ConfigFieldDescriptor[];
  private readonly maxFrameMs: number;
  private readonly listeners = new Set<() => void>();

  private engine: SimulationEngine;
  private recorder = new MetricsRecorder();
  private seed: number;
  private prewarmTicks: number;
  private running: boolean;
  private ticksPerSecond: number;
  private accumulator = 0;
  private lastFrameMs: number | null = null;
  private frameHandle: number | null = null;
  private dirty = false;
  private disposed = false;
  private cachedSnapshot: WorldSnapshot | null = null;
  private cachedHistory: readonly MetricsSample[] | null = null;

  constructor(options: LocalSimulationPortOptions) {
    this.scheduler = options.scheduler;
    this.engineFactory = options.engineFactory;
    this.policyRegistry = options.policyRegistry;
    this.adapters = options.adapters;
    this.configSchema = options.configSchema ?? CONFIG_SCHEMA;
    this.maxFrameMs = options.maxFrameMs ?? 250;
    this.seed = options.seed;
    this.prewarmTicks = options.prewarmTicks;
    this.running = options.running ?? true;
    this.ticksPerSecond = options.ticksPerSecond ?? 80;
    this.engine = this.build(options.seed, options.policies ?? {}, options.config ?? {});
    this.advance(this.prewarmTicks);
    this.scheduleFrame();
  }

  // ---- reads ----

  getSnapshot(): WorldSnapshot {
    this.cachedSnapshot ??= this.engine.snapshot();
    return this.cachedSnapshot;
  }

  getHistory(): readonly MetricsSample[] {
    this.cachedHistory ??= this.recorder.samples();
    return this.cachedHistory;
  }

  getClock(): ClockState {
    return { running: this.running, ticksPerSecond: this.ticksPerSecond };
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  listPolicies(): readonly PolicyDescriptor[] {
    return this.policyRegistry.list();
  }

  getConfigSchema(): readonly ConfigFieldDescriptor[] {
    return this.configSchema;
  }

  // ---- clock ----

  play(): void {
    if (this.running) return;
    this.running = true;
    this.accumulator = 0;
    this.markDirty();
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    this.accumulator = 0;
    this.markDirty();
  }

  stepBy(ticks: number): void {
    this.advance(ticks);
  }

  setSpeed(ticksPerSecond: number): void {
    if (!Number.isFinite(ticksPerSecond) || ticksPerSecond < 0) return;
    this.ticksPerSecond = ticksPerSecond;
    this.markDirty();
  }

  reset(options: ResetOptions = {}): void {
    const current = this.engine.snapshot();
    const policies: Partial<Record<FactionId, PolicyId>> = {};
    for (const f of current.factions) policies[f.id] = f.policyId;
    Object.assign(policies, options.policies);
    if (options.seed !== undefined) this.seed = options.seed;
    if (options.prewarmTicks !== undefined) this.prewarmTicks = options.prewarmTicks;
    this.engine = this.build(this.seed, policies, current.config);
    this.recorder = new MetricsRecorder();
    this.accumulator = 0;
    this.advance(this.prewarmTicks);
    this.markDirty();
  }

  // ---- commands ----

  updateConfig(patch: Partial<SimConfig>): void {
    const result = this.engine.dispatch({ type: 'update-config', patch });
    if (result.ok) this.markDirty();
  }

  setPolicy(faction: FactionId, policyId: PolicyId): void {
    const result = this.engine.dispatch({ type: 'set-policy', faction, policyId });
    if (result.ok) this.markDirty();
  }

  /** Stops the frame loop and drops listeners. */
  dispose(): void {
    this.disposed = true;
    if (this.frameHandle !== null) this.scheduler.cancel(this.frameHandle);
    this.frameHandle = null;
    this.listeners.clear();
  }

  // ---- internals ----

  private build(seed: number, policies: Partial<Record<FactionId, PolicyId>>, config: Partial<SimConfig>) {
    return this.engineFactory({
      seed,
      config,
      policies,
      ...(this.adapters ? { adapters: this.adapters } : {}),
    });
  }

  private advance(ticks: number): void {
    const n = Math.max(0, Math.floor(ticks));
    for (let i = 0; i < n; i++) {
      this.engine.step(1);
      if (this.recorder.shouldSample(this.engine.tick)) this.recorder.record(this.engine.snapshot());
    }
    if (n > 0) this.markDirty();
  }

  private markDirty(): void {
    this.dirty = true;
    this.cachedSnapshot = null;
    this.cachedHistory = null;
  }

  private scheduleFrame(): void {
    if (this.disposed) return;
    this.frameHandle = this.scheduler.request(this.onFrame);
  }

  private readonly onFrame = (nowMs: number): void => {
    this.frameHandle = null;
    if (this.disposed) return;
    const dtMs = this.lastFrameMs === null ? 0 : Math.max(0, Math.min(this.maxFrameMs, nowMs - this.lastFrameMs));
    this.lastFrameMs = nowMs;
    if (this.running) {
      this.accumulator += (dtMs / 1000) * this.ticksPerSecond;
      const ticks = Math.floor(this.accumulator);
      this.accumulator -= ticks;
      this.advance(ticks);
    }
    if (this.dirty) {
      this.dirty = false;
      for (const listener of [...this.listeners]) listener();
    }
    this.scheduleFrame();
  };
}
