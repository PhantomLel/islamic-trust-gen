import { describe, expect, it } from 'vitest';
import { mcdanielOrigin, mlpOrigin } from '$lib/config';
import { redirectFor, rerouteFor } from '$lib/hostPolicy';

describe('redirectFor', () => {
	it('sends a freemuslimwill host to the free will and keeps the query', () => {
		expect(redirectFor(new URL('https://freemuslimwill.org/?src=masjid-houston-hamza'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/free-islamic-will?src=masjid-houston-hamza`,
		});
		expect(redirectFor(new URL('https://www.freemuslimwill.org/anywhere?src=masjid-houston-hamza'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/free-islamic-will?src=masjid-houston-hamza`,
		});
	});

	it('sends apex hosts to www and keeps the path and query', () => {
		expect(redirectFor(new URL('https://muslimlegacyplanning.com/plans?x=1'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/plans?x=1`,
		});
		expect(redirectFor(new URL('https://mcdanielestateplanning.com/attorney?y=2'), 'HEAD')).toEqual({
			status: 301,
			location: `${mcdanielOrigin}/attorney?y=2`,
		});
	});

	it('sends MEP app paths to the MLP www URL with the same path and query', () => {
		expect(redirectFor(new URL('https://www.mcdanielestateplanning.com/admin/users'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/admin/users`,
		});
		expect(redirectFor(new URL('https://www.mcdanielestateplanning.com/plans'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/plans`,
		});
		expect(redirectFor(new URL('https://www.mcdanielestateplanning.com/free-islamic-will?x=1'), 'GET')).toEqual({
			status: 301,
			location: `${mlpOrigin}/free-islamic-will?x=1`,
		});
	});

	it('reroutes MEP marketing pages and does not redirect them', () => {
		const cases = [
			['/', '/mcdaniel'],
			['/attorney', '/mcdaniel/attorney'],
			['/legacy-plan', '/mcdaniel/legacy-plan'],
		] as const;
		for (const [path, internal] of cases) {
			const url = new URL(`https://www.mcdanielestateplanning.com${path}`);
			expect(redirectFor(url, 'GET')).toBeNull();
			expect(rerouteFor(url)).toBe(internal);
		}
	});

	it('sends MLP /mcdaniel/attorney to the firm /attorney', () => {
		expect(redirectFor(new URL('https://www.muslimlegacyplanning.com/mcdaniel/attorney'), 'GET')).toEqual({
			status: 301,
			location: `${mcdanielOrigin}/attorney`,
		});
	});

	it('does not redirect a POST to /api on MEP', () => {
		expect(redirectFor(new URL('https://www.mcdanielestateplanning.com/api/auth/sign-in/email'), 'POST')).toBeNull();
	});
});
