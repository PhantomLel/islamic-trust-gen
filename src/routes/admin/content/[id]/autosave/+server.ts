import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { savePage } from '$lib/server/content/pages';
import { parsePageForm } from '$lib/server/content/parse';
import { ContentPermissionError } from '$lib/content/permissions';

/**
 * Autosave writes a revision. It never changes the status and never touches a published
 * page's slug: a slug change on a published page must go through the explicit Save, which
 * asks about the redirect.
 */
export const POST: RequestHandler = async ({ locals, params, request }) => {
	try {
		const actor = requireContentStaff(locals, { need: 'draft' });
		const form = await request.formData();
		const res = await savePage(Number(params.id), parsePageForm(form), actor);
		if (!res.ok) return json({ ok: false, needsSave: 'slugChangePrompt' in res }, { status: 200 });
		return json({ ok: true, at: new Date().toISOString() });
	} catch (e) {
		if (e instanceof ContentPermissionError) return json({ ok: false, error: e.message }, { status: 403 });
		throw e;
	}
};
