import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { stripe } from '$lib/server/stripe';
import { fulfillCheckoutSession } from '$lib/server/fulfillCheckout';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';

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
		// Idempotent fulfillment shared with the success-return reconciliation path.
		await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
	}

	return json({ received: true });
};
