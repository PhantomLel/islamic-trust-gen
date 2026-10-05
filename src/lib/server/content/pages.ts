/**
 * Answer pages: persistence and the publish state machine.
 *
 * Statuses: draft → in_review → published ⇄ unpublished. A scheduled page stays
 * `in_review` with `scheduled_publish_at` set until the cron publishes it.
 *
 * Permission checks live here (not only in route actions) so every caller —
 * form action, cron, or future API — goes through the same gate.
 */
import { and, asc, desc, eq, inArray, isNotNull, lte, ne, or, sql, ilike, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	contentCategory,
	contentFaq,
	contentPage,
	contentPageRevision,
	contentRelated,
	contentRedirect,
	mediaAsset,
	videoPage,
} from '$lib/server/db/schema';
import { assertCan } from '$lib/content/permissions';
import { sanitizeDoc } from '$lib/content/body';
import {
	isReviewDue,
	isValidSlug,
	validatePageForPublish,
	type PageDraft,
	type RuleResult,
} from '$lib/content/rules';
import { MAX_RELATED, REVIEW_INTERVAL_MONTHS, type ContentJurisdiction, type CtaKey, type DocJson } from '$lib/content/types';
import { recordAudit } from './audit';

export type Actor = { id: string; role: string | null | undefined };

export type PageFields = {
	title: string;
	slug: string;
	answerSummary: string;
	body: DocJson;
	metaDescription: string;
	jurisdiction: ContentJurisdiction | null;
	categoryId: number | null;
	lastReviewedOn: string | null;
	ctaKey: CtaKey | null;
	caveatOverride: string | null;
	socialImageId: number | null;
	faq: { question: string; answer: string }[];
	relatedIds: number[];
};

export async function getPage(id: number) {
	const [page] = await db.select().from(contentPage).where(eq(contentPage.id, id)).limit(1);
	if (!page) return null;
	const [faqs, related, category, image, videos] = await Promise.all([
		db.select().from(contentFaq).where(eq(contentFaq.pageId, id)).orderBy(asc(contentFaq.sort), asc(contentFaq.id)),
		db
			.select({ id: contentPage.id, title: contentPage.title, slug: contentPage.slug, status: contentPage.status, sort: contentRelated.sort })
			.from(contentRelated)
			.innerJoin(contentPage, eq(contentRelated.relatedPageId, contentPage.id))
			.where(eq(contentRelated.pageId, id))
			.orderBy(asc(contentRelated.sort)),
		page.categoryId ? db.select().from(contentCategory).where(eq(contentCategory.id, page.categoryId)).limit(1) : Promise.resolve([]),
		page.socialImageId ? db.select().from(mediaAsset).where(eq(mediaAsset.id, page.socialImageId)).limit(1) : Promise.resolve([]),
		db.select({ id: videoPage.id, slug: videoPage.slug, title: videoPage.title, status: videoPage.status }).from(videoPage).where(eq(videoPage.relatedContentPageId, id)),
	]);
	return { page, faqs, related, category: category[0] ?? null, socialImage: image[0] ?? null, videos };
}

export type PageBundle = NonNullable<Awaited<ReturnType<typeof getPage>>>;

/** A published page only. Anything else is a 404 at the route (never a soft 200). */
export async function getPublishedPageBySlug(slug: string) {
	const [row] = await db
		.select({ id: contentPage.id })
		.from(contentPage)
		.where(and(eq(contentPage.slug, slug), eq(contentPage.status, 'published')))
		.limit(1);
	if (!row) return null;
	return getPage(row.id);
}

export async function listPagesForAdmin(filter?: { status?: string; q?: string }) {
	const conds = [];
	if (filter?.status) conds.push(eq(contentPage.status, filter.status as never));
	if (filter?.q) conds.push(ilike(contentPage.title, `%${filter.q.replace(/[%_]/g, '')}%`));
	return db
		.select({
			id: contentPage.id,
			title: contentPage.title,
			slug: contentPage.slug,
			status: contentPage.status,
			jurisdiction: contentPage.jurisdiction,
			lastReviewedOn: contentPage.lastReviewedOn,
			updatedAt: contentPage.updatedAt,
			scheduledPublishAt: contentPage.scheduledPublishAt,
			categoryName: contentCategory.name,
		})
		.from(contentPage)
		.leftJoin(contentCategory, eq(contentPage.categoryId, contentCategory.id))
		.where(conds.length ? and(...conds) : undefined)
		.orderBy(desc(contentPage.updatedAt));
}

/** Published pages whose last-reviewed date is older than six months (or missing). */
export async function listReviewDuePages(now: Date = new Date()) {
	const cutoff = new Date(now);
	cutoff.setUTCMonth(cutoff.getUTCMonth() - REVIEW_INTERVAL_MONTHS);
	const cutoffStr = cutoff.toISOString().slice(0, 10);
	const rows = await db
		.select({
			id: contentPage.id,
			title: contentPage.title,
			slug: contentPage.slug,
			lastReviewedOn: contentPage.lastReviewedOn,
		})
		.from(contentPage)
		.where(
			and(
				eq(contentPage.status, 'published'),
				or(isNull(contentPage.lastReviewedOn), sql`${contentPage.lastReviewedOn} < ${cutoffStr}`),
			),
		)
		.orderBy(asc(contentPage.lastReviewedOn));
	return rows.filter((r) => isReviewDue(r.lastReviewedOn, now));
}

export async function createDraft(actor: Actor): Promise<number> {
	assertCan(actor.role, 'draft');
	const slug = `draft-${Date.now().toString(36)}`;
	const [row] = await db
		.insert(contentPage)
		.values({ slug, authorId: actor.id, status: 'draft' })
		.returning({ id: contentPage.id });
	await recordAudit({ actorId: actor.id, action: 'create', targetType: 'content_page', targetId: row.id });
	return row.id;
}

export type SaveResult =
	| { ok: true; pageId: number }
	| { ok: false; error: string }
	| { ok: false; slugChangePrompt: { from: string; to: string } };

/**
 * Save draft fields. Anyone with `draft` may save. Editing a published page
 * keeps it published; a changed slug on a published page needs `insertRedirect`
 * to be confirmed (the UI prompts, the action refuses otherwise).
 */
export async function savePage(
	id: number,
	fields: PageFields,
	actor: Actor,
	opts: { insertRedirect?: boolean; revision?: boolean } = {},
): Promise<SaveResult> {
	assertCan(actor.role, 'draft');
	const existing = await getPage(id);
	if (!existing) return { ok: false, error: 'That page no longer exists.' };

	const slug = fields.slug.trim();
	if (slug && !isValidSlug(slug)) {
		return { ok: false, error: 'The page address (slug) can use lower-case letters, numbers and hyphens only.' };
	}
	if (slug) {
		const clash = await db
			.select({ id: contentPage.id })
			.from(contentPage)
			.where(and(eq(contentPage.slug, slug), ne(contentPage.id, id)))
			.limit(1);
		if (clash.length) return { ok: false, error: 'Another page already uses that address (slug).' };
	}

	const slugChanged = !!slug && slug !== existing.page.slug;
	const wasPublished = existing.page.status === 'published';
	if (slugChanged && wasPublished && !opts.insertRedirect) {
		return { ok: false, slugChangePrompt: { from: existing.page.slug, to: slug } };
	}

	const related = [...new Set(fields.relatedIds.filter((r) => r !== id))];
	if (related.length > MAX_RELATED) return { ok: false, error: `Choose at most ${MAX_RELATED} related questions.` };

	const body = sanitizeDoc(fields.body);
	await db
		.update(contentPage)
		.set({
			title: fields.title.trim(),
			slug: slug || existing.page.slug,
			answerSummary: fields.answerSummary.trim(),
			body,
			metaDescription: fields.metaDescription.trim(),
			jurisdiction: fields.jurisdiction,
			categoryId: fields.categoryId,
			lastReviewedOn: fields.lastReviewedOn || null,
			ctaKey: fields.ctaKey,
			caveatOverride: fields.caveatOverride?.trim() || null,
			socialImageId: fields.socialImageId,
			updatedAt: new Date(),
		})
		.where(eq(contentPage.id, id));

	// FAQ and related are small lists: replace them wholesale.
	await db.delete(contentFaq).where(eq(contentFaq.pageId, id));
	const faq = fields.faq.filter((f) => f.question.trim() || f.answer.trim());
	if (faq.length) {
		await db.insert(contentFaq).values(faq.map((f, i) => ({ pageId: id, question: f.question.trim(), answer: f.answer.trim(), sort: i })));
	}
	await db.delete(contentRelated).where(eq(contentRelated.pageId, id));
	if (related.length) {
		await db.insert(contentRelated).values(related.map((rid, i) => ({ pageId: id, relatedPageId: rid, sort: i })));
	}

	if (slugChanged && wasPublished && opts.insertRedirect) {
		await db
			.insert(contentRedirect)
			.values({ fromPath: `/answers/${existing.page.slug}`, toPath: `/answers/${slug}`, statusCode: 301, createdBy: actor.id })
			.onConflictDoUpdate({ target: contentRedirect.fromPath, set: { toPath: `/answers/${slug}`, statusCode: 301 } });
		await recordAudit({ actorId: actor.id, action: 'slug_redirect', targetType: 'content_redirect', targetId: `/answers/${existing.page.slug}` });
	}

	if (opts.revision !== false) {
		// Autosave fires often; only keep a revision when something actually changed.
		const [latest] = await db
			.select()
			.from(contentPageRevision)
			.where(eq(contentPageRevision.pageId, id))
			.orderBy(desc(contentPageRevision.id))
			.limit(1);
		const same =
			latest &&
			latest.title === fields.title.trim() &&
			latest.answerSummary === fields.answerSummary.trim() &&
			JSON.stringify(latest.body) === JSON.stringify(body);
		if (!same) {
			await db.insert(contentPageRevision).values({
				pageId: id,
				title: fields.title.trim(),
				answerSummary: fields.answerSummary.trim(),
				body,
				actorId: actor.id,
			});
		}
	}
	await recordAudit({ actorId: actor.id, action: 'save', targetType: 'content_page', targetId: id });
	return { ok: true, pageId: id };
}

export async function listRevisions(pageId: number) {
	return db
		.select({ id: contentPageRevision.id, createdAt: contentPageRevision.createdAt, actorId: contentPageRevision.actorId, title: contentPageRevision.title })
		.from(contentPageRevision)
		.where(eq(contentPageRevision.pageId, pageId))
		.orderBy(desc(contentPageRevision.createdAt))
		.limit(30);
}

/** Restore the title, summary and body from a revision (writes a new revision so the revert is itself undoable). */
export async function revertToRevision(pageId: number, revisionId: number, actor: Actor): Promise<{ ok: boolean; error?: string }> {
	assertCan(actor.role, 'draft');
	const [rev] = await db
		.select()
		.from(contentPageRevision)
		.where(and(eq(contentPageRevision.id, revisionId), eq(contentPageRevision.pageId, pageId)))
		.limit(1);
	if (!rev) return { ok: false, error: 'That revision was not found.' };
	const body = sanitizeDoc(rev.body);
	await db
		.update(contentPage)
		.set({ title: rev.title, answerSummary: rev.answerSummary, body, updatedAt: new Date() })
		.where(eq(contentPage.id, pageId));
	await db.insert(contentPageRevision).values({ pageId, title: rev.title, answerSummary: rev.answerSummary, body, actorId: actor.id });
	await recordAudit({ actorId: actor.id, action: `revert:${revisionId}`, targetType: 'content_page', targetId: pageId });
	return { ok: true };
}

/** Gather everything the publish rules need. */
export async function draftForRules(bundle: PageBundle): Promise<PageDraft> {
	const [cats] = await db.select({ n: sql<number>`count(*)::int` }).from(contentCategory);
	const { page } = bundle;
	return {
		title: page.title,
		slug: page.slug,
		answerSummary: page.answerSummary,
		body: page.body,
		metaDescription: page.metaDescription,
		jurisdiction: page.jurisdiction,
		categoryId: page.categoryId,
		lastReviewedOn: page.lastReviewedOn,
		ctaKey: page.ctaKey,
		hasSocialImage: !!bundle.socialImage,
		socialImageAlt: bundle.socialImage?.altText ?? null,
		faq: bundle.faqs.map((f) => ({ question: f.question, answer: f.answer })),
		relatedCount: bundle.related.length,
		hasRelatedVideo: bundle.videos.some((v) => v.status === 'published'),
		categoryCount: cats?.n ?? 0,
		caveatOverride: page.caveatOverride,
	};
}

export async function checkPage(id: number): Promise<RuleResult & { exists: boolean }> {
	const bundle = await getPage(id);
	if (!bundle) return { exists: false, errors: ['That page no longer exists.'], warnings: [] };
	return { exists: true, ...validatePageForPublish(await draftForRules(bundle)) };
}

export async function submitForReview(id: number, actor: Actor): Promise<{ ok: boolean; error?: string }> {
	assertCan(actor.role, 'submit');
	const bundle = await getPage(id);
	if (!bundle) return { ok: false, error: 'That page no longer exists.' };
	if (bundle.page.status === 'published') return { ok: false, error: 'This page is already published.' };
	await db.update(contentPage).set({ status: 'in_review', updatedAt: new Date() }).where(eq(contentPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'submit', targetType: 'content_page', targetId: id });
	return { ok: true };
}

export async function publishPage(id: number, actor: Actor): Promise<{ ok: boolean; errors?: string[]; warnings?: string[] }> {
	assertCan(actor.role, 'publish');
	const check = await checkPage(id);
	if (!check.exists || check.errors.length) return { ok: false, errors: check.errors, warnings: check.warnings };
	const [current] = await db.select({ publishedAt: contentPage.publishedAt }).from(contentPage).where(eq(contentPage.id, id)).limit(1);
	await db
		.update(contentPage)
		.set({ status: 'published', publishedAt: current?.publishedAt ?? new Date(), scheduledPublishAt: null, updatedAt: new Date() })
		.where(eq(contentPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'publish', targetType: 'content_page', targetId: id });
	return { ok: true, warnings: check.warnings };
}

export async function schedulePage(id: number, at: Date, actor: Actor): Promise<{ ok: boolean; errors?: string[] }> {
	assertCan(actor.role, 'schedule');
	if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return { ok: false, errors: ['Choose a date and time in the future.'] };
	const check = await checkPage(id);
	if (!check.exists || check.errors.length) return { ok: false, errors: check.errors };
	await db.update(contentPage).set({ status: 'in_review', scheduledPublishAt: at, updatedAt: new Date() }).where(eq(contentPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'schedule', targetType: 'content_page', targetId: id });
	return { ok: true };
}

export async function unpublishPage(id: number, actor: Actor): Promise<{ ok: boolean }> {
	assertCan(actor.role, 'unpublish');
	await db
		.update(contentPage)
		.set({ status: 'unpublished', scheduledPublishAt: null, updatedAt: new Date() })
		.where(eq(contentPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'unpublish', targetType: 'content_page', targetId: id });
	return { ok: true };
}

export async function cancelSchedule(id: number, actor: Actor): Promise<void> {
	assertCan(actor.role, 'schedule');
	await db.update(contentPage).set({ scheduledPublishAt: null, updatedAt: new Date() }).where(eq(contentPage.id, id));
	await recordAudit({ actorId: actor.id, action: 'cancel_schedule', targetType: 'content_page', targetId: id });
}

export const SYSTEM_ACTOR: Actor = { id: 'system', role: 'admin' };

/** Cron: publish pages whose scheduled time has passed. A page that no longer passes the rules is left for a human. */
export async function publishDuePages(now: Date = new Date()): Promise<{ published: number; failed: number }> {
	const due = await db
		.select({ id: contentPage.id })
		.from(contentPage)
		.where(and(isNotNull(contentPage.scheduledPublishAt), lte(contentPage.scheduledPublishAt, now), ne(contentPage.status, 'published')));
	let published = 0;
	let failed = 0;
	for (const { id } of due) {
		const res = await publishPage(id, SYSTEM_ACTOR);
		if (res.ok) published++;
		else {
			failed++;
			await db.update(contentPage).set({ scheduledPublishAt: null }).where(eq(contentPage.id, id));
			await recordAudit({ actorId: SYSTEM_ACTOR.id, action: 'schedule_failed', targetType: 'content_page', targetId: id });
		}
	}
	return { published, failed };
}

export type PublicListFilter = { categoryId?: number | null; jurisdiction?: string | null; q?: string | null };

export async function listPublishedPages(filter: PublicListFilter = {}) {
	const conds = [eq(contentPage.status, 'published')];
	if (filter.categoryId) conds.push(eq(contentPage.categoryId, filter.categoryId));
	if (filter.jurisdiction) conds.push(inArray(contentPage.jurisdiction, jurisdictionFilterValues(filter.jurisdiction)));
	if (filter.q) {
		const like = `%${filter.q.replace(/[%_\\]/g, '')}%`;
		conds.push(or(ilike(contentPage.title, like), ilike(contentPage.answerSummary, like))!);
	}
	return db
		.select({
			id: contentPage.id,
			title: contentPage.title,
			slug: contentPage.slug,
			answerSummary: contentPage.answerSummary,
			jurisdiction: contentPage.jurisdiction,
			categoryId: contentPage.categoryId,
			categoryName: contentCategory.name,
			lastReviewedOn: contentPage.lastReviewedOn,
			updatedAt: contentPage.updatedAt,
		})
		.from(contentPage)
		.leftJoin(contentCategory, eq(contentPage.categoryId, contentCategory.id))
		.where(and(...conds))
		.orderBy(asc(contentCategory.sortOrder), asc(contentPage.title));
}

/** Filtering for TX or CA also shows pages that cover both states and general pages. */
export function jurisdictionFilterValues(j: string): ContentJurisdiction[] {
	if (j === 'TX') return ['TX', 'BOTH', 'GENERAL'];
	if (j === 'CA') return ['CA', 'BOTH', 'GENERAL'];
	if (j === 'BOTH') return ['BOTH'];
	if (j === 'GENERAL') return ['GENERAL'];
	return ['TX', 'CA', 'BOTH', 'GENERAL'];
}

export async function publishedPageSitemap() {
	return db
		.select({ slug: contentPage.slug, updatedAt: contentPage.updatedAt, lastReviewedOn: contentPage.lastReviewedOn })
		.from(contentPage)
		.where(eq(contentPage.status, 'published'));
}
