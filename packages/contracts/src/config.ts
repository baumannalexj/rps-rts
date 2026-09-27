/** Tunable rules. Every field can change while a match runs. */
export interface SimConfig {
  /** Native units per second per extractor at full input. */
  readonly extractorRate: number;
  /** Each off-native resource per second an extractor consumes. */
  readonly inputNeed: number;
  /** Max stock per resource; overflow is wasted. */
  readonly storageCap: number;
  /** Native units burned to self-produce one off-native unit. Also caps trade prices. */
  readonly selfPenalty: number;
  /** Max off-native units per second a faction can self-produce. */
  readonly converterRate: number;
  /** Each off-native resource per second per soldier. */
  readonly upkeep: number;
  /** Share of looted goods the raider keeps (rest destroyed). 0..1 */
  readonly raidEfficiency: number;
  /** Combat multiplier against the faction you beat. */
  readonly rpsBonus: number;
  /** Ticks a cancelled contract keeps flowing. */
  readonly cancelNotice: number;
  /** Native cost of one extractor; each off-native costs 40% of this. */
  readonly extractorCost: number;
  /** Native cost per soldier; plus 2 of each off-native. */
  readonly soldierCost: number;
  readonly maxExtractors: number;
  /** Input-free native trickle from the HQ (prevents permanent dead stops). */
  readonly hqRate: number;
  /** Input-free trickle of each off-native resource. */
  readonly scavenge: number;
  /** Ticks before raids are allowed. */
  readonly raidGrace: number;
  /** Ticks a raid victim embargoes the raider. */
  readonly embargoTicks: number;
  readonly tradeOn: boolean;
  readonly raidsOn: boolean;
  readonly selfProdOn: boolean;
}

/** Lets a view render controls for config without hard-coding fields. */
export type ConfigFieldDescriptor =
  | {
      readonly key: NumericConfigKey;
      readonly kind: 'number';
      readonly label: string;
      readonly min: number;
      readonly max: number;
      readonly step: number;
      readonly unit: string;
      readonly hint: string;
    }
  | {
      readonly key: BooleanConfigKey;
      readonly kind: 'toggle';
      readonly label: string;
      readonly hint: string;
    };

export type NumericConfigKey = { [K in keyof SimConfig]: SimConfig[K] extends number ? K : never }[keyof SimConfig];
export type BooleanConfigKey = { [K in keyof SimConfig]: SimConfig[K] extends boolean ? K : never }[keyof SimConfig];
