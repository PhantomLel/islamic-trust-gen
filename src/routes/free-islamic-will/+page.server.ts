import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	claimPendingFreeWills,
	getLatestFreeWill,
	savePendingFreeWill,
	saveFreeWillForUser,
	type SaveFreeWillInput,
} from '$lib/server/freeWill';
import type { WillResponse } from '$lib/free-will/config';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null, savedWill: null };
	}

	// Pull any pre-signup submission into this account.
	await claimPendingFreeWills(locals.user.id, locals.user.email);
	const latest = await getLatestFreeWill(locals.user.id);

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
		},
		savedWill: latest
			? { id: latest.id, complete: latest.complete, recommendedPlan: latest.recommendedPlan }
			: null,
	};
};

function parseSaveInput(form: FormData): { name: string; email: string; input: SaveFreeWillInput } {
	const responsesRaw = form.get('responses');
	const tagsRaw = form.get('tags');
	if (typeof responsesRaw !== 'string') throw error(400, 'Missing responses');

	let responses: WillResponse[];
	let tags: string[];
	try {
		responses = JSON.parse(responsesRaw) as WillResponse[];
		tags = typeof tagsRaw === 'string' ? (JSON.parse(tagsRaw) as string[]) : [];
	} catch {
		throw error(400, 'Invalid payload');
	}
	if (!Array.isArray(responses)) throw error(400, 'Invalid responses');

	const state = typeof form.get('state') === 'string' ? (form.get('state') as string) : null;
	const legalMode = typeof form.get('legalMode') === 'string' ? (form.get('legalMode') as string) : 'self-help';
	const recommendedPlan =
		typeof form.get('recommendedPlan') === 'string' && form.get('recommendedPlan')
			? (form.get('recommendedPlan') as string)
			: null;

	return {
		name: typeof form.get('name') === 'string' ? (form.get('name') as string).trim() : '',
		email: typeof form.get('email') === 'string' ? (form.get('email') as string).trim() : '',
		input: {
			responses,
			state,
			legalMode,
			tags: Array.isArray(tags) ? tags : [],
			recommendedPlan,
			reviewReminders: form.get('reviewReminders') === 'true',
			attorneyAvailability: form.get('attorneyAvailability') === 'true',
		},
	};
}

export const actions: Actions = {
	/** Persist directly to the signed-in user's account. */
	saveAuthed: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Not authenticated');
		const { input } = parseSaveInput(await request.formData());
		await saveFreeWillForUser(locals.user.id, locals.user.name, locals.user.email, input);
		return { saved: true };
	},

	/** Persist a pending submission keyed by email; claimed after the user signs in. */
	savePending: async ({ request }) => {
		const { name, email, input } = parseSaveInput(await request.formData());
		if (!email || !email.includes('@')) throw error(400, 'A valid email is required');
		if (!name) throw error(400, 'A name is required');
		await savePendingFreeWill(name, email, input);
		return { saved: true };
	},
};
