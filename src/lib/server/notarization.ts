/**
 * Notarization booking flow — shared logic for Calendly webhooks, cron sync, and link provisioning.
 */

import { db } from '$lib/server/db';
import { trust, TrustStatus, user } from '$lib/server/db/schema';
import {
	createSingleUseSchedulingLink,
	fetchScheduledEvent,
	isCalendlyConfigured,
	listInviteesSince,
	type CalendlyInviteeResource,
} from '$lib/server/calendly';
import { adminUserUrl, notifyAdmins } from '$lib/server/notifyAdmins';
import { and, eq, or } from 'drizzle-orm';

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

function inviteeMatchesToken(invitee: CalendlyInviteeResource, token: string): boolean {
	return invitee.tracking?.utm_content?.trim() === token.trim();
}

/** Mint a fresh single-use link (e.g. after cancel or when the previous link was consumed). */
export async function regenerateNotarizationSchedulingLink(trustId: number): Promise<{
	notarizationLinkUrl: string | null;
	notarizationLinkToken: string | null;
}> {
	if (!isCalendlyConfigured()) {
		return { notarizationLinkUrl: null, notarizationLinkToken: null };
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
			.where(eq(trust.id, trustId));
		console.log(`[notarization] Regenerated scheduling link for trust #${trustId}`);
		return { notarizationLinkUrl: link.bookingUrl, notarizationLinkToken: link.token };
	} catch (err) {
		console.error(`[notarization] Failed to regenerate scheduling link for trust #${trustId}:`, err);
		const row = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { notarizationLinkUrl: true, notarizationLinkToken: true },
		});
		return {
			notarizationLinkUrl: row?.notarizationLinkUrl ?? null,
			notarizationLinkToken: row?.notarizationLinkToken ?? null,
		};
	}
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

	return regenerateNotarizationSchedulingLink(opts.trustId);
}

export type NotarizationReconcileResult = {
	status: TrustStatus;
	notarizationLinkUrl: string | null;
	notarizationBookedAt: Date | null;
	notarizationStartTime: Date | null;
	notarizationEndTime: Date | null;
};

/**
 * Align trust notarization state with Calendly when webhooks were missed.
 * - Applies active bookings found by link token (email on Calendly does not matter).
 * - Mints a new link when the old single-use link was consumed then canceled.
 */
export async function reconcileNotarizationForTrust(
	trustId: number
): Promise<NotarizationReconcileResult | null> {
	const row = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		with: { user: { columns: { id: true, name: true, email: true } } },
	});
	if (!row?.approved || !row.user) return null;

	const isPending = row.status === TrustStatus.NotarizationPending;
	const isScheduled = row.status === TrustStatus.NotarizationScheduled;
	if (!isPending && !isScheduled) {
		return {
			status: row.status as TrustStatus,
			notarizationLinkUrl: row.notarizationLinkUrl,
			notarizationBookedAt: row.notarizationBookedAt,
			notarizationStartTime: row.notarizationStartTime,
			notarizationEndTime: row.notarizationEndTime,
		};
	}

	if (!isCalendlyConfigured()) {
		const ensured = await ensureNotarizationSchedulingLink({
			trustId,
			notarizationLinkUrl: row.notarizationLinkUrl,
			notarizationLinkToken: row.notarizationLinkToken,
		});
		return {
			status: row.status as TrustStatus,
			notarizationLinkUrl: ensured.notarizationLinkUrl,
			notarizationBookedAt: row.notarizationBookedAt,
			notarizationStartTime: row.notarizationStartTime,
			notarizationEndTime: row.notarizationEndTime,
		};
	}

	const token = row.notarizationLinkToken?.trim();
	if (!token) {
		const ensured = await ensureNotarizationSchedulingLink({
			trustId,
			notarizationLinkUrl: row.notarizationLinkUrl,
			notarizationLinkToken: row.notarizationLinkToken,
		});
		return {
			status: row.status as TrustStatus,
			notarizationLinkUrl: ensured.notarizationLinkUrl,
			notarizationBookedAt: row.notarizationBookedAt,
			notarizationStartTime: row.notarizationStartTime,
			notarizationEndTime: row.notarizationEndTime,
		};
	}

	const lookbackDays = 90;
	const minStart = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();
	let invitees: CalendlyInviteeResource[] = [];
	try {
		invitees = await listInviteesSince(minStart);
	} catch (err) {
		console.error(`[notarization] reconcile trust #${trustId}: Calendly lookup failed`, err);
		return {
			status: row.status as TrustStatus,
			notarizationLinkUrl: row.notarizationLinkUrl,
			notarizationBookedAt: row.notarizationBookedAt,
			notarizationStartTime: row.notarizationStartTime,
			notarizationEndTime: row.notarizationEndTime,
		};
	}

	const forToken = invitees.filter((invitee) => inviteeMatchesToken(invitee, token));
	const activeInvitee = forToken.find((invitee) => invitee.status === 'active') ?? null;
	const hadCanceledOnly = forToken.length > 0 && !activeInvitee;

	if (activeInvitee && isPending) {
		await applyNotarizationBooking({
			trustId,
			user: row.user,
			payload: inviteeToPayload(activeInvitee),
			via: 'sync',
		});
	} else if (hadCanceledOnly && isPending) {
		await regenerateNotarizationSchedulingLink(trustId);
	} else if (isScheduled && !activeInvitee) {
		await revertNotarizationBooking({
			trustId,
			user: row.user,
			payload: {},
		});
	}

	const updated = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		columns: {
			status: true,
			notarizationLinkUrl: true,
			notarizationBookedAt: true,
			notarizationStartTime: true,
			notarizationEndTime: true,
		},
	});
	if (!updated) return null;

	return {
		status: updated.status as TrustStatus,
		notarizationLinkUrl: updated.notarizationLinkUrl,
		notarizationBookedAt: updated.notarizationBookedAt,
		notarizationStartTime: updated.notarizationStartTime,
		notarizationEndTime: updated.notarizationEndTime,
	};
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

/** Poll Calendly and reconcile trusts whose webhooks were missed. Returns trusts updated. */
export async function syncPendingNotarizationBookings(): Promise<number> {
	if (!isCalendlyConfigured()) return 0;

	const rows = await db.query.trust.findMany({
		where: and(
			eq(trust.approved, true),
			or(
				eq(trust.status, TrustStatus.NotarizationPending),
				eq(trust.status, TrustStatus.NotarizationScheduled)
			)
		),
		columns: { id: true, status: true, notarizationLinkUrl: true },
	});
	if (rows.length === 0) return 0;

	let updated = 0;
	for (const row of rows) {
		const beforeStatus = row.status;
		const beforeLink = row.notarizationLinkUrl;
		try {
			const result = await reconcileNotarizationForTrust(row.id);
			if (
				result &&
				(result.status !== beforeStatus || result.notarizationLinkUrl !== beforeLink)
			) {
				updated++;
			}
		} catch (err) {
			console.error(`[notarization] reconcile failed for trust #${row.id}:`, err);
		}
	}

	if (updated > 0) {
		console.log(`[notarization] Reconciled ${updated} trust(s) from Calendly`);
	}

	return updated;
}
