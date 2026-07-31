import { describe, expect, it } from 'vitest';
import { normalizePersonName } from './validation';

describe('normalizePersonName (C6)', () => {
	it('collapses extra whitespace', () => {
		expect(normalizePersonName('  Ahmad   Khan  ')).toBe('Ahmad Khan');
	});

	it('dedupes doubled word pairs', () => {
		expect(normalizePersonName('Mary Jane Mary Jane')).toBe('Mary Jane');
	});

	it('dedupes concatenated duplicate halves', () => {
		expect(normalizePersonName('AhmadKhanAhmadKhan')).toBe('AhmadKhan');
	});
});
