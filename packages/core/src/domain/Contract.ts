/** A two-way streaming swap between two factions. */
import type { ContractId, ContractSnapshot, ContractStatus, FactionId } from '@rps/contracts';

/** Combined rate below which a contract counts as not flowing. */
export const MIN_LIVE_FLOW = 0.01;

export class Contract {
  readonly id: ContractId;
  readonly a: FactionId;
  readonly b: FactionId;
  /** Units/tick of a.native flowing a → b. */
  rateA = 0;
  /** Units/tick of b.native flowing b → a. */
  rateB = 0;
  price = 1;
  noticeTicksLeft = 0;

  constructor(a: FactionId, b: FactionId) {
    if (a === b) throw new Error('A contract needs two different factions');
    this.a = a;
    this.b = b;
    this.id = Contract.idFor(a, b);
  }

  static idFor(a: FactionId, b: FactionId): ContractId {
    return `${a}:${b}`;
  }

  involves(f: FactionId): boolean {
    return this.a === f || this.b === f;
  }

  get isFlowing(): boolean {
    return this.rateA > 0 || this.rateB > 0;
  }

  get inNotice(): boolean {
    return this.noticeTicksLeft > 0;
  }

  setTerms(rateA: number, rateB: number, price: number): void {
    this.rateA = Math.max(0, rateA);
    this.rateB = Math.max(0, rateB);
    this.price = price;
  }

  /**
   * Starts a cancellation wind-down if the contract is flowing and not already winding down.
   * With zero notice the contract ends at once. Returns true if anything changed.
   */
  cancel(noticeTicks: number): boolean {
    if (!this.isFlowing || this.inNotice) return false;
    if (noticeTicks <= 0) this.end();
    else this.noticeTicksLeft = Math.ceil(noticeTicks);
    return true;
  }

  /** Counts the notice down. Returns true on the tick the contract ends. */
  tickNotice(): boolean {
    if (this.noticeTicksLeft <= 0) return false;
    this.noticeTicksLeft--;
    if (this.noticeTicksLeft === 0) {
      this.end();
      return true;
    }
    return false;
  }

  private end(): void {
    this.rateA = 0;
    this.rateB = 0;
    this.noticeTicksLeft = 0;
  }

  status(embargoed: boolean): ContractStatus {
    if (this.inNotice) return 'winding-down';
    if (embargoed) return 'embargoed';
    if (this.rateA + this.rateB >= MIN_LIVE_FLOW) return 'live';
    return 'none';
  }

  toSnapshot(embargoed: boolean): ContractSnapshot {
    return {
      id: this.id,
      a: this.a,
      b: this.b,
      rateA: this.rateA,
      rateB: this.rateB,
      price: this.price,
      noticeTicksLeft: this.noticeTicksLeft,
      status: this.status(embargoed),
    };
  }
}
