import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { helpConversation, helpQuery, helpTranscriptAccessLog } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');

	const conversation = await db.query.helpConversation.findFirst({
		where: eq(helpConversation.id, id),
	});
	if (!conversation) throw error(404, 'Not found');

	await db.insert(helpTranscriptAccessLog).values({
		adminUserId: locals.user!.id,
		conversationId: id,
	});

	const queries = await db
		.select()
		.from(helpQuery)
		.where(eq(helpQuery.conversationId, id))
		.orderBy(asc(helpQuery.turnIndex));

	return { conversation, queries };
};
