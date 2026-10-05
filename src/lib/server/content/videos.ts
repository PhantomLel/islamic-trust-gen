/** Video library: persistence and publish state machine. See pages.ts for the shared conventions. */
import { and, asc, desc, eq, isNotNull, lte, ne, or, ilike } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentPage, contentRedirect, mediaAsset, videoPage } from '$lib/server/db/schema';
import { assertCan } from '$lib/content/permissions';
import { isValidSlug, parseYoutubeId, validateVideoForPublish, type RuleResult, type VideoDraft } from '$lib/content/rules';
import type { ContentJurisdiction } from '$lib/content/types';
import { recordAudit } from './audit';
import type { Actor } from './pages';
import { SYSTEM_ACTOR } from './pages';
import { FEATURED_VIDEO_KEY, getSetting, setSetting } from './settings';

export type VideoFields = {
	title: string;
	slug: string;
	youtubeId: string;
	description: string;
	transcript: string;
	durationSeconds: number | null;
	jurisdiction: ContentJurisdiction | null;
	series: string | null;
	seriesOrder: number | null;
	relatedContentPageId: number | null;
	isTestimonial: boolean;
	releaseOnFile: boolean;
	isEndorsement: boolean;
	speakerTitle: string | null;
	speakerRelationship: string | null;
	metaDescription: string;
	thumbnailAssetId: number | null;
	uploadedOn: string | null;
};

export async function getVideo(id: number) {
	const [video] = await db.select().from(videoPage).where(eq(videoPage.id, id)).limit(1);
	if (!video) return null;
	const [thumb] = video.thumbnailAssetId
		? await db.select().from(mediaAsset).where(eq(mediaAsset.id, video.thumbnailAssetId)).limit(1)
		: [];
	const [related] = video.relatedContentPageId
		? await db
				.select({ id: contentPage.id, title: contentPage.title, slug: contentPage.slug, status: contentPage.status })
				.from(contentPage)
				.where(eq(contentPage.id, video.relatedContentPageId))
				.limit(1)
		: [];
	return { video, thumbnail: thumb ?? null, relatedPage: related ?? null };
}
export type VideoBundle = NonNullable<Awaited<ReturnType<typeof getVideo>>>;

export async function getPublishedVideoBySlug(slug: string) {
	const [row] = await db
		.select({ id: videoPage.id })
		.from(videoPage)
		.where(and(eq(videoPage.slug, slug), eq(videoPage.status, 'published')))
		.limit(1);
	return row ? getVideo(row.id) : null;
}

export async function listVideosForAdmin() {
	return db
		.select({
			id: videoPage.id,
			title: videoPage.title,
			slug: videoPage.slug,
			status: videoPage.status,
			series: videoPage.series,
			isTestimonial: videoPage.isTestimonial,
			updatedAt: videoPage.updatedAt,
			scheduledPublishAt: videoPage.scheduledPublishAt,
		})
		.from(videoPage)
		.orderBy(desc(videoPage.updatedAt));
}

export async function listPublishedVideos(filter: { series?: string | null; q?: string | null } = {}) {
	const conds = [eq(videoPage.status, 'published')];
	if (filter.series) conds.push(eq(videoPage.series, filter.series));
	if (filter.q) {
		const like = `%${filter.q.replace(/[%_\\]/g, '')}%`;
		conds.push(or(ilike(videoPage.title, like), ilike(videoPage.description, like))!);
	}
	return db
		.select({
			id: videoPage.id,
			title: videoPage.title,
			slug: videoPage.slug,
			description: videoPage.description,
			durationSeconds: videoPage.durationSeconds,
			series: videoPage.series,
			seriesOrder: videoPage.seriesOrder,
			jurisdiction: videoPage.jurisdiction,
			hasThumbnail: videoPage.thumbnailAssetId,
			uploadedOn: videoPage.uploadedOn,
		})
		.from(videoPage)
		.where(and(...conds))
		.orderBy(asc(videoPage.series), asc(videoPage.seriesOrder), desc(videoPage.uploadedOn));
}

/** Previous and next published videos inside a series, by series order. */
export async function seriesNeighbours(series: string, seriesOrder: number | null, id: number) {
	const all = await db
		.select({ id: videoPage.id, title: videoPage.title, slug: videoPage.slug, seriesOrder: videoPage.seriesOrder })
		.from(videoPage)
		.where(and(eq(videoPage.series, series), eq(videoPage.status, 'published')))
		.orderBy(asc(videoPage.seriesOrder), asc(videoPage.id));
	const idx = all.findIndex((v) => v.id === id);
	if (idx === -1) return { previous: null, next: null, all };
	void seriesOrder;
	return { previous: all[idx - 1] ?? null, next: all[idx + 1] ?? null, all };
}

export async function createVideoDraft(actor: Actor): Promise<number> {
	assertCan(actor.role, 'draft');
	const [row] = await db
		.insert(videoPage)
		.values({ slug: `video-${Date.now().toString(36)}`, authorId: actor.id })
		.returning({ id: videoPage.id });
	await recordAudit({ actorId: actor.id, action: 'create', targetType: 'video_page', targetId: row.id });
	return row.id;
}

export type VideoSaveResult =
	| { ok: true }
	| { ok: false; error: string }
	| { ok: false; slugChangePrompt: { from: string; to: string } };

export async function saveVideo(id: number, f: VideoFields, actor: Actor, opts: { insertRedirect?: boolean } = {}): Promise<VideoSaveResult> {
	assertCan(actor.role, 'draft');
	const existing = await getVideo(id);
	if (!existing) return { ok: false, error: 'That video no longer exists.' };
	const slug = f.slug.trim();
	if (slug && !isValidSlug(slug)) return { ok: false, error: 'The page address (slug) can use lower-case letters, numbers and hyphens only.' };
	if (slug === 'series') return { ok: false, error: 'That address is reserved. Choose another.' };
	if (slug) {
		const clash = await db.select({ id: videoPage.id }).from(videoPage).where(and(eq(videoPage.slug, slug), ne(videoPage.id, id))).limit(1);
		if (clash.length) return { ok: false, error: 'Another video already uses that address (slug).' };
	}
	const slugChanged = !!slug && slug !== existing.video.slug;
	const wasPublished = existing.video.status === 'published';
	if (slugChanged && wasPublished && !opts.insertRedirect) {
		return { ok: false, slugChangePrompt: { from: existing.video.slug, to: slug } };
	}
	const ytId = parseYoutubeId(f.youtubeId) ?? f.youtubeId.trim();
	await db
		.update(videoPage)
		.set({
			title: f.title.trim(),
			slug: slug || existing.video.slug,
			youtubeId: ytId,
			description: f.description.trim(),
			transcript: f.transcript.trim(),
			durationSeconds: f.durationSeconds,
			jurisdiction: f.jurisdiction,
			series: f.series?.trim() || null,
			seriesOrder: f.series?.trim() ? f.seriesOrder : null,
			relatedContentPageId: f.relatedContentPageId,
			isTestimonial: f.isTestimonial,
			releaseOnFile: f.isTestimonial ? f.releaseOnFile : false,
			isEndorsement: f.isTestimonial ? f.isEndorsement : false,
			speakerTitle: f.speakerTitle?.trim() || null,
			speakerRelationship: f.speakerRelationship?.trim() || null,
			metaDescription: f.metaDescription.trim(),
			thumbnailAssetId: f.thumbnailAssetId,
			uploadedOn: f.uploadedOn || null,
			updatedAt: new Date(),
		})
		.where(eq(videoPage.id, id));
	if (slugChanged && wasPublished && opts.insertRedirect) {
		await db
			.insert(contentRedirect)
			.values({ fromPath: `/videos/${existing.video.slug}`, toPath: `/videos/${slug}`, statusCode: 301, createdBy: actor.id })
			.onConflictDoUpdate({ target: contentRedirect.fromPath, set: { toPath: `/videos/${slug}`, statusCode: 301 } });
	}
	await recordAudit({ actorId: actor.id, action: 'save', targetType: 'video_page', targetId: id });
	return { ok: true };
}

export function draftForVideoRules(b: VideoBundle): VideoDraft {
	const v = b.video;
	return {
		title: v.title,
		slug: v.slug,
		youtubeId: v.youtubeId,
		description: v.description,
		transcript: v.transcript,
		durationSeconds: v.durationSeconds,
		jurisdiction: v.jurisdiction,
		metaDescription: v.metaDescription,
		hasThumbnail: !!b.thumbnail,
		thumbnailAlt: b.thumbnail?.altText ?? null,
		isTestimonial: v.isTestimonial,
		releaseOnFile: v.releaseOnFile,
		isEndorsement: v.isEndorsement,
		speakerTitle: v.speakerTitle,
		speakerRelationship: v.speakerRelationship,
		uploadedOn: v.uploadedOn,
	};
}

export async function checkVideo(id: number): Promise<RuleResult & { exists: boolean }> {
	const b = await getVideo(id);
	if (!b) return { exists: false, errors: ['That video no longer exists.'], warnings: [] };
	return { exists: true, ...validateVideoForPublish(draftForVideoRules(b)) };
}

export async function submitVideoForReview(id: number, actor: Actor): Promise<void> {
	assertCan(actor.role, 'submit');
	await db.update(videoPage).set({ status: 'in_review', updatedAt: new Date() }).where(and(eq(videoPage.id, id), ne(videoPage.status, 'published')));
	await recordAudit({ actorId: actor.id, action: 'submit', targetType: 'video_page', targetId: id });
}

export async function publishVideo(id: number, actor: Actor): Promise<{ ok: boolean; errors?: string[]; warnings?: string[] }> {
	assertCan(actor.role, 'publish');
	const check = await checkVideo(id);
	if (!check.exists || check.errors.length) return { ok: false, errors: check.errors, warnings: check.warnings };
	const [cur] = await db.select({ publishedAt: videoPage.publishedAt }).from(videoPage).where(eq(videoPage.id, id)).limit(1);
	await db
		.update(videoPage)
		.set({ status: 'published', publishedAt: cur?.publishedAt ?? new Date(), scheduledPublishAt: null, updatedAt: new Date() })
		.where(eq(videoPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'publish', targetType: 'video_page', targetId: id });
	return { ok: true, warnings: check.warnings };
}

export async function scheduleVideo(id: number, at: Date, actor: Actor): Promise<{ ok: boolean; errors?: string[] }> {
	assertCan(actor.role, 'schedule');
	if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return { ok: false, errors: ['Choose a date and time in the future.'] };
	const check = await checkVideo(id);
	if (!check.exists || check.errors.length) return { ok: false, errors: check.errors };
	await db.update(videoPage).set({ status: 'in_review', scheduledPublishAt: at, updatedAt: new Date() }).where(eq(videoPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'schedule', targetType: 'video_page', targetId: id });
	return { ok: true };
}

export async function unpublishVideo(id: number, actor: Actor): Promise<void> {
	assertCan(actor.role, 'unpublish');
	await db.update(videoPage).set({ status: 'unpublished', scheduledPublishAt: null, updatedAt: new Date() }).where(eq(videoPage.id, id));
	// A video that is no longer public cannot stay featured on the homepage.
	const featured = await getSetting(FEATURED_VIDEO_KEY);
	if (featured === String(id)) await setSetting(FEATURED_VIDEO_KEY, null, actor.id);
	await recordAudit({ actorId: actor.id, action: 'unpublish', targetType: 'video_page', targetId: id });
}

export async function publishDueVideos(now: Date = new Date()): Promise<{ published: number; failed: number }> {
	const due = await db
		.select({ id: videoPage.id })
		.from(videoPage)
		.where(and(isNotNull(videoPage.scheduledPublishAt), lte(videoPage.scheduledPublishAt, now), ne(videoPage.status, 'published')));
	let published = 0;
	let failed = 0;
	for (const { id } of due) {
		const res = await publishVideo(id, SYSTEM_ACTOR);
		if (res.ok) published++;
		else {
			failed++;
			await db.update(videoPage).set({ scheduledPublishAt: null }).where(eq(videoPage.id, id));
			await recordAudit({ actorId: SYSTEM_ACTOR.id, action: 'schedule_failed', targetType: 'video_page', targetId: id });
		}
	}
	return { published, failed };
}

export async function publishedVideoSitemap() {
	return db.select({ slug: videoPage.slug, updatedAt: videoPage.updatedAt, series: videoPage.series }).from(videoPage).where(eq(videoPage.status, 'published'));
}

/** The publisher-selected homepage video, only while it is published. Otherwise no video slot. */
export async function getFeaturedVideo() {
	const raw = await getSetting(FEATURED_VIDEO_KEY);
	const id = Number(raw);
	if (!raw || !Number.isInteger(id)) return null;
	const b = await getVideo(id);
	if (!b || b.video.status !== 'published' || !b.thumbnail) return null;
	return b;
}
