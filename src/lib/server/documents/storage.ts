import { eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { trust, type GeneratedFile } from '$lib/server/db/schema';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

let _utapi: UTApi | null = null;
function utapi(): UTApi {
	if (!_utapi) _utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
	return _utapi;
}

/**
 * Upload a freshly generated document to UploadThing and append a record of it
 * to `trust.generated_files`. If a previous file of the same `kind` exists for
 * this trust, it is removed from storage and replaced.
 */
export async function saveGeneratedDocx(opts: {
	trustId: number;
	kind: string;
	buffer: Buffer;
	filename: string;
}): Promise<GeneratedFile> {
	const file = new File([new Uint8Array(opts.buffer)], opts.filename, { type: DOCX_MIME });

	const result = await utapi().uploadFiles(file);
	if (result.error || !result.data) {
		throw new Error(`Upload failed: ${result.error?.message ?? 'unknown error'}`);
	}

	const entry: GeneratedFile = {
		kind: opts.kind,
		url: result.data.ufsUrl,
		filename: opts.filename,
		storageKey: result.data.key,
		generatedAt: new Date().toISOString(),
	};

	const existing = await db.query.trust.findFirst({
		where: eq(trust.id, opts.trustId),
		columns: { generated_files: true },
	});

	const prior = existing?.generated_files ?? [];
	const replaced = prior.find((f) => f.kind === opts.kind);
	const next = [...prior.filter((f) => f.kind !== opts.kind), entry];

	await db
		.update(trust)
		.set({ generated_files: next, updatedAt: new Date() })
		.where(eq(trust.id, opts.trustId));

	if (replaced?.storageKey) {
		try {
			await utapi().deleteFiles(replaced.storageKey);
		} catch (err) {
			console.error('Failed to delete superseded generated file', err);
		}
	}

	return entry;
}
