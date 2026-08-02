import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { helpQuery, helpConversation, user } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: helpQuery.id,
			createdAt: helpQuery.createdAt,
			unanswered: helpQuery.unanswered,
			adminReviewStatus: helpQuery.adminReviewStatus,
			selectedEntrySourceId: helpQuery.selectedEntrySourceId,
			userId: helpQuery.userId,
			userEmail: user.email,
			renderedResponse: helpQuery.renderedResponse,
			conversationId: helpQuery.conversationId,
			surface: helpConversation.surface,
			stepKey: helpConversation.stepKey,
		})
		.from(helpQuery)
		.leftJoin(user, eq(user.id, helpQuery.userId))
		.leftJoin(helpConversation, eq(helpConversation.id, helpQuery.conversationId))
		.where(eq(helpQuery.unanswered, true))
		.orderBy(desc(helpQuery.createdAt))
		.limit(100);
	return { rows };
};

export const actions: Actions = {
	resolve: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isFinite(id)) return { ok: false };
		await db
			.update(helpQuery)
			.set({ adminReviewStatus: 'resolved', unanswered: false })
			.where(eq(helpQuery.id, id));
		return { ok: true, resolvedBy: locals.user!.id };
	},
};
