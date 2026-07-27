/**
 * Notarization booking flow — shared logic for Calendly webhooks, cron sync, and link provisioning.
 */

import { db } from '$lib/server/db';
import { trust, TrustStatus, user } from '$lib/server/db/schema';
import {
	createSingleUseSchedulingLink,
	fetchScheduledEvent,
	isCalendlyConfigured,
	listActiveInviteesSince,
	type CalendlyInviteeResource,
} from '$lib/server/calendly';
import { adminUserUrl, notifyAdmins } from '$lib/server/notifyAdmins';
import { and, eq } from 'drizzle-orm';

export type NotarizationInviteePayload = {
	uri?: string;
	email?: string;
	name?: string;
	status?: string;
	event?: string;
	tracking?: {
		utm_content?: string | null;
		utm_source?: string | null;
	};
	scheduled_event?: {
		uri?: string;
		start_time?: string;
		end_time?: string;
	};
};

type TrustWithUser = {
	id: number;
	userId: string;
	user: { id: string; name: string; email: string | null };
};

function parseDate(value: string | undefined | null): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

export async function resolveNotarizationEventTimes(payload: NotarizationInviteePayload): Promise<{
	eventUri: string | null;
	start: Date | null;
	end: Date | null;
}> {
	const nested = payload.scheduled_event;
	if (nested?.start_time) {
		return {
			eventUri: nested.uri ?? payload.event ?? null,
			start: parseDate(nested.start_time),
			end: parseDate(nested.end_time),
		};
	}

	const eventUri = nested?.uri ?? payload.event ?? null;
	if (!eventUri) {
		return { eventUri: null, start: null, end: null };
	}

	const fetched = await fetchScheduledEvent(eventUri);
	if (!fetched) {
		return { eventUri, start: null, end: null };
	}

	return {
		eventUri: fetched.uri ?? eventUri,
		start: parseDate(fetched.start_time),
		end: parseDate(fetched.end_time),
	};
}

export async function findTrustForNotarizationBooking(
	payload: NotarizationInviteePayload
): Promise<TrustWithUser | null> {
	const token = payload.tracking?.utm_content?.trim();
	if (token) {
		const byToken = await db.query.trust.findFirst({
			where: eq(trust.notarizationLinkToken, token),
			with: { user: { columns: { id: true, name: true, email: true } } },
		});
		if (byToken) return byToken;
	}

	const email = payload.email?.trim().toLowerCase();
	if (!email) return null;

	const rows = await db
		.select({
			id: trust.id,
			userId: trust.userId,
			userName: user.name,
			userEmail: user.email,
			userDbId: user.id,
		})
		.from(trust)
		.innerJoin(user, eq(trust.userId, user.id))
		.where(
			and(eq(trust.approved, true), eq(trust.status, TrustStatus.NotarizationPending))
		);

	const matches = rows.filter((row) => row.userEmail?.trim().toLowerCase() === email);
	if (matches.length !== 1) {
		if (matches.length > 1) {
			console.warn(
				`[notarization] Multiple pending trusts match invitee email "${email}"; skipping email fallback`
			);
		}
		return null;
	}

	const match = matches[0];
	return {
		id: match.id,
		userId: match.userId,
		user: { id: match.userDbId, name: match.userName, email: match.userEmail },
	};
}

export async function applyNotarizationBooking(opts: {
	trustId: number;
	user: TrustWithUser['user'];
	payload: NotarizationInviteePayload;
	via: 'webhook' | 'sync';
}): Promise<void> {
	const { eventUri, start, end } = await resolveNotarizationEventTimes(opts.payload);
	const now = new Date();

	await db
		.update(trust)
		.set({
			status: TrustStatus.NotarizationScheduled,
			notarizationEventUri: eventUri,
			notarizationInviteeUri: opts.payload.uri ?? null,
			notarizationBookedAt: now,
			notarizationStartTime: start,
			notarizationEndTime: end,
			updatedAt: now,
		})
		.where(eq(trust.id, opts.trustId));

	await notifyAdmins(
		`Notarization booked — trust #${opts.trustId}`,
		[
			`Event: Calendly booking received (${opts.via})`,
			`Trust ID: ${opts.trustId}`,
			`Trust status: ${TrustStatus.NotarizationScheduled}`,
			`User: ${opts.user.name} <${opts.user.email ?? '(none)'}>`,
			`Invitee email: ${opts.payload.email ?? '(none)'}`,
			`Start: ${start?.toISOString() ?? '(unknown)'}`,
			`End: ${end?.toISOString() ?? '(unknown)'}`,
			`Open in admin: ${adminUserUrl(opts.user.id)}`,
		].join('\n')
	);
}

export async function revertNotarizationBooking(opts: {
	trustId: number;
	user: TrustWithUser['user'];
	payload: NotarizationInviteePayload;
}): Promise<void> {
	let newLinkUrl: string | null = null;
	let newLinkToken: string | null = null;
	if (isCalendlyConfigured()) {
		try {
			const link = await createSingleUseSchedulingLink();
			newLinkUrl = link.bookingUrl;
			newLinkToken = link.token;
		} catch (err) {
			console.error(
				`[notarization] Failed to mint replacement link for trust #${opts.trustId}:`,
				err
			);
		}
	}

	const now = new Date();
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
		.where(eq(trust.id, opts.trustId));

	await notifyAdmins(
		`Notarization canceled — trust #${opts.trustId}`,
		[
			`Event: Calendly booking canceled (invitee.canceled)`,
			`Trust ID: ${opts.trustId}`,
			`Trust status: ${TrustStatus.NotarizationPending} (reverted, awaiting re-book)`,
			`User: ${opts.user.name} <${opts.user.email ?? '(none)'}>`,
			`Replacement link: ${newLinkUrl ?? '(failed to mint — fallback to generic link)'}`,
			`Open in admin: ${adminUserUrl(opts.user.id)}`,
		].join('\n')
	);
}

/** Mint and persist a per-trust single-use Calendly link when missing. */
export async function ensureNotarizationSchedulingLink(opts: {
	trustId: number;
	notarizationLinkUrl: string | null;
	notarizationLinkToken: string | null;
}): Promise<{ notarizationLinkUrl: string | null; notarizationLinkToken: string | null }> {
	if (opts.notarizationLinkUrl && opts.notarizationLinkToken) {
		return {
			notarizationLinkUrl: opts.notarizationLinkUrl,
			notarizationLinkToken: opts.notarizationLinkToken,
		};
	}

	if (!isCalendlyConfigured()) {
		return {
			notarizationLinkUrl: opts.notarizationLinkUrl,
			notarizationLinkToken: opts.notarizationLinkToken,
		};
	}

	try {
		const link = await createSingleUseSchedulingLink();
		await db
			.update(trust)
			.set({
				notarizationLinkUrl: link.bookingUrl,
				notarizationLinkToken: link.token,
				updatedAt: new Date(),
			})
			.where(eq(trust.id, opts.trustId));
		return { notarizationLinkUrl: link.bookingUrl, notarizationLinkToken: link.token };
	} catch (err) {
		console.error(`[notarization] Failed to create scheduling link for trust #${opts.trustId}:`, err);
		return {
			notarizationLinkUrl: opts.notarizationLinkUrl,
			notarizationLinkToken: opts.notarizationLinkToken,
		};
	}
}

function inviteeToPayload(invitee: CalendlyInviteeResource): NotarizationInviteePayload {
	return {
		uri: invitee.uri,
		email: invitee.email,
		name: invitee.name,
		status: invitee.status,
		event: invitee.event,
		tracking: invitee.tracking,
	};
}

/** Poll Calendly for bookings that webhooks may have missed. Returns trusts updated. */
export async function syncPendingNotarizationBookings(): Promise<number> {
	if (!isCalendlyConfigured()) return 0;

	const pendingTrusts = await db.query.trust.findMany({
		where: and(eq(trust.approved, true), eq(trust.status, TrustStatus.NotarizationPending)),
		columns: { id: true },
	});
	if (pendingTrusts.length === 0) return 0;

	const pendingIds = new Set(pendingTrusts.map((t) => t.id));
	const lookbackDays = 90;
	const minCreated = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();

	let invitees: CalendlyInviteeResource[];
	try {
		invitees = await listActiveInviteesSince(minCreated);
	} catch (err) {
		console.error('[notarization] Calendly sync failed to list invitees:', err);
		return 0;
	}

	let synced = 0;
	for (const invitee of invitees) {
		const matched = await findTrustForNotarizationBooking(inviteeToPayload(invitee));
		if (!matched || !pendingIds.has(matched.id)) continue;

		try {
			await applyNotarizationBooking({
				trustId: matched.id,
				user: matched.user,
				payload: inviteeToPayload(invitee),
				via: 'sync',
			});
			pendingIds.delete(matched.id);
			synced++;
		} catch (err) {
			console.error(`[notarization] Failed to apply sync booking for trust #${matched.id}:`, err);
		}
	}

	if (synced > 0) {
		console.log(`[notarization] Synced ${synced} pending booking(s) from Calendly`);
	}

	return synced;
}
