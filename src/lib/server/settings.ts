import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentSetting } from '$lib/server/db/schema';
import { recordAudit } from '$lib/server/content/audit';

export const FEATURED_VIDEO_KEY = 'featured_video_id';
export const FREE_WILL_ENABLED_KEY = 'free_will_enabled';

/** Known keys in `content_setting`. Other string keys are allowed for forward-compatible settings. */
export type SettingKey = typeof FEATURED_VIDEO_KEY | (string & {});

export async function getSetting(key: SettingKey): Promise<string | null> {
	const [row] = await db.select().from(contentSetting).where(eq(contentSetting.key, key)).limit(1);
	return row?.value ?? null;
}

export async function getBooleanSetting(key: SettingKey, defaultValue: boolean): Promise<boolean> {
	const raw = await getSetting(key);
	if (raw === null) return defaultValue;
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	return defaultValue;
}

export async function setSetting(key: SettingKey, value: string | null, actorId: string): Promise<void> {
	await db
		.insert(contentSetting)
		.values({ key, value, updatedAt: new Date() })
		.onConflictDoUpdate({ target: contentSetting.key, set: { value, updatedAt: new Date() } });
	await recordAudit({
		actorId,
		action: `setting:${key}`,
		targetType: 'content_setting',
		targetId: key,
	});
}
