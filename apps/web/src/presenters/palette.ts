/** Maps domain ids to CSS palette tokens. The view decides colors, not the core. */
import type { ContractId, FactionId, ResourceId } from '@rps/contracts';

export const FACTION_ORDER: readonly FactionId[] = ['paper', 'scissors', 'rock'];

const FACTION_TOKEN: Readonly<Record<FactionId, string>> = {
  paper: '--water',
  scissors: '--energy',
  rock: '--carbon',
};

const RESOURCE_TOKEN: Readonly<Record<ResourceId, string>> = {
  water: '--water',
  energy: '--energy',
  carbon: '--carbon',
};

export function factionToken(id: FactionId): string {
  return FACTION_TOKEN[id];
}

export function resourceToken(id: ResourceId): string {
  return RESOURCE_TOKEN[id];
}

export interface LineStyle {
  readonly colorToken: string;
  readonly dash: readonly number[];
}

/** Contract-flow lines use ink tones and dash patterns, keyed by the (unordered) faction pair. */
const PAIR_STYLE: Readonly<Record<string, LineStyle>> = {
  'paper:scissors': { colorToken: '--t1', dash: [] },
  'paper:rock': { colorToken: '--t2', dash: [4, 3] },
  'scissors:rock': { colorToken: '--t1', dash: [1.5, 3] },
};
const FALLBACK_STYLES: readonly LineStyle[] = [
  { colorToken: '--t1', dash: [] },
  { colorToken: '--t2', dash: [4, 3] },
  { colorToken: '--t1', dash: [1.5, 3] },
  { colorToken: '--t2', dash: [8, 3, 2, 3] },
];

/** Canonical "x:y" key with faction order paper < scissors < rock, whatever order the id uses. */
export function canonicalPairKey(a: FactionId, b: FactionId): string {
  const [x, y] = FACTION_ORDER.indexOf(a) <= FACTION_ORDER.indexOf(b) ? [a, b] : [b, a];
  return `${x}:${y}`;
}

export function contractLineStyle(id: ContractId, a: FactionId, b: FactionId, index: number): LineStyle {
  return PAIR_STYLE[canonicalPairKey(a, b)] ?? PAIR_STYLE[id] ?? FALLBACK_STYLES[index % FALLBACK_STYLES.length]!;
}

/** Legend swatch class for a dash pattern. */
export function dashClass(dash: readonly number[]): '' | 'dash' | 'dot' {
  if (dash.length === 0) return '';
  return (dash[0] ?? 0) < 3 ? 'dot' : 'dash';
}
