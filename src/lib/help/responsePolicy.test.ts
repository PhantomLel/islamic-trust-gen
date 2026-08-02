import { describe, expect, it } from 'vitest';
import { resolveResponsePolicy } from './responsePolicy';
import { DEFAULT_HELP_SETTINGS } from '$lib/server/help/settingsDefaults';
import type { ServableEntry } from '$lib/server/help/servability';

const baseEntry: ServableEntry = {
	id: 1,
	sourceId: 'C1.1',
	entryType: 'faq',
	category: 'Category 1',
	title: null,
	question: 'What is a trust?',
	userFacingAnswer: 'Approved short answer.',
	goodTreeAppMeaning: 'App meaning.',
	userNextStep: 'Next step.',
	rerankDocument: null,
	classificationBase: 'safe',
	alsoAnswers: null,
	relatedSteps: null,
	status: 'approved',
};

describe('resolveResponsePolicy', () => {
	it('returns sensitive_data without entry', () => {
		const r = resolveResponsePolicy({
			triggers: [],
			sensitiveData: true,
			lowConfidence: false,
			verifierAccepted: true,
			entry: baseEntry,
			settings: DEFAULT_HELP_SETTINGS,
		});
		expect(r.kind).toBe('sensitive_data');
	});

	it('returns fallback when verifier rejects', () => {
		const r = resolveResponsePolicy({
			triggers: [],
			sensitiveData: false,
			lowConfidence: false,
			verifierAccepted: false,
			entry: baseEntry,
			settings: DEFAULT_HELP_SETTINGS,
		});
		expect(r.kind).toBe('fallback');
	});

	it('returns safe_answer for approved safe card', () => {
		const r = resolveResponsePolicy({
			triggers: [],
			sensitiveData: false,
			lowConfidence: false,
			verifierAccepted: true,
			entry: baseEntry,
			settings: DEFAULT_HELP_SETTINGS,
		});
		expect(r.kind).toBe('safe_answer');
		expect(r.shortAnswer).toBe('Approved short answer.');
	});
});
