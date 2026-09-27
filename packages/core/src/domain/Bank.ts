/** A faction's stockpile with per-tick flow accounting. */
import type { ResourceBundle, ResourceFlow, ResourceId } from '@rps/contracts';
import { RESOURCES, bundleOf } from './Resources.ts';
import type { Cost } from './Cost.ts';

export class Bank {
  private readonly stock: Record<ResourceId, number>;
  private readonly inflow: Record<ResourceId, number>;
  private readonly outflow: Record<ResourceId, number>;

  constructor(initial: number | Partial<ResourceBundle> = 0) {
    this.stock = bundleOf(initial);
    this.inflow = bundleOf(0);
    this.outflow = bundleOf(0);
  }

  get(r: ResourceId): number {
    return this.stock[r];
  }

  /** Sets a stock directly (no flow tracking). */
  set(r: ResourceId, amount: number): void {
    this.stock[r] = amount;
  }

  total(): number {
    let sum = 0;
    for (const r of RESOURCES) sum += this.stock[r];
    return sum;
  }

  /** Adds and records it as inflow this tick. */
  deposit(r: ResourceId, amount: number): void {
    this.stock[r] += amount;
    this.inflow[r] += amount;
  }

  /** Removes and records it as outflow this tick. Does not clamp; call clamp() at end of tick. */
  withdraw(r: ResourceId, amount: number): void {
    this.stock[r] -= amount;
    this.outflow[r] += amount;
  }

  resetFlows(): void {
    for (const r of RESOURCES) {
      this.inflow[r] = 0;
      this.outflow[r] = 0;
    }
  }

  /** Caps each stock at `cap` and floors at 0. Returns total overflow wasted. */
  clamp(cap: number): number {
    let wasted = 0;
    for (const r of RESOURCES) {
      if (this.stock[r] > cap) {
        wasted += this.stock[r] - cap;
        this.stock[r] = cap;
      }
      if (this.stock[r] < 0) this.stock[r] = 0;
    }
    return wasted;
  }

  canAfford(cost: Cost): boolean {
    for (const r of RESOURCES) {
      const need = cost[r];
      if (need !== undefined && this.stock[r] < need) return false;
    }
    return true;
  }

  /** Spends `cost` (untracked in flows, like the prototype). Returns false and changes nothing if unaffordable. */
  pay(cost: Cost): boolean {
    if (!this.canAfford(cost)) return false;
    for (const r of RESOURCES) {
      const need = cost[r];
      if (need !== undefined) this.stock[r] -= need;
    }
    return true;
  }

  toBundle(): ResourceBundle {
    return { water: this.stock.water, energy: this.stock.energy, carbon: this.stock.carbon };
  }

  flows(): Readonly<Record<ResourceId, ResourceFlow>> {
    const f = (r: ResourceId): ResourceFlow => ({ in: this.inflow[r], out: this.outflow[r] });
    return { water: f('water'), energy: f('energy'), carbon: f('carbon') };
  }
}
