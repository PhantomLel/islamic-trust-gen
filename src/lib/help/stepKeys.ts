import { allIntakeQuestions, screeningQuestions } from '$lib/config';
import { FUNDING_MILESTONES } from '$lib/funding/content';

/** Non-questionnaire steps in the create-trust flow. */
export const CREATE_TRUST_FLOW_STEP_KEYS = ['screening', 'type'] as const;

export type HelpStepKeyGroup = {
	label: string;
	keys: readonly string[];
};

export const HELP_STEP_KEY_GROUPS: HelpStepKeyGroup[] = [
	{
		label: 'Create trust — flow',
		keys: CREATE_TRUST_FLOW_STEP_KEYS,
	},
	{
		label: 'Create trust — screening',
		keys: screeningQuestions.map((q) => q.id),
	},
	{
		label: 'Create trust — intake',
		keys: allIntakeQuestions.map((q) => q.id),
	},
	{
		label: 'Funding — milestones',
		keys: FUNDING_MILESTONES.map((m) => m.key),
	},
];

/** Flat, deduplicated list of every known step key (sorted). */
export const ALL_HELP_STEP_KEYS: string[] = [
	...new Set(HELP_STEP_KEY_GROUPS.flatMap((g) => [...g.keys])),
].sort();
