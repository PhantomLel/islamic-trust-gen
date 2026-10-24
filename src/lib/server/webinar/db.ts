import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { webinar, webinarRegistration, type WebinarStatus } from '$lib/server/db/schema';
import { recordAudit } from '$lib/server/content/audit';
import { isZoomJoinUrl } from '$lib/webinar/joinUrl';
import { DuplicateRegistration, type RegistrationRow, type RegistrationStore } from '$lib/webinar/register';
import type { WebinarEmailKind } from '$lib/webinar/due';

export async function hasOpenWebinar(): Promise<boolean> {
	const [row] = await db.select({ id: webinar.id }).from(webinar).where(eq(webinar.status, 'open')).limit(1);
	return !!row;
}

export async function getOpenWebinar() {
	const [row] = await db.select().from(webinar).where(eq(webinar.status, 'open')).limit(1);
	return row ?? null;
}

/**
 * The open webinar, otherwise the latest draft, otherwise the most recently
 * updated row so a just-closed session can still be edited and exported.
 */
export async function getNextWebinar() {
	const open = await getOpenWebinar();
	if (open) return open;
	const [draft] = await db.select().from(webinar).where(eq(webinar.status, 'draft')).orderBy(desc(webinar.updatedAt)).limit(1);
	if (draft) return draft;
	const [latest] = await db.select().from(webinar).orderBy(desc(webinar.updatedAt)).limit(1);
	return latest ?? null;
}

export async function listRegistrants(webinarId: number) {
	return db
		.select({
			id: webinarRegistration.id,
			name: webinarRegistration.name,
			email: webinarRegistration.email,
			state: webinarRegistration.state,
			marketingConsent: webinarRegistration.marketingConsent,
			attributionCode: webinarRegistration.attributionCode,
			createdAt: webinarRegistration.createdAt,
		})
		.from(webinarRegistration)
		.where(eq(webinarRegistration.webinarId, webinarId))
		.orderBy(desc(webinarRegistration.createdAt));
}

export type WebinarSaveInput = {
	id: number | null;
	title: string;
	startsAt: Date;
	durationMinutes: number;
	joinUrl: string;
	status: WebinarStatus;
};

export async function saveWebinar(
	actorId: string,
	input: WebinarSaveInput,
): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
	const title = input.title.trim();
	if (!title || title.length > 200) return { ok: false, message: 'Enter a title.' };
	if (Number.isNaN(input.startsAt.getTime())) return { ok: false, message: 'Enter a date and time.' };
	if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 1440) {
		return { ok: false, message: 'Enter a duration in minutes, from 1 to 1440.' };
	}
	if (!isZoomJoinUrl(input.joinUrl)) return { ok: false, message: 'Enter an https Zoom join link.' };
	if (input.status !== 'draft' && input.status !== 'open' && input.status !== 'closed') {
		return { ok: false, message: 'Choose a status.' };
	}

	if (input.status === 'open') {
		const others = await db
			.select({ id: webinar.id })
			.from(webinar)
			.where(and(eq(webinar.status, 'open'), input.id ? sql`${webinar.id} <> ${input.id}` : sql`true`));
		if (others.length) {
			await db
				.update(webinar)
				.set({ status: 'closed', updatedAt: new Date() })
				.where(inArray(webinar.id, others.map((o) => o.id)));
			for (const other of others) {
				await recordAudit({ actorId, action: 'close', targetType: 'webinar', targetId: other.id });
			}
		}
	}

	const values = {
		title,
		startsAt: input.startsAt,
		durationMinutes: input.durationMinutes,
		joinUrl: input.joinUrl.trim(),
		status: input.status,
		updatedAt: new Date(),
	};

	if (input.id) {
		const [updated] = await db.update(webinar).set(values).where(eq(webinar.id, input.id)).returning({ id: webinar.id });
		if (!updated) return { ok: false, message: 'That webinar was not found.' };
		await recordAudit({ actorId, action: 'update', targetType: 'webinar', targetId: updated.id });
		return { ok: true, id: updated.id };
	}

	const [created] = await db.insert(webinar).values(values).returning({ id: webinar.id });
	await recordAudit({ actorId, action: 'create', targetType: 'webinar', targetId: created.id });
	return { ok: true, id: created.id };
}

function isUniqueViolation(err: unknown): boolean {
	const e = err as { code?: string; cause?: { code?: string }; message?: string };
	return e?.code === '23505' || e?.cause?.code === '23505' || /webinar_registration_email_idx|duplicate key/i.test(e?.message ?? '');
}

export function registrationStore(): RegistrationStore {
	return {
		async findByEmail(webinarId, email) {
			const [row] = await db
				.select({ id: webinarRegistration.id })
				.from(webinarRegistration)
				.where(and(eq(webinarRegistration.webinarId, webinarId), sql`lower(${webinarRegistration.email}) = ${email}`))
				.limit(1);
			return row ?? null;
		},
		async insert(webinarId, row: RegistrationRow) {
			try {
				const [created] = await db
					.insert(webinarRegistration)
					.values({
						webinarId,
						name: row.name,
						email: row.email,
						state: row.state,
						marketingConsent: row.marketingConsent,
						marketingConsentAt: row.marketingConsentAt,
						attributionCode: row.attributionCode,
					})
					.returning({ id: webinarRegistration.id });
				return created.id;
			} catch (err) {
				if (isUniqueViolation(err)) throw new DuplicateRegistration();
				throw err;
			}
		},
	};
}

const sentAt = {
	confirmation: webinarRegistration.confirmationSentAt,
	reminder_24h: webinarRegistration.reminder24hSentAt,
	reminder_1h: webinarRegistration.reminder1hSentAt,
	followup: webinarRegistration.followupSentAt,
} as const;

function sentPatch(kind: WebinarEmailKind, value: Date | null) {
	switch (kind) {
		case 'confirmation':
			return { confirmationSentAt: value };
		case 'reminder_24h':
			return { reminder24hSentAt: value };
		case 'reminder_1h':
			return { reminder1hSentAt: value };
		case 'followup':
			return { followupSentAt: value };
	}
}

/** Set `*_sent_at` only when it is still null. Returns false if another worker already claimed it. */
export async function claimSend(id: number, kind: WebinarEmailKind): Promise<boolean> {
	const rows = await db
		.update(webinarRegistration)
		.set(sentPatch(kind, new Date()))
		.where(and(eq(webinarRegistration.id, id), isNull(sentAt[kind])))
		.returning({ id: webinarRegistration.id });
	return rows.length > 0;
}

export async function releaseSend(id: number, kind: WebinarEmailKind): Promise<void> {
	await db.update(webinarRegistration).set(sentPatch(kind, null)).where(eq(webinarRegistration.id, id));
}

export async function listUnsentRegistrations() {
	return db.query.webinarRegistration.findMany({
		where: or(
			isNull(webinarRegistration.confirmationSentAt),
			isNull(webinarRegistration.reminder24hSentAt),
			isNull(webinarRegistration.reminder1hSentAt),
			isNull(webinarRegistration.followupSentAt),
		),
		with: { webinar: true },
	});
}
