/** Aggregate root: everything the engine mutates during a tick. */
import type {
  FactionId,
  GameEventKind,
  PerFaction,
  PolicyId,
  SimConfig,
  Tick,
  WorldSnapshot,
} from '@rps/contracts';
import { Contract } from './Contract.ts';
import { EventLog } from './EventLog.ts';
import { Faction, type FactionInit } from './Faction.ts';
import { FACTION_DEFINITIONS } from './Resources.ts';

export interface WorldInit {
  readonly seed: number;
  readonly config: SimConfig;
  readonly policies: PerFaction<PolicyId>;
  /** Overrides for starting state per faction (tests, scenarios). */
  readonly factions?: Partial<Record<FactionId, Omit<FactionInit, 'policyId'>>>;
  readonly logCapacity?: number;
}

export class World {
  readonly seed: number;
  config: SimConfig;
  tick: Tick = 0;
  readonly factions: readonly Faction[];
  readonly contracts: readonly Contract[];
  readonly log: EventLog;

  constructor(init: WorldInit) {
    this.seed = init.seed;
    this.config = { ...init.config };
    this.log = new EventLog(init.logCapacity ?? 80);
    this.factions = FACTION_DEFINITIONS.map(
      (def) => new Faction(def, { ...init.factions?.[def.id], policyId: init.policies[def.id] }),
    );
    const contracts: Contract[] = [];
    for (let i = 0; i < this.factions.length; i++) {
      for (let j = i + 1; j < this.factions.length; j++) {
        contracts.push(new Contract(this.factions[i]!.id, this.factions[j]!.id));
      }
    }
    this.contracts = contracts;
  }

  faction(id: FactionId): Faction {
    const f = this.factions.find((x) => x.id === id);
    if (!f) throw new Error(`Unknown faction: ${id}`);
    return f;
  }

  contractBetween(x: FactionId, y: FactionId): Contract | undefined {
    return this.contracts.find((c) => c.involves(x) && c.involves(y) && x !== y);
  }

  record(kind: GameEventKind, text: string, factions: readonly FactionId[] = []): void {
    this.log.push({ tick: this.tick, kind, text, factions });
  }

  isEmbargoed(c: Contract): boolean {
    return this.faction(c.a).isEmbargoing(c.b) || this.faction(c.b).isEmbargoing(c.a);
  }

  toSnapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      seed: this.seed,
      config: { ...this.config },
      factions: this.factions.map((f) => f.toSnapshot()),
      contracts: this.contracts.map((c) => c.toSnapshot(this.isEmbargoed(c))),
      events: this.log.toArray(),
    };
  }
}
