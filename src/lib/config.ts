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

export type Question = {
	id: string;
	text: string;
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean' | 'children' | 'charities';
	required: boolean;
	bucket: string;
	options?: string[];
	depends?: { field: string; eq: string | boolean };
	defaultWhen?: { field: string; eq: string | boolean; value: string | boolean };
};

export type ChildResponse = {
	firstName: string;
	lastName: string;
	dob: string;
};

export type CharityResponse = {
	charityId: string;
	percentage: number;
};

export type QuestionResponseValue = string | boolean | ChildResponse[] | CharityResponse[] | null;

export const buckets: Record<string, { label: string; icon: string }> = {
	personal: { label: 'Personal Info', icon: 'user' },
	family: { label: 'Family', icon: 'users' },
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

export const questions: Question[] = [
	{
		id: 'phone',
		text: 'What is your phone number?',
		type: 'tel',
		required: true,
		bucket: 'personal',
	},
	{
		id: 'date_of_birth',
		text: 'What is your date of birth?',
		type: 'date',
		required: true,
		bucket: 'personal',
	},
	{
		id: 'gender',
		text: 'What is your gender?',
		type: 'select',
		required: true,
		options: ['Male', 'Female'],
		bucket: 'personal',
	},
	{
		id: 'married',
		text: 'Are you married?',
		type: 'boolean',
		required: true,
		bucket: 'family',
	},
	{
		id: 'spouse-name',
		text: 'What is the full name of your spouse?',
		type: 'text',
		required: true,
		bucket: 'family',
		depends: { field: 'married', eq: true },
	},
	{
		id: 'children-sons',
		text: 'Do you have any sons?',
		type: 'boolean',
		required: true,
		bucket: 'family',
	},
	{
		id: 'children-data-sons',
		text: 'Add the full names and dates of birth of your sons',
		type: 'children',
		required: true,
		bucket: 'family',
		depends: { field: 'children-sons', eq: true },

	},
	{
		id: 'children-daughters',
		text: 'Do you have any daughters?',
		type: 'boolean',
		required: true,
		bucket: 'family',
	},
	{
		id: 'children-data-daughters',
		text: 'Add the full names and dates of birth of your daughters',
		type: 'children',
		required: true,
		bucket: 'family',
		depends: { field: 'children-daughters', eq: true },
	},
	{
		id: 'grandchildren',
		text: 'Do you have any grandchildren?',
		type: 'boolean',
		required: true,
		bucket: 'family',
		depends: { field: 'children', eq: true },
		defaultWhen: { field: 'children', eq: false, value: false },
	},
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
		text: "Would you like us to retrieve the deed for you?",
		type: 'boolean',
		required: true,
		bucket: 'property',
		depends: { field: 'house-deed', eq: false},

	},
	{
		id: "charities",
		text: "Would you like to any of these charities to receive a portion of your wasiyyah?",
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
