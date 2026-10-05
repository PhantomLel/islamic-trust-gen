import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { createDraft, listPagesForAdmin, listReviewDuePages } from '$lib/server/content/pages';
import { ContentPermissionError } from '$lib/content/permissions';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireContentStaff(locals);
	const status = url.searchParams.get('status') ?? '';
	const q = url.searchParams.get('q') ?? '';
	const [pages, reviewDue] = await Promise.all([
		listPagesForAdmin({ status: status || undefined, q: q || undefined }),
		listReviewDuePages(),
	]);
	return { pages, reviewDue, status, q };
};

export const actions: Actions = {
	create: async ({ locals }) => {
		const actor = requireContentStaff(locals, { need: 'draft' });
		try {
			const id = await createDraft(actor);
			throw redirect(303, `/admin/content/${id}`);
		} catch (e) {
			if (e instanceof ContentPermissionError) return fail(403, { message: e.message });
			throw e;
		}
	},
};
