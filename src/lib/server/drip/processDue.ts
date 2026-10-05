import { db } from '$lib/server/db';
import { marketingLead, trust, invoice, TrustStatus } from '$lib/server/db/schema';
import { and, eq, lte, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { SCHEDULES, APP_ABANDONMENT_DELAY_INTAKE_HOURS, APP_ABANDONMENT_DELAY_BARE_ACCOUNT_HOURS } from './sequences';
import type { SequenceName } from './sequences';
import { buildLinks } from './links';
import { renderDripEmail } from './renderEmail';
import { sendMarketingEmail } from './sendMarketingEmail';
import { enrollLead } from './enroll';
import { DRIP_SENDING_ENABLED } from './config';
import { env } from '$env/dynamic/private';

/** Process all leads with a due email. Returns count sent. */
export async function processDueEmails(): Promise<number> {
	// Drip sequences are switched off (see ./config.ts). Nothing is sent, and no
	// row is advanced, so re-enabling later resumes from where each lead stands.
	if (!DRIP_SENDING_ENABLED) return 0;

	const now = new Date();
	const origin = env.ORIGIN ?? '';

	const dueLeads = await db.query.marketingLead.findMany({
		where: and(
			eq(marketingLead.sequenceStatus, 'active'),
			isNotNull(marketingLead.nextEmailAt),
			lte(marketingLead.nextEmailAt, now),
			isNotNull(marketingLead.unsubscribeToken),
		),
	});

	let sent = 0;

	for (const lead of dueLeads) {
		try {
			const sequence = lead.currentSequence as SequenceName | null;
			if (!sequence) continue;

			const schedule = SCHEDULES[sequence];
			if (!schedule) continue;

			const idx = (lead.nextEmailIndex ?? 1) - 1; // convert 1-based to 0-based
			const emailMeta = schedule[idx];
			if (!emailMeta) {
				// Sequence complete.
				await db.update(marketingLead).set({ sequenceStatus: 'completed', nextEmailAt: null, updatedAt: now }).where(eq(marketingLead.id, lead.id));
				continue;
			}

			let trustId = lead.trustId ?? null;
			if (trustId == null && lead.userId) {
				const linkedTrust = await db.query.trust.findFirst({
					where: eq(trust.userId, lead.userId),
					orderBy: (t, { desc }) => [desc(t.updatedAt)],
					columns: { id: true },
				});
				trustId = linkedTrust?.id ?? null;
			}

			const links = buildLinks({
				origin,
				sequence,
				emailKey: emailMeta.key,
				unsubscribeToken: lead.unsubscribeToken!,
				trustId,
			});

			const html = renderDripEmail({
				sequence,
				emailKey: emailMeta.key,
				lead: {
					firstName: lead.firstName ?? 'friend',
					quizResult: lead.quizResult,
				},
				links,
			});

			if (!html) continue;

			await sendMarketingEmail({
				leadId: lead.id,
				to: lead.email,
				subject: emailMeta.subject,
				html,
				sequence,
				emailKey: emailMeta.key,
				unsubscribeUrl: links.unsubscribeUrl,
			});

			sent++;

			// Advance schedule.
			const nextIdx = idx + 1;
			const nextMeta = schedule[nextIdx];

			if (!nextMeta) {
				// Last email sent — mark complete.
				await db.update(marketingLead).set({ sequenceStatus: 'completed', nextEmailIndex: nextIdx + 1, nextEmailAt: null, updatedAt: now }).where(eq(marketingLead.id, lead.id));
			} else {
				// Schedule next from enrollment time + next offset.
				const base = lead.enrolledAt ?? now;
				const nextAt = new Date(base.getTime() + nextMeta.offsetHours * 3600 * 1000);
				await db.update(marketingLead).set({ nextEmailIndex: nextIdx + 1, nextEmailAt: nextAt, updatedAt: now }).where(eq(marketingLead.id, lead.id));
			}
		} catch (err) {
			console.error(`[drip] Error processing lead ${lead.id}:`, err);
		}
	}

	return sent;
}

/** Detect unpaid app abandoners and enroll them (or refresh their sequence). */
export async function enrollAppAbandoners(): Promise<number> {
	if (!DRIP_SENDING_ENABLED) return 0;

	const now = new Date();
	let enrolled = 0;

	// Find trusts that are started or awaiting-payment.
	// We filter for no paid invoice in JS below (simpler than a subquery).
	const unpaidTrusts = await db.query.trust.findMany({
		where: or(
			eq(trust.status, TrustStatus.Started),
			eq(trust.status, TrustStatus.AwaitingPayment),
		),
		with: { user: true },
	});

	// Check which users have a paid invoice.
	const userIdsWithTrusts = [...new Set(unpaidTrusts.map((t) => t.userId))];
	let paidUserIds = new Set<string>();
	if (userIdsWithTrusts.length > 0) {
		const paidInvoices = await db.query.invoice.findMany({
			where: and(
				eq(invoice.paid, true),
				sql`${invoice.userId} = ANY(${sql.raw(`ARRAY[${userIdsWithTrusts.map(() => '?').join(',')}]`)})`,
			),
			columns: { userId: true },
		}).catch(() => [] as { userId: string }[]);
		// Fallback: load individually if array query fails
		if (paidInvoices.length === 0 && userIdsWithTrusts.length > 0) {
			for (const uid of userIdsWithTrusts) {
				const paid = await db.query.invoice.findFirst({
					where: and(eq(invoice.userId, uid), eq(invoice.paid, true)),
					columns: { userId: true },
				});
				if (paid) paidUserIds.add(uid);
			}
		} else {
			paidUserIds = new Set(paidInvoices.map((i) => i.userId));
		}
	}

	const rows = unpaidTrusts
		.filter((t) => !paidUserIds.has(t.userId))
		.map((t) => ({
			trustId: t.id,
			userId: t.userId,
			status: t.status,
			updatedAt: t.updatedAt,
			screeningAnswers: t.screeningAnswers,
			userEmail: t.user.email,
			userName: t.user.name,
		}));

	for (const row of rows) {
		const email = row.userEmail?.trim().toLowerCase();
		if (!email) continue;

		const firstName = (row.userName ?? '').split(' ')[0] ?? '';
		const abandonedAt = row.updatedAt ?? now;
		const delayHours =
			row.status === TrustStatus.AwaitingPayment
				? APP_ABANDONMENT_DELAY_INTAKE_HOURS
				: APP_ABANDONMENT_DELAY_BARE_ACCOUNT_HOURS;

		// Only enroll if enough time has passed.
		const readyAt = new Date(abandonedAt.getTime() + delayHours * 3600 * 1000);
		if (readyAt > now) continue;

		// Detect complexity flags from screening.
		const flags: string[] = [];
		const sa = row.screeningAnswers as Record<string, boolean> | null;
		if (sa) {
			if (sa['business_ownership']) flags.push('business');
			if (sa['multiple_properties']) flags.push('multiple_properties');
			if (sa['blended_family']) flags.push('blended_family');
			if (sa['special_needs']) flags.push('special_needs');
			if (sa['taxable_estate']) flags.push('taxable_estate');
		}

		try {
			await enrollLead({
				email,
				firstName,
				userId: row.userId,
				sequence: 'app_started',
				leadType: 'app_started',
				appStatus: row.status === TrustStatus.AwaitingPayment ? 'intake_completed' : 'account_created',
				trustId: row.trustId,
				complexityFlags: flags,
				firstEmailDelayHours: 0, // delay already waited; send now
			});

			enrolled++;
		} catch (err) {
			console.error(`[drip] Error enrolling abandoner ${email}:`, err);
		}
	}

	return enrolled;
}
