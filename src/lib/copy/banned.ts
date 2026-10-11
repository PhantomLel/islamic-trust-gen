/**
 * AA W7.1 mechanical search strings, plus the AA W6.2 phrases that must not
 * appear on either site outside the Family Waqf Plan page.
 * Matching is case-insensitive and by substring.
 */
export const BANNED_PHRASES = [
	'enforce',
	'shariah-compliant',
	'avoids it entirely',
	'perpetual',
	'partnership',
	'unmatched',
	'self-service',
	'self-guided',
	'our attorneys',
	'legal team',
	'across the United States',
	'coming soon',
	'treasurer',
	'oversees its finances',
	'same day',
	'top of class',
	'five years',
	'never shared',
	'nonrefundable',
	'earned on receipt',
	'GoodTree',
	'Good Tree',
	'picsum',
	'g.page/r/review',
	'Afterfund partnership',
	'perpetual stream',
	'automatically, for generations',
	'Every dollar you endow continues to benefit your family and your masjid',
	'returning proceeds automatically',
] as const;

export type BannedAllowlistEntry = {
	file: string;
	string: string;
	reason: string;
	/** When set, only a line containing this text is allowed. */
	lineIncludes?: string;
	/** GoodTree hits are allowed only when every match on the line is an internal key. */
	internalKey?: boolean;
};

/** Explained hits. Internal keys stay; D19 freezes calculator copy. */
export const BANNED_ALLOWLIST: BannedAllowlistEntry[] = [
	{
		file: 'src/lib/config.ts',
		string: 'GoodTree',
		reason: 'Internal keys goodtree-trust, goodtree_fit, and utm_source=goodtree stay.',
		internalKey: true,
	},
	{
		file: 'src/lib/config.ts',
		string: 'same day',
		reason: 'Nikah and civil-marriage date question, not the Jabal same-day donation claim.',
		lineIncludes: 'nikah and civil marriage were on the same day',
	},
	{
		file: 'src/routes/free-islamic-will/+page.svelte',
		string: 'GoodTree',
		reason: 'Internal plan key goodtree-trust.',
		internalKey: true,
	},
	{
		file: 'src/routes/which-plan/+page.svelte',
		string: 'GoodTree',
		reason: 'Internal quiz tier key goodtree.',
		internalKey: true,
	},
	{
		file: 'src/routes/which-plan/+page.svelte',
		string: 'partnership',
		reason: 'Business-ownership question names a legal form of business, not a vendor partnership.',
		lineIncludes: 'LLC, partnership, sole proprietorship',
	},
	{
		file: 'src/routes/inheritance-calculator/+page.svelte',
		string: 'enforce',
		reason: 'D19 freezes the inheritance calculator. Button still says "Make it enforceable".',
		lineIncludes: 'Make it enforceable',
	},
];
