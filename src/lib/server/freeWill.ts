import { db } from '$lib/server/db';
import { freeWill } from '$lib/server/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { WillResponse, WillResponses } from '$lib/free-will/config';
import { getHeirsResponse, heirsQuestionId, isWillComplete, toWillResponses } from '$lib/free-will/logic';
import { isAcknowledgmentComplete, type AcknowledgmentData } from '$lib/free-will/acknowledgment';

export class IncompleteWillError extends Error {
	constructor() {
		super('Will responses are incomplete');
		this.name = 'IncompleteWillError';
	}
}

export class AcknowledgmentRequiredError extends Error {
	constructor() {
		super('Required acknowledgment checkboxes are missing');
		this.name = 'AcknowledgmentRequiredError';
	}
}

/** Throws when any active step is missing or invalid. */
export function assertWillComplete(responses: WillResponse[]): void {
	if (!isWillComplete(toWillResponses(responses))) {
		throw new IncompleteWillError();
	}
}

/** Throws when this user's situation requires an acknowledgment checkbox that isn't checked. */
export function assertAcknowledgmentComplete(
	responses: WillResponse[],
	acknowledgmentData: AcknowledgmentData | null | undefined,
): void {
	if (!isAcknowledgmentComplete(toWillResponses(responses), acknowledgmentData)) {
		throw new AcknowledgmentRequiredError();
	}
}

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
	acknowledgmentData: AcknowledgmentData | null;
	/** First-touch UTM attribution (A7 groundwork), captured client-side on first page load. */
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
};

/**
 * Persist a free will for an authenticated user.
 *
 * A4 — the flow is no longer locked to a single row per user: passing the id
 * of a will the user already owns updates that row in place (the "edit my
 * answers" path); omitting it (or passing an id that doesn't resolve to one
 * of their rows) always inserts a new one (the "start a new will" path, and
 * every first-time save). This is what lets a user hold several finished
 * wills — e.g. a second spouse completing one on the same account.
 */
export async function saveFreeWillForUser(
	userId: string,
	name: string,
	email: string,
	input: SaveFreeWillInput,
	willId?: number | null,
): Promise<{ id: number }> {
	assertWillComplete(input.responses);
	assertAcknowledgmentComplete(input.responses, input.acknowledgmentData);

	const existing = willId
		? await db.query.freeWill.findFirst({
				where: and(eq(freeWill.id, willId), eq(freeWill.userId, userId)),
			})
		: null;

	// Preserve the row's original first-touch attribution across edits — only
	// fill it in if this is the first time we've captured a UTM for this will.
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
		complete: true,
		updatedAt: new Date(),
		acknowledgmentAcceptedAt: new Date(),
		acknowledgmentData: input.acknowledgmentData,
		utmSource: existing?.utmSource ?? input.utmSource ?? null,
		utmMedium: existing?.utmMedium ?? input.utmMedium ?? null,
		utmCampaign: existing?.utmCampaign ?? input.utmCampaign ?? null,
	};

	if (existing) {
		await db.update(freeWill).set(values).where(eq(freeWill.id, existing.id));
		return { id: existing.id };
	}

	const [inserted] = await db.insert(freeWill).values(values).returning({ id: freeWill.id });
	return { id: inserted.id };
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
): Promise<{ id: number }> {
	assertWillComplete(input.responses);
	assertAcknowledgmentComplete(input.responses, input.acknowledgmentData);

	const claimEmail = email.trim().toLowerCase();

	await db
		.delete(freeWill)
		.where(and(isNull(freeWill.userId), eq(freeWill.claimEmail, claimEmail)));

	const [inserted] = await db
		.insert(freeWill)
		.values({
			userId: null,
			name,
			claimEmail,
			state: input.state,
			legalMode: input.legalMode,
			responses: input.responses,
			tags: input.tags,
			recommendedPlan: input.recommendedPlan,
			reviewReminders: input.reviewReminders,
			complete: true,
			acknowledgmentAcceptedAt: new Date(),
			acknowledgmentData: input.acknowledgmentData,
			utmSource: input.utmSource ?? null,
			utmMedium: input.utmMedium ?? null,
			utmCampaign: input.utmCampaign ?? null,
		})
		.returning({ id: freeWill.id });

	return { id: inserted.id };
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
