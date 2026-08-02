import { describe, expect, it } from 'vitest';
import evalSet from '../../../scripts/help-eval-set.json';
import { detectTriggers, highestTier } from '$lib/help/triggers';
import { redactSensitiveText } from '$lib/help/redact';

describe('help evaluation set fixtures', () => {
	it('has versioned cases', () => {
		expect(evalSet.version).toBeTruthy();
		expect(evalSet.cases.length).toBeGreaterThanOrEqual(5);
	});

	it('Tier 1 death-actual case triggers tier 1', () => {
		const c = evalSet.cases.find((x) => x.id === 'tier1-death-actual')!;
		const tier = highestTier(detectTriggers(c.question));
		expect(tier).toBe('1');
	});

	it('hypothetical death case does not false-positive Tier 1', () => {
		const c = evalSet.cases.find((x) => x.id === 'tier1-not-hypothetical')!;
		const tier = highestTier(detectTriggers(c.question));
		expect(tier).not.toBe('1');
	});

	it('sensitive seed case is redacted', () => {
		const c = evalSet.cases.find((x) => x.id === 'sensitive-seed')!;
		expect(redactSensitiveText(c.question).hadSensitiveData).toBe(true);
	});
});
