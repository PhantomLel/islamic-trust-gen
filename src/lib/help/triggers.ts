import type { HelpEscalationTier } from '$lib/server/db/help.schema';

export type TriggerMatch = {
	code: string;
	tier: HelpEscalationTier;
	templateId?: string;
	blocksStep?: boolean;
};

const TIER1_PATTERNS: Array<{ code: string; re: RegExp; templateId?: string }> = [
	{ code: 'death_actual', re: /\b(passed away|died|has died|just died|janazah|funeral today|my (husband|wife|father|mother|parent|child) (died|passed))\b/i, templateId: 'E-7' },
	{ code: 'signed_error', re: /\b(already signed|notarized).{0,40}\b(wrong|error|mistake)\b/i, templateId: 'E-8' },
	{ code: 'litigation', re: /\b(contest|suing|lawsuit|dispute in court|lawyer sent a letter)\b/i },
	{ code: 'contested_facts', re: /\b(paternity|secret marriage|hidden assets|abuse allegation)\b/i },
	{ code: 'trustee_incapacity', re: /\b(trustee (has dementia|died|incapacitated))\b/i },
];

const TIER2_PATTERNS: Array<{ code: string; re: RegExp; blocksStep?: boolean }> = [
	{ code: 'blended_family', re: /\b(blended family|stepchildren|ex-wife|ex-husband|prior marriage)\b/i, blocksStep: true },
	{ code: 'special_needs', re: /\b(special needs|autism|disability).{0,30}(inherit|beneficiary|medicaid|ssi)\b/i, blocksStep: true },
	{ code: 'business', re: /\b(s-corp|llc|my business|professional practice)\b/i, blocksStep: true },
	{ code: 'large_estate', re: /\b(over \$1\.?5\s*m|taxable estate|estate over)\b/i, blocksStep: true },
	{ code: 'noncitizen_spouse', re: /\b(noncitizen spouse|green card spouse|not a citizen)\b/i, blocksStep: true },
	{ code: 'international', re: /\b(overseas property|heirs outside|international assets)\b/i, blocksStep: true },
	{ code: 'public_benefits', re: /\b(medicaid|medi-cal|ssi|nursing home planning)\b/i, blocksStep: true },
	{ code: 'tax_planning', re: /\b(tax minimization|save on taxes|prop 19|estate tax|gift tax)\b/i, blocksStep: true },
	{ code: 'disinherit', re: /\b(disinheri|override islamic shares|unequal shares)\b/i, blocksStep: true },
	{ code: 'crypto_significant', re: /\b(significant crypto|large crypto holdings)\b/i, blocksStep: true },
];

const TIER3_PATTERNS: Array<{ code: string; re: RegExp; templateId?: string }> = [
	{ code: 'best_choice', re: /\b(which (beneficiary|choice) is best|what should i choose)\b/i, templateId: 'E-9' },
	{ code: 'outside_state', re: /\b(state other than texas|state other than california|outside tx\/ca)\b/i, templateId: 'E-6' },
	{ code: 'tax_question', re: /\b(tax advice|income tax on|capital gains strategy)\b/i, templateId: 'E-4' },
	{ code: 'fatwa', re: /\b(fatwa|haram\?|my sheikh said|madhhab specific)\b/i, templateId: 'E-5' },
];

/** Narrow allowlist: educational hypotheticals about death process, not actual events. */
const DEATH_HYPOTHETICAL =
	/\b(what happens when (i|we) die|when the first spouse dies|after i die in general|hypothetically if i died)\b/i;

export function detectTriggers(question: string): TriggerMatch[] {
	const q = question.toLowerCase();
	const matches: TriggerMatch[] = [];

	for (const p of TIER1_PATTERNS) {
		if (p.re.test(q)) {
			if (p.code === 'death_actual' && DEATH_HYPOTHETICAL.test(q) && !/\b(my|our) (father|mother|husband|wife|parent).{0,20}(died|passed)\b/i.test(q)) {
				continue;
			}
			matches.push({ code: p.code, tier: '1', templateId: p.templateId });
		}
	}
	for (const p of TIER2_PATTERNS) {
		if (p.re.test(q)) matches.push({ code: p.code, tier: '2', blocksStep: p.blocksStep });
	}
	for (const p of TIER3_PATTERNS) {
		if (p.re.test(q)) matches.push({ code: p.code, tier: '3', templateId: p.templateId });
	}
	return matches;
}

export function highestTier(matches: TriggerMatch[]): HelpEscalationTier | null {
	if (matches.some((m) => m.tier === '1')) return '1';
	if (matches.some((m) => m.tier === '2')) return '2';
	if (matches.some((m) => m.tier === '3')) return '3';
	return null;
}

export function mergeTriggerLists(a: TriggerMatch[], b: TriggerMatch[]): TriggerMatch[] {
	const byCode = new Map<string, TriggerMatch>();
	for (const m of [...a, ...b]) {
		const existing = byCode.get(m.code);
		if (!existing || Number(existing.tier) > Number(m.tier)) byCode.set(m.code, m);
		else if (existing.tier === m.tier) byCode.set(m.code, { ...existing, ...m });
	}
	return [...byCode.values()];
}
