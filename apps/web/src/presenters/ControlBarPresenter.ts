import type { ClockState } from '@rps/contracts';
import { fmtTime } from './format.ts';

export interface SpeedOption {
  readonly label: string;
  readonly ticksPerSecond: number;
}

export const SPEEDS: readonly SpeedOption[] = [
  { label: '1×', ticksPerSecond: 5 },
  { label: '4×', ticksPerSecond: 20 },
  { label: '16×', ticksPerSecond: 80 },
  { label: '64×', ticksPerSecond: 320 },
];

export const STEP_TICKS = 10;
export const DEFAULT_SEED = 42;

export interface ControlBarView {
  readonly clock: string;
  readonly playLabel: 'Play' | 'Pause';
  readonly running: boolean;
  /** ticksPerSecond of the pressed speed button, or null if the clock is at an off-menu speed. */
  readonly activeSpeed: number | null;
  readonly seed: number;
}

export function presentControlBar(clock: ClockState, tick: number, seed: number): ControlBarView {
  const match = SPEEDS.find((s) => s.ticksPerSecond === clock.ticksPerSecond);
  return {
    clock: fmtTime(tick),
    playLabel: clock.running ? 'Pause' : 'Play',
    running: clock.running,
    activeSpeed: match ? match.ticksPerSecond : null,
    seed,
  };
}

/** Parses the seed input the way the prototype did: non-numbers and 0 fall back to 1. */
export function parseSeed(raw: string): number {
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) && n !== 0 ? n : 1;
}
