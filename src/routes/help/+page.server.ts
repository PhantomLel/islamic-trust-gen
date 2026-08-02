import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadHelpBlockedStepsForUser } from '$lib/server/help/escalate';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return {
		helpBlockedSteps: await loadHelpBlockedStepsForUser(locals.user.id, 'help_center'),
	};
};
