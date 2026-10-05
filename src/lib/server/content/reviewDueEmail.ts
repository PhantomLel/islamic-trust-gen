import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { replyToEmail, siteName } from '$lib/config';
import { listReviewDuePages } from './pages';
import { db } from '$lib/server/db';
import { contentAudit } from '$lib/server/db/schema';
import { and, eq, gte } from 'drizzle-orm';

/** One email per calendar month to Leonard with answers due for re-review. */
export async function sendMonthlyContentReviewEmail(now: Date = new Date()): Promise<{ sent: boolean; count: number }> {
	const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	const [already] = await db
		.select({ id: contentAudit.id })
		.from(contentAudit)
		.where(and(eq(contentAudit.action, 'review_email'), gte(contentAudit.createdAt, monthStart)))
		.limit(1);
	if (already) return { sent: false, count: 0 };

	const due = await listReviewDuePages(now);
	if (!due.length) return { sent: false, count: 0 };

	const to = env.CONTENT_REVIEW_EMAIL?.trim() || replyToEmail;
	if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
		console.warn('[content/review] Missing RESEND_API_KEY or FROM_EMAIL');
		return { sent: false, count: due.length };
	}

	const resend = new Resend(env.RESEND_API_KEY);
	const lines = due.map(
		(p) => `• ${p.title || p.slug} (/answers/${p.slug}) — last reviewed ${p.lastReviewedOn ?? 'never'}`,
	);
	await resend.emails.send({
		from: env.FROM_EMAIL,
		to,
		replyTo: replyToEmail,
		subject: `${siteName}: ${due.length} answer page(s) due for review`,
		text: [`The following published answer pages are due for a six-month review:`, '', ...lines, ''].join('\n'),
	});

	await db.insert(contentAudit).values({
		actorId: 'system',
		action: 'review_email',
		targetType: 'content_review',
		targetId: monthStart.toISOString().slice(0, 7),
	});

	return { sent: true, count: due.length };
}
