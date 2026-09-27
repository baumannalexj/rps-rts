/** Every change to the world is a serializable command. Players, bots and the UI all speak this. */
import type { FactionId, PolicyId } from './ids.ts';
import type { SimConfig } from './config.ts';

export type Command =
  | { readonly type: 'build-extractor'; readonly faction: FactionId }
  | { readonly type: 'train-soldiers'; readonly faction: FactionId; readonly count: number }
  | { readonly type: 'raid'; readonly faction: FactionId; readonly target: FactionId }
  | { readonly type: 'set-policy'; readonly faction: FactionId; readonly policyId: PolicyId }
  | { readonly type: 'update-config'; readonly patch: Partial<SimConfig> };

export type CommandType = Command['type'];

export type CommandResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };
