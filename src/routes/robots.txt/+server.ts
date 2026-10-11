import type { RequestHandler } from './$types';
import { crawlSite, robotsTxt } from '$lib/robots';

export const GET: RequestHandler = ({ url }) =>
	new Response(robotsTxt(crawlSite(url)), {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
	});
