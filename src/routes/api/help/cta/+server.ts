import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { helpCtaEvent, helpQuery } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { checkHelpRateLimit, HelpRateLimitError } from '$lib/server/help/rateLimit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const body = await request.json().catch(() => null);
	const queryId = Number(body?.queryId);
	const ctaKey = String(body?.ctaKey ?? '');
	if (!queryId || !ctaKey) throw error(400, 'Invalid request');

	const row = await db.query.helpQuery.findFirst({
		where: and(eq(helpQuery.id, queryId), eq(helpQuery.userId, locals.user.id)),
	});
	if (!row) throw error(404, 'Query not found');

	const rendered = row.renderedResponse;
	if (!rendered?.cta || rendered.cta.key !== ctaKey) {
		throw error(400, 'CTA not available for this response');
	}

	try {
		await checkHelpRateLimit(locals.user.id, 'cta');
	} catch (err) {
		if (err instanceof HelpRateLimitError) throw error(429, 'Rate limit exceeded');
		throw err;
	}

	await db
		.insert(helpCtaEvent)
		.values({
			queryId,
			userId: locals.user.id,
			ctaKey,
			target: rendered.cta.target,
		})
		.onConflictDoNothing();

	return json({ ok: true });
};
