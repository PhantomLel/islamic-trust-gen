import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentCategory, mediaAsset, contentRedirect } from '$lib/server/db/schema';
import { slugify } from '$lib/content/rules';
import { recordAudit } from './audit';
import { isSafeRedirectPath } from './redirects';

export async function listCategories() {
	return db.select().from(contentCategory).orderBy(asc(contentCategory.sortOrder), asc(contentCategory.name));
}

export async function createCategory(name: string, actorId: string): Promise<{ error?: string }> {
	const clean = name.trim();
	if (!clean) return { error: 'Enter a category name.' };
	const slug = slugify(clean);
	if (!slug) return { error: 'Use letters or numbers in the category name.' };
	const existing = await db.select({ id: contentCategory.id }).from(contentCategory).where(eq(contentCategory.slug, slug)).limit(1);
	if (existing.length) return { error: 'A category with that name already exists.' };
	const all = await listCategories();
	const [row] = await db
		.insert(contentCategory)
		.values({ name: clean, slug, sortOrder: all.length })
		.returning({ id: contentCategory.id });
	await recordAudit({ actorId, action: 'create', targetType: 'content_category', targetId: row.id });
	return {};
}

export async function renameCategory(id: number, name: string, actorId: string): Promise<{ error?: string }> {
	const clean = name.trim();
	const slug = slugify(clean);
	if (!clean || !slug) return { error: 'Enter a category name.' };
	await db.update(contentCategory).set({ name: clean, slug }).where(eq(contentCategory.id, id));
	await recordAudit({ actorId, action: 'rename', targetType: 'content_category', targetId: id });
	return {};
}

export async function deleteCategory(id: number, actorId: string): Promise<void> {
	await db.delete(contentCategory).where(eq(contentCategory.id, id));
	await recordAudit({ actorId, action: 'delete', targetType: 'content_category', targetId: id });
}

export async function listRedirects() {
	return db.select().from(contentRedirect).orderBy(asc(contentRedirect.fromPath));
}

export async function upsertRedirect(
	input: { fromPath: string; toPath: string; statusCode?: number },
	actorId: string,
): Promise<{ error?: string }> {
	const from = input.fromPath.trim();
	const to = input.toPath.trim();
	if (!isSafeRedirectPath(from) || !isSafeRedirectPath(to)) return { error: 'Both paths must start with “/” (for example /answers/old-slug).' };
	if (from === to) return { error: 'The two paths are the same.' };
	const code = [301, 302, 307, 308].includes(Number(input.statusCode)) ? Number(input.statusCode) : 301;
	// Never create a two-step loop (A → B while B → A).
	const back = await db.select().from(contentRedirect).where(eq(contentRedirect.fromPath, to)).limit(1);
	if (back[0]?.toPath === from) return { error: 'That would create a redirect loop.' };
	await db
		.insert(contentRedirect)
		.values({ fromPath: from, toPath: to, statusCode: code, createdBy: actorId })
		.onConflictDoUpdate({ target: contentRedirect.fromPath, set: { toPath: to, statusCode: code } });
	await recordAudit({ actorId, action: 'upsert', targetType: 'content_redirect', targetId: from });
	return {};
}

export async function deleteRedirect(id: number, actorId: string): Promise<void> {
	await db.delete(contentRedirect).where(eq(contentRedirect.id, id));
	await recordAudit({ actorId, action: 'delete', targetType: 'content_redirect', targetId: id });
}

export async function listMedia() {
	return db.select().from(mediaAsset).orderBy(asc(mediaAsset.id));
}

export async function createMediaAsset(
	input: { uploadthingKey: string; url: string; altText: string; width?: number | null; height?: number | null },
	actorId: string,
): Promise<{ id?: number; error?: string }> {
	if (!input.altText.trim()) return { error: 'Alt text is required for every image.' };
	const [row] = await db
		.insert(mediaAsset)
		.values({
			uploadthingKey: input.uploadthingKey,
			url: input.url,
			altText: input.altText.trim(),
			width: input.width ?? null,
			height: input.height ?? null,
			createdBy: actorId,
		})
		.returning({ id: mediaAsset.id });
	await recordAudit({ actorId, action: 'upload', targetType: 'media_asset', targetId: row.id });
	return { id: row.id };
}

export async function updateMediaAlt(id: number, altText: string, actorId: string): Promise<{ error?: string }> {
	if (!altText.trim()) return { error: 'Alt text is required for every image.' };
	await db.update(mediaAsset).set({ altText: altText.trim() }).where(eq(mediaAsset.id, id));
	await recordAudit({ actorId, action: 'update_alt', targetType: 'media_asset', targetId: id });
	return {};
}
