import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('MEP /about', () => {
	it('returns 301 to /attorney', () => {
		try {
			GET({} as never);
			expect.fail('expected a redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (!isRedirect(error)) return;
			expect(error.status).toBe(301);
			expect(error.location).toBe('/attorney');
		}
	});
});
