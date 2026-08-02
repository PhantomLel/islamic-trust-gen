import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	kbEntry,
	kbEntryGovernance,
	kbPublicationGate,
	helpEscalation,
	helpQuery,
	helpConversation,
} from '$lib/server/db/schema';
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm';
import { bulkApproveEntries } from '$lib/server/help/governance';

export const load: PageServerLoad = async ({ url }) => {
	const statusFilter = url.searchParams.get('status') ?? 'all';
	const q = url.searchParams.get('q')?.trim() ?? '';

	const conditions = [];
	if (statusFilter !== 'all') {
		conditions.push(eq(kbEntryGovernance.status, statusFilter as 'approved' | 'needs_revision' | 'disabled'));
	}
	if (q) {
		conditions.push(
			or(
				ilike(kbEntry.sourceId, `%${q}%`),
				ilike(kbEntry.question, `%${q}%`),
				ilike(kbEntry.title, `%${q}%`),
			),
		);
	}

	const entries = await db
		.select({
			sourceId: kbEntry.sourceId,
			question: kbEntry.question,
			title: kbEntry.title,
			status: kbEntryGovernance.status,
			serveCount: kbEntryGovernance.serveCount,
			category: kbEntry.category,
		})
		.from(kbEntry)
		.leftJoin(kbEntryGovernance, eq(kbEntryGovernance.entryId, kbEntry.id))
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(kbEntry.sourceId);

	const [openEscalations, unanswered, conversations] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(helpEscalation).where(eq(helpEscalation.status, 'open')),
		db.select({ count: sql<number>`count(*)` }).from(helpQuery).where(eq(helpQuery.unanswered, true)),
		db.select({ count: sql<number>`count(*)` }).from(helpConversation),
	]);

	const unsatisfiedGates = await db
		.select({ count: sql<number>`count(*)` })
		.from(kbPublicationGate)
		.where(and(eq(kbPublicationGate.required, true), eq(kbPublicationGate.satisfied, false)));

	return {
		entries,
		statusFilter,
		q,
		stats: {
			openEscalations: Number(openEscalations[0]?.count ?? 0),
			unanswered: Number(unanswered[0]?.count ?? 0),
			conversations: Number(conversations[0]?.count ?? 0),
			unsatisfiedGates: Number(unsatisfiedGates[0]?.count ?? 0),
		},
	};
};

export const actions: Actions = {
	bulkApprove: async ({ request, locals }) => {
		const form = await request.formData();
		const ids = form.getAll('sourceId').map(String).filter(Boolean);
		if (ids.length === 0) return fail(400, { message: 'No entries selected' });
		const result = await bulkApproveEntries(ids, locals.user!.id);
		return { bulkApprove: result };
	},
};
