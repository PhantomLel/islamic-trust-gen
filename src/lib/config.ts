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
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean' | 'children';
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

export type QuestionResponseValue = string | boolean | ChildResponse[] | null;

export const buckets: Record<string, { label: string; icon: string }> = {
	personal: { label: 'Personal Info', icon: 'user' },
	family: { label: 'Family', icon: 'users' },
};

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
		id: 'children',
		text: 'Do you have any children?',
		type: 'boolean',
		required: true,
		bucket: 'family',
	},
	{
		id: 'children-data',
		text: 'Add the full names and dates of birth of your children',
		type: 'children',
		required: true,
		bucket: 'family',
		depends: { field: 'children', eq: true },

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
