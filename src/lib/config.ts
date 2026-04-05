import type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType } from '$lib/inheritance/types';
export type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType };

export const siteName = 'Amana Trust';
export const siteTagline = 'Texas Estate Planning';
export const consultationBookingUrl = 'https://mcdaniel.cliogrow.com/book/504611575cd41f17542e14c8c9c0dbde';

export const screeningQuestions = [
	{ id: 'business_ownership', text: 'Do you own a business?' },
	{ id: 'multiple_properties', text: 'Do you own more than one property?' },
	{ id: 'blended_family', text: 'Do you have a blended family?', subtext: 'A blended family generally means you or your spouse have children from a prior relationship, or there are stepchildren involved. These situations often require customized planning beyond this online trust.' },
	{ id: 'special_needs', text: 'Do you have a special needs beneficiary?', subtext: 'A special needs beneficiary is someone who receives or may qualify for government benefits such as SSI or Medicaid due to a disability. These situations typically require specialized trust planning.' },
	{ id: 'taxable_estate', text: 'Is your estate at risk of exceeding the taxable-estate threshold?', subtext: 'Federal estate tax only applies to very large estates (generally many millions of dollars per individual). Most families will not owe federal estate tax. If you believe your estate may require advanced tax planning, a consultation is recommended.' },
];

export type QuestionDependency = { field: string; eq: string | boolean };

export type Question = {
	id: string;
	text: string;
	subtext?: string;
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean' | 'children' | 'heir' | 'charities' | 'heirs-calculator' | 'personal-data';
	required: boolean;
	bucket: string;
	options?: string[];
	depends?: QuestionDependency | QuestionDependency[];
	defaultWhen?: { field: string; eq: string | boolean; value: string | boolean };
};

export type ChildResponse = {
	firstName: string;
	lastName: string;
	dob: string;
};

export type HeirResponse = {
	firstName: string;
	lastName: string;
};

export type CharityResponse = {
	charityId: string;
	percentage: number;
};

/** HeirAllocationJSON extended with per-person names collected during the questionnaire. */
export type NamedHeir = {
	heirType: HeirType;
	label: string;
	count: number;
	names: string[];
	totalShare: FractionValue;
	perPersonShare: FractionValue;
	shareType: ShareType;
	reasons: string[];
};

export type HeirsCalculatorResponse = {
	estateInput: EstateInput;
	namedHeirs: NamedHeir[];
	blockedHeirs: BlockedHeir[];
	awlApplied: boolean;
	raddApplied: boolean;
	dhawulArhamNeeded: boolean;
	notes: string[];
	verified: boolean;
};

export type PersonalDataResponse = {
	name: string;
	dob: string;
	county: string; // texas county
};

export type QuestionResponseValue = string | boolean | ChildResponse[] | HeirResponse[] | CharityResponse[] | HeirsCalculatorResponse | null | PersonalDataResponse;

export const buckets: Record<string, { label: string; icon: string }> = {
	personal: { label: 'Personal Info', icon: 'user' },
	family: { label: 'Family', icon: 'users' },
	property: { label: 'Property', icon: 'home' },
	trust: { label: 'Trust', icon: 'scroll' },
};

export type Charity = {
	id: string;
	name: string;
	logo: string;
	website: string;
};

export const charities: Charity[] = [
	{
		id: 'islamic-relief',
		name: 'Islamic Relief USA',
		logo: 'https://irusa.org/wp-content/uploads/2022/03/2022-IRUSA-Logo_Blue_IRUSA-stacked-e1771511047826.png',
		website: 'https://www.irusa.org'
	},
	{
		id: 'helping-hand',
		name: 'Helping Hand for Relief and Development',
		logo: 'https://www1.hhrd.org/Portals/0/ThemePluginPro/uploads/2021/11/9/HHRD%20LOGO-h-01.png',
		website: 'https://hhrd.org'
	},
	{
		id: 'penny-appeal',
		name: 'Penny Appeal USA',
		logo: 'https://pennyappeal.org/themes/pennyappeal/assets/images/global/logos/pennyappeal-orange.svg',
		website: 'https://pennyappeal.org'
	},
];

export const prePaymentQuestions: Question[] = [
	{
		id: "husband-data",
		text: "First, the husband.",
		type: 'personal-data',
		required: true,
		bucket: 'personal',
	},
	{
		id: "wife-data",
		text: "Now, the wife.",
		type: 'personal-data',
		required: true,
		bucket: 'personal',
	},
	{
		id: "marriage-date",
		text: "When were you married",
		subtext: "If you had both a nikah and a civil ceremony on different dates, enter the date of your civil marriage — the one that was legally registered. If your nikah and civil marriage were on the same day, just enter that date",
		type: 'date',
		required: true,
		bucket: 'personal',
	},
	// ── HEIRS ──────────────────────────────────────────────────────────────
	// All individual family/heir questions replaced with a single
	// heirs-calculator question using the Islamic inheritance calculator UI.
	{
		id: 'husband-heirs',
		text: 'On the husband\'s side, who are your heirs?',
		type: 'heirs-calculator',
		required: true,
		bucket: 'family',
	},
	{
		id: 'wife-heirs',
		text: 'On the wife\'s side, who are your heirs?',
		type: 'heirs-calculator',
		required: true,
		bucket: 'family',
	},
	
];

/** Shown only after the user has at least one paid invoice (see create-trust server). */
export const postPaymentQuestions: Question[] = [
	{
		id: "has-house",
		text: "Do you own a house?",
		type: 'boolean',
		required: true,
		bucket: 'property',
	},
	{
		id: "house-deed",
		text: "Do you know where the deed to your house is?",
		type: 'boolean',
		required: true,
		bucket: 'property',
		depends: { field: 'has-house', eq: true },
	},
	{
		id: "house-deed-retrieval",
		text: "Would you like us to retrieve the deed for you? ($30 retrieval fee)",
		type: 'boolean',
		required: true,
		bucket: 'property',
		depends: { field: 'house-deed', eq: false },

	},
	{
		id: "charities",
		text: "Would you like any of these charities to receive a portion of your wasiyyah?",
		type: 'charities',
		required: false,
		bucket: 'trust',

	},
	{
		id: "trustee-1",
		text: "Add the full name of the first person you would like to be a trustee",
		type: 'text',
		required: true,
		bucket: 'trust',
	},
	{
		id: "trustee-2",
		text: "Add the full name of the second person you would like to be a trustee",
		type: 'text',
		required: true,
		bucket: 'trust',
	},
	{
		id: "trustee-3",
		text: "Add the full name of the third person you would like to be a trustee",
		type: 'text',
		required: true,
		bucket: 'trust',
	},
	{
		id: "trust-name",
		text: "What would you like to call your trust?",
		type: 'text',
		required: true,
		bucket: 'trust',
	}
];

/** Full questionnaire (pre- + post-payment); use pre/post arrays when gating by payment. */
export const allIntakeQuestions: Question[] = [...prePaymentQuestions, ...postPaymentQuestions];
