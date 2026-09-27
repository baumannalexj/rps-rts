/**
 * Each pair renegotiates a two-way streaming swap. Every faction's native is an input the
 * other needs, so every pair has a mutual incentive. Contracts are processed in order and
 * later ones see the rates already agreed earlier in the same pass.
 */
import type {
  ContractTerms,
  FactionSnapshot,
  PricingModel,
  ResourceId,
  SimConfig,
  TradeNegotiator,
  WorldSnapshot,
} from '@rps/contracts';
import { NEUTRAL_STANCE, type TradeStance, type TradeStanceLookup } from '../policies/TradeStance.ts';

/** Relative change in a rate that is worth renegotiating. */
const CHANGE_THRESHOLD = 0.12;

export class BilateralNegotiator implements TradeNegotiator {
  readonly id = 'bilateral';
  private readonly stanceFor: TradeStanceLookup;

  constructor(stanceFor: TradeStanceLookup = () => NEUTRAL_STANCE) {
    this.stanceFor = stanceFor;
  }

  /** Units/tick of `r` this faction wants to receive. */
  want(f: FactionSnapshot, r: ResourceId, stance: TradeStance, config: SimConfig): number {
    let w = (config.inputNeed * f.extractors + config.upkeep * f.soldiers) * stance.tradeMargin;
    const fill = f.bank[r] / config.storageCap;
    if (fill < 0.4) w += ((0.4 - fill) * config.storageCap) / 60; // restock
    if (fill > 0.8) w *= 0.5;
    return w;
  }

  negotiate(world: WorldSnapshot, pricing: PricingModel): readonly ContractTerms[] {
    const config = world.config;
    const byId = new Map(world.factions.map((f) => [f.id, f]));
    const rates = world.contracts.map((c) => ({ a: c.a, b: c.b, rateA: c.rateA, rateB: c.rateB }));

    const spare = (f: FactionSnapshot, exclude: number): number => {
      let s =
        f.extractors * config.extractorRate * Math.max(f.efficiencyAvg, 0.25) * 0.85 +
        config.hqRate +
        Math.max(0, f.bank[f.native] - config.storageCap * 0.3) / 60;
      rates.forEach((c, i) => {
        if (i === exclude) return;
        if (c.a === f.id) s -= c.rateA;
        else if (c.b === f.id) s -= c.rateB;
      });
      return Math.max(0, s);
    };
    const embargoing = (f: FactionSnapshot, other: FactionSnapshot): boolean =>
      f.embargoes.some((e) => e.against === other.id && e.ticksLeft > 0);

    const out: ContractTerms[] = [];
    world.contracts.forEach((c, i) => {
      const cur = rates[i]!;
      if (c.noticeTicksLeft > 0) return;
      const A = byId.get(c.a);
      const B = byId.get(c.b);
      if (!A || !B) return;
      const sa = this.stanceFor(A.policyId);
      const sb = this.stanceFor(B.policyId);
      if (sa.passiveTrader && sb.passiveTrader) return;
      if (embargoing(A, B) || embargoing(B, A)) return;

      const price = pricing.quote({ a: A, b: B, config });
      if (!(price > 0) || !Number.isFinite(price)) return;
      // y: B.native flowing to A; x = y * price: A.native flowing to B.
      let y = Math.max(this.want(A, B.native, sa, config), this.want(B, A.native, sb, config) / price);
      y = Math.min(y, spare(B, i));
      let x = y * price;
      const sA = spare(A, i);
      if (x > sA) {
        x = sA;
        y = x / price;
      }
      if (sa.passiveTrader || sb.passiveTrader) {
        x = Math.min(x, cur.rateA);
        y = Math.min(y, cur.rateB);
      }
      const changed =
        Math.abs(x - cur.rateA) > CHANGE_THRESHOLD * Math.max(cur.rateA, 0.5) ||
        Math.abs(y - cur.rateB) > CHANGE_THRESHOLD * Math.max(cur.rateB, 0.5);
      if (changed) {
        cur.rateA = x;
        cur.rateB = y;
      }
      if (changed || price !== c.price) {
        out.push({ contractId: c.id, rateA: cur.rateA, rateB: cur.rateB, price });
      }
    });
    return out;
  }
}
