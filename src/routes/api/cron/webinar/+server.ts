import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { processDueWebinarEmails } from '$lib/server/webinar/processDue';

/**
 * Secured Vercel Cron endpoint. Vercel calls this every 15 minutes.
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const cronSecret = env.CRON_SECRET;

	if (!cronSecret) {
		console.error('[cron/webinar] CRON_SECRET is not set — refusing to run');
		return json({ error: 'Cron not configured' }, { status: 500 });
	}

	if (authHeader !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const start = Date.now();
	try {
		const sent = await processDueWebinarEmails();
		const elapsedMs = Date.now() - start;
		console.log(`[cron/webinar] sent=${sent} elapsed=${elapsedMs}ms`);
		return json({ ok: true, sent, elapsedMs });
	} catch (err) {
		console.error('[cron/webinar] Error:', err);
		return json({ error: 'Cron failed' }, { status: 500 });
	}
};
