import { db } from '$lib/server/db';
import { marketingLead } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/** Mark a lead unsubscribed by token. Returns false when token is unknown. */
export async function unsubscribeMarketingLeadByToken(token: string): Promise<boolean> {
	const trimmed = token.trim();
	if (!trimmed) return false;

	const lead = await db.query.marketingLead.findFirst({
		where: eq(marketingLead.unsubscribeToken, trimmed),
		columns: { id: true },
	});
	if (!lead) return false;

	const now = new Date();
	await db
		.update(marketingLead)
		.set({
			unsubscribed: true,
			sequenceStatus: 'unsubscribed',
			nextEmailAt: null,
			stoppedAt: now,
			stoppedReason: 'unsubscribed',
			updatedAt: now,
		})
		.where(eq(marketingLead.id, lead.id));

	return true;
}
