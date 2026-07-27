/**
 * Calendly webhook receiver.
 *
 * Subscribe to `invitee.created` and `invitee.canceled` for the user/organization that owns
 * the notarization event type. Configure the same signing key under `CALENDLY_WEBHOOK_SIGNING_KEY`.
 *
 * Identity: we match the inbound payload to a trust by the `tracking.utm_content` token we
 * embed in the per-trust single-use scheduling link (see `createSingleUseSchedulingLink`).
 * If the token is missing, we fall back to matching the invitee email against the single
 * notarization-pending trust for that user.
 */

import { json, error } from '@sveltejs/kit';
import { verifyCalendlyWebhookSignature } from '$lib/server/calendly';
import {
	applyNotarizationBooking,
	findTrustForNotarizationBooking,
	revertNotarizationBooking,
	type NotarizationInviteePayload,
} from '$lib/server/notarization';
import type { RequestHandler } from './$types';

type CalendlyEvent = {
	event?: string;
	payload?: NotarizationInviteePayload;
};

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const signatureHeader = request.headers.get('calendly-webhook-signature');

	const ok = verifyCalendlyWebhookSignature({ signatureHeader, rawBody });
	if (!ok) {
		console.warn('[Calendly webhook] Signature verification failed');
		throw error(400, 'Invalid signature');
	}

	let event: CalendlyEvent;
	try {
		event = JSON.parse(rawBody) as CalendlyEvent;
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const eventType = event.event;
	const payload = event.payload;
	if (!eventType || !payload) return json({ received: true });

	const matched = await findTrustForNotarizationBooking(payload);
	if (!matched) {
		const token = payload.tracking?.utm_content?.trim();
		if (token) {
			console.warn(`[Calendly webhook] ${eventType}: no trust matches token "${token}"`);
		} else {
			console.warn(
				`[Calendly webhook] ${eventType}: no utm_content token and no unique email match for ${payload.email ?? '(no email)'}`
			);
		}
		return json({ received: true, matched: false });
	}

	if (eventType === 'invitee.created') {
		await applyNotarizationBooking({
			trustId: matched.id,
			user: matched.user,
			payload,
			via: 'webhook',
		});
		return json({ received: true, matched: true });
	}

	if (eventType === 'invitee.canceled') {
		await revertNotarizationBooking({
			trustId: matched.id,
			user: matched.user,
			payload,
		});
		return json({ received: true, matched: true });
	}

	return json({ received: true });
};
