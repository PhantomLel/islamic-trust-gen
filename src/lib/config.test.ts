import { describe, expect, it } from 'vitest';
import { formatFirmNapLine, formatUsdWhole } from '$lib/config';

describe('formatFirmNapLine', () => {
	it('returns the AA W9.5 string exactly', () => {
		expect(formatFirmNapLine()).toBe(
			'McDaniel Estate Planning, PLLC · 13100 Wortham Center Drive, 3rd Floor, Houston, TX 77065 · (713) 659-9668 · admin@mcdanielestateplanning.com',
		);
	});
});

describe('formatUsdWhole', () => {
	it('formats whole dollars without cents', () => {
		expect(formatUsdWhole(1499)).toBe('$1,499');
	});
});
