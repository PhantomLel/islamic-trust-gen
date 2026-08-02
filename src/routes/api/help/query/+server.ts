import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processHelpQuery } from '$lib/server/help/answer';
import { normalizeSurface } from '$lib/help/stepMap';
import { HelpRateLimitError } from '$lib/server/help/rateLimit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { HELP_RERANK_DEFAULTS } from '$lib/help/decisions';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const body = await request.json().catch(() => null);
	if (!body || typeof body.question !== 'string') throw error(400, 'Invalid request');

	const question = body.question.trim();
	if (!question || question.length > HELP_RERANK_DEFAULTS.maxQuestionLength) {
		throw error(400, 'Question too long or empty');
	}

	const surface = normalizeSurface(String(body.surface ?? ''));
	if (!surface) throw error(400, 'Invalid surface');

	let trustId: number | null = body.trustId ?? null;
	if (trustId != null) {
		const owned = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		});
		if (!owned) throw error(403, 'Forbidden');
	}

	try {
		const result = await processHelpQuery({
			userId: locals.user.id,
			trustId,
			surface,
			stepKey: body.stepKey ?? null,
			conversationId: body.conversationId ?? null,
			question,
		});
		return json(result);
	} catch (err) {
		if (err instanceof HelpRateLimitError) throw error(429, 'Rate limit exceeded');
		if (err instanceof Error && err.message === 'Conversation not found') {
			throw error(404, err.message);
		}
		console.error('[help/query]', err);
		throw error(500, 'Unable to process help request');
	}
};
