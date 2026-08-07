import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { defaultPrepFee, postPaymentEntryQuestionId, siteName } from '$lib/config';
import { db } from '$lib/server/db';
import { invoice, trust, TrustStatus } from '$lib/server/db/schema';
import { paymentReceivedEmail, type PaymentPlanId } from '$lib/server/emails/paymentReceived';
import { adminUserUrl, formatStripeAmount, notifyAdmins } from '$lib/server/notifyAdmins';
import { stopLeadOnPayment } from '$lib/server/drip/stop';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type PromoteTrustParams = {
	trustId: number;
	selectedPlan: PaymentPlanId;
	deedRetrievalRequested: boolean;
	/** Checkout customer email, used for the confirmation email + drip stop. */
	customerEmail: string | null;
	/** Total charged in cents (0 for no-cost orders); used in emails/notifications only. */
	amountTotalCents: number | null;
	/** Stripe session id when available; null for no-cost orders handled without Stripe. */
	stripeCheckoutSessionId?: string | null;
};

/**
 * Idempotently promote a trust from AwaitingPayment → AwaitingAnswers once payment is
 * confirmed. Confirmation can arrive three ways, all of which funnel through here:
 *   1. the Stripe `checkout.session.completed` webhook,
 *   2. success-return reconciliation (in case the webhook is delayed or dropped),
 *   3. a no-cost ($0-effective) order that skips Stripe entirely.
 *
 * Safe to call multiple times: it only acts while the trust is still AwaitingPayment,
 * so the fastest confirmation wins and the rest become no-ops.
 *
 * @returns true if this call performed the promotion, false if it was a no-op.
 */
export async function promoteTrustAfterPayment(params: PromoteTrustParams): Promise<boolean> {
	const {
		trustId,
		selectedPlan,
		deedRetrievalRequested,
		customerEmail,
		amountTotalCents,
		stripeCheckoutSessionId = null,
	} = params;

	if (!trustId || Number.isNaN(trustId)) return false;

	// Proof-of-payment gate: only unlock post-payment intake if we're still awaiting payment.
	const existing = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		columns: { status: true },
	});
	if (existing?.status !== TrustStatus.AwaitingPayment) return false;

	const now = new Date();
	await db
		.update(trust)
		.set({
			status: TrustStatus.AwaitingAnswers,
			selectedPlan,
			deedRetrievalRequested,
			updatedAt: now,
		})
		.where(eq(trust.id, trustId));

	const trustWithUser = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		with: { user: true },
	});
	const u = trustWithUser?.user;

	// Stop drip by userId and any known emails (Stripe + account) so a mismatch between
	// checkout email and marketing_lead.email still stops sends.
	stopLeadOnPayment(
		{
			userId: u?.id ?? null,
			emails: [customerEmail, u?.email],
		},
		'stopped_paid',
		'stripe_payment_completed',
	).catch((err) => console.error('[drip] Stop on payment failed:', err));

	if (customerEmail && resend && env.FROM_EMAIL) {
		try {
			// Trust fee actually charged (excludes the deed add-on) — drives the Jabal
			// Foundation giving-program figure below. Read live off the trust row so it
			// always reflects the price the customer actually paid, never a hardcoded amount.
			const trustFeeAmountUsd = trustWithUser?.customPrice ?? defaultPrepFee;
			await resend.emails.send({
				from: env.FROM_EMAIL,
				to: customerEmail,
				subject: `Payment received — ${siteName}`,
				html: paymentReceivedEmail({
					trustId,
					selectedPlan,
					deedRetrievalRequested,
					amountTotalCents,
					trustFeeAmountUsd,
					continueUrl: `${env.ORIGIN}/create-trust/${trustId}#${postPaymentEntryQuestionId}`,
				}),
			});
		} catch (err) {
			console.error('[fulfillCheckout] Payment confirmation email failed:', err);
		}
	}

	if (u) {
		await notifyAdmins(
			`Payment received — trust #${trustId}`,
			[
				'Event: Payment received (Stripe checkout completed)',
				`Trust ID: ${trustId}`,
				`Trust status: ${TrustStatus.AwaitingAnswers} (post-payment intake unlocked)`,
				`User ID: ${u.id}`,
				`User name: ${u.name}`,
				`User email: ${u.email}`,
				`User county: ${u.county?.trim() ? u.county : '(not set)'}`,
				`Joint trust: ${trustWithUser?.joint === null ? 'unknown' : trustWithUser.joint ? 'yes' : 'no'}`,
				`Selected plan: ${selectedPlan}`,
				`Deed retrieval add-on: ${deedRetrievalRequested ? 'yes' : 'no'}`,
				`Stripe checkout session ID: ${stripeCheckoutSessionId ?? '(none — no-cost order)'}`,
				`Amount total: ${formatStripeAmount(amountTotalCents)}`,
				`Checkout customer email: ${customerEmail ?? '(none)'}`,
				`Open in admin: ${adminUserUrl(u.id)}`,
			].join('\n')
		);
	}

	return true;
}

/**
 * Fulfill a completed Stripe Checkout Session: mark its invoices paid and promote the trust.
 * Used by both the webhook and the success-return reconciliation path. Idempotent.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
	const sessionId = session.id;
	const trustId = session.metadata?.trustId ? parseInt(session.metadata.trustId, 10) : null;

	// Mark all invoices linked to this checkout session as paid.
	const linkedInvoices = await db.query.invoice.findMany({
		where: eq(invoice.stripeCheckoutSessionId, sessionId),
	});
	const now = new Date();
	for (const inv of linkedInvoices) {
		if (!inv.paid) {
			await db
				.update(invoice)
				.set({ paid: true, paidAt: now })
				.where(eq(invoice.id, inv.id));
		}
	}

	if (!trustId || Number.isNaN(trustId)) return;

	const selectedPlan: PaymentPlanId =
		session.metadata?.selectedPlan === 'discounted' ? 'discounted' : 'full';
	const deedRetrievalRequested = session.metadata?.addDeedRetrieval === 'true';
	const customerEmail = session.customer_email ?? session.customer_details?.email ?? null;

	await promoteTrustAfterPayment({
		trustId,
		selectedPlan,
		deedRetrievalRequested,
		customerEmail,
		amountTotalCents: session.amount_total,
		stripeCheckoutSessionId: sessionId,
	});
}
