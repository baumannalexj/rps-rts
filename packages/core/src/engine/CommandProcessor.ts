/** Validates and applies Commands to the World. The single write path for players, UI and governors. */
import type { AdapterSet, Command, CommandResult, FactionId, PolicyId, RandomSource, SimConfig } from '@rps/contracts';
import { validateConfigPatch } from '../config/defaults.ts';
import { extractorCost, soldierCost } from '../domain/Cost.ts';
import { RESOURCES } from '../domain/Resources.ts';
import type { World } from '../domain/World.ts';

/** Ticks a faction must wait between raids. */
export const RAID_COOLDOWN = 40;

const OK: CommandResult = Object.freeze({ ok: true });
const fail = (reason: string): CommandResult => ({ ok: false, reason });

export class CommandProcessor {
  private readonly world: World;
  private readonly adapters: AdapterSet;
  private readonly rng: RandomSource;

  constructor(world: World, adapters: AdapterSet, rng: RandomSource) {
    this.world = world;
    this.adapters = adapters;
    this.rng = rng;
  }

  dispatch(command: Command): CommandResult {
    switch (command.type) {
      case 'build-extractor':
        return this.buildExtractor(command.faction);
      case 'train-soldiers':
        return this.trainSoldiers(command.faction, command.count);
      case 'raid':
        return this.raid(command.faction, command.target);
      case 'set-policy':
        return this.setPolicy(command.faction, command.policyId);
      case 'update-config':
        return this.updateConfig(command.patch);
      default:
        return fail(`Unknown command: ${(command as { type?: unknown }).type}`);
    }
  }

  private hasFaction(id: FactionId): boolean {
    return this.world.factions.some((f) => f.id === id);
  }

  private buildExtractor(id: FactionId): CommandResult {
    if (!this.hasFaction(id)) return fail(`Unknown faction: ${id}`);
    const f = this.world.faction(id);
    if (f.extractors >= this.world.config.maxExtractors) return fail('At extractor limit');
    if (!f.bank.pay(extractorCost(f.native, this.world.config))) return fail('Cannot afford extractor');
    f.extractors++;
    return OK;
  }

  private trainSoldiers(id: FactionId, count: number): CommandResult {
    if (!this.hasFaction(id)) return fail(`Unknown faction: ${id}`);
    if (!Number.isFinite(count) || count <= 0) return fail('Soldier count must be positive');
    const f = this.world.faction(id);
    if (!f.bank.pay(soldierCost(f.native, count, this.world.config))) return fail('Cannot afford soldiers');
    f.soldiers += count;
    return OK;
  }

  private raid(attackerId: FactionId, targetId: FactionId): CommandResult {
    const world = this.world;
    const cfg = world.config;
    if (!this.hasFaction(attackerId) || !this.hasFaction(targetId)) return fail('Unknown faction');
    if (attackerId === targetId) return fail('Cannot raid yourself');
    if (!cfg.raidsOn) return fail('Raids are disabled');
    if (world.tick < cfg.raidGrace) return fail('Raid grace period');
    const A = world.faction(attackerId);
    const T = world.faction(targetId);
    if (A.raidCooldown > 0) return fail('Raid on cooldown');
    if (A.soldiers <= 0) return fail('No soldiers');

    const outcome = this.adapters.combat.resolve(
      { attacker: A.toSnapshot(), defender: T.toSnapshot(), config: { ...cfg } },
      this.rng,
    );
    const aLoss = Math.max(0, outcome.attackerLosses);
    A.soldiers = Math.max(0, A.soldiers - aLoss);
    T.soldiers = Math.max(0, T.soldiers - Math.max(0, outcome.defenderLosses));
    A.raidCooldown = RAID_COOLDOWN;

    let text: string;
    if (outcome.attackerWon) {
      const fraction = Math.max(0, Math.min(1, outcome.lootFraction));
      let taken = 0;
      for (const r of RESOURCES) {
        const l = T.bank.get(r) * fraction;
        T.bank.withdraw(r, l);
        const before = A.bank.get(r);
        const after = Math.min(cfg.storageCap, before + l * cfg.raidEfficiency);
        A.bank.deposit(r, after - before);
        taken += l;
      }
      A.looted += taken * cfg.raidEfficiency;
      T.lost += taken;
      const wrecked = Math.min(Math.max(0, Math.floor(outcome.extractorsWrecked)), Math.max(0, T.extractors - 1));
      T.extractors -= wrecked;
      const wreck = wrecked === 1 ? ', wrecked an extractor' : wrecked > 1 ? `, wrecked ${wrecked} extractors` : '';
      text =
        `${A.name} raided ${T.name}: took ${Math.round(taken * cfg.raidEfficiency)} ` +
        `(${Math.round(taken * (1 - cfg.raidEfficiency))} destroyed)${wreck}`;
    } else {
      text = `${A.name} raid on ${T.name} repelled (lost ${aLoss.toFixed(1)} troops)`;
    }
    world.record('raid', text, [A.id, T.id]);

    // The victim embargoes the raider and winds down any live contract.
    if (cfg.embargoTicks > 0) {
      T.embargo(A.id, cfg.embargoTicks);
      const c = world.contractBetween(A.id, T.id);
      if (c && c.cancel(cfg.cancelNotice)) {
        world.record('embargo', `${T.name} embargoes ${A.name} (${cfg.cancelNotice}s wind-down)`, [T.id, A.id]);
      }
    }
    return OK;
  }

  private setPolicy(id: FactionId, policyId: PolicyId): CommandResult {
    if (!this.hasFaction(id)) return fail(`Unknown faction: ${id}`);
    if (!this.adapters.policies.has(policyId)) return fail(`Unknown policy: ${policyId}`);
    const f = this.world.faction(id);
    if (f.policyId !== policyId) {
      f.policyId = policyId;
      this.world.record('system', `${f.name} is now governed by ${this.adapters.policies.get(policyId).label}`, [id]);
    }
    return OK;
  }

  private updateConfig(patch: Partial<SimConfig>): CommandResult {
    if (patch === null || typeof patch !== 'object') return fail('Config patch must be an object');
    const error = validateConfigPatch(patch);
    if (error) return fail(error);
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    this.world.config = { ...this.world.config, ...defined };
    return OK;
  }
}
