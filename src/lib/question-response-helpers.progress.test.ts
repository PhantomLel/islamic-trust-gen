import { describe, expect, it } from 'vitest';
import { getIntakeQuestionnaireProgress } from './question-response-helpers';

describe('getIntakeQuestionnaireProgress', () => {
	it('ignores legacy response ids not in the current intake', () => {
		const rows = [
			{ id: 'gender', response: 'male' },
			{ id: 'married', response: true },
			{ id: 'has-house', response: true },
			{ id: 'father-alive', response: false },
			{ id: 'husband-data', response: { name: 'Ahmed', dob: '1990-01-01', county: 'Harris' } },
		];
		const progress = getIntakeQuestionnaireProgress(rows, { hasPaid: false });
		expect(progress).toBeLessThanOrEqual(100);
		expect(progress).toBeGreaterThan(0);
		expect(progress).toBeLessThan(100);
	});

	it('never exceeds 100% when extra stored responses exist', () => {
		const legacy = Array.from({ length: 12 }, (_, i) => ({
			id: `legacy-${i}`,
			response: 'filled',
		}));
		const progress = getIntakeQuestionnaireProgress(legacy, { hasPaid: true });
		expect(progress).toBe(0);
	});
});
