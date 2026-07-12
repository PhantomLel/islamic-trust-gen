import { db } from '$lib/server/db';
import { marketingLead } from '$lib/server/db/schema';
import type { SequenceStatus } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';

/** Stop or switch a lead's drip sequence. */
export async function stopLead(
	email: string,
	status: SequenceStatus,
	reason?: string,
): Promise<void> {
	const now = new Date();
	await db
		.update(marketingLead)
		.set({
			sequenceStatus: status,
			nextEmailAt: null,
			stoppedAt: now,
			stoppedReason: reason ?? status,
			updatedAt: now,
		})
		.where(eq(marketingLead.email, email.trim().toLowerCase()));
}

/** Stop all active drip leads for a given user ID (e.g. on payment). */
export async function stopLeadByUserId(
	userId: string,
	status: SequenceStatus,
	reason?: string,
): Promise<void> {
	const now = new Date();
	await db
		.update(marketingLead)
		.set({
			sequenceStatus: status,
			nextEmailAt: null,
			stoppedAt: now,
			stoppedReason: reason ?? status,
			updatedAt: now,
		})
		.where(eq(marketingLead.userId, userId));
}

/**
 * Stop drip for a paying user by userId and/or any known emails
 * (Stripe session email, account email, etc.).
 */
export async function stopLeadOnPayment(
	opts: { userId?: string | null; emails?: (string | null | undefined)[] },
	status: SequenceStatus,
	reason?: string,
): Promise<void> {
	const conditions = [];
	if (opts.userId) {
		conditions.push(eq(marketingLead.userId, opts.userId));
	}
	const emails = [
		...new Set(
			(opts.emails ?? [])
				.filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
				.map((e) => e.trim().toLowerCase()),
		),
	];
	for (const email of emails) {
		conditions.push(eq(marketingLead.email, email));
	}
	if (conditions.length === 0) return;

	const now = new Date();
	await db
		.update(marketingLead)
		.set({
			sequenceStatus: status,
			nextEmailAt: null,
			stoppedAt: now,
			stoppedReason: reason ?? status,
			updatedAt: now,
		})
		.where(or(...conditions));
}
