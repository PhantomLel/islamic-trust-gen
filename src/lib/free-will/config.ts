/**
 * Free Islamic Will — question and option definitions.
 *
 * The free will is the platform's lead magnet (see dev brief). It collects
 * structured family and asset data with no account required up front, then
 * persists everything once the user creates an account at the end so the data
 * can be reused by the GoodTree Trust generator later.
 *
 * Storage shape mirrors the trust flow: a flat `{ id, response }[]` array
 * (see `WillResponse`) so the same downstream patterns as
 * `src/lib/server/documents/buildContext.ts` apply.
 */

export type UsState = { code: string; name: string };

/** All 50 states + DC. `code` is the USPS abbreviation, stored on responses. */
export const usStates: UsState[] = [
	{ code: 'AL', name: 'Alabama' },
	{ code: 'AK', name: 'Alaska' },
	{ code: 'AZ', name: 'Arizona' },
	{ code: 'AR', name: 'Arkansas' },
	{ code: 'CA', name: 'California' },
	{ code: 'CO', name: 'Colorado' },
	{ code: 'CT', name: 'Connecticut' },
	{ code: 'DE', name: 'Delaware' },
	{ code: 'DC', name: 'District of Columbia' },
	{ code: 'FL', name: 'Florida' },
	{ code: 'GA', name: 'Georgia' },
	{ code: 'HI', name: 'Hawaii' },
	{ code: 'ID', name: 'Idaho' },
	{ code: 'IL', name: 'Illinois' },
	{ code: 'IN', name: 'Indiana' },
	{ code: 'IA', name: 'Iowa' },
	{ code: 'KS', name: 'Kansas' },
	{ code: 'KY', name: 'Kentucky' },
	{ code: 'LA', name: 'Louisiana' },
	{ code: 'ME', name: 'Maine' },
	{ code: 'MD', name: 'Maryland' },
	{ code: 'MA', name: 'Massachusetts' },
	{ code: 'MI', name: 'Michigan' },
	{ code: 'MN', name: 'Minnesota' },
	{ code: 'MS', name: 'Mississippi' },
	{ code: 'MO', name: 'Missouri' },
	{ code: 'MT', name: 'Montana' },
	{ code: 'NE', name: 'Nebraska' },
	{ code: 'NV', name: 'Nevada' },
	{ code: 'NH', name: 'New Hampshire' },
	{ code: 'NJ', name: 'New Jersey' },
	{ code: 'NM', name: 'New Mexico' },
	{ code: 'NY', name: 'New York' },
	{ code: 'NC', name: 'North Carolina' },
	{ code: 'ND', name: 'North Dakota' },
	{ code: 'OH', name: 'Ohio' },
	{ code: 'OK', name: 'Oklahoma' },
	{ code: 'OR', name: 'Oregon' },
	{ code: 'PA', name: 'Pennsylvania' },
	{ code: 'RI', name: 'Rhode Island' },
	{ code: 'SC', name: 'South Carolina' },
	{ code: 'SD', name: 'South Dakota' },
	{ code: 'TN', name: 'Tennessee' },
	{ code: 'TX', name: 'Texas' },
	{ code: 'UT', name: 'Utah' },
	{ code: 'VT', name: 'Vermont' },
	{ code: 'VA', name: 'Virginia' },
	{ code: 'WA', name: 'Washington' },
	{ code: 'WV', name: 'West Virginia' },
	{ code: 'WI', name: 'Wisconsin' },
	{ code: 'WY', name: 'Wyoming' },
];

export function stateName(code: string | undefined | null): string {
	if (!code) return '';
	return usStates.find((s) => s.code === code)?.name ?? code;
}

/** States where Leonard is licensed and the will is an attorney legal service (Mode B). */
export const attorneyServiceStates = new Set(['TX', 'CA']);

/**
 * Married users in these states see the community-property warning and earn the
 * `community_property_state` lead tag (dev brief §5/§6 — TX, CA, WI).
 */
export const communityPropertyWarningStates = new Set(['TX', 'CA', 'WI']);

/**
 * States where the five community-property document clauses are auto-inserted.
 * Wisconsin is intentionally EXCLUDED pending a separate marital-property legal
 * review (dev brief §10 Phase 3 / §12). Do not add WI here without sign-off.
 */
export const communityPropertyClauseStates = new Set(['TX', 'CA']);

export type AssetRange = {
	id: string;
	label: string;
	/** Lower bound in USD, used for upsell routing thresholds. */
	floor: number;
};

export const assetRanges: AssetRange[] = [
	{ id: 'under-100k', label: 'Under $100,000', floor: 0 },
	{ id: '100k-250k', label: '$100,000 – $250,000', floor: 100_000 },
	{ id: '250k-500k', label: '$250,000 – $500,000', floor: 250_000 },
	{ id: '500k-1m', label: '$500,000 – $1 million', floor: 500_000 },
	{ id: '1m-2m', label: '$1 million – $2 million', floor: 1_000_000 },
	{ id: '2m-plus', label: '$2 million or more', floor: 2_000_000 },
];

export function assetRangeFloor(id: string | undefined | null): number {
	if (!id) return 0;
	return assetRanges.find((r) => r.id === id)?.floor ?? 0;
}

export function assetRangeLabel(id: string | undefined | null): string {
	if (!id) return '';
	return assetRanges.find((r) => r.id === id)?.label ?? '';
}

// ─── Question model ──────────────────────────────────────────────────────────

export type WillStage = 'location' | 'family' | 'assets' | 'goals';

export const stageMeta: Record<WillStage, { label: string }> = {
	location: { label: 'About you' },
	family: { label: 'Your family' },
	assets: { label: 'Your assets' },
	goals: { label: 'Your goals' },
};

export type WillFieldType =
	| 'state' // dropdown of US states; stored as state code
	| 'single-select' // one of `options`
	| 'yes-no' // boolean
	| 'yes-no-unsure' // 'yes' | 'no' | 'unsure'
	| 'counts'; // { sons: number; daughters: number }

/** A dependency: this step is only shown when `field` currently equals `eq`. */
export type WillDependency = { field: string; eq: string | boolean };

export type WillStep = {
	id: string;
	stage: WillStage;
	type: WillFieldType;
	/** Conversational question text. */
	question: string;
	/** Supporting line framing the question as helpful, not a legal intake. */
	help?: string;
	options?: string[];
	depends?: WillDependency;
};

/**
 * Ordered question list (dev brief §4). Conditional steps use `depends`.
 * Gender is collected because an accurate Islamic distribution schedule
 * cannot be produced without the testator's gender (spousal + child shares
 * differ). It is framed gently rather than as a legal intake field.
 */
export const willSteps: WillStep[] = [
	// ── Stage 1: location & basic status ──
	{
		id: 'state',
		stage: 'location',
		type: 'state',
		question: 'Which state do you live in?',
		help: 'Your state determines which laws apply and whether attorney-supervised service is available to you.',
	},
	{
		id: 'gender',
		stage: 'location',
		type: 'single-select',
		question: 'And are you the husband or the wife?',
		help: 'Islamic inheritance shares differ slightly by gender, so we ask in order to calculate the right distribution for you.',
		options: ['Male', 'Female'],
	},
	{
		id: 'marital_status',
		stage: 'location',
		type: 'single-select',
		question: 'What is your current marital status?',
		options: ['Married', 'Single', 'Widowed', 'Divorced'],
	},

	// ── Stage 2: family structure ──
	{
		id: 'has_children',
		stage: 'family',
		type: 'yes-no',
		question: 'Do you have children?',
		help: 'This helps us build the right distribution and guardian reminders for your family.',
	},
	{
		id: 'children_counts',
		stage: 'family',
		type: 'counts',
		question: 'How many children do you have?',
		help: 'We use these counts to calculate each child\u2019s Qur\u2019anic share.',
		depends: { field: 'has_children', eq: true },
	},
	{
		id: 'minor_children',
		stage: 'family',
		type: 'yes-no',
		question: 'Do you have any minor children under 18?',
		help: 'If so, we\u2019ll remind you about naming a guardian.',
		depends: { field: 'has_children', eq: true },
	},
	{
		id: 'special_needs',
		stage: 'family',
		type: 'yes-no',
		question: 'Do any of your children have special needs requiring ongoing support?',
		help: 'Special-needs planning often calls for tailored protections we can flag for you.',
		depends: { field: 'has_children', eq: true },
	},
	{
		id: 'blended_family',
		stage: 'family',
		type: 'yes-no',
		question: 'Do you, or your spouse, have children from a prior relationship?',
		help: 'Blended families sometimes need extra planning, and this helps us guide you.',
	},
	{
		id: 'non_muslim_heirs',
		stage: 'family',
		type: 'yes-no',
		question: 'Are any of your heirs non-Muslim?',
		help: 'This affects how certain shares are treated and lets us flag anything worth reviewing.',
	},
	{
		id: 'parents_living',
		stage: 'family',
		type: 'single-select',
		question: 'Are your parents living?',
		help: 'Parents are Qur\u2019anic heirs, so their status changes the distribution.',
		options: ['Both', 'Mother only', 'Father only', 'Neither'],
	},

	// ── Stage 3: assets ──
	{
		id: 'own_home',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you own a home?',
		help: 'A home is often the most important asset to plan around.',
	},
	{
		id: 'home_state',
		stage: 'assets',
		type: 'state',
		question: 'Which state is your home in?',
		depends: { field: 'own_home', eq: true },
	},
	{
		id: 'other_real_estate',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you own any other real estate, including property overseas?',
	},
	{
		id: 'retirement_accounts',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you have retirement accounts such as a 401(k) or IRA?',
		help: 'These often pass by beneficiary designation, which we\u2019ll remind you to review.',
	},
	{
		id: 'life_insurance',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you have life insurance?',
	},
	{
		id: 'business_ownership',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you have any business ownership, including a small LLC or partnership?',
	},
	{
		id: 'asset_range',
		stage: 'assets',
		type: 'single-select',
		question: 'Roughly, what is the total value of your family\u2019s assets?',
		help: 'A range is all we need \u2014 there\u2019s no need to share exact figures.',
		options: assetRanges.map((r) => r.label),
	},

	// ── Stage 4: goals ──
	{
		id: 'charity_interest',
		stage: 'goals',
		type: 'yes-no-unsure',
		question:
			'Would you like to leave a portion of your estate to charity, a masjid, or an Islamic institution?',
		help: 'Up to one-third of your estate may be given as wasiyyah.',
	},
	{
		id: 'avoid_probate',
		stage: 'goals',
		type: 'yes-no-unsure',
		question: 'Are you interested in keeping your family out of probate court?',
		help: 'Probate can be slow and public. A trust is the usual way to avoid it.',
	},
	{
		id: 'attorney_review',
		stage: 'goals',
		type: 'yes-no',
		question: 'Would you like to learn whether your situation may need attorney review?',
	},
];

export const willStages: WillStage[] = ['location', 'family', 'assets', 'goals'];

// ─── Response shape ────────────────────────────────────────────────────────

export type YesNoUnsure = 'yes' | 'no' | 'unsure';

export type ChildrenCounts = { sons: number; daughters: number };

export type WillResponseValue = string | boolean | YesNoUnsure | ChildrenCounts | null;

/** Mirror of the trust `Response` row shape so downstream code matches. */
export type WillResponse = { id: string; response: WillResponseValue };

/** A keyed view of the responses for convenient access in logic + UI. */
export type WillResponses = Record<string, WillResponseValue>;

export type WillOptIns = {
	/** "Send me reminders every 6 months to review my plan." (pre-checked) */
	reviewReminders: boolean;
	/** "Notify me when attorney-reviewed plans become available in my state." */
	attorneyAvailability: boolean;
};
