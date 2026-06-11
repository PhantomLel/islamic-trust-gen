import { error, fail, redirect } from '@sveltejs/kit';
import { Resend } from 'resend';
import { siteName } from '$lib/config';
import { db } from '$lib/server/db';
import { trust, user, adminNote, TrustStatus } from '$lib/server/db/schema';
import type { UserFile } from '$lib/server/db/schema';
import { documentsApprovedEmail } from '$lib/server/emails/documentsApproved';
import { createSingleUseSchedulingLink, isCalendlyConfigured } from '$lib/server/calendly';
import { eq, and, desc } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import type { PageServerLoad, Actions } from './$types';

const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const targetUser = await db.query.user.findFirst({
		where: eq(user.id, params.id),
	});

	if (!targetUser) throw error(404, 'User not found');

	const trusts = await db.query.trust.findMany({
		where: eq(trust.userId, params.id),
		orderBy: [desc(trust.createdAt)],
	});
	const hasPaid = trusts.some((t) => t.selectedPlan !== null);

	const notes = await db.query.adminNote.findMany({
		where: eq(adminNote.userId, params.id),
		orderBy: [desc(adminNote.pinned), desc(adminNote.createdAt)],
	});

	return {
		currentAdminId: locals.user.id,
		notes: notes.map((n) => ({
			id: n.id,
			body: n.body,
			authorId: n.authorId,
			authorName: n.authorName,
			pinned: n.pinned,
			createdAt: n.createdAt.toISOString(),
			updatedAt: n.updatedAt.toISOString(),
		})),
		targetUser: {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			createdAt: targetUser.createdAt.toISOString(),
			role: targetUser.role,
			requestedConsultation: targetUser.requestedConsultationAt != null,
			paid: hasPaid,
			county: targetUser.county?.trim() || null,
		},
		trusts: trusts.map((t) => ({
			id: t.id,
			createdAt: t.createdAt.toISOString(),
			updatedAt: t.updatedAt.toISOString(),
			joint: t.joint,
			complete: t.complete,
			isEligible: t.isEligible,
			screeningAnswers: t.screeningAnswers ?? null,
			status: t.status,
			approved: t.approved,
			awaitingPayment: t.status === TrustStatus.AwaitingPayment && t.selectedPlan === null,
			notarizationBookedAt: t.notarizationBookedAt?.toISOString() ?? null,
			notarizationStartTime: t.notarizationStartTime?.toISOString() ?? null,
			notarizationEndTime: t.notarizationEndTime?.toISOString() ?? null,
			responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
			houseDeedUrl: t.house_deed_url ?? null,
			fileUrls: t.file_urls ?? [],
			generatedFiles: t.generated_files ?? [],
			userFiles: (t.user_files ?? []) as UserFile[],
		})),
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const responses = JSON.parse(formData.get('responses') as string);

		await db.update(trust).set({
			responses,
			updatedAt: new Date(),
		}).where(eq(trust.id, trustId));

		return { saved: true };
	},

	toggleEligibility: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const isEligible = formData.get('isEligible') === 'true';

		await db.update(trust).set({
			isEligible,
			updatedAt: new Date(),
		}).where(eq(trust.id, trustId));

		return { toggled: true };
	},

	approveDocuments: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		if (Number.isNaN(trustId)) return fail(400, { message: 'Missing trust ID' });

		const row = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { id: true, userId: true, notarizationLinkUrl: true, notarizationLinkToken: true },
			with: { user: { columns: { email: true } } },
		});
		if (!row) return fail(404, { message: 'Trust not found' });
		if (row.userId !== params.id) return fail(400, { message: 'Trust does not belong to this user' });

		// Provision a per-trust single-use Calendly link if we don't already have one and Calendly
		// is configured. Failure here is non-fatal: the user can fall back to the generic link.
		let bookingUrl = row.notarizationLinkUrl;
		let bookingToken = row.notarizationLinkToken;
		if (!bookingUrl && isCalendlyConfigured()) {
			try {
				const link = await createSingleUseSchedulingLink();
				bookingUrl = link.bookingUrl;
				bookingToken = link.token;
			} catch (err) {
				console.error('[approveDocuments] Failed to create Calendly scheduling link:', err);
			}
		}

		await db
			.update(trust)
			.set({
				approved: true,
				status: TrustStatus.NotarizationPending,
				notarizationLinkUrl: bookingUrl ?? null,
				notarizationLinkToken: bookingToken ?? null,
				updatedAt: new Date(),
			})
			.where(eq(trust.id, trustId));

		const to = row.user.email?.trim();
		if (to && env.RESEND_API_KEY && env.FROM_EMAIL) {
			try {
				const resend = new Resend(env.RESEND_API_KEY);
				const origin = (env.ORIGIN ?? '').replace(/\/$/, '');
				const dashboardUrl = origin ? `${origin}/dashboard` : null;
				await resend.emails.send({
					from: env.FROM_EMAIL,
					to,
					subject: `Documents approved — schedule notarization (${siteName})`,
					html: documentsApprovedEmail({
						trustId,
						dashboardUrl,
						schedulingUrl: bookingUrl ?? undefined,
					}),
				});
			} catch (err) {
				console.error('[approveDocuments] User notification email failed:', err);
			}
		}

		return { approved: true };
	},

	toggleConsultation: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const requested = formData.get('requested') === 'true';

		await db.update(user).set({
			requestedConsultationAt: requested ? new Date() : null,
		}).where(eq(user.id, userId));

		return { toggled: true };
	},

	addNote: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const body = (formData.get('body') as string | null)?.trim() ?? '';
		const pinned = formData.get('pinned') === 'true';

		if (!body) return fail(400, { message: 'Note cannot be empty.' });
		if (body.length > 5000) return fail(400, { message: 'Note is too long (max 5000 characters).' });

		const target = await db.query.user.findFirst({
			where: eq(user.id, params.id),
			columns: { id: true },
		});
		if (!target) return fail(404, { message: 'User not found.' });

		await db.insert(adminNote).values({
			userId: params.id,
			authorId: locals.user.id,
			authorName: locals.user.name ?? null,
			body,
			pinned,
		});

		return { noteSaved: true };
	},

	editNote: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const noteId = Number(formData.get('noteId'));
		const body = (formData.get('body') as string | null)?.trim() ?? '';

		if (Number.isNaN(noteId)) return fail(400, { message: 'Missing note ID.' });
		if (!body) return fail(400, { message: 'Note cannot be empty.' });
		if (body.length > 5000) return fail(400, { message: 'Note is too long (max 5000 characters).' });

		const existing = await db.query.adminNote.findFirst({
			where: and(eq(adminNote.id, noteId), eq(adminNote.userId, params.id)),
			columns: { id: true },
		});
		if (!existing) return fail(404, { message: 'Note not found.' });

		await db
			.update(adminNote)
			.set({ body, updatedAt: new Date() })
			.where(eq(adminNote.id, noteId));

		return { noteSaved: true };
	},

	toggleNotePin: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const noteId = Number(formData.get('noteId'));
		const pinned = formData.get('pinned') === 'true';

		if (Number.isNaN(noteId)) return fail(400, { message: 'Missing note ID.' });

		const existing = await db.query.adminNote.findFirst({
			where: and(eq(adminNote.id, noteId), eq(adminNote.userId, params.id)),
			columns: { id: true },
		});
		if (!existing) return fail(404, { message: 'Note not found.' });

		await db
			.update(adminNote)
			.set({ pinned, updatedAt: new Date() })
			.where(eq(adminNote.id, noteId));

		return { noteSaved: true };
	},

	deleteNote: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const noteId = Number(formData.get('noteId'));
		if (Number.isNaN(noteId)) return fail(400, { message: 'Missing note ID.' });

		await db
			.delete(adminNote)
			.where(and(eq(adminNote.id, noteId), eq(adminNote.userId, params.id)));

		return { noteDeleted: true };
	},

	saveUserFile: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const url = formData.get('url');
		const filename = formData.get('filename');
		const kind = formData.get('kind');
		const storageKey = formData.get('storageKey');

		if (
			Number.isNaN(trustId) ||
			typeof url !== 'string' || !url ||
			typeof filename !== 'string' || !filename ||
			typeof kind !== 'string' || !kind
		) {
			return fail(400, { message: 'Missing fields' });
		}

		const existingTrust = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { user_files: true },
		});
		if (!existingTrust) return fail(404, { message: 'Trust not found' });

		const newFile: UserFile = {
			id: randomUUID(),
			kind: kind as UserFile['kind'],
			url,
			filename,
			storageKey: typeof storageKey === 'string' && storageKey ? storageKey : undefined,
			uploadedAt: new Date().toISOString(),
		};

		const current = (existingTrust.user_files ?? []) as UserFile[];
		await db
			.update(trust)
			.set({ user_files: [...current, newFile] })
			.where(eq(trust.id, trustId));

		return { saved: true };
	},

	deleteUserFile: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const fileId = formData.get('fileId');

		if (Number.isNaN(trustId) || typeof fileId !== 'string' || !fileId) {
			return fail(400, { message: 'Missing fields' });
		}

		const existingTrust = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { user_files: true },
		});
		if (!existingTrust) return fail(404, { message: 'Trust not found' });

		const current = (existingTrust.user_files ?? []) as UserFile[];
		const target = current.find((f) => f.id === fileId);
		if (!target) return fail(404, { message: 'File not found' });

		const next = current.filter((f) => f.id !== fileId);
		await db.update(trust).set({ user_files: next }).where(eq(trust.id, trustId));

		if (target.storageKey) {
			try { await utapi.deleteFiles(target.storageKey); } catch (err) {
				console.error('Failed to delete user file from storage', err);
			}
		}
		return { deleted: true };
	},

	deleteGeneratedFile: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const kind = formData.get('kind');

		if (Number.isNaN(trustId) || typeof kind !== 'string' || !kind) {
			return fail(400, { message: 'Missing fields' });
		}

		const existingTrust = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { generated_files: true },
		});
		if (!existingTrust) return fail(404, { message: 'Trust not found' });

		const current = existingTrust.generated_files ?? [];
		const target = current.find((f) => f.kind === kind);
		if (!target) return fail(404, { message: 'File not found' });

		const next = current.filter((f) => f.kind !== kind);
		await db.update(trust).set({ generated_files: next }).where(eq(trust.id, trustId));

		if (target.storageKey) {
			try { await utapi.deleteFiles(target.storageKey); } catch (err) {
				console.error('Failed to delete generated file from storage', err);
			}
		}
		return { deleted: true };
	},

	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const userId = formData.get('userId');
		if (typeof userId !== 'string' || !userId.trim()) {
			return fail(400, { message: 'Missing user ID' });
		}
		if (locals.user.id === userId) {
			return fail(400, { message: 'You cannot delete your own account.' });
		}

		const target = await db.query.user.findFirst({
			where: eq(user.id, userId),
		});
		if (!target) {
			return fail(404, { message: 'User not found.' });
		}
		if (target.role === 'admin') {
			return fail(400, { message: 'Admin accounts cannot be deleted from this screen.' });
		}

		await db.delete(user).where(eq(user.id, userId));
		redirect(303, '/admin');
	},
};
