import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLimit, mockOnConflict, recordAudit } = vi.hoisted(() => ({
	mockLimit: vi.fn(),
	mockOnConflict: vi.fn(),
	recordAudit: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: mockLimit,
				}),
			}),
		}),
		insert: () => ({
			values: () => ({
				onConflictDoUpdate: mockOnConflict,
			}),
		}),
	},
}));

vi.mock('$lib/server/content/audit', () => ({
	recordAudit: (...args: unknown[]) => recordAudit(...args),
}));

import { getBooleanSetting, getSetting, setSetting } from '$lib/server/settings';

describe('site settings', () => {
	beforeEach(() => {
		mockLimit.mockReset();
		mockOnConflict.mockReset();
		recordAudit.mockReset();
		mockOnConflict.mockResolvedValue(undefined);
	});

	it('getBooleanSetting returns the default when unset', async () => {
		mockLimit.mockResolvedValue([]);
		await expect(getBooleanSetting('free_will_enabled', true)).resolves.toBe(true);
		await expect(getBooleanSetting('free_will_enabled', false)).resolves.toBe(false);
	});

	it('getBooleanSetting reads stored true/false', async () => {
		mockLimit.mockResolvedValueOnce([{ value: 'true' }]);
		await expect(getBooleanSetting('free_will_enabled', false)).resolves.toBe(true);
		mockLimit.mockResolvedValueOnce([{ value: 'false' }]);
		await expect(getBooleanSetting('free_will_enabled', true)).resolves.toBe(false);
	});

	it('setSetting then getSetting returns the stored value', async () => {
		mockOnConflict.mockResolvedValue(undefined);
		mockLimit.mockResolvedValue([{ value: 'vid-1' }]);
		await setSetting('featured_video_id', 'vid-1', 'actor-1');
		await expect(getSetting('featured_video_id')).resolves.toBe('vid-1');
	});

	it('setSetting writes a content_audit row', async () => {
		mockOnConflict.mockResolvedValue(undefined);
		await setSetting('featured_video_id', 'vid-2', 'actor-2');
		expect(recordAudit).toHaveBeenCalledWith({
			actorId: 'actor-2',
			action: 'setting:featured_video_id',
			targetType: 'content_setting',
			targetId: 'featured_video_id',
		});
	});
});
