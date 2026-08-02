import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
	getEntryDetail,
	updateEntryGovernanceStatus,
	updateEntryUserFacingFields,
	satisfyPublicationGate,
	listEntryGates,
	approveEntry,
} from '$lib/server/help/governance';

export const load: PageServerLoad = async ({ params }) => {
	const sourceId = decodeURIComponent(params.sourceId);
	const entry = await getEntryDetail(sourceId);
	if (!entry) throw error(404, 'Entry not found');
	const gates = await listEntryGates(sourceId);
	return { entry, gates, sourceId };
};

export const actions: Actions = {
	approve: async ({ params, locals }) => {
		try {
			await approveEntry(decodeURIComponent(params.sourceId), locals.user!.id);
			return { approved: true };
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : 'Approve failed' });
		}
	},
	setStatus: async ({ request, params, locals }) => {
		const status = String((await request.formData()).get('status') ?? '');
		if (!['approved', 'needs_revision', 'disabled'].includes(status)) return fail(400, { message: 'Invalid status' });
		await updateEntryGovernanceStatus(
			decodeURIComponent(params.sourceId),
			status as 'approved' | 'needs_revision' | 'disabled',
			locals.user!.id,
		);
		return { saved: true };
	},
	saveFields: async ({ request, params, locals }) => {
		const form = await request.formData();
		await updateEntryUserFacingFields(
			decodeURIComponent(params.sourceId),
			{
				question: String(form.get('question') ?? ''),
				userFacingAnswer: String(form.get('userFacingAnswer') ?? ''),
				goodTreeAppMeaning: String(form.get('goodTreeAppMeaning') ?? ''),
				userNextStep: String(form.get('userNextStep') ?? ''),
			},
			locals.user!.id,
		);
		return { saved: true };
	},
	satisfyGate: async ({ request, params, locals }) => {
		const form = await request.formData();
		const gateType = String(form.get('gateType') ?? '');
		const note = String(form.get('note') ?? '');
		await satisfyPublicationGate(decodeURIComponent(params.sourceId), gateType, locals.user!.id, note);
		return { gateSatisfied: true };
	},
};
