/**
 * Thin Calendly v2 API client used for the notarization flow.
 *
 * Identity model:
 * - When admin approves documents we create a one-off (`max_event_count: 1`) scheduling link
 *   bound to our notarization event type. The link is opaque and invalidates after one booking.
 * - We append `utm_source=amana_trust&utm_content=<token>` to the booking URL. The token is a
 *   random per-trust string we store on the trust row. When Calendly POSTs the `invitee.created`
 *   webhook, `payload.tracking.utm_content` carries the token back, letting us match the
 *   booking to a specific trust without depending on the user's email.
 */

import { env } from '$env/dynamic/private';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

const CALENDLY_API_BASE = 'https://api.calendly.com';

export type CalendlySchedulingLink = {
	bookingUrl: string;
	token: string;
};

export function isCalendlyConfigured(): boolean {
	return Boolean(env.CALENDLY_API_TOKEN?.trim() && env.CALENDLY_EVENT_TYPE_URI?.trim());
}

/**
 * Create a single-use scheduling link for our notarization event type and return the
 * booking URL with our tracking token already appended as `utm_content`.
 *
 * Throws on any non-2xx response so callers can surface a clear error.
 */
export async function createSingleUseSchedulingLink(): Promise<CalendlySchedulingLink> {
	const apiToken = env.CALENDLY_API_TOKEN?.trim();
	const eventTypeUri = env.CALENDLY_EVENT_TYPE_URI?.trim();
	if (!apiToken || !eventTypeUri) {
		throw new Error('Calendly is not configured (CALENDLY_API_TOKEN / CALENDLY_EVENT_TYPE_URI).');
	}

	const res = await fetch(`${CALENDLY_API_BASE}/scheduling_links`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			max_event_count: 1,
			owner: eventTypeUri,
			owner_type: 'EventType',
		}),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Calendly scheduling_links failed (${res.status}): ${body || res.statusText}`);
	}

	const data = (await res.json()) as { resource?: { booking_url?: string } };
	const bookingUrl = data.resource?.booking_url;
	if (!bookingUrl) throw new Error('Calendly response missing booking_url.');

	const token = randomBytes(16).toString('hex');
	const url = new URL(bookingUrl);
	url.searchParams.set('utm_source', 'amana_trust');
	url.searchParams.set('utm_content', token);

	return { bookingUrl: url.toString(), token };
}

/**
 * Verify a Calendly webhook signature.
 *
 * Calendly sends a header `Calendly-Webhook-Signature: t=<unix_ts>,v1=<hex_hmac>` where the
 * HMAC-SHA256 is computed over `"<unix_ts>.<raw body>"` with the signing key.
 */
export function verifyCalendlyWebhookSignature(opts: {
	signatureHeader: string | null;
	rawBody: string;
	signingKey?: string;
	/** Allowable clock skew in seconds. Default 5 minutes. */
	toleranceSeconds?: number;
}): boolean {
	const { signatureHeader, rawBody } = opts;
	const signingKey = opts.signingKey ?? env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();
	const tolerance = opts.toleranceSeconds ?? 300;
	if (!signatureHeader || !signingKey) return false;

	const parts = Object.fromEntries(
		signatureHeader.split(',').map((kv) => {
			const idx = kv.indexOf('=');
			return idx === -1 ? [kv.trim(), ''] : [kv.slice(0, idx).trim(), kv.slice(idx + 1).trim()];
		})
	) as Record<string, string>;

	const ts = parts.t;
	const sig = parts.v1;
	if (!ts || !sig) return false;

	const tsNum = Number(ts);
	if (!Number.isFinite(tsNum)) return false;
	const nowSec = Math.floor(Date.now() / 1000);
	if (Math.abs(nowSec - tsNum) > tolerance) return false;

	const expected = createHmac('sha256', signingKey).update(`${ts}.${rawBody}`).digest('hex');
	const a = Buffer.from(expected, 'hex');
	const b = Buffer.from(sig, 'hex');
	if (a.length !== b.length || a.length === 0) return false;
	try {
		return timingSafeEqual(a, b);
	} catch {
		return false;
	}
}
