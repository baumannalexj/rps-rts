import type { ConfigFieldDescriptor, SimConfig } from '@rps/contracts';

export interface KnobView {
  readonly key: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly output: string;
  readonly hint: string;
}

export interface ToggleView {
  readonly key: string;
  readonly label: string;
  readonly checked: boolean;
  readonly hint: string;
}

export interface RulesView {
  readonly knobs: readonly KnobView[];
  readonly toggles: readonly ToggleView[];
}

/** Rounds away float noise from step arithmetic (0.1 + 0.2) without hiding real precision. */
export function formatKnobValue(value: number, step: number, unit: string): string {
  const decimals = stepDecimals(step);
  const text = String(Number(value.toFixed(Math.max(decimals, 0))));
  return `${text}${unit}`;
}

export function stepDecimals(step: number): number {
  const s = String(step);
  const dot = s.indexOf('.');
  if (s.includes('e-')) return Number(s.split('e-')[1] ?? 0);
  return dot < 0 ? 0 : s.length - dot - 1;
}

export class RulesPresenter {
  present(schema: readonly ConfigFieldDescriptor[], config: SimConfig): RulesView {
    const knobs: KnobView[] = [];
    const toggles: ToggleView[] = [];
    for (const field of schema) {
      if (field.kind === 'number') {
        const value = config[field.key];
        knobs.push({
          key: field.key,
          label: field.label,
          min: field.min,
          max: field.max,
          step: field.step,
          value,
          output: formatKnobValue(value, field.step, field.unit),
          hint: field.hint,
        });
      } else {
        toggles.push({ key: field.key, label: field.label, checked: config[field.key], hint: field.hint });
      }
    }
    return { knobs, toggles };
  }

  /** Builds the config patch for a control change, or null if the key isn't in the schema. */
  patchFor(schema: readonly ConfigFieldDescriptor[], key: string, raw: string | boolean): Partial<SimConfig> | null {
    const field = schema.find((f) => f.key === key);
    if (!field) return null;
    if (field.kind === 'toggle') return { [field.key]: Boolean(raw) } as Partial<SimConfig>;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return { [field.key]: Math.min(field.max, Math.max(field.min, n)) } as Partial<SimConfig>;
  }
}
