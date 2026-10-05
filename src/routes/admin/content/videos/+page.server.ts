import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { createVideoDraft, listVideosForAdmin } from '$lib/server/content/videos';

export const load: PageServerLoad = async ({ locals }) => {
	requireContentStaff(locals);
	return { videos: await listVideosForAdmin() };
};

export const actions: Actions = {
	create: async ({ locals }) => {
		const actor = requireContentStaff(locals, { need: 'draft' });
		const id = await createVideoDraft(actor);
		throw redirect(303, `/admin/content/videos/${id}`);
	},
};
