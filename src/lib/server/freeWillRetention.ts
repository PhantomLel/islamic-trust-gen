import { and, asc, eq, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { freeWill, type GeneratedFile } from '$lib/server/db/schema';
import { deleteUploadThingFiles } from '$lib/server/documents/storage';
import { purgeDueFreeWills, type FreeWillPurgeResult } from '$lib/free-will/purge';

function storageKeysOf(files: GeneratedFile[] | null | undefined): string[] {
	return (files ?? [])
		.map((file) => file.storageKey)
		.filter((key): key is string => Boolean(key));
}

export async function purgeExpiredFreeWills(now = new Date()): Promise<FreeWillPurgeResult> {
	return purgeDueFreeWills(
		{
			async listDue(asOf, limit) {
				const rows = await db.query.freeWill.findMany({
					where: lte(freeWill.purgeAfter, asOf),
					columns: { id: true, generated_files: true },
					orderBy: [asc(freeWill.purgeAfter)],
					limit,
				});
				return rows.map((row) => ({
					id: row.id,
					storageKeys: storageKeysOf(row.generated_files),
				}));
			},
			deleteFiles: deleteUploadThingFiles,
			async deleteRow(id, asOf) {
				const removed = await db
					.delete(freeWill)
					.where(and(eq(freeWill.id, id), lte(freeWill.purgeAfter, asOf)))
					.returning({ id: freeWill.id });
				return removed.length > 0;
			},
		},
		{ now },
	);
}
