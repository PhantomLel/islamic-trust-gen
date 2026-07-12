import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { postPaymentEntryQuestionId, siteName } from '$lib/config';
import { stripe } from '$lib/server/stripe';
import { db } from '$lib/server/db';
import { invoice, trust, TrustStatus } from '$lib/server/db/schema';
import { paymentReceivedEmail } from '$lib/server/emails/paymentReceived';
import { adminUserUrl, formatStripeAmount, notifyAdmins } from '$lib/server/notifyAdmins';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';
import { stopLeadOnPayment } from '$lib/server/drip/stop';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) throw error(400, 'Missing stripe-signature header');
	if (!env.STRIPE_WEBHOOK_SECRET) throw error(500, 'STRIPE_WEBHOOK_SECRET is not configured');

	let event;
	try {
		event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Stripe webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;
		const sessionId = session.id;
		const trustId = session.metadata?.trustId ? parseInt(session.metadata.trustId, 10) : null;

		// Mark all invoices linked to this checkout session as paid
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

		// Unlock post-payment intake: AwaitingPayment → AwaitingAnswers after successful checkout.
		// selectedPlan and deedRetrievalRequested are set here (not at checkout creation) so that
		// a non-null selectedPlan can be used as reliable proof of payment.
		if (trustId && !isNaN(trustId)) {
			const selectedPlan =
				session.metadata?.selectedPlan === 'discounted' ? 'discounted' : 'full';
			const deedRetrievalRequested = session.metadata?.addDeedRetrieval === 'true';

			const existing = await db.query.trust.findFirst({
				where: eq(trust.id, trustId),
				columns: { status: true },
			});

			if (existing?.status === TrustStatus.AwaitingPayment) {
				await db
					.update(trust)
					.set({
						status: TrustStatus.AwaitingAnswers,
						selectedPlan,
						deedRetrievalRequested,
						updatedAt: now,
					})
					.where(eq(trust.id, trustId));

				const customerEmail =
					session.customer_email ?? session.customer_details?.email ?? null;
				const metadataUserId = session.metadata?.userId ?? null;

				const trustWithUser = await db.query.trust.findFirst({
					where: eq(trust.id, trustId),
					with: { user: true },
				});
				const u = trustWithUser?.user;

				// Stop drip by userId and any known emails (Stripe + account) so a
				// mismatch between checkout email and marketing_lead.email still stops sends.
				stopLeadOnPayment(
					{
						userId: metadataUserId ?? u?.id ?? null,
						emails: [customerEmail, u?.email],
					},
					'stopped_paid',
					'stripe_payment_completed',
				).catch((err) => console.error('[drip] Stop on payment failed:', err));

				if (customerEmail && resend && env.FROM_EMAIL) {
					try {
						await resend.emails.send({
							from: env.FROM_EMAIL,
							to: customerEmail,
							subject: `Payment received — ${siteName}`,
							html: paymentReceivedEmail({
								trustId,
								selectedPlan,
								deedRetrievalRequested,
								amountTotalCents: session.amount_total,
								continueUrl: `${env.ORIGIN}/create-trust/${trustId}#${postPaymentEntryQuestionId}`,
							}),
						});
					} catch (err) {
						console.error('[Stripe webhook] Payment confirmation email failed:', err);
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
							`Stripe checkout session ID: ${sessionId}`,
							`Amount total: ${formatStripeAmount(session.amount_total)}`,
							`Checkout customer email: ${customerEmail ?? '(none)'}`,
							`Open in admin: ${adminUserUrl(u.id)}`,
						].join('\n')
					);
				}
			}
		}
	}

	return json({ received: true });
};
