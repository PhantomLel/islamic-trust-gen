import { describe, expect, it } from 'vitest';
import { detectTriggers, highestTier } from './triggers';

describe('detectTriggers', () => {
	it('detects actual death events as Tier 1', () => {
		const m = detectTriggers('My husband passed away last week');
		expect(highestTier(m)).toBe('1');
		expect(m.some((x) => x.code === 'death_actual')).toBe(true);
	});

	it('does not Tier 1 educational hypotheticals about death', () => {
		const m = detectTriggers('What happens when the first spouse dies in general?');
		expect(m.some((x) => x.code === 'death_actual')).toBe(false);
	});

	it('detects blended family as Tier 2 with step block', () => {
		const m = detectTriggers('I have stepchildren from a prior marriage');
		expect(highestTier(m)).toBe('2');
		expect(m.find((x) => x.code === 'blended_family')?.blocksStep).toBe(true);
	});

	it('detects fatwa requests as Tier 3', () => {
		const m = detectTriggers('Can my sheikh give a fatwa on this share?');
		expect(highestTier(m)).toBe('3');
	});
});
