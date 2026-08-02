import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { helpEscalation, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: helpEscalation.id,
			tier: helpEscalation.tier,
			triggerCode: helpEscalation.triggerCode,
			status: helpEscalation.status,
			surface: helpEscalation.surface,
			stepKey: helpEscalation.stepKey,
			userEmail: user.email,
			createdAt: helpEscalation.createdAt,
		})
		.from(helpEscalation)
		.leftJoin(user, eq(user.id, helpEscalation.userId))
		.orderBy(desc(helpEscalation.createdAt))
		.limit(100);
	return { escalations: rows };
};
