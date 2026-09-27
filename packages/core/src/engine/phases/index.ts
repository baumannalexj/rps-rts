import type { TickPhase } from '../TickPhase.ts';
import { CooldownPhase } from './CooldownPhase.ts';
import { GovernorPhase } from './GovernorPhase.ts';
import { NegotiationPhase } from './NegotiationPhase.ts';
import { ProductionPhase } from './ProductionPhase.ts';
import { SelfProductionPhase } from './SelfProductionPhase.ts';
import { StoragePhase } from './StoragePhase.ts';
import { TradeFlowPhase } from './TradeFlowPhase.ts';
import { TricklePhase } from './TricklePhase.ts';
import { UpkeepPhase } from './UpkeepPhase.ts';

export {
  CooldownPhase,
  GovernorPhase,
  NegotiationPhase,
  ProductionPhase,
  SelfProductionPhase,
  StoragePhase,
  TradeFlowPhase,
  TricklePhase,
  UpkeepPhase,
};

/** The standard tick pipeline, in order. */
export function defaultPhases(): TickPhase[] {
  return [
    new TradeFlowPhase(),
    new SelfProductionPhase(),
    new TricklePhase(),
    new ProductionPhase(),
    new UpkeepPhase(),
    new StoragePhase(),
    new CooldownPhase(),
    new GovernorPhase(),
    new NegotiationPhase(),
  ];
}
