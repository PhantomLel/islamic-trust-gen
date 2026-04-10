import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { stripe } from '$lib/server/stripe';
import { db } from '$lib/server/db';
import { invoice, trust, TrustStatus } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

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
		const session = event.data.object;
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
			}
		}
	}

	return json({ received: true });
};
