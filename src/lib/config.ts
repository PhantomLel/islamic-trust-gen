import type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType } from '$lib/inheritance/types';
export type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType };

export const siteName = 'Muslim Legacy Planning';
export const siteTagline = 'Islamic Estate Planning';
export const consultationBookingUrl = 'https://mcdaniel.cliogrow.com/book/504611575cd41f17542e14c8c9c0dbde';
export const notarizationBookingUrl = 'https://calendly.com/sumayya-mcdanielestateplanning/30min';
/** Default trust preparation fee in whole USD (e.g. 1499 → $1,499.00). */
export const defaultPrepFee = 1499;

/** CAN-SPAM physical mailing address required in all marketing emails. */
export const firmMailingAddress = 'McDaniel Estate Planning, PLLC · 3800 N Lamar Blvd, Ste 200 · Austin, TX 78756';
/** Reply-to address for marketing emails (a real inbox, not no-reply). */
export const replyToEmail = 'leonard@mcdanielestateplanning.com';

/** Format a whole-dollar USD amount for display (e.g. 1499 → "$1,499.00"). */
export function formatUsd(amountUsd: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUsd);
}

// ── Jabal Foundation giving program ──────────────────────────────────────────
// 5% of the app-tier trust preparation fee (never the deed add-on, never a
// hardcoded dollar figure) is donated to Jabal Foundation's Legacy Waqf the
// same day the sale happens. Leonard McDaniel serves as treasurer of Jabal
// Foundation's board (zero compensation) — disclosed by name wherever this
// program is described.
export const jabalGivingRate = 0.05;
export const jabalFoundationUrl = 'https://www.jabalfoundation.org/';
export const jabalProPublicaUrl =
	'https://projects.propublica.org/nonprofits/organizations/923844405';

/** 5% of the trust preparation fee actually charged (excludes the deed retrieval add-on). */
export function computeJabalDonation(trustFeeAmountUsd: number): number {
	return Math.round(trustFeeAmountUsd * jabalGivingRate * 100) / 100;
}

/** Format a donation amount for display (e.g. 74.95 → "$74.95"). */
export function formatJabalDonation(trustFeeAmountUsd: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
		computeJabalDonation(trustFeeAmountUsd)
	);
}


export type ScreeningQuestion = {
	id: string;
	text: string;
	subtext?: string;
	/**
	 * When `false`, answering Yes does not send the user to the consultation path.
	 * Default: true (Yes → consultation flow).
	 */
	consultationIfYes?: boolean;
	/** When set, shown after the user selects Yes until they tap Next (same step). */
	advisoryAfterYes?: string;
};

export const screeningQuestions: ScreeningQuestion[] = [
	{
		id: 'business_ownership',
		text: 'Do you own a business?',
		consultationIfYes: false,
		advisoryAfterYes:
			'If you own a business, you should still have a trust and you can still use this app. However we strongly advise that you make amendments to your bylaws and operating agreements so that they interact with your trust. Please continue with the process, however we will reach out to you via email for a free consultation to discuss writing your trust into your corporate documents.',
	},
	{ id: 'multiple_properties', text: 'Do you own more than one property?' },
	{ id: 'blended_family', text: 'Do you have a blended family?', subtext: 'A blended family generally means you or your spouse have children from a prior relationship, or there are stepchildren involved. These situations often require customized planning beyond this online trust.' },
	{ id: 'special_needs', text: 'Do you have a special needs beneficiary?', subtext: 'A special needs beneficiary is someone who receives or may qualify for government benefits such as SSI or Medicaid due to a disability. These situations typically require specialized trust planning.' },
	{ id: 'taxable_estate', text: 'Is your estate at risk of exceeding the taxable-estate threshold?', subtext: 'Federal estate tax only applies to very large estates (generally many millions of dollars per individual). Most families will not owe federal estate tax. If you believe your estate may require advanced tax planning, a consultation is recommended.' },
];

/** True when the user may continue the online trust (no screening “Yes” on a gating question). */
export function isEligibleForOnlineTrustFromScreening(answers: Record<string, boolean>): boolean {
	for (const q of screeningQuestions) {
		if (answers[q.id] !== true) continue;
		if (q.consultationIfYes === false) continue;
		return false;
	}
	return true;
}

export type QuestionDependency = { field: string; eq: string | boolean };

export type Question = {
	id: string;
	text: string;
	subtext?: string;
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean' | 'children' | 'heir' | 'charities' | 'heirs-calculator' | 'personal-data' | 'ownership-allocation' | 'heba' | 'heba-assets' | 'assets' | 'trustee-on-first-death' | 'successor-trustees' | 'pour-over-representatives' | 'madhab' | 'heir-preview' | 'minor-distribution' | 'non-charitable-bequests' | 'house-deed' | 'summary-review';
	required: boolean;
	bucket: string;
	options?: string[];
	depends?: QuestionDependency | QuestionDependency[];
	defaultWhen?: { field: string; eq: string | boolean; value: string | boolean };
	/** Optional video to display above the question input */
	videoUrl?: string;
	/** Optional title label shown above the video */
	videoTitle?: string;
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
	/** When present, this row is a user-added charity (`charityId` is an opaque id). */
	customName?: string;
	customEin?: string;
};

export type CharitiesResponse = {
	husbandInterested: boolean;
	wifeInterested: boolean;
	husbandCharities: CharityResponse[];
	wifeCharities: CharityResponse[];
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
	/** B1: user explicitly confirmed excluding spouse despite being married in intake. */
	spouseExclusionConfirmed?: boolean;
};

export type PersonalDataResponse = {
	name: string;
	dob: string;
	county: string; // texas county
};

export type HebaResponse = {
	/** @deprecated Legacy spousal attestation — no longer collected. */
	husbandConfirmation: string | null;
	wifeConfirmation: string | null;
};

export type AssetAllocationEntry = {
	assetName: string;
	accountId?: string;
	spouse: 'husband' | 'wife' | '50-50';
};

/** Heba path asset list — all property is jointly owned, so no per-spouse designation. */
export type HebaAssetEntry = {
	assetName: string;
	accountId?: string;
};

/** @deprecated Merged into major-asset lists; kept only for reading legacy saved responses. */
export type PersonalPropertyEntry = {
	itemDescription: string;
	spouse: 'husband' | 'wife' | '50-50';
};

export type SuccessorTrusteeEntry = {
	fullName: string;
	relationship: string;
	contact?: string;
};

/** Pour-over will personal representative or guardian nominee (shared shape). */
export type PourOverRepresentativeEntry = {
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
	| CharitiesResponse
	| HeirsCalculatorResponse
	| null
	| PersonalDataResponse
	| HebaResponse
	| AssetAllocationEntry[]
	| HebaAssetEntry[]
	| PersonalPropertyEntry[]
	| SuccessorTrusteeEntry[]
	| PourOverRepresentativeEntry[]
	| MinorDistributionResponse
	| NonCharitableBequestsResponse;

export const buckets: Record<string, { label: string; icon: string }> = {
	personal: { label: 'Personal Info', icon: 'user' },
	family: { label: 'Family', icon: 'users' },
	property: { label: 'Property', icon: 'home' },
	trust: { label: 'Trust', icon: 'scroll' },
	will: { label: 'Will', icon: 'file-text' },
	review: { label: 'Review', icon: 'check-circle' },
};

export const prePaymentQuestions: Question[] = [
	{
		id: "husband-data",
		text: "First, the husband.",
		type: 'personal-data',
		required: true,
		bucket: 'personal',
		videoUrl: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10mFr7q0dnzlcbr6eI10ZaOgjXxYfTdUkiNvD9',
		videoTitle: 'Let\'s get started with some easy questions.',
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
		videoUrl: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10IAIp6MPeFonb5wydHU6i2TYhqrPZDOkXj3RJ',
		videoTitle: 'Now we need to know who will inherit your estate.'
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
	// ── Property ───────────────────────────────────────────────────────────
	{
		id: "ownership-allocation",
		text: "How would you like to establish ownership of your marital property?",
		subtext: "This determines how the Islamic inheritance shares will be applied to your estate. Choose together.",
		type: 'ownership-allocation',
		required: true,
		bucket: 'property',
		videoUrl: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10xGGHSRKgUH105vesNS8Z4FiXfaME62wjuchA',
		videoTitle: 'What wealth is yours?'
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
		id: "heba-assets",
		text: "List your major assets.",
		type: 'heba-assets',
		required: false,
		bucket: 'property',
		depends: { field: 'ownership-allocation', eq: 'heba' },
	},
	{
		id: "assets",
		text: "Designate ownership of your major assets.",
		type: 'assets',
		required: true,
		bucket: 'property',
		depends: { field: 'ownership-allocation', eq: 'assets' },
	},
	{
		id: "charities",
		text: "Would you like to include any charitable bequests in your wasiyyah?",
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
		id: "house-deed",
		text: "Upload Your House Deed",
		subtext: "If you own a house, please upload a copy of your house deed. This helps us draft your trust accurately.",
		type: 'house-deed',
		required: false,
		bucket: 'property',
	},
	// ── Trust ──────────────────────────────────────────────────────────────
	{
		id: "trustee-on-first-death",
		text: "Who will manage your trust when you are no longer able to?",
		type: 'trustee-on-first-death',
		required: true,
		bucket: 'trust',
	},
	{
		id: "husband-successor-trustees",
		text: "Husband — please name your successor trustees, in order of preference.",
		subtext: "These trustees step in for your share of the trust if you are no longer able to serve. Name at least two, in order of preference.",
		type: 'successor-trustees',
		required: true,
		bucket: 'trust',
	},
	{
		id: "wife-successor-trustees",
		text: "Wife — please name your successor trustees, in order of preference.",
		subtext: "These trustees step in for your share of the trust if you are no longer able to serve. Name at least two, in order of preference.",
		type: 'successor-trustees',
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
		subtext:
			"Regardless of which option you choose, your trustee may distribute a child's inheritance to them at any time if they believe the child has rushd — the maturity and sound judgment to manage their inheritance responsibly.",
		type: 'minor-distribution',
		required: true,
		bucket: 'trust',
		videoUrl: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10nJllLYDNQrS24zUAo7hYkq0V6PBGpLRuJayO',
		videoTitle: 'Children\'s inheritance distribution'
	},
	{
		id: "madhab",
		text: "Which school of Islamic jurisprudence do you follow?",
		type: 'madhab',
		required: true,
		bucket: 'trust',
	},
	{
		id: "trust-name",
		text: "What would you like to call your trust?",
		subtext:
			'You can name your trust quite literally anything. It could be personal, such as "The Khan Family Trust" or "The Sarah and Ahmed Trust." It could also be Islamic, such as "The Bismillah Trust." There are no requirements as to how you name your trust. It is simply a marker.',
		type: 'text',
		required: true,
		bucket: 'trust',
	},
	// ── Pour-over will ─────────────────────────────────────────────────────
	{
		id: "husband-personal-representatives",
		text: "Husband — who are the personal representatives on your pour-over will?",
		subtext: "Your personal representative (also called an executor) manages your estate through probate before any remaining assets pour over into the trust. Name up to three, in order of preference.",
		type: 'pour-over-representatives',
		required: true,
		bucket: 'will',
		videoUrl: 'https://xpxx9c4eks.ufs.sh/f/xrmNhsKgUH10yXz3q1Ncb63rAR8KDBn2h140uEaitxHCSkwQ',
		videoTitle: 'Pour-Over Will'
	},
	{
		id: "husband-guardians",
		text: "Husband — who are the guardians on your pour-over will?",
		subtext: "If both spouses pass while any child is still a minor, the guardian is the person who raises your children. Name up to three, in order of preference.",
		type: 'pour-over-representatives',
		required: true,
		bucket: 'will',
	},
	{
		id: "wife-personal-representatives",
		text: "Wife — who are the personal representatives on your pour-over will?",
		subtext: "Your personal representative (also called an executor) manages your estate through probate before any remaining assets pour over into the trust. Name up to three, in order of preference.",
		type: 'pour-over-representatives',
		required: true,
		bucket: 'will',
	},
	{
		id: "wife-guardians",
		text: "Wife — who are the guardians on your pour-over will?",
		subtext: "If both spouses pass while any child is still a minor, the guardian is the person who raises your children. Name up to three, in order of preference.",
		type: 'pour-over-representatives',
		required: true,
		bucket: 'will',
	},
	// ── Review ─────────────────────────────────────────────────────────────
	{
		id: "summary-review",
		text: "Here is your trust — please review everything before we generate your document.",
		type: 'summary-review',
		required: true,
		bucket: 'review',
	},
];

/** First question after payment (property / marital ownership); used when returning from checkout. */
export const postPaymentEntryQuestionId = postPaymentQuestions[0]!.id;

/** Full questionnaire (pre- + post-payment); use pre/post arrays when gating by payment. */
export const allIntakeQuestions: Question[] = [...prePaymentQuestions, ...postPaymentQuestions];
