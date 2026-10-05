import { db } from '$lib/server/db';
import { contentAudit } from '$lib/server/db/schema';

export type AuditTarget = 'content_page' | 'video_page' | 'content_category' | 'content_redirect' | 'media_asset' | 'content_setting' | 'user' | 'review_email';

/**
 * Append one audit row. This is the only writer: there is deliberately no update or
 * delete path, in code or in the UI (and a database trigger refuses both).
 */
export async function recordAudit(entry: {
	actorId: string;
	action: string;
	targetType: AuditTarget;
	targetId: string | number;
}): Promise<void> {
	await db.insert(contentAudit).values({
		actorId: entry.actorId,
		action: entry.action,
		targetType: entry.targetType,
		targetId: String(entry.targetId),
	});
}
