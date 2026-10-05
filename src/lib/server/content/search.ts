import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contentPage, videoPage } from '$lib/server/db/schema';
import { bodyPlainText } from '$lib/content/body';

export type SearchHit = { type: 'answer' | 'video'; title: string; href: string; snippet: string };

function like(q: string): string {
	return `%${q.replace(/[%_\\]/g, ' ').trim()}%`;
}

function snippet(text: string, q: string, len = 160): string {
	const t = text.replace(/\s+/g, ' ').trim();
	const i = t.toLowerCase().indexOf(q.toLowerCase());
	if (i < 0) return t.slice(0, len);
	const start = Math.max(0, i - 40);
	return (start ? '…' : '') + t.slice(start, start + len);
}

/**
 * Site search over published answers and videos only. A plain database query — no
 * third-party search vendor. Unpublished and draft content can never appear here.
 */
export async function searchContent(query: string, limit = 20): Promise<SearchHit[]> {
	const q = query.trim().slice(0, 100);
	if (q.length < 2) return [];
	const pat = like(q);

	const pages = await db
		.select({ title: contentPage.title, slug: contentPage.slug, summary: contentPage.answerSummary, body: contentPage.body })
		.from(contentPage)
		.where(and(eq(contentPage.status, 'published'), or(ilike(contentPage.title, pat), ilike(contentPage.answerSummary, pat), ilike(contentPage.metaDescription, pat))))
		.limit(limit);

	const videos = await db
		.select({ title: videoPage.title, slug: videoPage.slug, description: videoPage.description, transcript: videoPage.transcript })
		.from(videoPage)
		.where(and(eq(videoPage.status, 'published'), or(ilike(videoPage.title, pat), ilike(videoPage.description, pat), ilike(videoPage.transcript, pat))))
		.limit(limit);

	const hits: SearchHit[] = [
		...pages.map((p) => ({ type: 'answer' as const, title: p.title, href: `/answers/${p.slug}`, snippet: snippet(p.summary || bodyPlainText(p.body), q) })),
		...videos.map((v) => ({ type: 'video' as const, title: v.title, href: `/videos/${v.slug}`, snippet: snippet(v.description || v.transcript, q) })),
	];
	return hits.slice(0, limit);
}
