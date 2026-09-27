/** Default rules and the UI schema describing the tunable ones. */
import type { ConfigFieldDescriptor, SimConfig } from '@rps/contracts';

export const DEFAULT_CONFIG: SimConfig = Object.freeze({
  extractorRate: 2.0,
  inputNeed: 0.5,
  storageCap: 400,
  selfPenalty: 3,
  converterRate: 0.6,
  upkeep: 0.04,
  raidEfficiency: 0.6,
  rpsBonus: 1.5,
  cancelNotice: 30,
  extractorCost: 60,
  soldierCost: 4,
  maxExtractors: 30,
  hqRate: 1.0,
  scavenge: 0.15,
  raidGrace: 180,
  embargoTicks: 150,
  tradeOn: true,
  raidsOn: true,
  selfProdOn: true,
});

export const CONFIG_SCHEMA: readonly ConfigFieldDescriptor[] = Object.freeze([
  { key: 'extractorRate', kind: 'number', label: 'Extractor output', min: 0.5, max: 5, step: 0.1, unit: '/s',
    hint: 'Native resource each extractor makes per second when fully supplied.' },
  { key: 'inputNeed', kind: 'number', label: 'Extractor input need', min: 0, max: 2, step: 0.05, unit: '/s',
    hint: 'How much of each foreign resource an extractor burns per second. Higher means more need to trade.' },
  { key: 'selfPenalty', kind: 'number', label: 'Self-production cost', min: 1, max: 8, step: 0.5, unit: ':1',
    hint: 'Native units burned to make one foreign unit yourself. Also the ceiling on trade prices.' },
  { key: 'converterRate', kind: 'number', label: 'Converter speed', min: 0, max: 3, step: 0.1, unit: '/s',
    hint: 'Most foreign units per second a faction can make on its own when running low.' },
  { key: 'upkeep', kind: 'number', label: 'Soldier upkeep', min: 0, max: 0.2, step: 0.005, unit: '/s',
    hint: 'Each foreign resource a soldier eats per second. Unpaid soldiers desert.' },
  { key: 'raidEfficiency', kind: 'number', label: 'Raid loot kept', min: 0.1, max: 1, step: 0.05, unit: '',
    hint: 'Share of stolen goods the raider keeps; the rest is destroyed.' },
  { key: 'rpsBonus', kind: 'number', label: 'Matchup bonus', min: 1, max: 3, step: 0.1, unit: '×',
    hint: 'Combat multiplier against the faction you beat (rock > scissors > paper > rock).' },
  { key: 'storageCap', kind: 'number', label: 'Storage cap', min: 100, max: 1500, step: 50, unit: '',
    hint: 'Most of each resource a faction can hold. Anything above is wasted.' },
  { key: 'cancelNotice', kind: 'number', label: 'Cancel notice', min: 0, max: 120, step: 5, unit: 's',
    hint: 'How long a cancelled contract keeps flowing before it stops.' },
  { key: 'raidGrace', kind: 'number', label: 'Raid grace period', min: 0, max: 600, step: 30, unit: 's',
    hint: 'Seconds at the start of a match when nobody may raid.' },
  { key: 'embargoTicks', kind: 'number', label: 'Embargo length', min: 0, max: 600, step: 10, unit: 's',
    hint: 'How long a raided faction refuses to trade with its attacker.' },
  { key: 'tradeOn', kind: 'toggle', label: 'Trade contracts', hint: 'Factions negotiate streaming resource swaps.' },
  { key: 'raidsOn', kind: 'toggle', label: 'Raids', hint: 'Factions may attack each other to steal goods.' },
  { key: 'selfProdOn', kind: 'toggle', label: 'Self-production',
    hint: 'Factions can slowly make foreign resources themselves, at a loss, when running low.' },
] satisfies ConfigFieldDescriptor[]);

/** Validates a config patch. Returns an error message, or null if the patch is acceptable. */
export function validateConfigPatch(patch: Partial<SimConfig>): string | null {
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(DEFAULT_CONFIG, key)) return `Unknown config key: ${key}`;
    const expected = typeof DEFAULT_CONFIG[key as keyof SimConfig];
    if (value === undefined) continue;
    if (typeof value !== expected) return `Config ${key} must be a ${expected}`;
    if (expected === 'number' && (!Number.isFinite(value) || (value as number) < 0)) {
      return `Config ${key} must be a finite number >= 0`;
    }
  }
  if (patch.storageCap !== undefined && patch.storageCap <= 0) return 'Config storageCap must be > 0';
  if (patch.selfPenalty !== undefined && patch.selfPenalty <= 0) return 'Config selfPenalty must be > 0';
  return null;
}
