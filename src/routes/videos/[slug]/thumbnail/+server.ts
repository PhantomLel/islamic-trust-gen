import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPublishedVideoBySlug } from '$lib/server/content/videos';

/**
 * Serves the video's thumbnail from this site's own URL (structured data and the
 * facade both point here), so no page ever requests an image from YouTube.
 */
export const GET: RequestHandler = async ({ params, fetch }) => {
	const b = await getPublishedVideoBySlug(params.slug);
	if (!b?.thumbnail) throw error(404, 'Not found');
	const upstream = await fetch(b.thumbnail.url);
	if (!upstream.ok || !upstream.body) throw error(502, 'Thumbnail unavailable');
	return new Response(upstream.body, {
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
			'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
		},
	});
};
