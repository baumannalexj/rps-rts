/** Small, fast, seedable PRNG (mulberry32). Deterministic for a given seed. */
import type { RandomSource } from '@rps/contracts';

export class Mulberry32 implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export const mulberry32Factory = (seed: number): RandomSource => new Mulberry32(seed);
