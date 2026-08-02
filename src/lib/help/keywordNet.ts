import type { HelpEscalationTier } from '$lib/server/db/help.schema';
import type { TriggerMatch } from '$lib/help/triggers';

/** KB B.4 one-way tier ratchet: once escalated, never downgrade within a session. Tier 1 is most severe. */
export function ratchetTier(
	current: HelpEscalationTier | null,
	incoming: HelpEscalationTier | null,
): HelpEscalationTier | null {
	if (!incoming) return current;
	if (!current) return incoming;
	return Number(incoming) <= Number(current) ? incoming : current;
}

export function ratchetTriggerMatches(
	existing: TriggerMatch[],
	incoming: TriggerMatch[],
): TriggerMatch[] {
	const byCode = new Map<string, TriggerMatch>();
	for (const m of existing) byCode.set(m.code, m);
	for (const m of incoming) {
		const prev = byCode.get(m.code);
		if (!prev) {
			byCode.set(m.code, m);
			continue;
		}
		const tier = ratchetTier(prev.tier, m.tier)!;
		byCode.set(m.code, { ...prev, ...m, tier });
	}
	return [...byCode.values()];
}

export function sessionTierFromTriggers(matches: TriggerMatch[]): HelpEscalationTier | null {
	let tier: HelpEscalationTier | null = null;
	for (const m of matches) tier = ratchetTier(tier, m.tier);
	return tier;
}
