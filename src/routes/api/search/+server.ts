import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchContent } from '$lib/server/content/search';

/** Site search over published answers and videos. `GET /api/search?q=...` */
export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const hits = await searchContent(q);
	return json({ q, hits }, { headers: { 'cache-control': 'no-store' } });
};
