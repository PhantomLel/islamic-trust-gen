import { db } from '$lib/server/db';
import { freeWill, type GeneratedFile } from '$lib/server/db/schema';
import { deleteUploadThingFiles } from '$lib/server/documents/storage';
import { freeWillPurgeAfter } from '$lib/free-will/retention';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { WillResponse, WillResponses } from '$lib/free-will/config';
import { getHeirsResponse, heirsQuestionId, isWillComplete, toWillResponses } from '$lib/free-will/logic';
import { isAcknowledgmentComplete, type AcknowledgmentData } from '$lib/free-will/acknowledgment';
import { FREE_WILL_LEGAL_MODE, isWillAnswersNotHandled } from '$lib/free-will/logic';

export class IncompleteWillError extends Error {
	constructor() {
		super('Will responses are incomplete');
		this.name = 'IncompleteWillError';
	}
}

export class AcknowledgmentRequiredError extends Error {
	constructor() {
		super('Required B6.1 notice acknowledgment is missing');
		this.name = 'AcknowledgmentRequiredError';
	}
}

export class NotHandledWillError extends Error {
	constructor() {
		super('This situation is not handled by the free will tool');
		this.name = 'NotHandledWillError';
	}
}

export function assertWillSaveAllowed(responses: WillResponse[]): void {
	const keyed = toWillResponses(responses);
	if (isWillAnswersNotHandled(keyed)) {
		throw new NotHandledWillError();
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

function storageKeys(files: GeneratedFile[] | null | undefined): string[] {
	return (files ?? [])
		.map((file) => file.storageKey)
		.filter((key): key is string => Boolean(key));
}

/**
 * Consent is recorded only when the visitor ticks the box. A later save that does
 * not tick it never clears an earlier opt-in on the same row.
 */
function consentColumns(
	input: { marketingConsent?: boolean },
	existing: { marketingConsent: boolean; marketingConsentAt: Date | null } | null | undefined,
): { marketingConsent: boolean; marketingConsentAt: Date | null } {
	if (existing?.marketingConsent) {
		return { marketingConsent: true, marketingConsentAt: existing.marketingConsentAt };
	}
	return input.marketingConsent
		? { marketingConsent: true, marketingConsentAt: new Date() }
		: { marketingConsent: false, marketingConsentAt: null };
}

export type SaveFreeWillInput = {
	responses: WillResponse[];
	state: string | null;
	legalMode: string;
	tags: string[];
	recommendedPlan: string | null;
	reviewReminders: boolean;
	acknowledgmentData: AcknowledgmentData | null;
	/** Short first-party source code read from the cookie on the server (spec v3 §5.1). */
	attributionCode?: string | null;
	/** Account-step marketing opt-in (spec v3 §4.3). Unchecked by default. */
	marketingConsent?: boolean;
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
	assertAcknowledgmentComplete(input.responses, input.acknowledgmentData);
	assertWillSaveAllowed(input.responses);
	assertWillComplete(input.responses);

	const existing = willId
		? await db.query.freeWill.findFirst({
				where: and(eq(freeWill.id, willId), eq(freeWill.userId, userId)),
			})
		: null;

	// Preserve the row's original first-touch attribution across edits — only
	// fill it in if this is the first time we've captured a code for this will.
	const values = {
		userId,
		name,
		claimEmail: email.trim().toLowerCase(),
		state: input.state,
		legalMode: input.legalMode || FREE_WILL_LEGAL_MODE,
		responses: input.responses,
		tags: input.tags,
		recommendedPlan: input.recommendedPlan,
		reviewReminders: input.reviewReminders,
		complete: true,
		updatedAt: new Date(),
		acknowledgmentAcceptedAt: new Date(),
		acknowledgmentData: input.acknowledgmentData,
		attributionCode: existing?.attributionCode ?? input.attributionCode ?? null,
		purgeAfter: freeWillPurgeAfter(),
		...consentColumns(input, existing),
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
	assertAcknowledgmentComplete(input.responses, input.acknowledgmentData);
	assertWillSaveAllowed(input.responses);
	assertWillComplete(input.responses);

	const claimEmail = email.trim().toLowerCase();

	const prior = await db.query.freeWill.findMany({
		where: and(isNull(freeWill.userId), eq(freeWill.claimEmail, claimEmail)),
		columns: { generated_files: true },
	});
	const priorKeys = prior.flatMap((row) => storageKeys(row.generated_files));
	if (priorKeys.length > 0) {
		try {
			const removed = await deleteUploadThingFiles(priorKeys);
			if (!removed.success) {
				console.error('[free-will] failed to delete replaced pending files', priorKeys.length);
			}
		} catch (err) {
			console.error('[free-will] failed to delete replaced pending files', err);
		}
	}

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
			legalMode: input.legalMode || FREE_WILL_LEGAL_MODE,
			responses: input.responses,
			tags: input.tags,
			recommendedPlan: input.recommendedPlan,
			reviewReminders: input.reviewReminders,
			complete: true,
			acknowledgmentAcceptedAt: new Date(),
			acknowledgmentData: input.acknowledgmentData,
			attributionCode: input.attributionCode ?? null,
			purgeAfter: freeWillPurgeAfter(),
			...consentColumns(input, null),
		})
		.returning({ id: freeWill.id });

	return { id: inserted.id };
}

/**
 * Seed values for the Guided Trust intake derived from a completed free will.
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
