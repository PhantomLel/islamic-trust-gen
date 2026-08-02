import { db } from '$lib/server/db';
import {
	kbEntry,
	kbEntryGovernance,
	kbEntryInternal,
	kbPublicationGate,
	type KbClassificationBase,
	type KbEntryType,
	type KbGovernanceStatus,
} from '$lib/server/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export type ServableEntry = {
	id: number;
	entryType: KbEntryType;
	category: string | null;
	title: string | null;
	question: string | null;
	userFacingAnswer: string | null;
	goodTreeAppMeaning: string | null;
	userNextStep: string | null;
	rerankDocument: string | null;
	classificationBase: KbClassificationBase | null;
	alsoAnswers: string[] | null;
	status: KbGovernanceStatus;
};

export function entryHasRenderableText(row: Pick<ServableEntry, 'entryType' | 'question' | 'userFacingAnswer' | 'title'>): boolean {
	if (row.entryType === 'explainer') {
		return Boolean(row.title?.trim() && row.userFacingAnswer?.trim());
	}
	return Boolean(row.question?.trim() && row.userFacingAnswer?.trim());
}

export async function entryHasUnsatisfiedRequiredGates(entryId: number): Promise<boolean> {
	const gates = await db
		.select()
		.from(kbPublicationGate)
		.where(
			and(
				eq(kbPublicationGate.contentType, 'kb_entry'),
				eq(kbPublicationGate.contentId, String(entryId)),
				eq(kbPublicationGate.required, true),
				eq(kbPublicationGate.satisfied, false),
			),
		);
	return gates.length > 0;
}

export async function isEntryServable(entryId: number): Promise<boolean> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
		with: { governance: true, internal: true },
	});
	if (!row?.governance) return false;
	if (row.governance.status !== 'approved') return false;
	if (!entryHasRenderableText({
		entryType: row.entryType,
		question: row.question,
		userFacingAnswer: row.userFacingAnswer,
		title: row.title,
	})) {
		return false;
	}
	return !(await entryHasUnsatisfiedRequiredGates(entryId));
}

export async function listServableEntries(options?: {
	entryTypes?: KbEntryType[];
	classifications?: KbClassificationBase[];
	category?: string;
	limit?: number;
}): Promise<ServableEntry[]> {
	const rows = await db
		.select({
			id: kbEntry.id,
			entryType: kbEntry.entryType,
			category: kbEntry.category,
			title: kbEntry.title,
			question: kbEntry.question,
			userFacingAnswer: kbEntry.userFacingAnswer,
			goodTreeAppMeaning: kbEntry.goodTreeAppMeaning,
			userNextStep: kbEntry.userNextStep,
			rerankDocument: kbEntry.rerankDocument,
			classificationBase: sql<string | null>`null`,
			alsoAnswers: sql<string[] | null>`null`,
			status: kbEntryGovernance.status,
		})
		.from(kbEntry)
		.innerJoin(kbEntryGovernance, eq(kbEntryGovernance.entryId, kbEntry.id))
		.where(eq(kbEntryGovernance.status, 'approved'));

	const ids = rows.map((r) => r.id);
	if (ids.length === 0) return [];

	const internalRows = await db
		.select({
			entryId: kbEntryInternal.entryId,
			alsoAnswers: kbEntryInternal.alsoAnswers,
			classificationBase: kbEntryInternal.classificationBase,
		})
		.from(kbEntryInternal)
		.where(inArray(kbEntryInternal.entryId, ids));

	const internalMap = new Map<number, { alsoAnswers: string[] | null; classificationBase: KbClassificationBase | null }>();
	for (const ir of internalRows) {
		internalMap.set(ir.entryId, {
			alsoAnswers: ir.alsoAnswers ?? null,
			classificationBase: ir.classificationBase ?? null,
		});
	}

	const unsatisfiedGates = await db
		.select({ contentId: kbPublicationGate.contentId })
		.from(kbPublicationGate)
		.where(and(eq(kbPublicationGate.required, true), eq(kbPublicationGate.satisfied, false)));

	const blocked = new Set(unsatisfiedGates.map((g) => g.contentId));

	let result: ServableEntry[] = [];
	for (const row of rows) {
		if (blocked.has(String(row.id))) continue;
		if (!entryHasRenderableText(row)) continue;
		const internal = internalMap.get(row.id);
		const enriched: ServableEntry = {
			...row,
			classificationBase: internal?.classificationBase ?? null,
			alsoAnswers: internal?.alsoAnswers ?? null,
		};
		if (options?.entryTypes && !options.entryTypes.includes(enriched.entryType)) continue;
		if (
			options?.classifications &&
			enriched.classificationBase &&
			!options.classifications.includes(enriched.classificationBase)
		) {
			continue;
		}
		if (options?.category && enriched.category !== options.category) continue;
		result.push(enriched);
	}

	if (options?.limit) result = result.slice(0, options.limit);
	return result;
}

export async function searchServableEntries(query: string, limit = 20): Promise<ServableEntry[]> {
	const q = query.trim();
	if (!q) return listServableEntries({ limit });

	const pattern = q
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w.replace(/[^\w-]/g, ''))
		.join(' & ');

	if (!pattern) return [];

	const rows = await db.execute(sql`
		SELECT e.id, e.entry_type, e.category, e.title, e.question,
			e.user_facing_answer, e.good_tree_app_meaning, e.user_next_step, e.rerank_document,
			g.status
		FROM kb_entry e
		INNER JOIN kb_entry_governance g ON g.entry_id = e.id
		WHERE g.status = 'approved'
		AND (
			to_tsvector('simple', coalesce(e.question,'') || ' ' || coalesce(e.title,'') || ' ' || coalesce(e.user_facing_answer,''))
			@@ plainto_tsquery('simple', ${q})
			OR e.question ILIKE ${'%' + q + '%'}
			OR e.title ILIKE ${'%' + q + '%'}
		)
		LIMIT ${limit}
	`);

	const blocked = new Set(
		(
			await db
				.select({ contentId: kbPublicationGate.contentId })
				.from(kbPublicationGate)
				.where(and(eq(kbPublicationGate.required, true), eq(kbPublicationGate.satisfied, false)))
		).map((g) => g.contentId),
	);

	return (rows.rows as Array<Record<string, unknown>>)
		.filter((r) => !blocked.has(String(r.id)))
		.map((r) => ({
			id: Number(r.id),
			entryType: r.entry_type as KbEntryType,
			category: (r.category as string | null) ?? null,
			title: (r.title as string | null) ?? null,
			question: (r.question as string | null) ?? null,
			userFacingAnswer: (r.user_facing_answer as string | null) ?? null,
			goodTreeAppMeaning: (r.good_tree_app_meaning as string | null) ?? null,
			userNextStep: (r.user_next_step as string | null) ?? null,
			rerankDocument: (r.rerank_document as string | null) ?? null,
			classificationBase: null,
			alsoAnswers: null,
			status: r.status as KbGovernanceStatus,
		}))
		.filter((r) => entryHasRenderableText(r));
}
