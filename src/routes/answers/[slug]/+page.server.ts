import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedPageBySlug } from '$lib/server/content/pages';
import { buildAnswerSeo, buildAnswerView } from '$lib/server/content/view';

export const load: PageServerLoad = async ({ params }) => {
	// Only published pages exist publicly. Drafts, in-review and unpublished pages are a real 404.
	const bundle = await getPublishedPageBySlug(params.slug);
	if (!bundle) throw error(404, 'This page is not available.');
	return { view: buildAnswerView(bundle), seo: buildAnswerSeo(bundle) };
};
