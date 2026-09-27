/** Static game data: resources, factions and the rock-paper-scissors matchup table. */
import type { FactionId, ResourceBundle, ResourceId } from '@rps/contracts';

export const RESOURCES: readonly ResourceId[] = Object.freeze(['water', 'energy', 'carbon'] as const);

export interface FactionDefinition {
  readonly id: FactionId;
  readonly name: string;
  readonly native: ResourceId;
}

export const FACTION_DEFINITIONS: readonly FactionDefinition[] = Object.freeze([
  Object.freeze({ id: 'paper', name: 'Paper', native: 'water' }),
  Object.freeze({ id: 'scissors', name: 'Scissors', native: 'energy' }),
  Object.freeze({ id: 'rock', name: 'Rock', native: 'carbon' }),
] as const);

export const FACTION_IDS: readonly FactionId[] = Object.freeze(FACTION_DEFINITIONS.map((f) => f.id));

/** Rock beats Scissors, Scissors beats Paper, Paper beats Rock. */
export const BEATS: Readonly<Record<FactionId, FactionId>> = Object.freeze({
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
});

/** Resources other than `native`, in canonical RESOURCES order. */
export function offNative(native: ResourceId): readonly ResourceId[] {
  return RESOURCES.filter((r) => r !== native);
}

/** Combat multiplier of `attacker` against `defender`: bonus if it beats them, inverse if beaten. */
export function matchupMultiplier(attacker: FactionId, defender: FactionId, rpsBonus: number): number {
  if (BEATS[attacker] === defender) return rpsBonus;
  if (BEATS[defender] === attacker) return 1 / rpsBonus;
  return 1;
}

export function definitionOf(id: FactionId): FactionDefinition {
  const def = FACTION_DEFINITIONS.find((f) => f.id === id);
  if (!def) throw new Error(`Unknown faction: ${id}`);
  return def;
}

export function bundleOf(value: number | Partial<ResourceBundle> = 0): Record<ResourceId, number> {
  if (typeof value === 'number') return { water: value, energy: value, carbon: value };
  return { water: value.water ?? 0, energy: value.energy ?? 0, carbon: value.carbon ?? 0 };
}

export function bundleTotal(bundle: ResourceBundle): number {
  return bundle.water + bundle.energy + bundle.carbon;
}
