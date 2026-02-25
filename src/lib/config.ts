export const siteName = 'Amanah Trust';
export const siteTagline = 'Estate Planning';

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
		id: 'name',
		text: 'What is your name?',
		type: 'text',
		required: true,
		bucket: 'personal',
	},
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
];
