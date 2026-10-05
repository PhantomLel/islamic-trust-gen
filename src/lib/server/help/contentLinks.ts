import { getPublishedPageBySlug } from '$lib/server/content/pages';
import type { ServableEntry } from './servability';

export function entryDisplayTitle(e: ServableEntry): string {
	const t = (e.entryType === 'explainer' ? e.title : e.question)?.trim();
	return t || `Entry #${e.id}`;
}

export async function publishedAnswerHref(slug: string | null | undefined): Promise<string | null> {
	const clean = slug?.trim();
	if (!clean) return null;
	const bundle = await getPublishedPageBySlug(clean);
	return bundle ? `/answers/${clean}` : null;
}

export async function hrefForEntry(e: ServableEntry): Promise<string> {
	return (await publishedAnswerHref(e.contentPageSlug)) ?? '/help';
}
