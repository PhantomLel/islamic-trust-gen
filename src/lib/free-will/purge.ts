import { FREE_WILL_PURGE_BATCH } from './retention';

export type DueFreeWill = {
	id: number;
	storageKeys: string[];
};

export type FreeWillPurgeStore = {
	listDue(now: Date, limit: number): Promise<DueFreeWill[]>;
	/** False means keep the row and retry. Thrown errors are treated the same. */
	deleteFiles(keys: string[]): Promise<{ success: boolean }>;
	/** True only when the row was still due and was removed. */
	deleteRow(id: number, now: Date): Promise<boolean>;
};

export type FreeWillPurgeResult = {
	deleted: number;
	skipped: number;
};

/**
 * Delete each due will's files, then the row.
 * The row stays when the file delete fails, so the storage key is not lost.
 * The row delete is conditional on `purgeAfter` still being due, so a save
 * that lands mid-run is kept.
 */
export async function purgeDueFreeWills(
	store: FreeWillPurgeStore,
	opts?: { now?: Date; limit?: number },
): Promise<FreeWillPurgeResult> {
	const now = opts?.now ?? new Date();
	const limit = opts?.limit ?? FREE_WILL_PURGE_BATCH;
	const due = await store.listDue(now, limit);
	let deleted = 0;
	let skipped = 0;

	for (const row of due) {
		try {
			if (row.storageKeys.length > 0) {
				const files = await store.deleteFiles(row.storageKeys);
				if (!files.success) {
					skipped += 1;
					continue;
				}
			}
			const removed = await store.deleteRow(row.id, now);
			if (removed) deleted += 1;
			else skipped += 1;
		} catch (err) {
			skipped += 1;
			console.error('[free-will-retention] skipped will', row.id, err);
		}
	}

	return { deleted, skipped };
}
