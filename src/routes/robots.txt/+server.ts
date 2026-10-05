import type { RequestHandler } from './$types';
import { robotsTxt } from '$lib/robots';
import { siteForHost } from '$lib/seo';

export const GET: RequestHandler = ({ url }) =>
	new Response(robotsTxt(siteForHost(url.hostname)), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
	});
