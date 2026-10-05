import type { PageServerLoad } from './$types';
import { listCategories } from '$lib/server/content/taxonomy';
import { listPublishedPages } from '$lib/server/content/pages';
import { searchContent } from '$lib/server/content/search';
import { JURISDICTIONS } from '$lib/content/types';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const categoryParam = Number(url.searchParams.get('category'));
	const categoryId = Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : null;
	const jRaw = url.searchParams.get('jurisdiction');
	const jurisdiction = jRaw && (JURISDICTIONS as readonly string[]).includes(jRaw) ? jRaw : null;

	// A real, server-rendered document: the list is in the HTML, filters are plain GET links.
	const [categories, pages, hits] = await Promise.all([
		listCategories(),
		listPublishedPages({ categoryId, jurisdiction, q: q || null }),
		q ? searchContent(q) : Promise.resolve([]),
	]);
	return { categories, pages, hits, q, categoryId, jurisdiction };
};
