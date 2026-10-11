import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { resolveSeo } from '$lib/seo';
import ReviewsBlock from './ReviewsBlock.svelte';

const APP = 'elfsight-app-fdfb23d6-45c5-41bd-950a-d905edc79df1';

describe('ReviewsBlock', () => {
	it('renders the Elfsight widget and the Google links, with no stored count', () => {
		const { body } = render(ReviewsBlock);
		expect(body).toContain(APP);
		expect(body).toContain('Read all reviews on Google');
		expect(body).toContain('Leave a review');
		expect(body).not.toMatch(/\d+(\.\d+)?\s+Google reviews/i);
	});
});

describe('home page JSON-LD', () => {
	it('contains no Review or AggregateRating', () => {
		const homes = [
			resolveSeo({ routeId: '/', url: new URL('https://www.muslimlegacyplanning.com/') }),
			resolveSeo({
				routeId: '/mcdaniel',
				url: new URL('https://www.mcdanielestateplanning.com/'),
			}),
		];
		for (const seo of homes) {
			const text = JSON.stringify(seo?.jsonLd);
			expect(text).not.toMatch(/"@type":"Review"/);
			expect(text).not.toMatch(/AggregateRating/);
		}
	});
});
