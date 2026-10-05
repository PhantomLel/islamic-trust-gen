import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { siteName } from '$lib/config';
import { replyToEmail } from '$lib/server/config';
import { db } from '$lib/server/db';
import { marketingEmailLog, marketingLead } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { adminUserUrl, notifyAdmins } from '$lib/server/notifyAdmins';
import { listUnsubscribeHeaders } from './marketingEmailHeaders';

export type MarketingEmailPayload = {
	leadId: number;
	to: string;
	subject: string;
	html: string;
	sequence: string;
	emailKey: string;
	unsubscribeUrl: string;
};

export async function sendMarketingEmail(payload: MarketingEmailPayload): Promise<void> {
	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
		console.warn('[drip] Missing RESEND_API_KEY or FROM_EMAIL — cannot send', payload.emailKey);
		throw new Error('Missing RESEND_API_KEY or FROM_EMAIL');
	}

	const resend = new Resend(env.RESEND_API_KEY);
	let resendId: string | undefined;

	try {
		const result = await resend.emails.send({
			from: env.FROM_EMAIL,
			to: payload.to,
			replyTo: replyToEmail,
			subject: `${payload.subject} — ${siteName}`,
			html: payload.html,
			headers: listUnsubscribeHeaders(payload.unsubscribeUrl),
		});
		resendId = result.data?.id ?? undefined;
		console.log(`[drip] Sent ${payload.emailKey} to ${payload.to} (resendId=${resendId})`);
	} catch (err) {
		console.error(`[drip] Failed to send ${payload.emailKey} to ${payload.to}:`, err);
		throw err;
	}

	const lead = await db.query.marketingLead.findFirst({
		where: eq(marketingLead.id, payload.leadId),
		columns: {
			firstName: true,
			userId: true,
			leadType: true,
			quizResult: true,
			appStatus: true,
		},
	}).catch(() => null);

	try {
		await db.insert(marketingEmailLog).values({
			leadId: payload.leadId,
			email: payload.to,
			sequence: payload.sequence,
			emailKey: payload.emailKey,
			subject: payload.subject,
			resendId: resendId ?? null,
		});
		await db
			.update(marketingLead)
			.set({ lastEmailAt: new Date(), lastEmailKey: payload.emailKey, updatedAt: new Date() })
			.where(eq(marketingLead.id, payload.leadId));
	} catch (err) {
		console.error('[drip] Failed to log email send:', err);
	}

	// Production-only admin alert (notifyAdmins no-ops outside production / local ORIGIN).
	notifyAdmins(
		`Drip sent — ${payload.emailKey}`,
		[
			'Event: Automated marketing drip email sent',
			`Recipient: ${payload.to}`,
			`First name: ${lead?.firstName?.trim() || '(none)'}`,
			`Sequence: ${payload.sequence}`,
			`Email key: ${payload.emailKey}`,
			`Subject: ${payload.subject}`,
			`Lead type: ${lead?.leadType ?? '(unknown)'}`,
			`Quiz result: ${lead?.quizResult ?? '(n/a)'}`,
			`App status: ${lead?.appStatus ?? '(n/a)'}`,
			`Resend ID: ${resendId ?? '(none)'}`,
			`Lead ID: ${payload.leadId}`,
			lead?.userId ? `Open in admin: ${adminUserUrl(lead.userId)}` : 'Open in admin: (no linked user yet)',
		].join('\n'),
	).catch((err) => console.error('[drip] Admin notify failed:', err));
}
