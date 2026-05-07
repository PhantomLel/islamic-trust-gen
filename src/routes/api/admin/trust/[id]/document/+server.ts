import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { renderJointTrust } from '$lib/server/documents/renderJointTrust';
import { saveGeneratedDocx } from '$lib/server/documents/storage';
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

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trustId = Number(params.id);
	if (!Number.isInteger(trustId)) throw error(400, 'Invalid trust id');

	const row = await loadTrustRow(trustId);

	const { buffer, filename } = await renderJointTrust({
		id: row.id,
		responses: row.responses ?? [],
		user: { name: row.user?.name ?? null },
	});

	const file = await saveGeneratedDocx({
		trustId: row.id,
		kind: 'joint-trust',
		buffer,
		filename,
	});

	return json({ ok: true as const, file });
};

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trustId = Number(params.id);
	if (!Number.isInteger(trustId)) throw error(400, 'Invalid trust id');

	const row = await loadTrustRow(trustId);

	const { buffer, filename } = await renderJointTrust({
		id: row.id,
		responses: row.responses ?? [],
		user: { name: row.user?.name ?? null },
	});

	try {
		await saveGeneratedDocx({ trustId: row.id, kind: 'joint-trust', buffer, filename });
	} catch (err) {
		console.error('Failed to persist generated trust document', err);
	}

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Content-Length': String(buffer.byteLength),
			'Cache-Control': 'no-store',
		},
	});
};
