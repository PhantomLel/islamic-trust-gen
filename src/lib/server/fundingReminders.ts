/**
 * Funding journey reminder processor — invoked from the drip cron (no separate endpoint).
 */
import { Resend } from 'resend';
import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import {
	fundingDashboard,
	TrustStatus,
} from '$lib/server/db/schema';
import {
	claimReminderSend,
	releaseReminderClaim,
	setReminderResendId,
	flagsFromDashboard,
} from '$lib/server/funding';
import { computeFundingProgress, isMilestoneApplicable } from '$lib/funding/logic';
import { getMilestoneContent } from '$lib/funding/content';
import { fundingReminderEmail } from '$lib/server/emails/funding/reminder';

const DAY_MS = 86_400_000;

function daysAgo(n: number): Date {
	return new Date(Date.now() - n * DAY_MS);
}

async function sendOnce(
	dashboardId: number,
	reminderKey: string,
	opts: {
		to: string;
		name?: string | null;
		trustId: number;
		subject: string;
		headline: string;
		body: string;
		fundingUrl: string | null;
	},
): Promise<boolean> {
	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return false;

	const logId = await claimReminderSend(dashboardId, reminderKey);
	if (!logId) return false;

	try {
		const resend = new Resend(env.RESEND_API_KEY);
		const result = await resend.emails.send({
			from: env.FROM_EMAIL,
			to: opts.to,
			subject: opts.subject,
			html: fundingReminderEmail({
				trustId: opts.trustId,
				recipientName: opts.name,
				subject: opts.subject,
				headline: opts.headline,
				body: opts.body,
				fundingUrl: opts.fundingUrl,
			}),
		});
		await setReminderResendId(logId, result.data?.id ?? null);
		return true;
	} catch (err) {
		await releaseReminderClaim(logId);
		console.error(`[funding-reminders] ${reminderKey} failed:`, err);
		return false;
	}
}

export async function processFundingReminders(): Promise<number> {
	let sent = 0;
	const origin = (env.ORIGIN ?? '').replace(/\/$/, '');

	const dashboards = await db.query.fundingDashboard.findMany({
		where: and(isNotNull(fundingDashboard.documentsReadyAt), isNull(fundingDashboard.implementationCompletedAt)),
		with: {
			milestones: true,
			user: { columns: { email: true, name: true } },
			trust: { columns: { id: true, status: true } },
		},
		limit: 200,
	});

	for (const dash of dashboards) {
		const to = dash.user?.email?.trim();
		if (!to) continue;
		const readyAt = dash.documentsReadyAt;
		if (!readyAt) continue;

		const fundingUrl = origin ? `${origin}/make-your-trust-work/${dash.trustId}` : null;
		const flags = flagsFromDashboard(dash);
		const progress = computeFundingProgress(flags, dash.milestones, {
			fundingUnlockedAt: dash.fundingUnlockedAt,
		});
		if (progress.implementationComplete) continue;

		const base = {
			to,
			name: dash.user?.name,
			trustId: dash.trustId,
			fundingUrl,
		};

		// day7_signing — notarization not completed
		if (readyAt <= daysAgo(7) && dash.trust?.status !== TrustStatus.Completed) {
			if (
				await sendOnce(dash.id, 'day7_signing', {
					...base,
					subject: 'Reminder: your documents are not finished until they are signed',
					headline: 'Schedule or complete notarization',
					body: 'Your Good Tree documents are ready, but your trust is not effective until it is signed and notarized. Open Make Your Trust Work to review signing steps and book your appointment.',
				})
			)
				sent += 1;
		}

		// day14_prepare — inventory/forms incomplete
		if (readyAt <= daysAgo(14) && !progress.prepareComplete) {
			if (
				await sendOnce(dash.id, 'day14_prepare', {
					...base,
					subject: 'Accounts like Schwab, Fidelity, Robinhood, Chase, and 401(k)s need institution-specific steps',
					headline: 'Keep preparing your funding checklist',
					body: 'Bank and brokerage accounts are different from employer plans and IRAs. Use Prepare Your Funding to list accounts and gather forms — you will submit to institutions after notarization.',
				})
			)
				sent += 1;
		}

		// day21_will
		if (readyAt <= daysAgo(21) && dash.pourOverWillIncluded) {
			const willRow = dash.milestones.find((m) => m.key === 'will_signing');
			const willContent = getMilestoneContent('will_signing');
			const willDone =
				willRow?.status === 'complete' ||
				willRow?.status === 'not_applicable' ||
				(willContent &&
					willContent.checklist.every((i) => willRow?.checklist?.[i.id] === true));
			const applicable = isMilestoneApplicable('will_signing', flags, !!dash.fundingUnlockedAt);
			if (applicable && !willDone) {
				if (
					await sendOnce(dash.id, 'day21_will', {
						...base,
						subject: 'Reminder: your pour-over will has separate signing steps',
						headline: 'Pour-over will signing is separate',
						body: 'Your pour-over will may require in-person witnesses and notarization. Do not treat it as done just because your trust was notarized online. Open the will-signing card when Complete Your Funding is unlocked.',
					})
				)
					sent += 1;
			}
		}

		// day30_complete — after funding unlocked
		const unlockedAt = dash.fundingUnlockedAt;
		if (unlockedAt && unlockedAt <= daysAgo(30)) {
			const storage = dash.milestones.find((m) => m.key === 'storage');
			const trustee = dash.milestones.find((m) => m.key === 'trustee_notification');
			const storageDone = storage?.status === 'complete' || storage?.status === 'not_applicable';
			const trusteeDone = trustee?.status === 'complete' || trustee?.status === 'not_applicable';
			if (!storageDone || !trusteeDone) {
				if (
					await sendOnce(dash.id, 'day30_complete', {
						...base,
						subject: 'Save your confirmations and tell your successor trustee where documents are stored',
						headline: 'Finish storage and trustee notification',
						body: 'Store signed originals where your successor trustee can find them, and tell them they are named. These steps are in Protect & Share inside Make Your Trust Work.',
					})
				)
					sent += 1;
			}
		}
	}

	return sent;
}
