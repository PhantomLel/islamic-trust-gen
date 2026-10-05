/**
 * Free Islamic Will — question and option definitions.
 *
 * The free will is the platform's lead magnet (see dev brief). It collects
 * structured family and asset data with no account required up front, then
 * persists everything once the user creates an account at the end so the data
 * can be reused by the Guided Trust generator later.
 *
 * Storage shape mirrors the trust flow: a flat `{ id, response }[]` array
 * (see `WillResponse`) so the same downstream patterns as
 * `src/lib/server/documents/buildContext.ts` apply.
 */

import type { HeirsCalculatorResponse } from '$lib/config';
import { texasCounties, californiaCounties } from '$lib/counties';
import { getMasjidById } from '$lib/masajid';

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

/** Get counties for a given state code. Returns empty array for unsupported states. */
export function getCountiesByState(stateCode: string | undefined | null): string[] {
	if (!stateCode) return [];
	if (stateCode === 'TX') return texasCounties;
	if (stateCode === 'CA') return californiaCounties;
	return [];
}

/** States where the free will generator can currently produce a document. */
export const willAvailableStates = new Set(['TX', 'CA']);

export function isWillAvailableState(code: string | undefined | null): boolean {
	return typeof code === 'string' && willAvailableStates.has(code);
}

/** States where Leonard is licensed and the will is an attorney legal service (Mode B). */
export const attorneyServiceStates = willAvailableStates;

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

/**
 * States where married users must tick the A6 community-property/shariah
 * acknowledgment checkbox before a document can be generated (dev packet
 * §3.3). Texas only for now — add a state code here once Leonard signs off
 * on extending the same gate elsewhere (e.g. California).
 */
export const communityPropertyAckStates = new Set(['TX']);

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
	{ id: 'prefer-not-to-say', label: 'Prefer not to say', floor: 0 },
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
	| 'county' // searchable dropdown of counties for the selected state
	| 'single-select' // one of `options`
	| 'text' // free-form string
	| 'yes-no' // boolean
	| 'yes-no-unsure' // 'yes' | 'no' | 'unsure'
	| 'address' // street / unit / city / zip (state comes from the `state` step)
	| 'heirs-calculator' // reuses the Islamic inheritance calculator + heir names
	| 'executors' // executor selection (1 required, 2 backups optional — C1)
	| 'guardians' // guardian selection (1 required, 1 backup optional — C1)
	| 'wasiyyah'; // wasiyyah bequests — masajid + custom charities, capped at 1/3

/** Islamic wasiyyah cap: one-third of the estate. */
export const WILL_WASIYYAH_CAP = 100 / 3;

/** A single wasiyyah bequest entry (charity or other recipient). */
export type WillWasiyyahEntry = {
	charityId: string;
	percentage: number;
	/** When present this is a user-added charity (charityId is an opaque UUID). */
	customName?: string;
	customEin?: string;
	/** C3 — user will supply EIN later; still allows proceeding. */
	einDeferred?: boolean;
	/** ISO timestamp of the explicit Jabal Foundation confirmation (Appendix A §3.2). Set only on the Jabal entry. */
	jabalConfirmedAt?: string;
};

export type WillWasiyyahResponse = {
	interested: boolean;
	bequests: WillWasiyyahEntry[];
};

/** User-added recipient row (charityId is an opaque UUID). */
export function isCustomWillWasiyyahEntry(e: WillWasiyyahEntry): boolean {
	return typeof e.customName === 'string';
}

/** Display name for a bequest; empty when a custom entry has no name. */
export function resolveWillWasiyyahRecipientName(
	e: WillWasiyyahEntry,
	presetCharityNames: ReadonlyMap<string, string>,
): string {
	if (isCustomWillWasiyyahEntry(e)) return e.customName?.trim() ?? '';
	return presetCharityNames.get(e.charityId) ?? getMasjidById(e.charityId)?.name ?? '';
}

/** Residential address; `state` is collected separately in the `state` step. */
export type AddressValue = {
	street: string;
	unit?: string;
	city: string;
	zip: string;
};

/** Personal representative (executor) entry for wills. */
export type ExecutorEntry = {
	fullName: string;
	relationship: string;
	contact?: string;
};

/** Guardian entry for wills. */
export type GuardianEntry = {
	fullName: string;
	relationship: string;
	contact?: string;
};

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
	/** Predicate dependency for cases a simple `depends` can't express (e.g. derived from heirs). */
	showIf?: (responses: WillResponses) => boolean;
};

/** Number of children (sons + daughters) captured by the heirs calculator response. */
export function heirsResponseChildCount(responses: WillResponses): number {
	const h = responses['heirs'] as HeirsCalculatorResponse | undefined;
	if (!h || !Array.isArray(h.namedHeirs)) return 0;
	return h.namedHeirs
		.filter((n) => n.heirType === 'son' || n.heirType === 'daughter')
		.reduce((sum, n) => sum + (n.count || 0), 0);
}

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
		help: 'We currently prepare wills only for Texas and California matters.',
	},
	{
		id: 'county',
		stage: 'location',
		type: 'county',
		question: 'Which county do you live in?',
		help: 'Your county identifies where your will should be filed if needed.',
		showIf: (r) => isWillAvailableState(r['state'] as string),
	},
	{
		id: 'full_legal_name',
		stage: 'location',
		type: 'text',
		question: 'What is your full legal name?',
		help: 'As it appears on your government ID \u2014 we\u2019ll use this on your will.',
	},
	{
		id: 'address',
		stage: 'location',
		type: 'address',
		question: 'What is your home address?',
		help: 'Your address identifies you on your will. We keep it private and never share it.',
	},
	{
		id: 'gender',
		stage: 'location',
		type: 'single-select',
		question: 'What is your gender?',
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
	{
		id: 'spouse_name',
		stage: 'location',
		type: 'text',
		question: 'What is your spouse\u2019s full name?',
		help: 'We\u2019ll use this on your will and in your Islamic distribution schedule.',
		depends: { field: 'marital_status', eq: 'Married' },
	},

	// ── Stage 2: family structure ──
	{
		id: 'father_alive',
		stage: 'family',
		type: 'yes-no',
		question: 'Is your father alive?',
	},
	{
		id: 'father_name',
		stage: 'family',
		type: 'text',
		question: "What is your father's full name?",
		help: 'We\u2019ll use this on your will — whether he is alive or deceased.',
		showIf: (r) => r['father_alive'] === true || r['father_alive'] === false,
	},
	{
		id: 'mother_alive',
		stage: 'family',
		type: 'yes-no',
		question: 'Is your mother alive?',
	},
	{
		id: 'mother_name',
		stage: 'family',
		type: 'text',
		question: "What is your mother's full name?",
		help: 'We\u2019ll use this on your will — whether she is alive or deceased.',
		showIf: (r) => r['mother_alive'] === true || r['mother_alive'] === false,
	},
	{
		id: 'heirs',
		stage: 'family',
		type: 'heirs-calculator',
		question: 'Who are your heirs?',
		help: 'Tell us who survives you and add each person\u2019s name. We calculate the exact Qur\u2019anic share for everyone you list.',
	},
	{
		id: 'minor_children',
		stage: 'family',
		type: 'yes-no',
		question: 'Are any of your children under 18?',
		help: 'If so, we\u2019ll remind you about naming a guardian.',
		showIf: (r) => heirsResponseChildCount(r) > 0,
	},
	{
		id: 'guardians',
		stage: 'family',
		type: 'guardians',
		question: 'Who will serve as guardians for your minor children?',
		depends: { field: 'minor_children', eq: true },
	},
	{
		id: 'special_needs',
		stage: 'family',
		type: 'yes-no',
		question: 'Do any of your children have special needs requiring ongoing support?',
		help: 'Special-needs planning often calls for tailored protections we can flag for you.',
		showIf: (r) => heirsResponseChildCount(r) > 0,
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
		question: 'Are any of your close relatives non-Muslim?',
		help: 'Non-Muslim relatives are not Qur\u2019anic heirs, but letting us know helps us flag anything worth reviewing.',
	},

	// ── Stage 3: assets ──
	{
		id: 'own_home',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you own a home?',
		help: 'Homes often pass outside your will depending on how title is held. This helps us flag whether extra review may be useful.',
	},
	{
		id: 'home_state',
		stage: 'assets',
		type: 'yes-no',
		question: 'Is your home in a different state than where you live?',
		help: 'If yes, we\u2019ll note this for attorney review \u2014 it won\u2019t stop you from completing your will.',
		depends: { field: 'own_home', eq: true },
	},
	{
		id: 'other_real_estate',
		stage: 'assets',
		type: 'yes-no',
		question: 'Do you own any other real estate in the U.S. besides your primary home?',
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
		help: 'Business interests often need succession planning beyond a basic will.',
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
		id: 'executors',
		stage: 'goals',
		type: 'executors',
		question: 'Who will serve as your personal representatives?',
	},
	{
		id: 'wasiyyah',
		stage: 'goals',
		type: 'wasiyyah',
		question:
			'Would you like to leave a portion of your estate to charity, a masjid, or another recipient?',
		help: 'Up to one-third of your estate may be given as wasiyyah. This is optional.',
	},
	{
		id: 'avoid_probate',
		stage: 'goals',
		type: 'yes-no-unsure',
		question: 'Are you interested in keeping your family out of probate court?',
		help: 'Probate can be slow and public.',
	},
	{
		id: 'attorney_review',
		stage: 'goals',
		type: 'yes-no',
		question: 'Would you like to book a consultation to discuss attorney review before you finish?',
	},
	{
		id: 'strict_faraid',
		stage: 'goals',
		type: 'yes-no',
		question:
			'Is it important to you that your estate be distributed in strict accordance with Islamic inheritance (faraid)?',
		help: 'Some assets pass outside a will under U.S. law. If strict faraid compliance matters to you, additional planning may be needed.',
	},
];

export const willStages: WillStage[] = ['location', 'family', 'assets', 'goals'];

// ─── Response shape ────────────────────────────────────────────────────────

export type YesNoUnsure = 'yes' | 'no' | 'unsure';

export type ChildrenCounts = { sons: number; daughters: number };

export type WillResponseValue =
	| string
	| boolean
	| YesNoUnsure
	| AddressValue
	| HeirsCalculatorResponse
	| ExecutorEntry[]
	| GuardianEntry[]
	| WillWasiyyahResponse
	| null;

/** Mirror of the trust `Response` row shape so downstream code matches. */
export type WillResponse = { id: string; response: WillResponseValue };

/** A keyed view of the responses for convenient access in logic + UI. */
export type WillResponses = Record<string, WillResponseValue>;

export type WillOptIns = {
	/** "Send me reminders every 6 months to review my plan." (pre-checked) */
	reviewReminders: boolean;
};
