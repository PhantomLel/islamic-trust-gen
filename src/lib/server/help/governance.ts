import { db } from '$lib/server/db';
import {
	kbEntry,
	kbEntryGovernance,
	kbEntryVersion,
	kbPublicationGate,
	type KbGovernanceStatus,
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

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
		with: { internal: true, governance: true, policies: true, versions: true },
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
	},
	adminUserId: string,
): Promise<void> {
	const row = await db.query.kbEntry.findFirst({
		where: eq(kbEntry.id, entryId),
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
