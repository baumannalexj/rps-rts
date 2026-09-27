/** User intents translated into SimulationPort calls. DOM-free so they can be tested with a fake port. */
import type { FactionId, PolicyId, SimConfig, SimulationPort } from '@rps/contracts';
import { STEP_TICKS } from '../presenters/ControlBarPresenter.ts';

export type PresetId = 'mixed' | 'merchants' | 'warlords' | 'balanced' | 'leaver';

export interface PresetSpec {
  readonly id: PresetId;
  readonly label: string;
}

export const PRESETS: readonly PresetSpec[] = [
  { id: 'mixed', label: 'Merchant · Warlord · Balanced' },
  { id: 'merchants', label: 'All merchants' },
  { id: 'warlords', label: 'All warlords' },
  { id: 'balanced', label: 'All balanced' },
  { id: 'leaver', label: 'Scissors player leaves' },
];

const LINEUPS: Readonly<Record<Exclude<PresetId, 'leaver'>, Readonly<Record<FactionId, PolicyId>>>> = {
  mixed: { paper: 'merchant', scissors: 'warlord', rock: 'balanced' },
  merchants: { paper: 'merchant', scissors: 'merchant', rock: 'merchant' },
  warlords: { paper: 'warlord', scissors: 'warlord', rock: 'warlord' },
  balanced: { paper: 'balanced', scissors: 'balanced', rock: 'balanced' },
};

export function isPresetId(value: string): value is PresetId {
  return PRESETS.some((p) => p.id === value);
}

export class AppActions {
  readonly port: SimulationPort;

  constructor(port: SimulationPort) {
    this.port = port;
  }

  togglePlay(): void {
    if (this.port.getClock().running) this.port.pause();
    else this.port.play();
  }

  step(): void {
    this.port.stepBy(STEP_TICKS);
  }

  setSpeed(ticksPerSecond: number): void {
    this.port.setSpeed(ticksPerSecond);
  }

  /** Restart from tick 0 with the given seed, keeping each faction's current governor. */
  restart(seed: number): void {
    this.port.reset({ seed, policies: this.currentPolicies() });
  }

  setPolicy(faction: FactionId, policyId: PolicyId): void {
    this.port.setPolicy(faction, policyId);
  }

  updateConfig(patch: Partial<SimConfig>): void {
    this.port.updateConfig(patch);
  }

  /** Lineup presets restart the match; "leaver" swaps Scissors to the idle governor mid-match. */
  applyPreset(id: PresetId, seed: number): void {
    if (id === 'leaver') {
      this.port.setPolicy('scissors', 'idle');
      return;
    }
    this.port.reset({ seed, policies: { ...LINEUPS[id] } });
  }

  private currentPolicies(): Partial<Record<FactionId, PolicyId>> {
    const out: Partial<Record<FactionId, PolicyId>> = {};
    for (const f of this.port.getSnapshot().factions) out[f.id] = f.policyId;
    return out;
  }
}
