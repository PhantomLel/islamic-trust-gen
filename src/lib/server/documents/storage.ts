import { eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import { uploadBufferToUploadThing } from '$lib/server/uploadthingUpload';
import { db } from '$lib/server/db';
import { trust, freeWill, type GeneratedFile } from '$lib/server/db/schema';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';

let _utapi: UTApi | null = null;
function utapi(): UTApi {
	if (!_utapi) _utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });
	return _utapi;
}

/** Delete stored files. `success: false` means the caller must keep the keys and retry. */
export async function deleteUploadThingFiles(keys: string[]): Promise<{ success: boolean }> {
	if (keys.length === 0) return { success: true };
	const result = await utapi().deleteFiles(keys);
	return { success: result.success };
}

/**
 * Upload multiple generated documents and persist them in one DB write so
 * parallel saves cannot overwrite each other's `generated_files` entries.
 */
export async function saveGeneratedDocxBatch(opts: {
	trustId: number;
	files: Array<{ kind: string; buffer: Buffer; filename: string; mime?: string }>;
}): Promise<GeneratedFile[]> {
	if (opts.files.length === 0) return [];

	const entries = await Promise.all(
		opts.files.map(async (file) => {
			const result = await uploadBufferToUploadThing(file.buffer, file.filename, file.mime ?? DOCX_MIME);

			const entry: GeneratedFile = {
				kind: file.kind,
				url: result.ufsUrl,
				filename: file.filename,
				storageKey: result.key,
				generatedAt: new Date().toISOString(),
			};
			return entry;
		}),
	);

	const existing = await db.query.trust.findFirst({
		where: eq(trust.id, opts.trustId),
		columns: { generated_files: true },
	});

	const prior = existing?.generated_files ?? [];
	const replacedKinds = new Set(opts.files.map((file) => file.kind));
	const superseded = prior.filter((file) => replacedKinds.has(file.kind));
	const next = [...prior.filter((file) => !replacedKinds.has(file.kind)), ...entries];

	await db
		.update(trust)
		.set({ generated_files: next, updatedAt: new Date() })
		.where(eq(trust.id, opts.trustId));

	const storageKeys = superseded
		.map((file) => file.storageKey)
		.filter((key): key is string => Boolean(key));
	if (storageKeys.length > 0) {
		try {
			await utapi().deleteFiles(storageKeys);
		} catch (err) {
			console.error('Failed to delete superseded generated files', err);
		}
	}

	return entries;
}

/** Same as `saveGeneratedDocx` for a non-docx file (e.g. the PDF acceptance copy). */
export async function saveGeneratedFile(opts: {
	trustId: number;
	kind: string;
	buffer: Buffer;
	filename: string;
	mime: string;
}): Promise<GeneratedFile> {
	const [entry] = await saveGeneratedDocxBatch({
		trustId: opts.trustId,
		files: [{ kind: opts.kind, buffer: opts.buffer, filename: opts.filename, mime: opts.mime }],
	});
	return entry;
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
	const [entry] = await saveGeneratedDocxBatch({
		trustId: opts.trustId,
		files: [{ kind: opts.kind, buffer: opts.buffer, filename: opts.filename }],
	});
	return entry;
}

/**
 * Upload a generated free-will document to UploadThing and append a record of it
 * to `free_will.generated_files`. A previous file of the same `kind` for this
 * submission is removed from storage and replaced.
 */
export async function saveGeneratedWillFile(opts: {
	freeWillId: number;
	kind: string;
	buffer: Buffer;
	filename: string;
}): Promise<GeneratedFile> {
	const result = await uploadBufferToUploadThing(opts.buffer, opts.filename, PDF_MIME);

	const entry: GeneratedFile = {
		kind: opts.kind,
		url: result.ufsUrl,
		filename: opts.filename,
		storageKey: result.key,
		generatedAt: new Date().toISOString(),
	};

	const existing = await db.query.freeWill.findFirst({
		where: eq(freeWill.id, opts.freeWillId),
		columns: { generated_files: true },
	});

	const prior = existing?.generated_files ?? [];
	const replaced = prior.find((f) => f.kind === opts.kind);
	const next = [...prior.filter((f) => f.kind !== opts.kind), entry];

	await db
		.update(freeWill)
		.set({ generated_files: next, updatedAt: new Date() })
		.where(eq(freeWill.id, opts.freeWillId));

	if (replaced?.storageKey) {
		try {
			await deleteUploadThingFiles([replaced.storageKey]);
		} catch (err) {
			console.error('Failed to delete superseded generated will file', err);
		}
	}

	return entry;
}
