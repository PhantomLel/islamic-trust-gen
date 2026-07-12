import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoice, trust, adminNote, freeWill, marketingLead } from '$lib/server/db/schema';
import type { GeneratedFile } from '$lib/server/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trusts = await db.query.trust.findMany({
		with: { user: true },
		orderBy: [desc(trust.createdAt)],
	});

	const userIds = [...new Set(trusts.map((t) => t.userId))];
	const paidTotalByUserId = new Map<string, number>();

	if (userIds.length > 0) {
		const paidInvoices = await db.query.invoice.findMany({
			where: and(inArray(invoice.userId, userIds), eq(invoice.paid, true)),
			columns: { userId: true, amount: true },
		});

		for (const inv of paidInvoices) {
			paidTotalByUserId.set(inv.userId, (paidTotalByUserId.get(inv.userId) ?? 0) + inv.amount);
		}
	}

	type RecentNote = { body: string; authorName: string | null; createdAt: string; pinned: boolean };
	const noteCountByUserId = new Map<string, number>();
	const recentNotesByUserId = new Map<string, RecentNote[]>();
	if (userIds.length > 0) {
		const notes = await db.query.adminNote.findMany({
			where: inArray(adminNote.userId, userIds),
			orderBy: [desc(adminNote.pinned), desc(adminNote.createdAt)],
			columns: { userId: true, body: true, authorName: true, createdAt: true, pinned: true },
		});

		for (const n of notes) {
			noteCountByUserId.set(n.userId, (noteCountByUserId.get(n.userId) ?? 0) + 1);
			const list = recentNotesByUserId.get(n.userId) ?? [];
			if (list.length < 3) {
				list.push({
					body: n.body,
					authorName: n.authorName,
					createdAt: n.createdAt.toISOString(),
					pinned: n.pinned,
				});
				recentNotesByUserId.set(n.userId, list);
			}
		}
	}

	// ── Free Islamic Will submissions ─────────────────────────────────
	// Loaded alongside trusts so admins can review generated wills, their
	// responses, and the submitter's data. A will may have no account yet
	// (userId null, pending email claim); those are still surfaced here.
	const wills = await db.query.freeWill.findMany({
		with: { user: true },
		orderBy: [desc(freeWill.createdAt)],
	});

	/** Users who already have at least one (non-admin) trust → enables the trust link. */
	const trustUserIds = new Set(
		trusts.filter((t) => t.user.role !== 'admin').map((t) => t.userId),
	);

	// Fetch manual follow-up flags keyed by email.
	const followUpLeads = await db.query.marketingLead.findMany({
		where: eq(marketingLead.manualFollowUp, true),
		columns: { email: true, manualFollowUpReasons: true, currentSequence: true },
	});
	const followUpByEmail = new Map(followUpLeads.map((l) => [l.email, l]));

	return {
		wills: wills
			.filter((w) => w.user?.role !== 'admin')
			.map((w) => ({
				id: w.id,
				createdAt: w.createdAt.toISOString(),
				updatedAt: w.updatedAt.toISOString(),
				complete: w.complete,
				state: w.state,
				legalMode: w.legalMode,
				tags: w.tags ?? [],
				recommendedPlan: w.recommendedPlan,
				reviewReminders: w.reviewReminders,
				responses: (w.responses ?? []) as { id: string; response: unknown }[],
				generatedFiles: (w.generated_files ?? []) as GeneratedFile[],
				claimEmail: w.claimEmail,
				// Display name: prefer the linked account, fall back to the captured name.
				name: w.user?.name ?? w.name ?? null,
				user: w.user ? { id: w.user.id, name: w.user.name, email: w.user.email } : null,
				// Link to the admin user page (which surfaces the trust) when the
				// submitter has an account *and* a trust already exists for them.
				trustUserId: w.userId && trustUserIds.has(w.userId) ? w.userId : null,
			})),
		trusts: trusts
			.filter((t) => t.user.role !== 'admin')
			.map((t) => ({
				id: t.id,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString(),
				joint: t.joint,
				complete: t.complete,
				approved: t.approved,
				isEligible: t.isEligible,
				businessOwnership:
					t.screeningAnswers == null
						? null
						: typeof t.screeningAnswers.business_ownership === 'boolean'
							? t.screeningAnswers.business_ownership
							: null,
				status: t.status,
				selectedPlan: t.selectedPlan,
				deedRetrievalRequested: t.deedRetrievalRequested,
				customPrice: t.customPrice,
				paidAmount:
					t.selectedPlan !== null ? (paidTotalByUserId.get(t.userId) ?? null) : null,
				responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
			user: {
				id: t.user.id,
				name: t.user.name,
				email: t.user.email,
				noteCount: noteCountByUserId.get(t.user.id) ?? 0,
				recentNotes: recentNotesByUserId.get(t.user.id) ?? [],
				dripFollowUp: followUpByEmail.has(t.user.email?.toLowerCase() ?? '') ? true : false,
			},
		})),
	};
};

export const actions: Actions = {
	updatePrice: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = parseInt(formData.get('trustId') as string, 10);
		const price = parseInt(formData.get('price') as string, 10);

		if (isNaN(trustId)) throw error(400, 'Invalid trust ID');
		if (isNaN(price) || price < 0) throw error(400, 'Invalid price');

		const existing = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { id: true },
		});

		if (!existing) throw error(404, 'Trust not found');

		await db
			.update(trust)
			.set({ customPrice: price })
			.where(eq(trust.id, trustId));

		return { updated: true };
	},
};
