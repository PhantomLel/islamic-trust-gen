import { describe, expect, it } from 'vitest';
import { redactSensitiveText } from './redact';

describe('redactSensitiveText', () => {
	it('redacts SSN patterns', () => {
		const r = redactSensitiveText('My SSN is 123-45-6789 for the form');
		expect(r.hadSensitiveData).toBe(true);
		expect(r.text).toContain('[redacted: possible SSN]');
		expect(r.text).not.toContain('123-45-6789');
	});

	it('flags seed phrase references', () => {
		const r = redactSensitiveText('Here is my seed phrase for the wallet');
		expect(r.hadSensitiveData).toBe(true);
		expect(r.markers).toContain('credential reference');
	});

	it('leaves benign questions unchanged', () => {
		const q = 'How do I add a beneficiary in Good Tree?';
		const r = redactSensitiveText(q);
		expect(r.hadSensitiveData).toBe(false);
		expect(r.text).toBe(q);
	});
});
