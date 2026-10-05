import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentSetting } from '$lib/server/db/schema';
import { recordAudit } from './audit';

export const FEATURED_VIDEO_KEY = 'featured_video_id';

export async function getSetting(key: string): Promise<string | null> {
	const [row] = await db.select().from(contentSetting).where(eq(contentSetting.key, key)).limit(1);
	return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null, actorId: string): Promise<void> {
	await db
		.insert(contentSetting)
		.values({ key, value, updatedAt: new Date() })
		.onConflictDoUpdate({ target: contentSetting.key, set: { value, updatedAt: new Date() } });
	await recordAudit({ actorId, action: `set:${key}`, targetType: 'content_setting', targetId: key });
}
