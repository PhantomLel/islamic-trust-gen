import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { trust, invoice, TrustStatus } from '$lib/server/db/schema';
import type { WarningAgreementData } from '$lib/server/db/schema';
import { WARNING_AGREEMENT_VERSION } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { stripe } from '$lib/server/stripe';
import type { PageServerLoad, Actions } from './$types';
import { defaultPrepFee, postPaymentEntryQuestionId } from '$lib/config';

const CHARITY_DISCOUNT = 200;
const DEED_RETRIEVAL_FEE = 35;

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
		const selectedPlan = formData.get('selectedPlan') === 'discounted' ? 'discounted' : 'full';
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
		const trustFeeAmount = selectedPlan === 'discounted'
			? Math.max(0, baseAmount - CHARITY_DISCOUNT)
			: baseAmount;

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

		// Create a one-off coupon so Stripe shows it as a separate discount line.
		let discounts: { coupon: string }[] | undefined;
		if (selectedPlan === 'discounted') {
			const coupon = await stripe.coupons.create({
				amount_off: CHARITY_DISCOUNT * 100,
				currency: 'usd',
				name: 'Wasiyyah Pledge Discount',
				duration: 'once',
			});
			discounts = [{ coupon: coupon.id }];
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			customer_email: locals.user.email,
			line_items: lineItems,
			...(discounts ? { discounts } : {}),
			metadata: {
				trustId: String(trustId),
				userId: locals.user.id,
				selectedPlan,
				addDeedRetrieval: String(addDeedRetrieval),
			},
			success_url: `${env.ORIGIN}/create-trust/${trustId}?payment=success#${postPaymentEntryQuestionId}`,
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
