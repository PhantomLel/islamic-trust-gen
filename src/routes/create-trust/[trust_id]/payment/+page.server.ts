import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { trust, invoice, TrustStatus } from '$lib/server/db/schema';
import type { WarningAgreementData } from '$lib/server/db/schema';
import { WARNING_AGREEMENT_VERSION } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { stripe } from '$lib/server/stripe';
import { promoteTrustAfterPayment } from '$lib/server/fulfillCheckout';
import type { PageServerLoad, Actions } from './$types';
import { defaultPrepFee, deedRetrievalFeeUsd, postPaymentEntryQuestionId } from '$lib/config';

/** Optional service fee (Appendix A Schedule A). The county copy charge is absorbed by the Firm, never passed through. */
const DEED_RETRIEVAL_FEE = deedRetrievalFeeUsd;

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trustId = parseInt(params.trust_id, 10);
	if (isNaN(trustId)) throw error(404, 'Trust not found');

	const existing = await db.query.trust.findFirst({
		where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
	});

	if (!existing) throw error(404, 'Trust not found');

	// Redirect away if not in the payment-pending state
	if (existing.status !== TrustStatus.AwaitingPayment) {
		throw redirect(302, `/create-trust/${trustId}`);
	}

	return {
		trustId,
		amountUsd: existing.customPrice ?? defaultPrepFee,
		userEmail: locals.user.email,
		userName: locals.user.name,
	};
};

export const actions: Actions = {
	checkout: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const existing = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		});
		if (!existing) throw error(404, 'Trust not found');
		if (existing.status !== TrustStatus.AwaitingPayment) {
			throw error(400, 'Trust is not awaiting payment');
		}

		const formData = await request.formData();
		const selectedPlan = 'full';
		const addDeedRetrieval = formData.get('addDeedRetrieval') === 'true';

		// Parse and persist the Planning Warning agreement
		let warningAcceptedAt: Date | null = null;
		let warningAgreementData: WarningAgreementData | null = null;
		const warningRaw = formData.get('warningAgreement');
		if (typeof warningRaw === 'string' && warningRaw.trim()) {
			try {
				const parsed = JSON.parse(warningRaw) as WarningAgreementData;
				if (parsed && parsed.version === WARNING_AGREEMENT_VERSION && parsed.clientTimestamp) {
					warningAgreementData = parsed;
					warningAcceptedAt = new Date();
				}
			} catch {
				console.error('[checkout] Failed to parse warning agreement data');
			}
		}
		if (warningAcceptedAt) {
			await db
				.update(trust)
				.set({ warningAcceptedAt, warningAgreementData, updatedAt: new Date() })
				.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));
		}

		const baseAmount = existing.customPrice ?? defaultPrepFee;
		const deedAmount = addDeedRetrieval ? DEED_RETRIEVAL_FEE : 0;
		const effectiveTotal = baseAmount + deedAmount;
		const trustFeeAmount = baseAmount;

		const successUrl = `${env.ORIGIN}/create-trust/${trustId}?payment=success&session_id={CHECKOUT_SESSION_ID}#${postPaymentEntryQuestionId}`;

		// ── No-cost order ($0 effective total) ────────────────────────────────
		// A comped price reduces the total to $0. Stripe does not reliably deliver
		// `checkout.session.completed` for no-cost orders, which would otherwise leave
		// the trust stuck in AwaitingPayment. Skip Stripe entirely and fulfill directly.
		if (effectiveTotal <= 0) {
			const now = new Date();
			await db.insert(invoice).values({
				userId: locals.user.id,
				name: 'Trust Preparation Fee',
				description: 'Trust preparation and document drafting',
				amount: trustFeeAmount,
				paid: true,
				paidAt: now,
				createdAt: now,
			});
			if (addDeedRetrieval) {
				await db.insert(invoice).values({
					userId: locals.user.id,
					name: 'Deed Retrieval Fee',
					description: 'Retrieval of house deed from county records office',
					amount: DEED_RETRIEVAL_FEE,
					paid: true,
					paidAt: now,
					createdAt: now,
				});
			}

			await promoteTrustAfterPayment({
				trustId,
				selectedPlan,
				deedRetrievalRequested: addDeedRetrieval,
				customerEmail: locals.user.email,
				amountTotalCents: 0,
				stripeCheckoutSessionId: null,
			});

			// Same-origin success URL (no Stripe session id for no-cost orders).
			return {
				checkoutUrl: `${env.ORIGIN}/create-trust/${trustId}?payment=success#${postPaymentEntryQuestionId}`,
			};
		}

		const lineItems: {
			price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
			quantity: number;
		}[] = [
			{
				price_data: {
					currency: 'usd',
					product_data: { name: 'Trust Preparation Fee' },
					unit_amount: baseAmount * 100,
				},
				quantity: 1,
			},
		];

		if (addDeedRetrieval) {
			lineItems.push({
				price_data: {
					currency: 'usd',
					product_data: {
						name: 'House Deed Retrieval',
						description: 'Retrieval of house deed from county records office',
					},
					unit_amount: DEED_RETRIEVAL_FEE * 100,
				},
				quantity: 1,
			});
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			customer_email: locals.user.email,
			line_items: lineItems,
			metadata: {
				trustId: String(trustId),
				userId: locals.user.id,
				selectedPlan,
				addDeedRetrieval: String(addDeedRetrieval),
			},
			success_url: successUrl,
			cancel_url: `${env.ORIGIN}/create-trust/${trustId}/payment?cancelled=true`,
		});

		// Create the trust preparation invoice now that we have a Stripe session ID.
		const [prepInvoice] = await db
			.insert(invoice)
			.values({
				userId: locals.user.id,
				name: 'Trust Preparation Fee',
				description: 'Trust preparation and document drafting',
				amount: trustFeeAmount,
				stripeCheckoutSessionId: session.id,
				createdAt: new Date(),
			})
			.returning({ id: invoice.id });

		// Create the deed retrieval invoice if selected.
		if (addDeedRetrieval) {
			await db.insert(invoice).values({
				userId: locals.user.id,
				name: 'Deed Retrieval Fee',
				description: 'Retrieval of house deed from county records office',
				amount: DEED_RETRIEVAL_FEE,
				stripeCheckoutSessionId: session.id,
				createdAt: new Date(),
			});
		}

		// Store invoice ID in Stripe session metadata for webhook reconciliation.
		// selectedPlan and deedRetrievalRequested are intentionally NOT written here;
		// the webhook sets them on confirmed payment so they act as a payment verification flag.
		await stripe.checkout.sessions.update(session.id, {
			metadata: {
				trustId: String(trustId),
				userId: locals.user.id,
				selectedPlan,
				addDeedRetrieval: String(addDeedRetrieval),
				invoiceId: String(prepInvoice.id),
			},
		});

		return { checkoutUrl: session.url };
	},
};
