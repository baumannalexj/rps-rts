import type { GovernorPolicy, PolicyDescriptor, PolicyId, PolicyRegistry } from '@rps/contracts';
import { BalancedPolicy } from './BalancedPolicy.ts';
import { IdlePolicy } from './IdlePolicy.ts';
import { MerchantPolicy } from './MerchantPolicy.ts';
import { WarlordPolicy } from './WarlordPolicy.ts';

export class MapPolicyRegistry implements PolicyRegistry {
  private readonly policies = new Map<PolicyId, GovernorPolicy>();

  constructor(policies: Iterable<GovernorPolicy> = []) {
    for (const p of policies) this.register(p);
  }

  /** The built-in governors: merchant, balanced, warlord, idle. */
  static withDefaults(): MapPolicyRegistry {
    return new MapPolicyRegistry([new MerchantPolicy(), new BalancedPolicy(), new WarlordPolicy(), new IdlePolicy()]);
  }

  register(policy: GovernorPolicy): this {
    if (this.policies.has(policy.id)) throw new Error(`Policy already registered: ${policy.id}`);
    this.policies.set(policy.id, policy);
    return this;
  }

  get(id: PolicyId): GovernorPolicy {
    const p = this.policies.get(id);
    if (!p) throw new Error(`Unknown policy: ${id}`);
    return p;
  }

  has(id: PolicyId): boolean {
    return this.policies.has(id);
  }

  list(): readonly PolicyDescriptor[] {
    return [...this.policies.values()].map(({ id, label, description }) => ({ id, label, description }));
  }
}
