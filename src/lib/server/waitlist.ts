/**
 * Out-of-state free-will waitlist capture (ticket A1). Extends `marketing_lead`
 * rather than a second leads table, keyed by email like the drip leads. No
 * drip sequence exists for these visitors yet, so this bypasses `enrollLead`'s
 * scheduling machinery entirely and upserts the row directly.
 */

import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { marketingLead } from '$lib/server/db/schema';

export type WillWaitlistInput = {
	email: string;
	name?: string | null;
	/** USPS state code the visitor selected (not yet available: CA/TX only today). */
	state: string;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	/** Which free-will step the visitor was on, e.g. 'state' or 'home_state'. */
	lastStep?: string | null;
};

export async function recordWillWaitlistLead(input: WillWaitlistInput): Promise<void> {
	const email = input.email.trim().toLowerCase();
	const firstName = (input.name ?? '').trim().split(/\s+/)[0] || null;
	const now = new Date();

	const existing = await db.query.marketingLead.findFirst({ where: eq(marketingLead.email, email) });

	if (!existing) {
		await db.insert(marketingLead).values({
			email,
			firstName,
			leadType: 'waitlist',
			state: input.state,
			utmSource: input.utmSource ?? null,
			utmMedium: input.utmMedium ?? null,
			utmCampaign: input.utmCampaign ?? null,
			lastStep: input.lastStep ?? null,
			firstTouchSource: input.utmSource ?? null,
			lastTouchSource: input.utmSource ?? null,
			// No drip sequence for waitlist leads yet — leave the schedule untouched
			// so the drip cron (which requires a non-null nextEmailAt) never picks them up.
			sequenceStatus: null,
			unsubscribeToken: randomBytes(24).toString('hex'),
			updatedAt: now,
		});
		return;
	}

	// Don't clobber an existing drip lead's classification/schedule — just record
	// the latest attribution and state so admins see the newest touchpoint.
	await db
		.update(marketingLead)
		.set({
			firstName: existing.firstName ?? firstName,
			leadType: existing.leadType ?? 'waitlist',
			state: input.state,
			utmSource: input.utmSource ?? existing.utmSource,
			utmMedium: input.utmMedium ?? existing.utmMedium,
			utmCampaign: input.utmCampaign ?? existing.utmCampaign,
			lastStep: input.lastStep ?? existing.lastStep,
			lastTouchSource: input.utmSource ?? existing.lastTouchSource,
			updatedAt: now,
		})
		.where(eq(marketingLead.email, email));
}


export type ReferralRequestInput = {
	email: string;
	name?: string | null;
	/** USPS state code the visitor selected (outside the Texas / California scope). */
	state: string;
};

/**
 * Out-of-state referral request (spec v3 §3.1). Distinct lead type, no drip
 * sequence, no marketing consent. The email is used only to answer the request.
 * Never reactivates or reclassifies an existing row.
 */
export async function recordReferralRequest(input: ReferralRequestInput): Promise<void> {
	const email = input.email.trim().toLowerCase();
	const firstName = (input.name ?? '').trim().split(/\s+/)[0] || null;
	const now = new Date();

	const existing = await db.query.marketingLead.findFirst({ where: eq(marketingLead.email, email) });

	if (!existing) {
		await db.insert(marketingLead).values({
			email,
			firstName,
			leadType: 'referral_request',
			state: input.state,
			lastStep: 'state',
			sequenceStatus: null,
			currentSequence: null,
			nextEmailAt: null,
			marketingConsent: false,
			unsubscribeToken: randomBytes(24).toString('hex'),
			updatedAt: now,
		});
		return;
	}

	await db
		.update(marketingLead)
		.set({ firstName: existing.firstName ?? firstName, state: input.state, updatedAt: now })
		.where(eq(marketingLead.email, email));
}
