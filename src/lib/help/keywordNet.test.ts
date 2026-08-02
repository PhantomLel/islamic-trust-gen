import { describe, expect, it } from 'vitest';
import { ratchetTier, sessionTierFromTriggers } from './keywordNet';

describe('keywordNet tier ratchet', () => {
	it('never downgrades tier within a session', () => {
		expect(ratchetTier('1', '3')).toBe('1');
		expect(ratchetTier('3', '1')).toBe('1');
		expect(ratchetTier('2', '3')).toBe('2');
	});

	it('accumulates highest tier from triggers', () => {
		expect(
			sessionTierFromTriggers([
				{ code: 'a', tier: '3' },
				{ code: 'b', tier: '2' },
			]),
		).toBe('2');
	});
});
