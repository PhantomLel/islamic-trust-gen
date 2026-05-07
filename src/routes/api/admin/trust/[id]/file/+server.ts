import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import {
	collectTrustFileUrls,
	isHttpUrl,
	TRUST_FILE_PROXY_MAX_BYTES,
} from '$lib/server/trustFileUrls';
import type { RequestHandler } from './$types';

/** Admin-only: stream a trust-linked remote file for in-app preview (avoids browser CORS on storage URLs). */
export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) throw error(401, 'Not authenticated');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trustId = Number(params.id);
	if (!Number.isInteger(trustId)) throw error(400, 'Invalid trust id');

	const fileUrl = url.searchParams.get('url');
	if (!fileUrl || !isHttpUrl(fileUrl)) throw error(400, 'Invalid url');

	const row = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		columns: {
			house_deed_url: true,
			file_urls: true,
			generated_files: true,
			user_files: true,
		},
	});
	if (!row) throw error(404, 'Trust not found');

	const allowed = new Set(collectTrustFileUrls(row));
	if (!allowed.has(fileUrl)) throw error(403, 'URL not allowed for this trust');

	const upstream = await fetch(fileUrl, { redirect: 'follow' });
	if (!upstream.ok) {
		console.error('Admin file proxy upstream error', upstream.status, fileUrl.slice(0, 80));
		throw error(502, 'Could not fetch file');
	}

	const lenHeader = upstream.headers.get('content-length');
	if (lenHeader) {
		const n = Number(lenHeader);
		if (Number.isFinite(n) && n > TRUST_FILE_PROXY_MAX_BYTES) throw error(413, 'File too large');
	}

	const buf = new Uint8Array(await upstream.arrayBuffer());
	if (buf.byteLength > TRUST_FILE_PROXY_MAX_BYTES) throw error(413, 'File too large');

	const contentType =
		upstream.headers.get('content-type') ??
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

	return new Response(buf, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'private, no-store',
		},
	});
};
