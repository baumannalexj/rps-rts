/** Pure scale and tick math for the canvas charts. */

/** Rounds up to 1, 2, 2.5, 5 or 10 times a power of ten. Non-positive input gives 1. */
export function niceMax(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 1;
  const p = 10 ** Math.floor(Math.log10(value));
  const n = value / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

export class LinearScale {
  readonly d0: number;
  readonly d1: number;
  readonly r0: number;
  readonly r1: number;

  constructor(d0: number, d1: number, r0: number, r1: number) {
    this.d0 = d0;
    this.d1 = d1 === d0 ? d0 + 1 : d1;
    this.r0 = r0;
    this.r1 = r1;
  }

  map(v: number): number {
    return this.r0 + ((v - this.d0) / (this.d1 - this.d0)) * (this.r1 - this.r0);
  }

  invert(r: number): number {
    return this.d0 + ((r - this.r0) / (this.r1 - this.r0)) * (this.d1 - this.d0);
  }
}

/** Evenly spaced values 0..max inclusive (count intervals). */
export function valueTicks(max: number, count = 4): number[] {
  const out: number[] = [];
  for (let k = 0; k <= count; k++) out.push((max * k) / count);
  return out;
}

const TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

/** A whole-second step that reads well on an m:ss axis, at least `raw`. */
export function niceTimeStep(raw: number): number {
  for (const s of TIME_STEPS) if (s >= raw) return s;
  return Math.ceil(raw / 3600) * 3600;
}

/** Tick positions (game seconds) across [t0, t1], about `target` of them. */
export function timeTicks(t0: number, t1: number, target = 5): number[] {
  const span = Math.max(1, t1 - t0);
  const step = niceTimeStep(span / target);
  const out: number[] = [];
  for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) out.push(t);
  return out;
}

/** Index of the time nearest to `t` in an ascending list; -1 when empty. */
export function nearestIndex(times: readonly number[], t: number): number {
  if (times.length === 0) return -1;
  let lo = 0;
  let hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((times[mid] ?? 0) <= t) lo = mid;
    else hi = mid;
  }
  const a = times[lo] ?? 0;
  const b = times[hi] ?? 0;
  return Math.abs(t - a) <= Math.abs(b - t) ? lo : hi;
}
