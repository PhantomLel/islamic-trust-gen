import { describe, expect, it } from 'vitest';
import { freeWillReadyEmailV2, type FreeWillReadyV2Input } from './freeWillReadyV2';
import { willSigningWrapper, texasWillSigningSteps } from '$lib/free-will/signing';
import { DRAFT_MARKER } from '$lib/free-will/draft';
import { productName } from '$lib/config';

const baseInput: FreeWillReadyV2Input = {
	firstName: 'Yusuf',
	stateName: 'Texas',
	stateCode: 'TX',
	filename: 'Yusuf-Islamic-Will.docx',
};

describe('freeWillReadyEmailV2', () => {
	it('renders the greeting, filename, and draft marker', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).toContain('Assalamu Alaikum, Yusuf');
		expect(html).toContain('Yusuf-Islamic-Will.docx');
		expect(html).toContain(DRAFT_MARKER);
		expect(html).toContain('Licensed in Texas and California');
		expect(html).not.toContain('{{');
	});

	it('Texas: shows the wrapper, the Appendix A 4.1 heading, and all eight steps verbatim', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).toContain(willSigningWrapper);
		expect(html).toContain('How to sign your will in Texas');
		expect(texasWillSigningSteps).toHaveLength(8);
		for (const step of texasWillSigningSteps) expect(html).toContain(step);
	});

	it('California: shows the wrapper only, with no Texas steps and no draft California steps', () => {
		const html = freeWillReadyEmailV2({ ...baseInput, stateCode: 'CA', stateName: 'California' });
		expect(html).toContain(willSigningWrapper);
		expect(html).not.toContain('How to sign your will in Texas');
		expect(html).not.toContain('How to sign your will in California');
		expect(html).not.toContain('self-proving affidavit');
		expect(html).not.toContain('California does not require a notary');
	});

	it('is a service email: no plan card, flag list, or promotional block', () => {
		for (const stateCode of ['TX', 'CA']) {
			const html = freeWillReadyEmailV2({ ...baseInput, stateCode });
			expect(html).not.toContain('RECOMMENDED FOR YOUR SITUATION');
			expect(html).not.toContain('RECOMMENDED NEXT STEPS');
			expect(html).not.toContain('PREMIUM OPTION');
			expect(html).not.toContain('Start your trust');
			expect(html).not.toMatch(/Legacy Plan(?!ning)/);
			expect(html).not.toContain(productName);
			expect(html).not.toContain('GoodTree');
			expect(html).not.toContain('Book an attorney review');
			expect(html).not.toContain('a will alone does not avoid probate');
		}
	});
});
