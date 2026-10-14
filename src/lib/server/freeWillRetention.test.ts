import { describe, expect, it, vi } from 'vitest';
import { purgeDueFreeWills, type FreeWillPurgeStore } from '$lib/free-will/purge';

function store(overrides: Partial<FreeWillPurgeStore> = {}): FreeWillPurgeStore & {
	deleteFiles: ReturnType<typeof vi.fn>;
	deleteRow: ReturnType<typeof vi.fn>;
} {
	return {
		listDue: vi.fn(async () => [{ id: 7, storageKeys: ['file-a'] }]),
		deleteFiles: vi.fn(async () => ({ success: true })),
		deleteRow: vi.fn(async () => true),
		...overrides,
	};
}

describe('purgeDueFreeWills', () => {
	it('deletes the file, then the row', async () => {
		const calls: string[] = [];
		const fake = store({
			deleteFiles: vi.fn(async () => {
				calls.push('files');
				return { success: true };
			}),
			deleteRow: vi.fn(async () => {
				calls.push('row');
				return true;
			}),
		});

		const result = await purgeDueFreeWills(fake, { now: new Date('2026-03-01T00:00:00.000Z') });

		expect(result).toEqual({ deleted: 1, skipped: 0 });
		expect(calls).toEqual(['files', 'row']);
		expect(fake.deleteFiles).toHaveBeenCalledWith(['file-a']);
		expect(fake.deleteRow).toHaveBeenCalledWith(7, new Date('2026-03-01T00:00:00.000Z'));
	});

	it('keeps the row when the file delete fails', async () => {
		const fake = store({
			deleteFiles: vi.fn(async () => ({ success: false })),
		});

		const result = await purgeDueFreeWills(fake);

		expect(result).toEqual({ deleted: 0, skipped: 1 });
		expect(fake.deleteRow).not.toHaveBeenCalled();
	});

	it('keeps the row when the file delete throws', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const fake = store({
			deleteFiles: vi.fn(async () => {
				throw new Error('uploadthing down');
			}),
		});

		const result = await purgeDueFreeWills(fake);

		expect(result).toEqual({ deleted: 0, skipped: 1 });
		expect(fake.deleteRow).not.toHaveBeenCalled();
	});

	it('deletes a row that has no file', async () => {
		const fake = store({
			listDue: vi.fn(async () => [{ id: 3, storageKeys: [] }]),
		});

		const result = await purgeDueFreeWills(fake);

		expect(result).toEqual({ deleted: 1, skipped: 0 });
		expect(fake.deleteFiles).not.toHaveBeenCalled();
		expect(fake.deleteRow).toHaveBeenCalled();
	});

	it('counts a row that was saved again before the delete', async () => {
		const fake = store({
			deleteRow: vi.fn(async () => false),
		});

		const result = await purgeDueFreeWills(fake);

		expect(result).toEqual({ deleted: 0, skipped: 1 });
	});
});
