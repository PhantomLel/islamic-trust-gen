import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { renderAllTrustDocuments } from '$lib/server/documents/generateTrustDocuments';
import { saveGeneratedDocxBatch } from '$lib/server/documents/storage';
import type { RequestHandler } from './$types';

async function loadTrustRow(trustId: number) {
	const row = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		with: { user: true },
	});
	if (!row) throw error(404, 'Trust not found');
	if (!row.complete) throw error(409, 'Questionnaire not complete');
	return row;
}

function trustPayload(row: Awaited<ReturnType<typeof loadTrustRow>>) {
	return {
		id: row.id,
		responses: row.responses ?? [],
		user: { name: row.user?.name ?? null },
	};
}

async function persistAllGeneratedDocuments(
	trustId: number,
	docs: Awaited<ReturnType<typeof renderAllTrustDocuments>>,
) {
	const [
		jointTrust,
		pourOverWillHusband,
		pourOverWillWife,
		acknowledgmentOfOwnershipElection,
		certificationOfTrust,
	] = await saveGeneratedDocxBatch({
		trustId,
		files: [
			{
				kind: 'joint-trust',
				buffer: docs.jointTrust.buffer,
				filename: docs.jointTrust.filename,
			},
			{
				kind: 'pour-over-will-husband',
				buffer: docs.pourOverWillHusband.buffer,
				filename: docs.pourOverWillHusband.filename,
			},
			{
				kind: 'pour-over-will-wife',
				buffer: docs.pourOverWillWife.buffer,
				filename: docs.pourOverWillWife.filename,
			},
			{
				kind: 'acknowledgment-of-islamic-ownership-election',
				buffer: docs.acknowledgmentOfOwnershipElection.buffer,
				filename: docs.acknowledgmentOfOwnershipElection.filename,
			},
			{
				kind: 'certification-of-trust',
				buffer: docs.certificationOfTrust.buffer,
				filename: docs.certificationOfTrust.filename,
			},
		],
	});

	return {
		jointTrust,
		pourOverWillHusband,
		pourOverWillWife,
		acknowledgmentOfOwnershipElection,
		certificationOfTrust,
	};
}

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trustId = Number(params.id);
	if (!Number.isInteger(trustId)) throw error(400, 'Invalid trust id');

	const row = await loadTrustRow(trustId);
	const docs = await renderAllTrustDocuments(trustPayload(row));
	const files = await persistAllGeneratedDocuments(row.id, docs);

	return json({ ok: true as const, files });
};

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trustId = Number(params.id);
	if (!Number.isInteger(trustId)) throw error(400, 'Invalid trust id');

	const row = await loadTrustRow(trustId);
	const docs = await renderAllTrustDocuments(trustPayload(row));

	try {
		await persistAllGeneratedDocuments(row.id, docs);
	} catch (err) {
		console.error('Failed to persist generated trust documents', err);
	}

	return new Response(new Uint8Array(docs.jointTrust.buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename="${docs.jointTrust.filename}"`,
			'Content-Length': String(docs.jointTrust.buffer.byteLength),
			'Cache-Control': 'no-store',
		},
	});
};
