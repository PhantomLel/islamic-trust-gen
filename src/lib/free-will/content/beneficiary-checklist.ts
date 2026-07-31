export type ChecklistItem = {
	number: number;
	title: string;
	paragraphs: string[];
	bullets?: string[];
};

export const beneficiaryChecklistIntro = {
	lede: 'Your will does not control every asset you own. Use this checklist to make sure your beneficiary forms support your Islamic estate plan instead of accidentally overriding it.',
	warningTitle: 'Some assets pass outside your will',
	warningBody:
		'Certain accounts are transferred according to the beneficiary form on file with the financial institution. That designation will usually control even when your will says something different.',
	commonAssets: [
		'401(k), 403(b), pension, and other workplace retirement plans',
		'Traditional and Roth IRAs',
		'Life insurance policies',
		'Annuities',
		'Payable-on-death bank accounts',
		'Transfer-on-death investment accounts',
	],
};

export const beneficiaryChecklistSteps: ChecklistItem[] = [
	{
		number: 1,
		title: 'Make a list of every account with a beneficiary designation',
		paragraphs: [
			'Include all retirement accounts, life insurance policies, annuities, payable-on-death accounts, and transfer-on-death accounts.',
			'Do not assume that an old account was updated when you changed jobs, got married, divorced, had children, or completed a new estate plan.',
		],
	},
	{
		number: 2,
		title: 'Check the primary beneficiary',
		paragraphs: ['The primary beneficiary receives the account first. Confirm that:'],
		bullets: [
			'The beneficiary is still living',
			'The name is spelled correctly',
			'The relationship is still appropriate',
			'The designation matches your current estate plan',
			'You understand whether the institution will divide the account equally or by the percentages you entered',
		],
	},
	{
		number: 3,
		title: 'Add contingent beneficiaries',
		paragraphs: [
			'A contingent beneficiary receives the account if the primary beneficiary dies before you or cannot receive it. Without a valid contingent beneficiary, the asset may be paid to your estate and could require probate.',
		],
	},
	{
		number: 4,
		title: 'Confirm the percentages total 100%',
		paragraphs: [
			'Review the percentages carefully. An incomplete or inconsistent form may be rejected or applied according to the institution\u2019s default rules.',
		],
	},
	{
		number: 5,
		title: 'Do not name minor children directly without legal advice',
		paragraphs: [
			'A minor generally cannot directly control inherited funds. Naming a minor child may require a court-supervised guardianship or custodial arrangement. A properly drafted trust may provide more control over who manages the money, what it may be used for, and when the child receives control.',
		],
	},
	{
		number: 6,
		title: 'Be cautious before naming your estate',
		paragraphs: [
			'Naming \u201cmy estate\u201d can cause an asset that would otherwise pass directly to become subject to probate, creditor claims, delays, and administrative expenses.',
		],
	},
	{
		number: 7,
		title: 'Review any spouse-consent requirement',
		paragraphs: [
			'Some workplace retirement plans require a spouse\u2019s written consent before anyone other than the spouse may be named as beneficiary. Follow the plan administrator\u2019s instructions exactly.',
		],
	},
	{
		number: 8,
		title: 'Review trust designations carefully',
		paragraphs: [
			'Naming a trust may help coordinate Islamic inheritance, protect minor beneficiaries, and control how funds are managed. However, trust designations can also create tax, distribution, and administrative consequences, especially for retirement accounts.',
			'Do not simply type the name of a trust into a beneficiary form unless the trust was designed to receive that asset and the designation has been reviewed.',
		],
	},
	{
		number: 9,
		title: 'Save confirmation',
		paragraphs: ['After submitting a change:'],
		bullets: [
			'Download or print the confirmation',
			'Save a copy with your estate-planning records',
			'Confirm that the institution actually accepted the designation',
			'Recheck the account after several business days',
		],
	},
	{
		number: 10,
		title: 'Review everything regularly',
		paragraphs: [
			'Review your beneficiary designations after marriage or divorce, birth or adoption of a child, death of a beneficiary, a move to another state, significant changes in wealth, opening or transferring an account, or creating or amending a trust. Even without a major life event, review them at least once every two years.',
		],
	},
];

export const beneficiaryIslamicWarning = {
	title: 'Islamic-planning warning',
	paragraphs: [
		'A standard beneficiary designation does not automatically calculate or preserve the Islamic inheritance shares.',
		'For example, naming several children \u201cequally\u201d may not produce the Qur\u2019anic distribution that would apply at death. The correct shares depend on which eligible heirs are alive at that time.',
		'Do not guess at fixed percentages unless your estate plan specifically instructs you to use them.',
	],
};

export const beneficiaryWillScope = {
	title: 'What your free Islamic will does \u2014 and does not do',
	paragraphs: [
		'Your free Islamic will provides instructions for assets controlled by the will. It does not automatically change the beneficiary designation on any retirement account, insurance policy, bank account, investment account, or annuity. You must update those accounts separately.',
	],
};

export const beneficiaryChecklistDisclaimer =
	'This checklist provides general educational information and is not legal, tax, financial, or religious advice. Beneficiary-designation rules vary by account, institution, plan document, state law, and family circumstances. Completing this checklist does not create an attorney-client relationship.';
