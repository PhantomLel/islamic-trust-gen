/**
 * Centralized user-facing copy for Make Your Trust Work.
 * Non-developers edit visible legal-adjacent language here only.
 */

import { consultationBookingUrl } from '$lib/config';

export type FundingPhaseId = 'prepare' | 'complete';

export type FundingModuleId =
	| 'get_oriented'
	| 'get_ready_to_sign'
	| 'gather_forms'
	| 'finish_signing'
	| 'update_institutions'
	| 'protect_share';

export type FundingMilestoneKey =
	| 'download_review'
	| 'find_your_stuff'
	| 'funding_explainer'
	| 'webinar'
	| 'prepare_sign_trust'
	| 'prepare_pour_over'
	| 'home_deed_office'
	| 'forms_bank'
	| 'forms_brokerage'
	| 'forms_employer'
	| 'forms_ira'
	| 'forms_life'
	| 'confirm_trust_signing'
	| 'will_signing'
	| 'bank_brokerage'
	| 'employer_retirement'
	| 'ira'
	| 'life_insurance'
	| 'vehicles'
	| 'crypto_digital'
	| 'home_insurance'
	| 'homestead'
	| 'storage'
	| 'trustee_notification'
	| 'family_discussion';

export type FundingChecklistItem = {
	id: string;
	label: string;
};

/**
 * Categories used to match the asset list the user typed during intake against the funding cards.
 * A card can cover more than one (bank and brokerage share a card).
 */
export type FundingAssetCategory =
	| 'bank'
	| 'brokerage'
	| 'employer_plan'
	| 'ira'
	| 'life_insurance'
	| 'vehicle'
	| 'crypto'
	| 'real_property';

/**
 * When a card offers the consult CTA. The retirement cards gate it on the user's own risk answers
 * rather than showing it to everyone, so the button stays a real routing signal — a click means
 * someone with an actual risk factor asked for help.
 */
export type FundingConsultCondition =
	| 'always'
	/** Retirement beneficiary is someone other than the spouse, or the user is unsure. */
	| 'retirement_beneficiary_risk'
	/** Beneficiary risk, or combined retirement accounts over the threshold. */
	| 'retirement_risk';

export type FundingMilestoneContent = {
	key: FundingMilestoneKey;
	moduleId: FundingModuleId;
	phase: FundingPhaseId;
	title: string;
	body: string;
	warning?: string;
	checklist: FundingChecklistItem[];
	/** Optional video URL; hide video block when null/empty. */
	videoUrl?: string | null;
	/** Allow user to mark N/A. */
	allowNa?: boolean;
	/** Show the consult CTA, either always or only when the user's answers show risk. */
	consultWhen?: FundingConsultCondition;
	/** Exclude from completion denominator (e.g. webinar without URL handled in logic). */
	excludeFromCompletion?: boolean;
	/** Informational only — no user checklist completion required beyond admin status. */
	informational?: boolean;
	/** Show the assets the user listed at intake that may belong to this step. */
	assetCategories?: FundingAssetCategory[];
};

export type FundingModuleContent = {
	id: FundingModuleId;
	phase: FundingPhaseId;
	title: string;
	shortLabel: string;
	milestoneKeys: FundingMilestoneKey[];
};

export type FindYourStuffQuestion = {
	field:
		| 'ownsHome'
		| 'hasBankAccounts'
		| 'hasBrokerage'
		| 'hasEmployerPlan'
		| 'hasIra'
		| 'hasLifeInsurance'
		| 'hasVehicle'
		| 'hasCrypto'
		| 'hasBusiness'
		| 'retirementOverThreshold';
	question: string;
};

export const FUNDING_DISCLAIMER =
	'This dashboard gives general implementation guidance for the Good Tree Trust App. It is not individualized legal, tax, or investment advice. Each bank, employer plan, custodian, insurer, and county has its own current process. Always follow the institution’s instructions and save written confirmation.';

export const FUNDING_SUBTITLE =
	'Your documents are only the first step. This dashboard walks you through signing, funding, storing, and sharing the information your family may need later.';

export const COMPLETE_PHASE_LOCKED_EXPLAINER =
	'You can prepare everything now — we just wait until your trust is signed before you submit anything to a bank or insurer, so nothing references a trust that doesn’t exist yet.';

export const COMPLETION_BANNER_TITLE = 'Your Guided Steps Are Complete';

export const COMPLETION_BANNER_BODY =
	'You have completed the guided steps in your Make Your Trust Work dashboard. Keep your originals, confirmations, and access instructions safe, and review everything once a year or after any major life change. Completing these steps makes your plan much more likely to work smoothly, though no plan can guarantee every asset avoids court involvement.';

export const NEED_HELP_MODAL_BODY =
	'Most questions are covered in the cards or the Good Tree webinar. If your question is about your specific accounts, family, taxes, or assets, a consultation is the right move because this app cannot give individual advice.';

export const PREPARE_COMPLETE_WHILE_LOCKED_COPY =
	'You’re ready for the next chapter — after notarization you’ll unlock Update Institutions so you can submit changes to banks and insurers.';

export const PREPARE_PHASE_COMPLETE_TITLE = 'Prepare Your Funding — complete';

export const PREPARE_PHASE_COMPLETE_BODY =
	'You’ve finished every preparation step. There’s nothing else to do here until your trust is signed — then Complete Your Funding will unlock so you can submit changes to banks and insurers.';

export const COMPLETE_PHASE_COMPLETE_TITLE = 'Complete Your Funding — complete';

export const COMPLETE_PHASE_COMPLETE_BODY =
	'Every post-signing step is done. Keep your originals, confirmations, and access instructions safe, and review everything once a year or after any major life change.';

export const FUNDING_UNLOCKED_BANNER =
	'Your trust is signed — you can finish funding steps now.';

/** Admin-editable via config; empty → generic contact message. */
export const fundingBookingUrl = consultationBookingUrl;

/** Optional webinar URLs — set when available; empty hides webinar milestone. */
export const webinarRegistrationUrl: string | null = null;
export const webinarReplayUrl: string | null = null;
export const willSigningEnabled = true;

/** Optional explainer video for Prepare. */
export const fundingExplainerVideoUrl: string | null = null;

export const FIND_YOUR_STUFF_QUESTIONS: FindYourStuffQuestion[] = [
	{
		field: 'ownsHome',
		question: 'Do you own the home you live in?',
	},
	{
		field: 'hasBankAccounts',
		question: 'Do you have checking, savings, or credit union accounts?',
	},
	{
		field: 'hasBrokerage',
		question:
			'Do you have a regular non-retirement investment account, like Schwab, Fidelity, Vanguard, Robinhood, or a brokerage account?',
	},
	{
		field: 'hasEmployerPlan',
		question:
			'Do you have a retirement plan through work, like a 401(k), 403(b), pension, TSP, or profit-sharing plan?',
	},
	{
		field: 'hasIra',
		question: 'Do you have an IRA, such as a Traditional IRA, Roth IRA, SEP IRA, or SIMPLE IRA?',
	},
	{
		field: 'hasLifeInsurance',
		question: 'Do you have life insurance, either your own policy or through work?',
	},
	{
		field: 'hasVehicle',
		question: 'Do you own a car or truck?',
	},
	{
		field: 'hasCrypto',
		question:
			'Do you own cryptocurrency or valuable digital assets, like Coinbase, an exchange account, a hardware wallet, or MetaMask?',
	},
	{
		field: 'hasBusiness',
		question: 'Do you own a business or professional practice?',
	},
	{
		field: 'retirementOverThreshold',
		question: 'Very roughly, are your combined retirement accounts over $250,000?',
	},
];

/**
 * Asked only of married users who have an employer plan or IRA. Naming anyone other than a
 * spouse changes the tax and rollover analysis, so the answer routes the user to a consultation
 * and raises an admin flag rather than being answered by the app.
 */
export const RETIREMENT_BENEFICIARY_QUESTION: {
	field: 'retirementBeneficiary';
	question: string;
	help: string;
	options: { value: 'spouse_sole' | 'other' | 'not_sure'; label: string }[];
} = {
	field: 'retirementBeneficiary',
	question: 'On your retirement accounts, who is currently named as primary beneficiary?',
	help: 'This does not change anything. It only tells us whether your situation needs a conversation before you update beneficiary forms.',
	options: [
		{ value: 'spouse_sole', label: 'My spouse, as the only primary beneficiary' },
		{ value: 'other', label: 'Someone or something else — a child, my trust, or a charity' },
		{ value: 'not_sure', label: 'Not sure' },
	],
};

export const ASSET_REFERENCE_TITLE = 'Assets you listed';

/** Reinforces the core message: the trust schedule is not the institution's record. */
export const ASSET_REFERENCE_NOTE =
	'You listed these when you set up your trust. Naming an asset there does not change the institution’s own records — that is what this step is for.';

export const ASSET_REFERENCE_MATCH_HINT =
	'These look like they belong to this step, based on how you described them. You know your accounts best, so use your own judgment.';

export const ASSET_REFERENCE_NO_MATCH_HINT =
	'Nothing you listed clearly belongs to this step. Your full list is here in case it helps.';

export const ASSET_REFERENCE_SHOW_ALL = 'Show everything I listed';
export const ASSET_REFERENCE_HIDE_ALL = 'Hide the full list';

export const RETIREMENT_BENEFICIARY_RISK_NOTE =
	'You told us your retirement accounts name someone other than your spouse as primary beneficiary, or that you are not sure. That choice can change the taxes your beneficiaries pay and can affect a surviving spouse’s rollover options. Please book a consultation before you submit any beneficiary forms.';

export const CATEGORY_TRANSLATION: {
	recognizes: string;
	category: string;
	whatToDo: string;
	warning: string;
}[] = [
	{
		recognizes: 'Chase, Bank of America, Wells Fargo, credit union checking/savings',
		category: 'Bank accounts',
		whatToDo:
			'Ask the bank whether to retitle to the trust or add POD/TOD beneficiary; use the bank’s process; save confirmation.',
		warning: 'Listing an account in the trust does not change the bank’s records.',
	},
	{
		recognizes: 'Schwab, Fidelity, Vanguard taxable, Robinhood taxable',
		category: 'Non-retirement brokerage',
		whatToDo: 'Use the institution’s process for trust title or TOD beneficiary; save confirmation.',
		warning: 'The brokerage’s records control; a trust schedule is not enough.',
	},
	{
		recognizes: '401(k), 403(b), pension, TSP, profit-sharing',
		category: 'Employer retirement plan',
		whatToDo:
			'Use the plan’s beneficiary forms. If married, ask about spouse consent and plan-specific requirements.',
		warning: 'Online entry may not be enough if spouse consent or a plan form is required.',
	},
	{
		recognizes: 'Traditional IRA, Roth IRA, SEP IRA, SIMPLE IRA',
		category: 'IRA',
		whatToDo:
			'Use the custodian’s beneficiary process; ask about spouse acknowledgment and trust documentation.',
		warning: 'IRAs are different from employer plans; naming a trust can affect taxes and spouse options.',
	},
	{
		recognizes: 'Life insurance through work or private carrier',
		category: 'Life insurance',
		whatToDo: 'Use the carrier’s beneficiary process; save written confirmation.',
		warning: 'Changing beneficiary is different from changing policy ownership.',
	},
	{
		recognizes: 'Your home',
		category: 'Real property',
		whatToDo:
			'Our office handles your deed; after it is recorded, complete your homeowners insurance and homestead exemption steps.',
		warning: 'Listing the home in the trust does not transfer title by itself.',
	},
	{
		recognizes: 'Car or truck',
		category: 'Vehicle',
		whatToDo: 'Use your state’s DMV transfer-on-death/beneficiary option if available.',
		warning: 'Ordinary vehicles generally should not go into the trust through this app.',
	},
	{
		recognizes: 'Coinbase, exchanges, hardware wallet, MetaMask',
		category: 'Crypto / digital assets',
		whatToDo: 'Create a secure inventory and offline access plan; get separate advice if significant.',
		warning: 'Never upload keys or seed phrases; listing an account may not guarantee access.',
	},
];

export const ADMIN_NOTE_TEMPLATES: { id: string; label: string; body: string }[] = [
	{
		id: 'clarification',
		label: 'Clarification needed',
		body: 'We need clarification before your documents can be finalized. Please review the note below and reply with the requested information.',
	},
	{
		id: 'deed',
		label: 'Deed issue',
		body: 'We need additional information about your home or deed before this step can be completed. Please contact our office or reply with the requested details.',
	},
	{
		id: 'signing',
		label: 'Signing issue',
		body: 'Please pause before signing. We need to clarify a signing or notarization issue to help avoid problems with your documents.',
	},
	{
		id: 'retirement',
		label: 'Retirement-account issue',
		body: 'Your retirement-account situation may require additional review before you complete beneficiary designations. Please book a consultation or contact our office before making changes.',
	},
	{
		id: 'complex',
		label: 'Complex asset issue',
		body: 'One of your assets may require individualized planning. The app can provide general guidance, but this issue should be reviewed separately.',
	},
	{
		id: 'general',
		label: 'General attorney review note',
		body: 'Our office has a note for you before you continue. Please review the message below and respond before completing this step.',
	},
];

export const FUNDING_MODULES: FundingModuleContent[] = [
	{
		id: 'get_oriented',
		phase: 'prepare',
		title: 'Get Oriented',
		shortLabel: 'Orient',
		milestoneKeys: ['download_review', 'find_your_stuff', 'funding_explainer', 'webinar'],
	},
	{
		id: 'get_ready_to_sign',
		phase: 'prepare',
		title: 'Get Ready to Sign',
		shortLabel: 'Sign prep',
		milestoneKeys: ['prepare_sign_trust', 'prepare_pour_over', 'home_deed_office'],
	},
	{
		id: 'gather_forms',
		phase: 'prepare',
		title: 'Gather Your Forms',
		shortLabel: 'Forms',
		milestoneKeys: ['forms_bank', 'forms_brokerage', 'forms_employer', 'forms_ira', 'forms_life'],
	},
	{
		id: 'finish_signing',
		phase: 'complete',
		title: 'Finish Signing',
		shortLabel: 'Signing',
		milestoneKeys: ['confirm_trust_signing', 'will_signing'],
	},
	{
		id: 'update_institutions',
		phase: 'complete',
		title: 'Update Institutions',
		shortLabel: 'Institutions',
		milestoneKeys: [
			'bank_brokerage',
			'employer_retirement',
			'ira',
			'life_insurance',
			'vehicles',
			'crypto_digital',
			'home_insurance',
			'homestead',
		],
	},
	{
		id: 'protect_share',
		phase: 'complete',
		title: 'Protect & Share',
		shortLabel: 'Protect',
		milestoneKeys: ['storage', 'trustee_notification', 'family_discussion'],
	},
];

export const FUNDING_MILESTONES: FundingMilestoneContent[] = [
	{
		key: 'download_review',
		moduleId: 'get_oriented',
		phase: 'prepare',
		title: 'Download and Review Documents',
		body: 'Download your documents and review them carefully before signing. Check every name and spelling, trustee and guardian choices, inheritance information, and signing instructions. If something looks wrong, contact us before signing; corrections are easier now than later.',
		warning:
			'Do not change the documents yourself. If something is wrong, contact our office and we will correct and reissue the documents.',
		checklist: [
			{ id: 'downloaded', label: 'Downloaded my documents' },
			{ id: 'reviewed_names', label: 'Reviewed names and spellings' },
			{ id: 'reviewed_trustees', label: 'Reviewed trustee and guardian choices' },
			{ id: 'reviewed_signing', label: 'Reviewed signing instructions' },
			{
				id: 'no_edit',
				label: 'I understand I should not edit, retype, or hand-mark the documents myself',
			},
		],
	},
	{
		key: 'find_your_stuff',
		moduleId: 'get_oriented',
		phase: 'prepare',
		title: 'Find Your Stuff',
		body: 'Answer a few questions about what you own so we can show the right funding cards. “Not sure” shows the card — you can mark it not applicable later if needed.',
		checklist: [],
	},
	{
		key: 'funding_explainer',
		moduleId: 'get_oriented',
		phase: 'prepare',
		title: 'Watch the Funding Explainer',
		body: 'A short overview of why institution records control what happens to accounts, and how preparation now makes the post-signing steps faster.',
		videoUrl: fundingExplainerVideoUrl,
		checklist: [{ id: 'watched', label: 'Watched the funding explainer (or read the written guidance)' }],
		excludeFromCompletion: !fundingExplainerVideoUrl,
	},
	{
		key: 'webinar',
		moduleId: 'get_oriented',
		phase: 'prepare',
		title: 'Funding Webinar',
		body: 'Good Tree may offer live or recorded webinars walking through signing, funding, beneficiary designations, trustee notification, and common mistakes.',
		warning: 'The webinar is general education. It does not replace individual advice.',
		checklist: [{ id: 'registered', label: 'Registered for the next webinar or watched the replay' }],
		excludeFromCompletion: !(webinarRegistrationUrl || webinarReplayUrl),
	},
	{
		key: 'prepare_sign_trust',
		moduleId: 'get_ready_to_sign',
		phase: 'prepare',
		title: 'Prepare to Sign Your Trust',
		body: 'Your trust documents must be signed correctly to work. Follow the signing instructions in your package. Schedule your notarization appointment and arrange witnesses if required. You will confirm signing after the notarization session.',
		warning:
			'Do not schedule informal signing on your own if our office is coordinating online notarization. Follow the instructions in your package.',
		checklist: [
			{ id: 'read_instructions', label: 'Read the signing instructions' },
			{ id: 'arranged_witnesses', label: 'Arranged witnesses if required' },
			{ id: 'scheduled_notarization', label: 'Scheduled my notarization appointment' },
		],
	},
	{
		key: 'prepare_pour_over',
		moduleId: 'get_ready_to_sign',
		phase: 'prepare',
		title: 'Prepare Your Pour-Over Will Signing',
		body: 'Your pour-over will is different from your trust and deed. It may require in-person signing formalities, witnesses, and/or an in-person notary. Plan those steps now; confirm the signing after notarization in the Complete phase.',
		warning:
			'Do not treat the will as complete merely because your trust or deed was handled through an online process.',
		checklist: [
			{ id: 'read_will_instructions', label: 'Read the pour-over will signing instructions' },
			{ id: 'arranged_will_witnesses', label: 'Arranged required witnesses' },
			{ id: 'arranged_in_person_notary', label: 'Arranged an in-person notary' },
		],
	},
	{
		key: 'home_deed_office',
		moduleId: 'get_ready_to_sign',
		phase: 'prepare',
		title: 'Home / Deed (Handled by Our Office)',
		body: 'If your home is part of your trust plan, our office prepares, coordinates signing, and records the deed for your primary residence. You do not need to file the deed yourself through this app.',
		warning:
			'A trust does not control your home just because the home is listed in your documents. Until the deed is recorded by our office, that step is not done.',
		checklist: [
			{ id: 'understood', label: 'I understand our office handles deed preparation and recording' },
		],
		informational: true,
	},
	{
		key: 'forms_bank',
		moduleId: 'gather_forms',
		phase: 'prepare',
		title: 'Gather Bank Forms',
		body: 'Contact each bank or find their trust retitle / POD forms so you are ready to submit after signing.',
		checklist: [{ id: 'ready', label: 'I have the forms or know where to get them for each bank' }],
		allowNa: true,
		assetCategories: ['bank'],
	},
	{
		key: 'forms_brokerage',
		moduleId: 'gather_forms',
		phase: 'prepare',
		title: 'Gather Brokerage Forms',
		body: 'Locate each brokerage’s trust title or TOD beneficiary process.',
		checklist: [{ id: 'ready', label: 'I have the forms or know where to get them for each brokerage' }],
		allowNa: true,
		assetCategories: ['brokerage'],
	},
	{
		key: 'forms_employer',
		moduleId: 'gather_forms',
		phase: 'prepare',
		title: 'Gather Employer Plan Forms',
		body: 'Ask HR or the plan administrator for the beneficiary designation process (and spouse consent rules if married).',
		checklist: [{ id: 'ready', label: 'I know how to request my plan’s beneficiary forms' }],
		allowNa: true,
		consultWhen: 'retirement_beneficiary_risk',
		assetCategories: ['employer_plan'],
	},
	{
		key: 'forms_ira',
		moduleId: 'gather_forms',
		phase: 'prepare',
		title: 'Gather IRA Custodian Forms',
		body: 'Ask each IRA custodian what documents they require for beneficiary updates.',
		checklist: [{ id: 'ready', label: 'I know how to get each custodian’s beneficiary forms' }],
		allowNa: true,
		consultWhen: 'retirement_risk',
		assetCategories: ['ira'],
	},
	{
		key: 'forms_life',
		moduleId: 'gather_forms',
		phase: 'prepare',
		title: 'Gather Life Insurance Forms',
		body: 'Locate each carrier’s beneficiary change form or online process.',
		checklist: [{ id: 'ready', label: 'I have the forms or know where to get them for each policy' }],
		allowNa: true,
		assetCategories: ['life_insurance'],
	},
	{
		key: 'confirm_trust_signing',
		moduleId: 'finish_signing',
		phase: 'complete',
		title: 'Confirm Trust Signing',
		body: 'Your notarization session is complete. Confirm that your trust and related non-will documents were signed with the required formalities.',
		checklist: [
			{ id: 'signed_trust', label: 'Signed the trust with the required formalities' },
			{ id: 'signed_related', label: 'Signed any non-will affidavits or related documents as instructed' },
		],
	},
	{
		key: 'will_signing',
		moduleId: 'finish_signing',
		phase: 'complete',
		title: 'Sign Your Pour-Over Will Correctly',
		body: 'Your pour-over will may require in-person signing formalities, witnesses, and/or an in-person notary. Do not treat the will as complete merely because your trust was notarized online.',
		warning:
			'An unsigned or incorrectly signed will may not work. Shortcuts on will signing can create serious problems later.',
		checklist: [
			{ id: 'read_instructions', label: 'Read the pour-over will signing instructions' },
			{ id: 'witnesses', label: 'Arranged required witnesses' },
			{ id: 'notary', label: 'Arranged an in-person notary' },
			{ id: 'signed', label: 'Signed the will using the required formalities' },
			{ id: 'stored', label: 'Stored the original signed will with my trust documents' },
		],
	},
	{
		key: 'bank_brokerage',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Bank and Non-Retirement Brokerage Accounts',
		body: 'Ordinary bank accounts and regular non-retirement investment accounts may often be coordinated with your trust by retitling to the trust or naming the trust as POD/TOD beneficiary, if the institution allows it. Contact each one, use their process, and save written confirmation.',
		warning:
			'Listing an account in your trust paperwork does not change the bank’s or brokerage’s records. 401(k)s and IRAs are handled separately.',
		checklist: [
			{ id: 'listed', label: 'Identified my bank and regular investment accounts' },
			{ id: 'contacted', label: 'Contacted each institution' },
			{ id: 'completed', label: 'Completed each institution’s own retitle or POD/TOD process' },
			{ id: 'saved', label: 'Saved written confirmation for each account' },
		],
		allowNa: true,
		assetCategories: ['bank', 'brokerage'],
	},
	{
		key: 'employer_retirement',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Employer Retirement Plans',
		body: 'Do not transfer ownership of employer plans into your trust. They usually stay in your individual name and pass by beneficiary designation using the plan’s own forms. Contact your plan administrator, ask for the beneficiary process, and if married ask whether spouse consent is required.',
		warning:
			'Filling something online may not be enough. Some plans require notarized spouse consent. The plan’s records control who receives the account.',
		checklist: [
			{ id: 'contacted', label: 'Contacted my plan administrator or HR' },
			{ id: 'requested', label: 'Requested the plan’s beneficiary designation process' },
			{ id: 'spouse', label: 'If married, asked whether spouse consent is required' },
			{ id: 'completed', label: 'Completed the plan’s required process' },
			{ id: 'saved', label: 'Saved the plan’s accepted confirmation' },
		],
		allowNa: true,
		consultWhen: 'retirement_beneficiary_risk',
		assetCategories: ['employer_plan'],
	},
	{
		key: 'ira',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'IRAs',
		body: 'IRAs stay individually owned and pass by the custodian’s beneficiary designation. Contact your IRA custodian, ask for its beneficiary process, and ask whether it requires spouse acknowledgment, community-property consent, trust certification, or other documentation.',
		warning:
			'Naming a trust as IRA beneficiary can affect taxes and a surviving spouse’s rollover options. If you are considering naming the trust, a charity, or anyone other than your spouse, get advice first.',
		checklist: [
			{ id: 'identified', label: 'Identified each IRA' },
			{ id: 'contacted', label: 'Contacted my IRA custodian' },
			{ id: 'asked', label: 'Asked what documents my custodian requires' },
			{ id: 'completed', label: 'Completed the custodian’s beneficiary process' },
			{ id: 'saved', label: 'Saved written confirmation' },
		],
		allowNa: true,
		consultWhen: 'retirement_risk',
		assetCategories: ['ira'],
	},
	{
		key: 'life_insurance',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Life Insurance',
		body: 'Life insurance pays according to the insurance company’s beneficiary records. Identify each policy, contact the carrier, and use its exact beneficiary form if a change is needed. Save the carrier’s confirmation.',
		warning:
			'Changing a beneficiary is different from changing the policy’s owner. Do not change policy ownership based on this app.',
		checklist: [
			{ id: 'identified', label: 'Identified each policy I own or have through work' },
			{ id: 'contacted', label: 'Contacted each carrier' },
			{ id: 'completed', label: 'Completed beneficiary updates where needed' },
			{ id: 'saved', label: 'Saved written confirmation' },
		],
		allowNa: true,
		assetCategories: ['life_insurance'],
	},
	{
		key: 'vehicles',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Vehicles',
		body: 'We generally do not recommend putting ordinary cars and trucks into your trust through this app. Many states offer a transfer-on-death option for vehicle title. If your state offers it and you want it, complete the state’s form.',
		warning:
			'This card is optional. Skipping it usually does not break your plan for ordinary vehicles.',
		checklist: [
			{ id: 'checked', label: 'Checked whether my state offers a vehicle TOD/beneficiary option' },
			{ id: 'completed', label: 'Completed the state form if I chose to' },
			{ id: 'saved', label: 'Saved confirmation with my records' },
		],
		allowNa: true,
		assetCategories: ['vehicle'],
	},
	{
		key: 'crypto_digital',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Cryptocurrency / Digital Assets',
		body: 'What your family needs is a secure inventory of what exists and where, plus secure offline access instructions kept with your other important records — never inside this app.',
		warning:
			'Never enter passwords, seed phrases, recovery phrases, or private keys into this app. Anyone who asks for them is not us.',
		checklist: [
			{ id: 'inventory', label: 'Created a secure inventory of my crypto and digital assets' },
			{ id: 'offline', label: 'Created secure access instructions stored safely offline' },
			{
				id: 'no_keys',
				label: 'I did not type or upload passwords, seed phrases, or private keys anywhere in this app',
			},
			{ id: 'advice', label: 'Obtained separate advice if my holdings are significant' },
		],
		allowNa: true,
		consultWhen: 'always',
		assetCategories: ['crypto'],
	},
	{
		key: 'home_insurance',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Homeowners Insurance Notification',
		body: 'After your deed is recorded, contact your homeowners insurance agent or carrier. Tell them your home is now held in your revocable living trust and ask how they want the trust or trustee listed while keeping you personally insured as the resident homeowner. Ask for written confirmation.',
		warning:
			'Do not skip this step. A phone call is not enough; get it in writing. Follow your carrier’s current instructions.',
		checklist: [
			{ id: 'contacted', label: 'Contacted my insurance agent or carrier' },
			{ id: 'resident', label: 'Confirmed I remain personally insured as resident homeowner' },
			{ id: 'mortgagee', label: 'Confirmed mortgagee/coverage details are unchanged or updated correctly' },
			{ id: 'saved', label: 'Saved written confirmation with my trust records' },
		],
		assetCategories: ['real_property'],
	},
	{
		key: 'homestead',
		moduleId: 'update_institutions',
		phase: 'complete',
		title: 'Homestead Exemption Follow-Up',
		body: 'Moving your home into your revocable living trust should not raise your property taxes, but your homestead exemption still has to stay in place. After your deed is recorded, follow the homestead exemption guide in your portal, then confirm with your county appraisal district that your exemption remains properly in place.',
		warning:
			'Our office provides the homestead guide but does not file the exemption for you. Forms, deadlines, and proof requirements are set by your county appraisal district — follow its current instructions and keep what it sends you.',
		checklist: [
			{ id: 'read_guide', label: 'Read the homestead exemption guide in my portal' },
			{ id: 'followed', label: 'Followed the guide’s steps for my county' },
			{
				id: 'confirmed',
				label: 'Confirmed with my county appraisal district that my exemption is still in place',
			},
			{ id: 'saved', label: 'Saved the confirmation with my trust records' },
		],
		assetCategories: ['real_property'],
	},
	{
		key: 'storage',
		moduleId: 'protect_share',
		phase: 'complete',
		title: 'Store Originals Safely',
		body: 'Your family may need the original signed documents, not just copies. Store the signed originals somewhere safe, dry, and accessible to the right person.',
		warning:
			'Avoid storage your trustee cannot reach, such as a safe with a code nobody else knows or a safe-deposit box only you can open.',
		checklist: [
			{ id: 'stored', label: 'Stored my signed originals in a safe, known place' },
			{ id: 'digital', label: 'Made digital copies' },
			{ id: 'confirmations', label: 'Stored written confirmations with my trust records' },
			{ id: 'trustee_access', label: 'Confirmed my successor trustee will be able to access the storage location' },
		],
	},
	{
		key: 'trustee_notification',
		moduleId: 'protect_share',
		phase: 'complete',
		title: 'Notify Successor Trustee',
		body: 'Your successor trustee should know the trust exists, that they are named, and where to find the signed originals if something happens to you.',
		warning:
			'If your named trustee is unwilling or cannot be reached, contact our office about updating your documents.',
		checklist: [
			{ id: 'told', label: 'Told my successor trustee they are named' },
			{ id: 'location', label: 'Told them where the documents are stored and how to access them' },
			{ id: 'contact', label: 'Saved my trustee’s current contact information with my records' },
		],
	},
	{
		key: 'family_discussion',
		moduleId: 'protect_share',
		phase: 'complete',
		title: 'Family / Spouse Discussion',
		body: 'Estate plans work better when the right people know enough to avoid confusion. Confirm your chosen trustees and guardians are still willing, and make sure contact information is current.',
		warning:
			'Keep this practical. The goal is not to share every financial detail; it is to prevent avoidable confusion later.',
		checklist: [
			{ id: 'spouse', label: 'Discussed the plan with my spouse, if applicable' },
			{ id: 'willing', label: 'Confirmed trustees and guardians are still willing to serve' },
			{ id: 'contacts', label: 'Updated contact information in my records' },
		],
		allowNa: true,
	},
];

export function getMilestoneContent(key: string): FundingMilestoneContent | undefined {
	return FUNDING_MILESTONES.find((m) => m.key === key);
}

export function getModuleContent(id: FundingModuleId): FundingModuleContent | undefined {
	return FUNDING_MODULES.find((m) => m.id === id);
}
