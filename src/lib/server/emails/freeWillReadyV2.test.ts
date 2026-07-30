import { describe, expect, it } from 'vitest';
import { freeWillReadyEmailV2, type FreeWillReadyV2Input } from './freeWillReadyV2';

const legacyOffer = {
	title: 'Legacy Plan',
	tagline: 'Full-service estate planning designed personally by your attorney.',
	priceLine: 'From $3,500.',
	href: 'https://example.com/plans?utm_source=transactional&utm_medium=email&utm_campaign=will_delivery',
	variant: 'premium' as const,
};

const goodTreeOffer = {
	title: 'GoodTree Trust',
	tagline: 'Build an attorney-backed Islamic living trust online.',
	priceLine: '$1,499.00 flat fee.',
	href: 'https://example.com/trust?utm_source=transactional&utm_medium=email&utm_campaign=will_delivery',
	variant: 'app' as const,
};

const baseInput: FreeWillReadyV2Input = {
	firstName: 'Yusuf',
	stateName: 'Texas',
	stateCode: 'TX',
	filename: 'Yusuf-Islamic-Will.docx',
	marriedCommunityPropertyState: false,
	flagLines: [],
	offers: [legacyOffer],
	consultUrl: 'https://example.com/consult?utm_source=transactional&utm_medium=email&utm_campaign=will_delivery',
};

describe('freeWillReadyEmailV2', () => {
	it('renders the greeting, filename, and Texas notary step', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).toContain('Assalamu Alaikum, Yusuf');
		expect(html).toContain('Yusuf-Islamic-Will.docx');
		expect(html).toContain('self-proving affidavit');
		expect(html).toContain('Licensed in Texas and California');
		expect(html).not.toContain('{{');
	});

	it('omits the MARRIED_TX and FLAGS blocks when inactive', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).not.toContain('A NOTE FOR MARRIED COUPLES IN TEXAS');
		expect(html).not.toContain('RECOMMENDED NEXT STEPS');
	});

	it('renders the MARRIED_TX note when married in a community-property ack state', () => {
		const html = freeWillReadyEmailV2({ ...baseInput, marriedCommunityPropertyState: true });
		expect(html).toContain('A NOTE FOR MARRIED COUPLES IN TEXAS');
		expect(html).toContain('community property law already gives each spouse half');
	});

	it('renders one FLAG_LINES bullet per active flag, no more', () => {
		const html = freeWillReadyEmailV2({
			...baseInput,
			flagLines: ['Your home may pass outside your will.', 'You want to avoid probate.'],
		});
		expect(html).toContain('RECOMMENDED NEXT STEPS');
		expect(html).toContain('Your home may pass outside your will.');
		expect(html).toContain('You want to avoid probate.');
		expect((html.match(/&#8226;/g) ?? []).length).toBe(2);
	});

	it('renders the GoodTree app card above the Legacy Plan card when APP_RECOMMENDED', () => {
		const html = freeWillReadyEmailV2({ ...baseInput, offers: [goodTreeOffer, legacyOffer] });
		expect(html.indexOf('GoodTree Trust')).toBeLessThan(html.indexOf('>Legacy Plan<'));
		expect(html).toContain('Start your trust');
		expect(html).toContain('Learn more');
	});

	it('renders only the Legacy Plan card when not app-recommended', () => {
		const html = freeWillReadyEmailV2(baseInput);
		expect(html).not.toContain('GoodTree Trust');
		expect(html).not.toContain('Start your trust');
		expect(html).toContain('Legacy Plan');
	});

	it('uses the non-Texas signing step and generic state note outside Texas', () => {
		const html = freeWillReadyEmailV2({ ...baseInput, stateCode: 'CA', stateName: 'California' });
		expect(html).not.toContain('optional in Texas');
		expect(html).toContain('for California');
	});
});
