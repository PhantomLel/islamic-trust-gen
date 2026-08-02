import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { helpConversation, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const userId = url.searchParams.get('userId');
	const rows = await db
		.select({
			id: helpConversation.id,
			userId: helpConversation.userId,
			userEmail: user.email,
			surface: helpConversation.surface,
			stepKey: helpConversation.stepKey,
			turnCount: helpConversation.turnCount,
			lastMessageAt: helpConversation.lastMessageAt,
			hasRedaction: helpConversation.hasRedaction,
			maxTier: helpConversation.maxTier,
		})
		.from(helpConversation)
		.leftJoin(user, eq(user.id, helpConversation.userId))
		.where(userId ? eq(helpConversation.userId, userId) : undefined)
		.orderBy(desc(helpConversation.lastMessageAt))
		.limit(200);

	return { conversations: rows, filterUserId: userId };
};
