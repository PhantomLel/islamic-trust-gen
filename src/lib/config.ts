import type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType } from '$lib/inheritance/types';
export type { EstateInput, BlockedHeir, FractionValue, HeirType, ShareType };

export const siteName = 'Muslim Legacy Planning';
export const siteTagline = 'Islamic Estate Planning';
export const consultationBookingUrl = 'https://mcdaniel.cliogrow.com/book/504611575cd41f17542e14c8c9c0dbde';
export const notarizationBookingUrl = 'https://calendly.com/sumayya-mcdanielestateplanning/30min';
/** Default trust preparation fee in whole USD (e.g. 1499 → $1,499.00). */
export const defaultPrepFee = 1499;
/** Optional house-deed retrieval service fee in whole USD (Appendix A Schedule A). A service fee, not a pass-through cost. */
export const deedRetrievalFeeUsd = 35;

/** CAN-SPAM physical mailing address required in all marketing emails. */
export const firmNap = {
	name: 'McDaniel Estate Planning, PLLC',
	street: '13100 Wortham Center Drive, 3rd Floor',
	city: 'Houston',
	region: 'TX',
	postalCode: '77065',
	phone: '(713) 659-9668',
	phoneTel: '+17136599668',
	email: 'admin@mcdanielestateplanning.com',
} as const;

export const firmMailingAddress = `${firmNap.name} · ${firmNap.street}, ${firmNap.city}, ${firmNap.region} ${firmNap.postalCode}`;
export const firmPhone = firmNap.phone;
export const firmPhoneTel = firmNap.phoneTel;

/** Reply-to address for marketing emails (a real inbox, not no-reply). */
export const replyToEmail = 'leonard@mcdanielestateplanning.com';

/** Single-line firm NAP (AA W9.5). */
export function formatFirmNapLine(): string {
	return `${firmNap.name} · ${firmNap.street}, ${firmNap.city}, ${firmNap.region} ${firmNap.postalCode} · ${firmNap.phone} · ${firmNap.email}`;
}

/** Format a whole-dollar USD amount for display (e.g. 1499 → "$1,499.00"). */
export function formatUsd(amountUsd: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUsd);
}

/** MLP homepage hero. Replace this object to swap the photo. */
export const mlpHeroImage = {
	src: '/pfp.jpg',
	alt: 'Leonard McDaniel, estate planning attorney.',
	width: 720,
	height: 1080,
} as const;

/** Public list prices: whole dollars, no cents (AA W8.2). */
export function formatUsdWhole(amountUsd: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amountUsd);
}

// ── Product name (spec v3 §2.1–2.2) ──────────────────────────────────────────
// The single source of the product name. Never hard-code any of these strings
// in a page, component, email, document template, or help answer. Internal keys
// (`goodtree-trust`, `goodtree_fit`, Calendly `utm_source=goodtree`) are stored
// data / webhook contracts and intentionally keep their historical spelling.

/** Full name — used as the tier name and wherever the product is named as an offer or heading. */
export const productName = 'The Muslim Legacy Planning Guided Trust';
/** Approved short form for running sentences. */
export const productNameShort = 'the Guided Trust';
/** Second approved short form for running sentences. */
export const productNameRunning = 'our guided trust plan';
/** Required sentence rendered in the same view whenever the full name is a tier, offer, or heading. */
export const productAttorneyReviewSentence =
	'Complete the guided interview online or with our assistance; an attorney reviews your information and documents before finalization.';

export type ProductNames = {
	productName: string;
	productNameShort: string;
	productNameRunning: string;
};

export const productNames: ProductNames = { productName, productNameShort, productNameRunning };

/** Lower-case a leading "The " so the full name can sit mid-sentence ("…built the Muslim Legacy Planning Guided Trust…"). */
export function productNameMidSentence(names: ProductNames = productNames): string {
	return names.productName.replace(/^The /, 'the ');
}

/** The short form without its article ("the Guided Trust" → "Guided Trust"), for "For every Guided Trust purchased". */
export function productNameShortBare(names: ProductNames = productNames): string {
	return names.productNameShort.replace(/^the /i, '');
}

/** Upper-case the first character, for a short form that opens a sentence. */
export function productNameShortCapitalized(names: ProductNames = productNames): string {
	const s = names.productNameShort;
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Replace `{{productName}}`, `{{productNameShort}}`, `{{productNameRunning}}` tokens at render time.
 * Used by help answers, CMS bodies and transcripts so a rename never needs a re-edit or re-approval.
 */
export function renderProductTokens(text: string, names: ProductNames = productNames): string {
	return text
		.replaceAll('{{productNameShort}}', names.productNameShort)
		.replaceAll('{{productNameRunning}}', names.productNameRunning)
		.replaceAll('{{productName}}', names.productName);
}

// ── Firm identity (spec v3 §2.11) ────────────────────────────────────────────
export const firmIdentityLine =
	'Muslim Legacy Planning is the Islamic estate-planning service of McDaniel Estate Planning, PLLC. Legal services by Leonard McDaniel, licensed in Texas and California.';
export const firmDescriptionLine =
	'An attorney-led estate-planning practice offering educational resources and technology-assisted legal services.';
export const attorneyName = 'Leonard McDaniel';
/** Short byline for content pages (Appendix A §5.3). The name is rendered as a link to the profile; this is the rest of the sentence. */
export const attorneyBylineRest =
	' is an estate planning attorney licensed in Texas and California. He has focused on estate planning for Muslim families since 2022.';
export const mlpOrigin = 'https://www.muslimlegacyplanning.com';
export const mcdanielOrigin = 'https://www.mcdanielestateplanning.com';
export const attorneyProfileUrl = `${mcdanielOrigin}/attorney`;
export const attorneyPersonId = `${attorneyProfileUrl}#person`;
export const firmLegalServiceId = `${mcdanielOrigin}/#legalservice`;
export const googlePlaceId = 'ChIJszQ9uNfRQIYRg3017kJNF8Y';
/** Elfsight Google Reviews widget (AA-W5, D8). Home pages only. */
export const elfsightReviewsAppId = 'fdfb23d6-45c5-41bd-950a-d905edc79df1';
export const googleWriteReviewUrl =
	`https://search.google.com/local/writereview?placeid=${googlePlaceId}`;
export const googleReadReviewsUrl =
	`https://search.google.com/local/reviews?placeid=${googlePlaceId}`;

// ── Jabal Foundation giving program (Appendix A §3) ──────────────────────────
// A fixed $75 gift of the Firm's own funds per Guided Trust purchased. It is NOT
// computed from the fee and NOT a checkout split: no Stripe transfer, second
// charge, or payout is created for it. Leonard McDaniel serves without
// compensation as secretary of Jabal Foundation's board.
export const jabalDonationUsd = 75;
export const jabalFoundationUrl = 'https://www.jabalfoundation.org/';
export const jabalProPublicaUrl =
	'https://projects.propublica.org/nonprofits/organizations/923844405';

/** The fixed donation figure for display, e.g. "$75" (never derived from the fee charged). */
export function formatJabalDonation(): string {
	return formatUsdWhole(jabalDonationUsd);
}

/** Appendix A §3.2 — landing page giving section (short form rendered from config). */
export function jabalLandingCopy(names: ProductNames = productNames): string {
	return `For every ${productNameShortBare(names)} purchased, McDaniel Estate Planning donates ${formatJabalDonation()} of its own funds to Jabal Foundation's Legacy Waqf, which supports orphan development and ongoing meal distribution. The donation is made by the Firm and is not part of your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.`;
}

/** Appendix A §3.2 — payment screen, beneath the fee. */
export function jabalPaymentCopy(): string {
	return `With your purchase, McDaniel Estate Planning will donate ${formatJabalDonation()} of its own funds to Jabal Foundation's Legacy Waqf. This does not come from or add to your fee. Leonard McDaniel serves without compensation as secretary of Jabal Foundation's board.`;
}

/** Appendix A §3.2 — confirmation after payment and payment-received email. */
export function jabalConfirmationCopy(): string {
	return `Thank you. McDaniel Estate Planning will donate ${formatJabalDonation()} of its own funds to Jabal Foundation's Legacy Waqf in connection with your purchase. Leonard McDaniel serves without compensation as secretary of the foundation's board.`;
}

/** Appendix A §3.2 — beside the Jabal entry in the charitable picker. */
export const jabalPickerDisclosure =
	"Leonard McDaniel, your attorney, serves without compensation as secretary of this organization's board. Including it is entirely your choice and has no effect on your plan, your fee, or our work for you.";
/** Appendix A §3.2 — explicit confirm prompt when Jabal is selected. */
export const jabalPickerConfirmPrompt =
	'You have selected Jabal Foundation, where your attorney serves as an unpaid board secretary. Please confirm this gift reflects your own wishes.';
/** Appendix A §3.2 — charitable picker section heading. */
export const charityPickerHeading =
	'Some Islamic charities in Texas. Listing an organization here is not a recommendation. You may also add any U.S. charity by its legal name and EIN, or leave no charitable gift.';

// ── Intake privacy notice (spec v3 §4.2) ─────────────────────────────────────
export const intakePrivacyNotice =
	'We use your information to evaluate and, if accepted, provide legal services. Access is limited to authorized firm personnel and service providers operating under confidentiality and security obligations. We do not send your interview answers, documents, or identifiable consultation or client activity to advertising platforms, and we do not use them to build advertising audiences. Optional educational and marketing subscriptions are separate. Our privacy notice explains the information collected, its purposes, service providers, retention, and how to contact us about privacy.';

// ── Out-of-state exit (spec v3 §3.1) ─────────────────────────────────────────
export const outOfStateExitParagraphs = [
	'We currently prepare wills only for Texas and California matters. We are not able to prepare a document for the state you selected.',
	'You are welcome to use the educational resources on this site. If you would like a referral to an attorney licensed in your state, contact us and we will help where we can.'
] as const;

export const outOfStateRealPropertyQuestion =
	'Do you own real property in Texas or California, or do you expect your estate to be administered there?';

/** Educational exit targets. Phase 7 ships both indexes. */
export const contentLibraryHref = '/answers';
export const videoLibraryHref = '/videos';

// ── Email capture and marketing opt-in (spec v3 §4.3) ───────────────────────
/** States what the email is for, in the spec's own terms. */
export const emailPurposeNotice =
	'We use your email to deliver your document and to communicate about your request.';

/** Exact label. Unchecked by default, never bundled into account creation or terms. */
export const marketingConsentLabel =
	'Send me occasional educational and service emails from McDaniel Estate Planning. I may unsubscribe at any time; this is not required to request the free will.';

// ── Testimonial disclaimer (spec v3 §2.8) ────────────────────────────────────
export const testimonialDisclaimer =
	'Client experience; not a guarantee of results. Legal outcomes depend on the circumstances, proper execution, and implementation.';


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
	/** ISO timestamp of the explicit Jabal Foundation confirmation (Appendix A §3.2). Set only on the Jabal entry. */
	jabalConfirmedAt?: string;
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
