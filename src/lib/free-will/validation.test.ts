import { describe, expect, it } from 'vitest';
import { isFullLegalName } from './validation';

describe('isFullLegalName', () => {
	it('requires at least two name parts', () => {
		expect(isFullLegalName('Ahmad')).toBe(false);
		expect(isFullLegalName('Ahmad Khan')).toBe(true);
		expect(isFullLegalName('  Mary   Jane  Watson  ')).toBe(true);
	});
});
