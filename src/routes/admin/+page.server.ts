import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoice, trust, adminNote, freeWill, marketingLead, marketingEmailLog, utmTrackingEvent } from '$lib/server/db/schema';
import type { GeneratedFile } from '$lib/server/db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { FREE_WILL_ENABLED_KEY, getBooleanSetting, setSetting } from '$lib/server/settings';

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

	const wills = await db.query.freeWill.findMany({
		with: { user: true },
		orderBy: [desc(freeWill.createdAt)],
	});

	const trustUserIds = new Set(
		trusts.filter((t) => t.user.role !== 'admin').map((t) => t.userId),
	);

	const dripLeads = await db.query.marketingLead.findMany({
		orderBy: [desc(marketingLead.updatedAt)],
		limit: 200,
	});
	const dripByEmail = new Map(dripLeads.map((l) => [l.email.toLowerCase(), l]));

	const recentDripSends = await db.query.marketingEmailLog.findMany({
		orderBy: [desc(marketingEmailLog.sentAt)],
		limit: 100,
	});

	const leadById = new Map(dripLeads.map((l) => [l.id, l]));
	const missingLeadIds = [
		...new Set(recentDripSends.map((s) => s.leadId).filter((id) => !leadById.has(id))),
	];
	if (missingLeadIds.length > 0) {
		const extraLeads = await db.query.marketingLead.findMany({
			where: inArray(marketingLead.id, missingLeadIds),
		});
		for (const l of extraLeads) {
			leadById.set(l.id, l);
			dripByEmail.set(l.email.toLowerCase(), l);
		}
	}

	// UTM tracking data
	let utmEvents: Array<{
		id: number;
		createdAt: Date;
		eventType: 'landing' | 'will_completion';
		utmSource: string | null;
		utmMedium: string | null;
		utmCampaign: string | null;
		willId: number | null;
		email: string | null;
		sessionId: string | null;
		payload: Record<string, unknown> | null;
	}> = [];
	
	try {
		utmEvents = await db
			.select()
			.from(utmTrackingEvent)
			.orderBy(desc(utmTrackingEvent.createdAt))
			.limit(200);
	} catch (error) {
		console.error('[Admin] Failed to fetch UTM tracking events:', error);
		// Continue with empty array if table doesn't exist yet
	}

	// Calculate conversion metrics by campaign
	const campaignMetrics = new Map<string, { landings: number; completions: number; campaign: string; source: string | null; medium: string | null }>();
	
	for (const event of utmEvents) {
		const campaign = event.utmCampaign || '(no campaign)';
		if (!campaignMetrics.has(campaign)) {
			campaignMetrics.set(campaign, {
				campaign,
				source: event.utmSource,
				medium: event.utmMedium,
				landings: 0,
				completions: 0,
			});
		}
		const metrics = campaignMetrics.get(campaign)!;
		if (event.eventType === 'landing') {
			metrics.landings++;
		} else if (event.eventType === 'will_completion') {
			metrics.completions++;
		}
	}

	const freeWillEnabled = await getBooleanSetting(FREE_WILL_ENABLED_KEY, true);

	return {
		freeWillEnabled,
		dripSends: recentDripSends.map((s) => {
			const lead = leadById.get(s.leadId);
			return {
				id: s.id,
				sentAt: s.sentAt.toISOString(),
				email: s.email,
				firstName: lead?.firstName ?? null,
				userId: lead?.userId ?? null,
				sequence: s.sequence,
				emailKey: s.emailKey,
				subject: s.subject,
				resendId: s.resendId,
				sequenceStatus: lead?.sequenceStatus ?? null,
			};
		}),
		dripLeads: dripLeads.map((l) => ({
			id: l.id,
			email: l.email,
			firstName: l.firstName,
			userId: l.userId,
			leadType: l.leadType,
			currentSequence: l.currentSequence,
			sequenceStatus: l.sequenceStatus,
			lastEmailKey: l.lastEmailKey,
			lastEmailAt: l.lastEmailAt?.toISOString() ?? null,
			nextEmailIndex: l.nextEmailIndex,
			nextEmailAt: l.nextEmailAt?.toISOString() ?? null,
			unsubscribed: l.unsubscribed,
			enrolledAt: l.enrolledAt?.toISOString() ?? null,
			// A1 — out-of-state waitlist attribution.
			state: l.state,
			utmSource: l.utmSource,
			utmMedium: l.utmMedium,
			utmCampaign: l.utmCampaign,
			lastStep: l.lastStep,
		})),
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
				name: w.user?.name ?? w.name ?? null,
				user: w.user ? { id: w.user.id, name: w.user.name, email: w.user.email } : null,
				trustUserId: w.userId && trustUserIds.has(w.userId) ? w.userId : null,
			})),
		trusts: trusts
			.filter((t) => t.user.role !== 'admin')
			.map((t) => {
				const drip = dripByEmail.get(t.user.email?.toLowerCase() ?? '');
				return {
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
					responses: (t.responses ?? []) as {
						id: string;
						response: string | string[] | boolean | number | null;
					}[],
					user: {
						id: t.user.id,
						name: t.user.name,
						email: t.user.email,
						noteCount: noteCountByUserId.get(t.user.id) ?? 0,
						recentNotes: recentNotesByUserId.get(t.user.id) ?? [],
						drip: drip
							? {
									sequence: drip.currentSequence,
									status: drip.sequenceStatus,
									lastEmailKey: drip.lastEmailKey,
									lastEmailAt: drip.lastEmailAt?.toISOString() ?? null,
									nextEmailAt: drip.nextEmailAt?.toISOString() ?? null,
								}
							: null,
					},
				};
			}),
		utmCampaigns: Array.from(campaignMetrics.values()).sort((a, b) => b.landings - a.landings),
		utmRecentEvents: utmEvents.slice(0, 50).map((e) => ({
			id: e.id,
			createdAt: e.createdAt.toISOString(),
			eventType: e.eventType,
			utmSource: e.utmSource,
			utmMedium: e.utmMedium,
			utmCampaign: e.utmCampaign,
			email: e.email,
			willId: e.willId,
		})),
	};
};

export const actions: Actions = {
	setFreeWillEnabled: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		if (locals.user.role !== 'admin') throw error(403, 'Forbidden');
		const form = await request.formData();
		const enabled = form.get('enabled') === 'true';
		await setSetting(FREE_WILL_ENABLED_KEY, enabled ? 'true' : 'false', locals.user.id);
		return { freeWillEnabled: enabled };
	},

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

		await db.update(trust).set({ customPrice: price }).where(eq(trust.id, trustId));

		return { updated: true };
	},
};
