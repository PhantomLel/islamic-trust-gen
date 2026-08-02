import { db } from '$lib/server/db';
import {
	kbEntry,
	kbEntryGovernance,
	kbEntryInternal,
	kbEntryVersion,
	kbPublicationGate,
	type KbClassificationBase,
	type KbGovernanceStatus,
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export function buildRerankDocument(parts: {
	question?: string | null;
	alsoAnswers?: string[] | null;
	userFacingAnswer?: string | null;
}): string {
	return [parts.question, parts.alsoAnswers?.join(', '), parts.userFacingAnswer].filter(Boolean).join('\n');
}

export async function createKbEntry(
	fields: {
		question: string;
		userFacingAnswer: string;
		category?: string | null;
		goodTreeAppMeaning?: string | null;
		userNextStep?: string | null;
		alsoAnswers?: string[];
	},
	_adminUserId: string,
): Promise<number> {
	const question = fields.question.trim();
	const userFacingAnswer = fields.userFacingAnswer.trim();
	if (!question || !userFacingAnswer) {
		throw new Error('Question and answer are required');
	}

	const alsoAnswers = fields.alsoAnswers?.map((s) => s.trim()).filter(Boolean) ?? [];
	const rerankDocument = buildRerankDocument({ question, alsoAnswers, userFacingAnswer });

	const [entry] = await db
		.insert(kbEntry)
		.values({
			entryType: 'faq',
			category: fields.category?.trim() || null,
			title: question,
			question,
			userFacingAnswer,
			goodTreeAppMeaning: fields.goodTreeAppMeaning?.trim() || null,
			userNextStep: fields.userNextStep?.trim() || null,
			rerankDocument,
		})
		.returning({ id: kbEntry.id });

	await db.insert(kbEntryInternal).values({
		entryId: entry.id,
		alsoAnswers: alsoAnswers.length ? alsoAnswers : null,
		classificationBase: 'safe',
	});

	await db.insert(kbEntryGovernance).values({
		entryId: entry.id,
		status: 'needs_revision',
	});

	return entry.id;
}

export async function deleteKbEntry(entryId: number): Promise<void> {
	const row = await db.query.kbEntry.findFirst({ where: eq(kbEntry.id, entryId) });
	if (!row) throw new Error('Entry not found');

	await db
		.delete(kbPublicationGate)
		.where(
			and(eq(kbPublicationGate.contentType, 'kb_entry'), eq(kbPublicationGate.contentId, String(entryId))),
		);
	await db.delete(kbEntry).where(eq(kbEntry.id, entryId));
}

export function parseAlsoAnswers(raw: string): string[] {
	return raw
		.split(/[,;\n]/)
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function snapshotEntryVersion(
	entryId: number,
	authorId: string,
	changeReason: string,
	approvalState: KbGovernanceStatus,
): Promise<number> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
		with: { internal: true, governance: true },
	});
	if (!row) throw new Error('Entry not found');

	const [version] = await db
		.insert(kbEntryVersion)
		.values({
			entryId,
			snapshot: {
				entry: row,
				internal: row.internal ?? null,
				governance: row.governance ?? null,
			},
			sourceHash: row.internal?.sourceHash ?? null,
			authorId,
			changeReason,
			approvalState,
		})
		.returning({ id: kbEntryVersion.id });
	return version.id;
}

export async function approveEntry(entryId: number, adminUserId: string): Promise<void> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
		with: { governance: true },
	});
	if (!row?.governance) throw new Error('Entry not found');

	const unsatisfied = await db
		.select()
		.from(kbPublicationGate)
		.where(eq(kbPublicationGate.contentId, String(entryId)));
	const blocking = unsatisfied.filter((g) => g.required && !g.satisfied);
	if (blocking.length > 0) {
		throw new Error(`Publication gates unsatisfied: ${blocking.map((g) => g.gateType).join(', ')}`);
	}

	await snapshotEntryVersion(row.id, adminUserId, 'approve', 'approved');
	await db
		.update(kbEntryGovernance)
		.set({
			status: 'approved',
			approvedAt: new Date(),
			approvedBy: adminUserId,
			lastReviewedAt: new Date(),
			lastReviewedBy: adminUserId,
		})
		.where(eq(kbEntryGovernance.entryId, row.id));
}

export async function bulkApproveEntries(entryIds: number[], adminUserId: string): Promise<{
	approved: number[];
	skipped: Array<{ entryId: number; reason: string }>;
}> {
	const approved: number[] = [];
	const skipped: Array<{ entryId: number; reason: string }> = [];

	for (const entryId of entryIds) {
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
		if (gates.some((g) => g.gateType === 'scholar_review' || g.gateType === 'policy_confirmation')) {
			skipped.push({ entryId, reason: 'scholar or policy gate required' });
			continue;
		}
		try {
			await approveEntry(entryId, adminUserId);
			approved.push(entryId);
		} catch (err) {
			skipped.push({
				entryId,
				reason: err instanceof Error ? err.message : 'approve failed',
			});
		}
	}
	return { approved, skipped };
}

export async function updateEntryGovernanceStatus(
	entryId: number,
	status: KbGovernanceStatus,
	adminUserId: string,
): Promise<void> {
	const row = await db.query.kbEntry.findFirst({ where: eq(kbEntry.id, entryId) });
	if (!row) throw new Error('Entry not found');
	await snapshotEntryVersion(row.id, adminUserId, `status:${status}`, status);
	await db
		.update(kbEntryGovernance)
		.set({
			status,
			lastReviewedAt: new Date(),
			lastReviewedBy: adminUserId,
			...(status === 'approved'
				? { approvedAt: new Date(), approvedBy: adminUserId }
				: { approvedAt: null, approvedBy: null }),
		})
		.where(eq(kbEntryGovernance.entryId, row.id));
}

export async function satisfyPublicationGate(
	entryId: number,
	gateType: string,
	reviewerId: string,
	note?: string,
): Promise<void> {
	await db
		.update(kbPublicationGate)
		.set({
			satisfied: true,
			reviewerId,
			reviewedAt: new Date(),
			evidenceNote: note ?? null,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(kbPublicationGate.contentId, String(entryId)),
				eq(kbPublicationGate.gateType, gateType as never),
			),
		);
}

export async function listEntryGates(entryId: number) {
	return db
		.select()
		.from(kbPublicationGate)
		.where(eq(kbPublicationGate.contentId, String(entryId)));
}

export async function getEntryDetail(entryId: number) {
	const entry = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
		with: { internal: true, governance: true, versions: true },
	});
	if (!entry) return null;
	if (entry.versions) {
		entry.versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}
	return entry;
}

export async function updateEntryUserFacingFields(
	entryId: number,
	fields: {
		question?: string | null;
		userFacingAnswer?: string | null;
		goodTreeAppMeaning?: string | null;
		userNextStep?: string | null;
		category?: string | null;
		alsoAnswers?: string[];
	},
	adminUserId: string,
): Promise<void> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
		with: { governance: true, internal: true },
	});
	if (!row) throw new Error('Entry not found');

	const question = (fields.question ?? row.question ?? '').trim();
	const userFacingAnswer = (fields.userFacingAnswer ?? row.userFacingAnswer ?? '').trim();
	const alsoAnswers =
		fields.alsoAnswers ??
		row.internal?.alsoAnswers ??
		[];
	const rerankDocument = buildRerankDocument({ question, alsoAnswers, userFacingAnswer });

	const status = row.governance?.status ?? 'needs_revision';
	await snapshotEntryVersion(row.id, adminUserId, 'edit user-facing fields', status);
	await db
		.update(kbEntry)
		.set({
			question,
			title: question,
			userFacingAnswer,
			goodTreeAppMeaning: fields.goodTreeAppMeaning ?? row.goodTreeAppMeaning,
			userNextStep: fields.userNextStep ?? row.userNextStep,
			category: fields.category !== undefined ? fields.category || null : row.category,
			rerankDocument,
			updatedAt: new Date(),
		})
		.where(eq(kbEntry.id, row.id));

	if (fields.alsoAnswers !== undefined || row.internal) {
		await db
			.insert(kbEntryInternal)
			.values({
				entryId: row.id,
				alsoAnswers: alsoAnswers.length ? alsoAnswers : null,
				classificationBase: (row.internal?.classificationBase ?? 'safe') as KbClassificationBase,
			})
			.onConflictDoUpdate({
				target: kbEntryInternal.entryId,
				set: { alsoAnswers: alsoAnswers.length ? alsoAnswers : null },
			});
	}
}
