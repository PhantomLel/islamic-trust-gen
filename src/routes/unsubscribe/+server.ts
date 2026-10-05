import type { RequestHandler } from './$types';
import { unsubscribeMarketingLeadByToken } from '$lib/server/drip/unsubscribeMarketingLead';

/** RFC 8058 one-click unsubscribe (POST from mail clients). */
export const POST: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!token.trim()) {
		return new Response('Missing token', { status: 400 });
	}

	const ok = await unsubscribeMarketingLeadByToken(token);
	if (!ok) {
		return new Response('Invalid token', { status: 404 });
	}

	return new Response(null, { status: 200 });
};
