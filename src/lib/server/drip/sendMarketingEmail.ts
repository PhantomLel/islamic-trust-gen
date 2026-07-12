import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { siteName, replyToEmail } from '$lib/config';
import { db } from '$lib/server/db';
import { marketingEmailLog, marketingLead } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export type MarketingEmailPayload = {
	leadId: number;
	to: string;
	subject: string;
	html: string;
	sequence: string;
	emailKey: string;
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
		});
		resendId = result.data?.id ?? undefined;
		console.log(`[drip] Sent ${payload.emailKey} to ${payload.to} (resendId=${resendId})`);
	} catch (err) {
		console.error(`[drip] Failed to send ${payload.emailKey} to ${payload.to}:`, err);
		throw err;
	}

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
}
