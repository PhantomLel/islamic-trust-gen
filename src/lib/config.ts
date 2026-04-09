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
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean' | 'children' | 'heir' | 'charities' | 'heirs-calculator' | 'personal-data' | 'ownership-allocation' | 'heba' | 'assets' | 'separate-property' | 'trustee-on-first-death' | 'successor-trustees' | 'madhab' | 'heir-preview' | 'minor-distribution' | 'non-charitable-bequests';
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

export type HebaResponse = {
	husbandConfirmation: string | null;
	wifeConfirmation: string | null;
};

export type AssetAllocationEntry = {
	assetName: string;
	accountId?: string;
	spouse: 'husband' | 'wife' | '50-50';
};

export type SeparatePropertyEntry = {
	assetName: string;
	accountId?: string;
	approximateValue?: string;
};

export type SeparatePropertyResponse = {
	husband: SeparatePropertyEntry[];
	wife: SeparatePropertyEntry[];
};

export type SuccessorTrusteeEntry = {
	fullName: string;
	relationship: string;
	contact?: string;
};

/** Wasiyyah to non-heirs; percentages only, combined with charities under one-third of estate. */
export type NonCharitableBequestEntry = {
	recipientName: string;
	relationship: string;
	percentage: number;
};

export type NonCharitableBequestsResponse = {
	husbandInterested: boolean;
	wifeInterested: boolean;
	husbandBequests: NonCharitableBequestEntry[];
	wifeBequests: NonCharitableBequestEntry[];
};

/** Article Thirteen — minor beneficiary distribution (only one mode is stored for drafting). */
export type MinorDistributionStaggered = {
	mode: 'staggered';
	firstPercent: number;
	firstAge: number;
	secondPercent: number;
	secondAge: number;
	remainderAge: number;
};

export type MinorDistributionSingleAge = {
	mode: 'single-age';
	age: number;
};

export type MinorDistributionAgeOfMajority = {
	mode: 'age-of-majority';
};

export type MinorDistributionResponse =
	| MinorDistributionStaggered
	| MinorDistributionSingleAge
	| MinorDistributionAgeOfMajority;

export type QuestionResponseValue =
	| string
	| boolean
	| ChildResponse[]
	| HeirResponse[]
	| CharityResponse[]
	| HeirsCalculatorResponse
	| null
	| PersonalDataResponse
	| HebaResponse
	| AssetAllocationEntry[]
	| SeparatePropertyResponse
	| SuccessorTrusteeEntry[]
	| MinorDistributionResponse
	| NonCharitableBequestsResponse;

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
		id: "ownership-allocation",
		text: "How would you like to establish ownership of your marital property?",
		subtext: "This determines how the Islamic inheritance shares will be applied to your estate. Choose together.",
		type: 'ownership-allocation',
		required: true,
		bucket: 'property',
	},
	{
		id: "heba",
		text: "Before we continue — please read this carefully. Both of you.",
		type: 'heba',
		required: true,
		bucket: 'property',
		depends: { field: 'ownership-allocation', eq: 'heba' },
	},
	{
		id: "assets",
		text: "Let's designate who owns what.",
		type: 'assets',
		required: true,
		bucket: 'property',
		depends: { field: 'ownership-allocation', eq: 'assets' },
	},

	{
		id: "separate-property",
		text: "Did either of you own property before the marriage, or receive a personal gift or inheritance during the marriage?",
		type: 'separate-property',
		required: false,
		bucket: 'property',
	},

	{
		id: "trustee-on-first-death",
		text: "Who will manage your trust when you are no longer able to?",
		type: 'trustee-on-first-death',
		required: true,
		bucket: 'trust',
	},
	{
		id: "successor-trustees",
		text: "Please name your successor trustees, in order of preference.",
		type: 'successor-trustees',
		required: true,
		bucket: 'trust',
	},
	{
		id: "madhab",
		text: "Which school of Islamic jurisprudence do you follow?",
		type: 'madhab',
		required: true,
		bucket: 'trust',
	},
	{
		id: "heir-preview",
		text: "Here are your heirs and their estimated shares.",
		type: 'heir-preview',
		required: true,
		bucket: 'trust',
	},
	{
		id: "minor-distribution",
		text: "How should your children receive their inheritance?",
		type: 'minor-distribution',
		required: true,
		bucket: 'trust',
	},
	{
		id: "charities",
		text: "Would you like any of these charities to receive a portion of your wasiyyah?",
		type: 'charities',
		required: false,
		bucket: 'property',

	},
	{
		id: "non-charitable-bequests",
		text: "Would either of you like to leave something to someone who is not an Islamic heir?",
		type: 'non-charitable-bequests',
		required: false,
		bucket: 'property',
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
