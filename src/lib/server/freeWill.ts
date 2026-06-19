import { db } from '$lib/server/db';
import { freeWill } from '$lib/server/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { WillResponse, WillResponses } from '$lib/free-will/config';
import { getHeirsResponse, heirsQuestionId } from '$lib/free-will/logic';

/**
 * Claim any pending free-will submissions (userId null) that match this user's
 * email, attaching them to the account. Called after authentication so the data
 * collected before signup follows the user into their account.
 *
 * Returns the number of rows claimed.
 */
export async function claimPendingFreeWills(userId: string, email: string): Promise<number> {
	const claimEmail = email.trim().toLowerCase();
	if (!claimEmail) return 0;

	const claimed = await db
		.update(freeWill)
		.set({ userId, updatedAt: new Date() })
		.where(and(isNull(freeWill.userId), eq(freeWill.claimEmail, claimEmail)))
		.returning({ id: freeWill.id });

	return claimed.length;
}

/** The most recent free will tied to a user (claimed or directly saved). */
export async function getLatestFreeWill(userId: string) {
	return db.query.freeWill.findFirst({
		where: eq(freeWill.userId, userId),
		orderBy: [desc(freeWill.createdAt)],
	});
}

export type SaveFreeWillInput = {
	responses: WillResponse[];
	state: string | null;
	legalMode: string;
	tags: string[];
	recommendedPlan: string | null;
	reviewReminders: boolean;
	attorneyAvailability: boolean;
};

/** Persist a free will for an authenticated user (upsert their latest open row). */
export async function saveFreeWillForUser(
	userId: string,
	name: string,
	email: string,
	input: SaveFreeWillInput,
): Promise<void> {
	const existing = await db.query.freeWill.findFirst({
		where: eq(freeWill.userId, userId),
		orderBy: [desc(freeWill.createdAt)],
	});

	const values = {
		userId,
		name,
		claimEmail: email.trim().toLowerCase(),
		state: input.state,
		legalMode: input.legalMode,
		responses: input.responses,
		tags: input.tags,
		recommendedPlan: input.recommendedPlan,
		reviewReminders: input.reviewReminders,
		attorneyAvailability: input.attorneyAvailability,
		complete: true,
		updatedAt: new Date(),
	};

	if (existing) {
		await db.update(freeWill).set(values).where(eq(freeWill.id, existing.id));
	} else {
		await db.insert(freeWill).values(values);
	}
}

/**
 * Save a pending free will keyed by email before the user has an account. Any
 * previous pending row for the same email is replaced so we never accumulate
 * duplicates. The row is claimed on the user's next authenticated visit.
 */
export async function savePendingFreeWill(
	name: string,
	email: string,
	input: SaveFreeWillInput,
): Promise<void> {
	const claimEmail = email.trim().toLowerCase();

	await db
		.delete(freeWill)
		.where(and(isNull(freeWill.userId), eq(freeWill.claimEmail, claimEmail)));

	await db.insert(freeWill).values({
		userId: null,
		name,
		claimEmail,
		state: input.state,
		legalMode: input.legalMode,
		responses: input.responses,
		tags: input.tags,
		recommendedPlan: input.recommendedPlan,
		reviewReminders: input.reviewReminders,
		attorneyAvailability: input.attorneyAvailability,
		complete: true,
	});
}

/**
 * Seed values for the GoodTree Trust intake derived from a completed free will.
 * The trust is joint and far more detailed, so this only pre-fills the fields
 * that overlap. It is intentionally conservative: it returns a partial map keyed
 * by trust question id that a future "start a trust from your will" flow can
 * merge into `trust.responses`.
 */
export function freeWillToTrustSeed(responses: WillResponses): Record<string, unknown> {
	const seed: Record<string, unknown> = {};

	// The heirs-calculator response is already exactly the shape the trust intake
	// stores for `husband-heirs` / `wife-heirs`, so it can be reused verbatim.
	const heirs = getHeirsResponse(responses);
	if (heirs) {
		seed[heirsQuestionId(responses)] = heirs;
	}

	return seed;
}
