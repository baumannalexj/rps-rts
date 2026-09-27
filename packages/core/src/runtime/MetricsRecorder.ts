/** Samples world snapshots into a bounded time series for charts. */
import type { ContractId, FactionId, MetricsSample, WorldSnapshot } from '@rps/contracts';
import { bundleTotal } from '../domain/Resources.ts';

export interface MetricsRecorderOptions {
  /** Sample every N ticks. */
  readonly interval?: number;
  /** Max samples kept; oldest are dropped. */
  readonly capacity?: number;
}

export class MetricsRecorder {
  readonly interval: number;
  readonly capacity: number;
  private readonly rows: MetricsSample[] = [];
  private lastTick = -Infinity;

  constructor(options: MetricsRecorderOptions = {}) {
    this.interval = Math.max(1, Math.floor(options.interval ?? 2));
    this.capacity = Math.max(1, Math.floor(options.capacity ?? 1500));
  }

  static sample(world: WorldSnapshot): MetricsSample {
    const cfg = world.config;
    const output = {} as Record<FactionId, number>;
    const army = {} as Record<FactionId, number>;
    const worth = {} as Record<FactionId, number>;
    for (const f of world.factions) {
      output[f.id] = f.extractors * cfg.extractorRate * f.efficiency;
      army[f.id] = f.soldiers;
      worth[f.id] = bundleTotal(f.bank) + f.extractors * cfg.extractorCost * 1.8;
    }
    const contractFlow: Record<ContractId, number> = {};
    for (const c of world.contracts) contractFlow[c.id] = c.rateA + c.rateB;
    return { tick: world.tick, output, army, worth, contractFlow };
  }

  /** True when `tick` falls on the sampling interval and hasn't been sampled yet. */
  shouldSample(tick: number): boolean {
    return tick % this.interval === 0 && tick !== this.lastTick;
  }

  /** Records a sample if the snapshot's tick is due. Returns whether it recorded. */
  record(world: WorldSnapshot): boolean {
    if (!this.shouldSample(world.tick)) return false;
    this.rows.push(Object.freeze(MetricsRecorder.sample(world)));
    this.lastTick = world.tick;
    if (this.rows.length > this.capacity) this.rows.splice(0, this.rows.length - this.capacity);
    return true;
  }

  /** Oldest first. A copy. */
  samples(): readonly MetricsSample[] {
    return this.rows.slice();
  }

  get size(): number {
    return this.rows.length;
  }

  clear(): void {
    this.rows.length = 0;
    this.lastTick = -Infinity;
  }
}
