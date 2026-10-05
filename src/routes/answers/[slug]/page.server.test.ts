import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/content/pages', () => ({
	getPublishedPageBySlug: vi.fn(),
}));

import { load } from './+page.server';
import { getPublishedPageBySlug } from '$lib/server/content/pages';

describe('answers/[slug] load', () => {
	beforeEach(() => {
		vi.mocked(getPublishedPageBySlug).mockReset();
	});

	it('returns 404 when the page is not published', async () => {
		vi.mocked(getPublishedPageBySlug).mockResolvedValue(null);
		await expect(load({ params: { slug: 'missing' } } as never)).rejects.toMatchObject({ status: 404 });
	});
});
