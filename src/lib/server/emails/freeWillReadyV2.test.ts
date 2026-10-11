import { describe, expect, it } from 'vitest';
import { freeWillReadyEmailV2, type FreeWillReadyV2Input } from './freeWillReadyV2';
import { freeWillSigningWrapper } from '$lib/free-will/deliveryCopy';
import { texasWillSigningSteps } from '$lib/free-will/signing';
import { productName } from '$lib/config';

const baseInput: FreeWillReadyV2Input = {
	firstName: 'Yusuf',
	stateName: 'Texas',
	stateCode: 'TX',
	filename: 'islamic-will-Yusuf-1.pdf',
};

describe('freeWillReadyEmailV2', () => {
	it('renders the greeting, filename, and signing wrapper', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).toContain('Assalamu Alaikum, Yusuf');
		expect(html).toContain('islamic-will-Yusuf-1.pdf');
		expect(html).toContain(freeWillSigningWrapper);
		expect(html).toContain('Licensed in Texas and California');
		expect(html).not.toContain('DRAFT');
		expect(html).not.toContain('{{');
	});

	it('Texas: keeps the wrapper and omits the old step list', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).toContain(freeWillSigningWrapper);
		expect(html).not.toContain('How to sign your will in Texas');
		for (const step of texasWillSigningSteps) expect(html).not.toContain(step);
	});

	it('California: shows the wrapper only, with no Texas steps and no draft California steps', () => {
		const html = freeWillReadyEmailV2({ ...baseInput, stateCode: 'CA', stateName: 'California' });
		expect(html).toContain(freeWillSigningWrapper);
		expect(html).not.toContain('How to sign your will in Texas');
		expect(html).not.toContain('How to sign your will in California');
		expect(html).not.toContain('self-proving affidavit');
		expect(html).not.toContain('California does not require a notary');
	});

	it('does not include removed disclaimer wording (B6.2/B6.3)', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).not.toMatch(/attorney-client relationship/i);
		expect(html).not.toMatch(/never shared/i);
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
