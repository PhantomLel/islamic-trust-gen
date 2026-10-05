import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { deleteRedirect, listRedirects, upsertRedirect } from '$lib/server/content/taxonomy';

export const load: PageServerLoad = async ({ locals }) => {
	requireContentStaff(locals, { need: 'manage_taxonomy' });
	return { redirects: await listRedirects() };
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
		const f = await request.formData();
		const r = await upsertRedirect({ fromPath: String(f.get('from') ?? ''), toPath: String(f.get('to') ?? ''), statusCode: Number(f.get('status') ?? 301) }, actor.id);
		return r.error ? fail(400, { message: r.error }) : { ok: true };
	},
	delete: async ({ locals, request }) => {
		const actor = requireContentStaff(locals, { need: 'manage_taxonomy' });
		const f = await request.formData();
		await deleteRedirect(Number(f.get('id')), actor.id);
		return { ok: true };
	},
};
