import { describe, expect, it } from 'vitest';
import {
	PUBLIC_ANALYTICS_ALLOWED_PREFIXES,
	isAnalyticsAllowedPath,
	isSensitivePath
} from './analytics';

describe('public analytics allowlist', () => {
	it('ships empty, so analytics is off everywhere by default', () => {
		expect(PUBLIC_ANALYTICS_ALLOWED_PREFIXES).toHaveLength(0);
		expect(isAnalyticsAllowedPath('/')).toBe(false);
		expect(isAnalyticsAllowedPath('/answers/some-question')).toBe(false);
	});

	it('only allows listed prefixes', () => {
		expect(isAnalyticsAllowedPath('/answers/x', ['/answers'])).toBe(true);
		expect(isAnalyticsAllowedPath('/answersx', ['/answers'])).toBe(false);
		expect(isAnalyticsAllowedPath('/videos', ['/answers'])).toBe(false);
	});

	it('never allows a sensitive route even if it is added to the allowlist', () => {
		for (const path of [
			'/free-islamic-will',
			'/create-trust/12',
			'/create-trust/12/payment',
			'/consultation/12',
			'/dashboard',
			'/make-your-trust-work/12',
			'/login'
		]) {
			expect(isSensitivePath(path)).toBe(true);
			expect(isAnalyticsAllowedPath(path, ['/'])).toBe(false);
		}
	});
});
