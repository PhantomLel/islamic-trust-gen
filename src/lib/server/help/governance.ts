import { db } from '$lib/server/db';
import {
	kbEntry,
	kbEntryGovernance,
	kbEntryInternal,
	kbEntryVersion,
	kbPublicationGate,
	type KbGovernanceStatus,
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { POLICY_BLOCKED_SOURCE_IDS, SCHOLAR_REVIEW_SOURCE_IDS } from '$lib/help/decisions';

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

export async function approveEntry(sourceId: string, adminUserId: string): Promise<void> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.sourceId, sourceId),
		with: { governance: true },
	});
	if (!row?.governance) throw new Error('Entry not found');

	const unsatisfied = await db
		.select()
		.from(kbPublicationGate)
		.where(
			eq(kbPublicationGate.contentId, sourceId),
		);
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

export async function bulkApproveEntries(sourceIds: string[], adminUserId: string): Promise<{
	approved: string[];
	skipped: Array<{ sourceId: string; reason: string }>;
}> {
	const approved: string[] = [];
	const skipped: Array<{ sourceId: string; reason: string }> = [];

	for (const sourceId of sourceIds) {
		if (
			(SCHOLAR_REVIEW_SOURCE_IDS as readonly string[]).includes(sourceId) ||
			(POLICY_BLOCKED_SOURCE_IDS as readonly string[]).includes(sourceId)
		) {
			skipped.push({ sourceId, reason: 'scholar or policy gate required' });
			continue;
		}
		try {
			await approveEntry(sourceId, adminUserId);
			approved.push(sourceId);
		} catch (err) {
			skipped.push({
				sourceId,
				reason: err instanceof Error ? err.message : 'approve failed',
			});
		}
	}
	return { approved, skipped };
}

export async function updateEntryGovernanceStatus(
	sourceId: string,
	status: KbGovernanceStatus,
	adminUserId: string,
): Promise<void> {
	const row = await db.query.kbEntry.findFirst({ where: eq(kbEntry.sourceId, sourceId) });
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
	sourceId: string,
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
		.where(and(eq(kbPublicationGate.contentId, sourceId), eq(kbPublicationGate.gateType, gateType as never)));
}

export async function listEntryGates(sourceId: string) {
	return db
		.select()
		.from(kbPublicationGate)
		.where(eq(kbPublicationGate.contentId, sourceId));
}

export async function getEntryDetail(sourceId: string) {
	const entry = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.sourceId, sourceId),
		with: { internal: true, governance: true, policies: true, versions: true },
	});
	if (!entry) return null;
	if (entry.versions) {
		entry.versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}
	return entry;
}

export async function updateEntryUserFacingFields(
	sourceId: string,
	fields: {
		question?: string | null;
		userFacingAnswer?: string | null;
		goodTreeAppMeaning?: string | null;
		userNextStep?: string | null;
	},
	adminUserId: string,
): Promise<void> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.sourceId, sourceId),
		with: { governance: true },
	});
	if (!row) throw new Error('Entry not found');
	const status = row.governance?.status ?? 'needs_revision';
	await snapshotEntryVersion(row.id, adminUserId, 'edit user-facing fields', status);
	await db
		.update(kbEntry)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(kbEntry.id, row.id));
}

export async function seedDefaultGatesForEntry(sourceId: string): Promise<void> {
	if ((SCHOLAR_REVIEW_SOURCE_IDS as readonly string[]).includes(sourceId)) {
		await db
			.insert(kbPublicationGate)
			.values({
				contentType: 'kb_entry',
				contentId: sourceId,
				gateType: 'scholar_review',
				required: true,
				satisfied: false,
			})
			.onConflictDoNothing();
	}
	if ((POLICY_BLOCKED_SOURCE_IDS as readonly string[]).includes(sourceId)) {
		await db
			.insert(kbPublicationGate)
			.values({
				contentType: 'kb_entry',
				contentId: sourceId,
				gateType: 'policy_confirmation',
				required: true,
				satisfied: false,
			})
			.onConflictDoNothing();
	}
}
