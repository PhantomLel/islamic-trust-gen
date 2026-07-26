import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { processDueEmails, enrollAppAbandoners } from '$lib/server/drip/processDue';
import { processFundingReminders } from '$lib/server/fundingReminders';
import { processFundingFlags } from '$lib/server/fundingFlags';

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
	let fundingSent = 0;
	let fundingFlagged = 0;

	try {
		[sent, enrolled, fundingSent, fundingFlagged] = await Promise.all([
			processDueEmails(),
			enrollAppAbandoners(),
			processFundingReminders(),
			processFundingFlags(),
		]);
	} catch (err) {
		console.error('[cron/drip] Error:', err);
		return json({ error: 'Cron failed' }, { status: 500 });
	}

	const elapsed = Date.now() - start;
	console.log(
		`[cron/drip] sent=${sent} enrolled=${enrolled} fundingSent=${fundingSent} fundingFlagged=${fundingFlagged} elapsed=${elapsed}ms`,
	);
	return json({ ok: true, sent, enrolled, fundingSent, fundingFlagged, elapsedMs: elapsed });
};
