import type { AdapterSet, FactionId, FrameScheduler, PolicyId, SimulationPort } from '@rps/contracts';
import { createEngine, resolveAdapters } from '../engine/createEngine.ts';
import { BrowserFrameScheduler } from './BrowserFrameScheduler.ts';
import { LocalSimulationPort } from './LocalSimulationPort.ts';

export function createLocalSimulationPort(
  options: {
    seed?: number;
    prewarmTicks?: number;
    scheduler?: FrameScheduler;
    policies?: Partial<Record<FactionId, PolicyId>>;
    adapters?: Partial<AdapterSet>;
  } = {},
): SimulationPort {
  // Resolve once so the engine and listPolicies() share the same registry across resets.
  const adapters = resolveAdapters(options.adapters);
  return new LocalSimulationPort({
    scheduler: options.scheduler ?? new BrowserFrameScheduler(),
    engineFactory: createEngine,
    policyRegistry: adapters.policies,
    seed: options.seed ?? 42,
    prewarmTicks: options.prewarmTicks ?? 240,
    adapters,
    ...(options.policies ? { policies: options.policies } : {}),
  });
}
