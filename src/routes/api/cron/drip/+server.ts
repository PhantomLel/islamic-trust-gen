import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { processDueEmails, enrollAppAbandoners } from '$lib/server/drip/processDue';

/**
 * Secured Vercel Cron endpoint. Vercel calls this every 15 minutes.
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const cronSecret = env.CRON_SECRET;

	if (!cronSecret) {
		console.error('[cron/drip] CRON_SECRET is not set — refusing to run');
		return json({ error: 'Cron not configured' }, { status: 500 });
	}

	if (authHeader !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const start = Date.now();
	let sent = 0;
	let enrolled = 0;

	try {
		[sent, enrolled] = await Promise.all([
			processDueEmails(),
			enrollAppAbandoners(),
		]);
	} catch (err) {
		console.error('[cron/drip] Error:', err);
		return json({ error: 'Cron failed' }, { status: 500 });
	}

	const elapsed = Date.now() - start;
	console.log(`[cron/drip] sent=${sent} enrolled=${enrolled} elapsed=${elapsed}ms`);
	return json({ ok: true, sent, enrolled, elapsedMs: elapsed });
};
