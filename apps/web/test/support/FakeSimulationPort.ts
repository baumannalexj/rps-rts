/** In-memory SimulationPort for tests: canned snapshot + history, records every call. */
import type {
  ClockState,
  ConfigFieldDescriptor,
  ContractSnapshot,
  FactionId,
  FactionSnapshot,
  MetricsSample,
  PolicyDescriptor,
  PolicyId,
  ResetOptions,
  ResourceId,
  SimConfig,
  SimulationPort,
  Unsubscribe,
  WorldSnapshot,
} from '@rps/contracts';

export interface RecordedCall {
  readonly method: string;
  readonly args: readonly unknown[];
}

export const TEST_CONFIG: SimConfig = {
  extractorRate: 2,
  inputNeed: 0.5,
  storageCap: 400,
  selfPenalty: 3,
  converterRate: 1,
  upkeep: 0.05,
  raidEfficiency: 0.6,
  rpsBonus: 1.5,
  cancelNotice: 30,
  extractorCost: 60,
  soldierCost: 10,
  maxExtractors: 12,
  hqRate: 0.5,
  scavenge: 0.1,
  raidGrace: 120,
  embargoTicks: 60,
  tradeOn: true,
  raidsOn: true,
  selfProdOn: true,
};

export const TEST_SCHEMA: readonly ConfigFieldDescriptor[] = [
  { key: 'extractorRate', kind: 'number', label: 'Extractor output', min: 0.5, max: 5, step: 0.1, unit: '/s', hint: 'Native units each extractor makes.' },
  { key: 'upkeep', kind: 'number', label: 'Army upkeep', min: 0, max: 0.2, step: 0.005, unit: '/s', hint: 'Per soldier.' },
  { key: 'storageCap', kind: 'number', label: 'Storage cap', min: 100, max: 1500, step: 50, unit: '', hint: 'Per resource.' },
  { key: 'tradeOn', kind: 'toggle', label: 'Trade contracts', hint: 'Allow contracts.' },
  { key: 'raidsOn', kind: 'toggle', label: 'Raids', hint: 'Allow raids.' },
];

export const TEST_POLICIES: readonly PolicyDescriptor[] = [
  { id: 'merchant', label: 'Merchant', description: 'Trades.' },
  { id: 'warlord', label: 'Warlord', description: 'Raids.' },
  { id: 'balanced', label: 'Balanced', description: 'Both.' },
  { id: 'idle', label: 'Idle (player left)', description: 'Does nothing.' },
];

const NATIVE: Readonly<Record<FactionId, ResourceId>> = { paper: 'water', scissors: 'energy', rock: 'carbon' };
const NAME: Readonly<Record<FactionId, string>> = { paper: 'Paper', scissors: 'Scissors', rock: 'Rock' };

export function makeFaction(id: FactionId, overrides: Partial<FactionSnapshot> = {}): FactionSnapshot {
  return {
    id,
    name: NAME[id],
    native: NATIVE[id],
    policyId: 'balanced',
    bank: { water: 100, energy: 200, carbon: 50 },
    flows: { water: { in: 2.5, out: 1.25 }, energy: { in: 0, out: 0.5 }, carbon: { in: 150, out: 0 } },
    extractors: 3,
    soldiers: 4.4,
    efficiency: 0.9,
    efficiencyAvg: 0.8,
    wasted: 12,
    raidCooldown: 0,
    embargoes: [],
    ...overrides,
  };
}

export function makeContract(a: FactionId, b: FactionId, overrides: Partial<ContractSnapshot> = {}): ContractSnapshot {
  return { id: `${a}:${b}`, a, b, rateA: 1.5, rateB: 0.75, price: 2, noticeTicksLeft: 0, status: 'live', ...overrides };
}

export function makeSnapshot(overrides: Partial<WorldSnapshot> = {}): WorldSnapshot {
  return {
    tick: 125,
    seed: 42,
    config: TEST_CONFIG,
    // Deliberately out of canonical order to check that the view sorts.
    factions: [makeFaction('rock', { policyId: 'balanced' }), makeFaction('paper', { policyId: 'merchant' }), makeFaction('scissors', { policyId: 'warlord' })],
    contracts: [makeContract('paper', 'scissors'), makeContract('paper', 'rock', { status: 'winding-down', noticeTicksLeft: 12 }), makeContract('scissors', 'rock', { status: 'none', rateA: 0, rateB: 0 })],
    events: [
      { tick: 120, kind: 'raid', text: 'Scissors raided Paper', factions: ['scissors', 'paper'] },
      { tick: 60, kind: 'trade', text: 'Paper and Rock signed', factions: ['paper', 'rock'] },
    ],
    ...overrides,
  };
}

export function makeHistory(length: number, startTick = 0): MetricsSample[] {
  const out: MetricsSample[] = [];
  for (let i = 0; i < length; i++) {
    out.push({
      tick: startTick + i,
      output: { paper: i, scissors: 2 * i, rock: 10 },
      army: { paper: 0, scissors: i / 2, rock: 1 },
      worth: { paper: 100 + i, scissors: 90, rock: 80 },
      contractFlow: { 'paper:scissors': 2.25, 'paper:rock': i * 0.1, 'scissors:rock': 0 },
    });
  }
  return out;
}

export class FakeSimulationPort implements SimulationPort {
  readonly calls: RecordedCall[] = [];
  snapshot: WorldSnapshot;
  history: MetricsSample[];
  clock: ClockState = { running: true, ticksPerSecond: 80 };
  schema: readonly ConfigFieldDescriptor[] = TEST_SCHEMA;
  policies: readonly PolicyDescriptor[] = TEST_POLICIES;
  private readonly listeners = new Set<() => void>();

  constructor(snapshot: WorldSnapshot = makeSnapshot(), history: MetricsSample[] = makeHistory(20)) {
    this.snapshot = snapshot;
    this.history = history;
  }

  /** Calls whose method matches, for terse assertions. */
  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((c) => c.method === method);
  }

  get listenerCount(): number {
    return this.listeners.size;
  }

  /** Simulates the runtime notifying the view. */
  emit(): void {
    for (const l of this.listeners) l();
  }

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  getSnapshot(): WorldSnapshot {
    return this.snapshot;
  }
  getHistory(): readonly MetricsSample[] {
    return this.history;
  }
  getClock(): ClockState {
    return this.clock;
  }
  subscribe(listener: () => void): Unsubscribe {
    this.record('subscribe');
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  play(): void {
    this.record('play');
    this.clock = { ...this.clock, running: true };
  }
  pause(): void {
    this.record('pause');
    this.clock = { ...this.clock, running: false };
  }
  stepBy(ticks: number): void {
    this.record('stepBy', ticks);
  }
  setSpeed(ticksPerSecond: number): void {
    this.record('setSpeed', ticksPerSecond);
    this.clock = { ...this.clock, ticksPerSecond };
  }
  reset(options?: ResetOptions): void {
    this.record('reset', options);
  }
  updateConfig(patch: Partial<SimConfig>): void {
    this.record('updateConfig', patch);
    this.snapshot = { ...this.snapshot, config: { ...this.snapshot.config, ...patch } };
  }
  setPolicy(faction: FactionId, policyId: PolicyId): void {
    this.record('setPolicy', faction, policyId);
    this.snapshot = {
      ...this.snapshot,
      factions: this.snapshot.factions.map((f) => (f.id === faction ? { ...f, policyId } : f)),
    };
  }
  listPolicies(): readonly PolicyDescriptor[] {
    return this.policies;
  }
  getConfigSchema(): readonly ConfigFieldDescriptor[] {
    return this.schema;
  }
}
