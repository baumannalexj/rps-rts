/** Identifiers and value shapes shared by every layer. Types only. */

export type ResourceId = 'water' | 'energy' | 'carbon';
export type FactionId = 'paper' | 'scissors' | 'rock';
/** One tick is one second of game time. */
export type Tick = number;
/** Key into a PolicyRegistry, e.g. "merchant". */
export type PolicyId = string;
/** Stable id for the contract between two factions, e.g. "paper:rock". */
export type ContractId = string;

export type ResourceBundle = Readonly<Record<ResourceId, number>>;
export type PerFaction<T> = Readonly<Record<FactionId, T>>;
