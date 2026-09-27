/** Prices of things a faction can buy, as per-resource amounts. */
import type { ResourceId, SimConfig } from '@rps/contracts';
import { offNative } from './Resources.ts';

export type Cost = Readonly<Partial<Record<ResourceId, number>>>;

function nativePlusEachOff(native: ResourceId, nativeAmount: number, eachOff: number): Cost {
  const cost: Partial<Record<ResourceId, number>> = { [native]: nativeAmount };
  for (const r of offNative(native)) cost[r] = eachOff;
  return cost;
}

/** One extractor: extractorCost native, 40% of that in each off-native. */
export function extractorCost(native: ResourceId, config: SimConfig): Cost {
  return nativePlusEachOff(native, config.extractorCost, config.extractorCost * 0.4);
}

/** `count` soldiers: soldierCost native each, plus 2 of each off-native each. */
export function soldierCost(native: ResourceId, count: number, config: SimConfig): Cost {
  return nativePlusEachOff(native, config.soldierCost * count, 2 * count);
}

/** Native amount plus the same amount of each off-native; handy for affordability checks. */
export function costOf(native: ResourceId, nativeAmount: number, eachOff: number): Cost {
  return nativePlusEachOff(native, nativeAmount, eachOff);
}
