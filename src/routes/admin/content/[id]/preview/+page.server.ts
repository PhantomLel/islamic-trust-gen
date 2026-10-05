import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { getPage } from '$lib/server/content/pages';
import { buildAnswerView } from '$lib/server/content/view';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireContentStaff(locals);
	const bundle = await getPage(Number(params.id));
	if (!bundle) throw error(404, 'Not found');
	return { view: buildAnswerView(bundle), status: bundle.page.status, id: bundle.page.id };
};
