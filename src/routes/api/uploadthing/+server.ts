import { createRouteHandler } from 'uploadthing/server';
import { ourFileRouter } from '$lib/server/uploadthing';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const handler = createRouteHandler({
	router: ourFileRouter,
	config: {
		token: env.UPLOADTHING_TOKEN,
	},
});

export const GET: RequestHandler = ({ request }) => handler(request);
export const POST: RequestHandler = ({ request }) => handler(request);
