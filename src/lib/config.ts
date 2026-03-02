export const siteName = 'Amana Trust';
export const siteTagline = 'Texas Estate Planning';

export const screeningQuestions = [
	{ id: 'business_ownership', text: 'Do you own a business?' },
	{ id: 'multiple_properties', text: 'Do you own more than one property?' },
	{ id: 'blended_family', text: 'Do you have a blended family?' },
	{ id: 'special_needs', text: 'Do you have a special needs beneficiary?' },
	{ id: 'taxable_estate', text: 'Is your estate at risk of exceeding the taxable-estate threshold?' },
];

export type Question = {
	id: string;
	text: string;
	type: 'text' | 'tel' | 'date' | 'select' | 'boolean';
	required: boolean;
	bucket: string;
	options?: string[];
	depends?: { field: string; eq: string | boolean };
	defaultWhen?: { field: string; eq: string | boolean; value: string | boolean };
};

export function getActiveQuestions(
	responses: Record<string, string | boolean | null>
): { active: Question[]; autoValues: Record<string, string | boolean> } {
	const autoValues: Record<string, string | boolean> = {};
	const active = questions.filter((q) => {
		if (q.defaultWhen && responses[q.defaultWhen.field] === q.defaultWhen.eq) {
			autoValues[q.id] = q.defaultWhen.value;
			return false;
		}
		if (q.depends && responses[q.depends.field] !== q.depends.eq) {
			return false;
		}
		return true;
	});
	return { active, autoValues };
}

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
		id: 'children',
		text: 'Do you have any children?',
		type: 'boolean',
		required: true,
		bucket: 'family',
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
];
