/**
 * Calendly webhook receiver.
 *
 * Subscribe to `invitee.created` and `invitee.canceled` for the user/organization that owns
 * the notarization event type. Configure the same signing key under `CALENDLY_WEBHOOK_SIGNING_KEY`.
 *
 * Identity: we match the inbound payload to a trust by the `tracking.utm_content` token we
 * embed in the per-trust single-use scheduling link (see `createSingleUseSchedulingLink`).
 * If the token is missing or doesn't match, we log and acknowledge — Calendly retries on 5xx
 * but we don't want indefinite retries for off-flow bookings.
 */

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, TrustStatus } from '$lib/server/db/schema';
import {
	createSingleUseSchedulingLink,
	isCalendlyConfigured,
	verifyCalendlyWebhookSignature,
} from '$lib/server/calendly';
import { adminUserUrl, notifyAdmins } from '$lib/server/notifyAdmins';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

type CalendlyInviteePayload = {
	uri?: string;
	email?: string;
	name?: string;
	status?: string;
	cancel_url?: string;
	reschedule_url?: string;
	tracking?: {
		utm_content?: string | null;
		utm_source?: string | null;
		utm_campaign?: string | null;
	};
	scheduled_event?: {
		uri?: string;
		start_time?: string;
		end_time?: string;
	};
};

type CalendlyEvent = {
	event?: string;
	payload?: CalendlyInviteePayload;
};

function parseDate(value: string | undefined | null): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

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

	const token = payload.tracking?.utm_content?.trim();
	if (!token) {
		console.warn(`[Calendly webhook] ${eventType} without utm_content tracking token; ignoring`);
		return json({ received: true, matched: false });
	}

	const matched = await db.query.trust.findFirst({
		where: eq(trust.notarizationLinkToken, token),
		with: { user: { columns: { id: true, name: true, email: true } } },
	});
	if (!matched) {
		console.warn(`[Calendly webhook] No trust matches token "${token}"`);
		return json({ received: true, matched: false });
	}

	const now = new Date();

	if (eventType === 'invitee.created') {
		const start = parseDate(payload.scheduled_event?.start_time);
		const end = parseDate(payload.scheduled_event?.end_time);

		await db
			.update(trust)
			.set({
				status: TrustStatus.NotarizationScheduled,
				notarizationEventUri: payload.scheduled_event?.uri ?? null,
				notarizationInviteeUri: payload.uri ?? null,
				notarizationBookedAt: now,
				notarizationStartTime: start,
				notarizationEndTime: end,
				updatedAt: now,
			})
			.where(eq(trust.id, matched.id));

		await notifyAdmins(
			`Notarization booked — trust #${matched.id}`,
			[
				`Event: Calendly booking received (invitee.created)`,
				`Trust ID: ${matched.id}`,
				`Trust status: ${TrustStatus.NotarizationScheduled}`,
				`User: ${matched.user.name} <${matched.user.email}>`,
				`Invitee email: ${payload.email ?? '(none)'}`,
				`Start: ${start?.toISOString() ?? '(unknown)'}`,
				`End: ${end?.toISOString() ?? '(unknown)'}`,
				`Open in admin: ${adminUserUrl(matched.user.id)}`,
			].join('\n')
		);
		return json({ received: true, matched: true });
	}

	if (eventType === 'invitee.canceled') {
		// The previous scheduling link was single-use and is now exhausted, so we mint a fresh
		// one before reverting the status. Failure to mint is non-fatal — the dashboard falls
		// back to the generic notarization URL when notarizationLinkUrl is null.
		let newLinkUrl: string | null = null;
		let newLinkToken: string | null = null;
		if (isCalendlyConfigured()) {
			try {
				const link = await createSingleUseSchedulingLink();
				newLinkUrl = link.bookingUrl;
				newLinkToken = link.token;
			} catch (err) {
				console.error(
					`[Calendly webhook] Failed to mint replacement link for trust #${matched.id}:`,
					err
				);
			}
		}

		await db
			.update(trust)
			.set({
				status: TrustStatus.NotarizationPending,
				notarizationLinkUrl: newLinkUrl,
				notarizationLinkToken: newLinkToken,
				notarizationEventUri: null,
				notarizationInviteeUri: null,
				notarizationBookedAt: null,
				notarizationStartTime: null,
				notarizationEndTime: null,
				updatedAt: now,
			})
			.where(eq(trust.id, matched.id));

		await notifyAdmins(
			`Notarization canceled — trust #${matched.id}`,
			[
				`Event: Calendly booking canceled (invitee.canceled)`,
				`Trust ID: ${matched.id}`,
				`Trust status: ${TrustStatus.NotarizationPending} (reverted, awaiting re-book)`,
				`User: ${matched.user.name} <${matched.user.email}>`,
				`Replacement link: ${newLinkUrl ?? '(failed to mint — fallback to generic link)'}`,
				`Open in admin: ${adminUserUrl(matched.user.id)}`,
			].join('\n')
		);
	return json({ received: true, matched: true });
	}

	return json({ received: true });
};
