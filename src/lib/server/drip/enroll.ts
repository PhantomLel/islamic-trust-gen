import { db } from '$lib/server/db';
import { marketingLead } from '$lib/server/db/schema';
import type { LeadType, QuizResult, AppStatus, SequenceStatus } from '$lib/server/db/schema';
import type { SequenceName } from './sequences';
import { eq } from 'drizzle-orm';
import { SCHEDULES } from './sequences';
import { sendMarketingEmail } from './sendMarketingEmail';
import { buildLinks } from './links';
import { renderDripEmail } from './renderEmail';
import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';

export type { LeadType, QuizResult, AppStatus, SequenceName };

/**
 * Priority weights — higher wins.
 * Stopped statuses are terminal; active sequences are compared by lead type.
 */
const SEQUENCE_PRIORITY: Record<string, number> = {
	unsubscribed: 100,
	stopped_paid: 90,
	stopped_consult: 80,
	stopped_manual: 70,
	app_started: 50,
	quiz_lead: 30,
	free_will_lead: 20,
};

function sequencePriority(status: SequenceStatus | null, sequenceName: string | null): number {
	if (status === 'unsubscribed') return SEQUENCE_PRIORITY['unsubscribed']!;
	if (status === 'stopped_paid') return SEQUENCE_PRIORITY['stopped_paid']!;
	if (status === 'stopped_consult') return SEQUENCE_PRIORITY['stopped_consult']!;
	if (status === 'stopped_manual') return SEQUENCE_PRIORITY['stopped_manual']!;
	return SEQUENCE_PRIORITY[sequenceName ?? ''] ?? 0;
}

function isTerminalStatus(s: SequenceStatus | null): boolean {
	return s === 'unsubscribed' || s === 'stopped_paid' || s === 'stopped_consult' || s === 'stopped_manual';
}

export type EnrollInput = {
	email: string;
	firstName?: string | null;
	userId?: string | null;
	source?: string | null;
	leadType: LeadType;
	sequence: SequenceName;
	quizResult?: QuizResult | null;
	quizWaqf?: boolean;
	complexityFlags?: string[];
	appStatus?: AppStatus | null;
	trustId?: number | null;
	/** For App Started: override the first email delay (hours from now). Default: from schedule. */
	firstEmailDelayHours?: number;
	/** If true, send Email 1 immediately (quiz sequence) and schedule Email 2+. */
	sendFirstEmailNow?: boolean;
};

export type EnrollResult =
	| { enrolled: true }
	| { enrolled: false; reason: 'terminal' | 'lower_priority' | 'empty_schedule' };

/** Enroll or switch a lead into a drip sequence. */
export async function enrollLead(input: EnrollInput): Promise<EnrollResult> {
	const email = input.email.trim().toLowerCase();
	const now = new Date();

	const existing = await db.query.marketingLead.findFirst({
		where: eq(marketingLead.email, email),
	});

	// Never override terminal statuses.
	if (existing && isTerminalStatus(existing.sequenceStatus)) {
		return { enrolled: false, reason: 'terminal' };
	}

	// Priority check: only enroll if incoming sequence outranks existing.
	const existingPriority = sequencePriority(existing?.sequenceStatus ?? null, existing?.currentSequence ?? null);
	const incomingPriority = SEQUENCE_PRIORITY[input.sequence] ?? 0;

	const shouldSwitch = !existing || incomingPriority > existingPriority;

	const schedule = SCHEDULES[input.sequence];
	if (!schedule || schedule.length === 0) {
		return { enrolled: false, reason: 'empty_schedule' };
	}

	const token = existing?.unsubscribeToken ?? randomBytes(24).toString('hex');
	// Every subsequent email is scheduled as enrolledAt + offsetHours (see processDueEmails).
	// On a real switch, the new sequence's clock must start now — preserving the old
	// enrolledAt would make the new sequence's offsets resolve to the past and blast the
	// early emails out all at once. Only keep the original timestamp when we're NOT switching.
	const enrolledAt = shouldSwitch ? now : (existing?.enrolledAt ?? now);

	// Determine nextEmailIndex and nextEmailAt.
	let nextIndex: number;
	let nextAt: Date;

	if (input.sendFirstEmailNow) {
		// Email 1 is sent in this request; keep index at 1 until send succeeds, then advance.
		nextIndex = 1;
		nextAt = now;
	} else if (input.firstEmailDelayHours !== undefined) {
		// App-started: Email 1 fires after delay, measured from now.
		nextIndex = 1;
		nextAt = new Date(now.getTime() + input.firstEmailDelayHours * 3600 * 1000);
	} else {
		// Free will: skip Email 1; start at Email 2 immediately but offset from enrollment.
		nextIndex = 1;
		const firstEmail = schedule[0];
		nextAt = firstEmail
			? new Date(enrolledAt.getTime() + firstEmail.offsetHours * 3600 * 1000)
			: now;
	}

	// Don't regress an already-active sequence of same or higher priority.
	if (existing && !shouldSwitch) {
		// Update attribution + app status only, don't reset schedule.
		await db.update(marketingLead).set({
			lastTouchSource: input.source ?? existing.lastTouchSource,
			appStatus: input.appStatus ?? existing.appStatus,
			complexityFlags: input.complexityFlags ?? existing.complexityFlags,
			userId: input.userId ?? existing.userId,
			trustId: input.trustId ?? existing.trustId,
			updatedAt: now,
		}).where(eq(marketingLead.email, email));
		return { enrolled: false, reason: 'lower_priority' };
	}

	if (!existing) {
		await db.insert(marketingLead).values({
			email,
			firstName: input.firstName ?? null,
			userId: input.userId ?? null,
			trustId: input.trustId ?? null,
			firstTouchSource: input.source ?? null,
			lastTouchSource: input.source ?? null,
			leadType: input.leadType,
			quizResult: input.quizResult ?? null,
			quizWaqf: input.quizWaqf ?? false,
			complexityFlags: input.complexityFlags ?? [],
			appStatus: input.appStatus ?? null,
			currentSequence: input.sequence,
			sequenceStatus: 'active',
			nextEmailIndex: nextIndex,
			nextEmailAt: nextAt,
			enrolledAt,
			unsubscribeToken: token,
			updatedAt: now,
		});
	} else {
		// Switch sequence.
		await db.update(marketingLead).set({
			firstName: input.firstName ?? existing.firstName,
			userId: input.userId ?? existing.userId,
			trustId: input.trustId ?? existing.trustId,
			lastTouchSource: input.source ?? existing.lastTouchSource,
			leadType: input.leadType,
			quizResult: input.quizResult ?? existing.quizResult,
			quizWaqf: input.quizWaqf ?? existing.quizWaqf ?? false,
			complexityFlags: input.complexityFlags ?? existing.complexityFlags,
			appStatus: input.appStatus ?? existing.appStatus,
			currentSequence: input.sequence,
			sequenceStatus: 'active',
			nextEmailIndex: nextIndex,
			nextEmailAt: nextAt,
			enrolledAt,
			stoppedAt: null,
			stoppedReason: null,
			updatedAt: now,
		}).where(eq(marketingLead.email, email));
	}

	// Send Email 1 immediately for quiz sequence; only then advance to Email 2.
	if (input.sendFirstEmailNow) {
		const lead = await db.query.marketingLead.findFirst({ where: eq(marketingLead.email, email) });
		if (!lead) return { enrolled: true };

		const emailMeta = schedule[0];
		if (!emailMeta) return { enrolled: true };

		const links = buildLinks({
			origin: env.ORIGIN ?? '',
			sequence: input.sequence,
			emailKey: emailMeta.key,
			unsubscribeToken: lead.unsubscribeToken!,
			trustId: input.trustId ?? lead.trustId,
		});

		const html = renderDripEmail({
			sequence: input.sequence,
			emailKey: emailMeta.key,
			lead: {
				firstName: lead.firstName ?? 'friend',
				quizResult: lead.quizResult,
			},
			links,
		});

		if (html) {
			await sendMarketingEmail({
				leadId: lead.id,
				to: email,
				subject: emailMeta.subject,
				html,
				sequence: input.sequence,
				emailKey: emailMeta.key,
			});

			const secondEmail = schedule[1];
			const nextAt2 = secondEmail
				? new Date(now.getTime() + secondEmail.offsetHours * 3600 * 1000)
				: new Date(now.getTime() + 48 * 3600 * 1000);
			await db
				.update(marketingLead)
				.set({ nextEmailIndex: 2, nextEmailAt: nextAt2, updatedAt: new Date() })
				.where(eq(marketingLead.email, email));
		}
	}

	return { enrolled: true };
}
