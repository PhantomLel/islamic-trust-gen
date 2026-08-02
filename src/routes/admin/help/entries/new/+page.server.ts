import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createKbEntry } from '$lib/server/help/governance';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const question = String(form.get('question') ?? '').trim();
		const userFacingAnswer = String(form.get('userFacingAnswer') ?? '').trim();
		if (!question || !userFacingAnswer) {
			return fail(400, { message: 'Question and answer are required' });
		}
		const alsoAnswers = String(form.get('alsoAnswers') ?? '')
			.split(/[,;\n]/)
			.map((s) => s.trim())
			.filter(Boolean);
		const entryId = await createKbEntry(
			{
				question,
				userFacingAnswer,
				category: String(form.get('category') ?? '') || null,
				goodTreeAppMeaning: String(form.get('goodTreeAppMeaning') ?? '') || null,
				userNextStep: String(form.get('userNextStep') ?? '') || null,
				alsoAnswers,
			},
			locals.user!.id,
		);
		throw redirect(303, `/admin/help/entries/${entryId}`);
	},
};
