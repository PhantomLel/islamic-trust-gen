import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { publishDuePages } from '$lib/server/content/pages';
import { publishDueVideos } from '$lib/server/content/videos';
import { sendMonthlyContentReviewEmail } from '$lib/server/content/reviewDueEmail';

/** Secured cron: scheduled CMS publish + monthly review-due email. Auth: Bearer CRON_SECRET */
export const GET: RequestHandler = async ({ request }) => {
	const cronSecret = env.CRON_SECRET;
	if (!cronSecret) {
		console.error('[cron/content] CRON_SECRET is not set');
		return json({ error: 'Cron not configured' }, { status: 500 });
	}
	if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const start = Date.now();
	const [pages, videos, review] = await Promise.all([
		publishDuePages(),
		publishDueVideos(),
		sendMonthlyContentReviewEmail(),
	]);

	return json({
		ok: true,
		ms: Date.now() - start,
		pagesPublished: pages.published,
		pagesFailed: pages.failed,
		videosPublished: videos.published,
		videosFailed: videos.failed,
		reviewEmailSent: review.sent,
		reviewDueCount: review.count,
	});
};
