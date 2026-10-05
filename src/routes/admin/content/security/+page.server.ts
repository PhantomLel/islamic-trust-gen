import type { PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';

export const load: PageServerLoad = async ({ locals }) => {
	requireContentStaff(locals, { allowWithout2fa: true });
	return {
		twoFactorEnabled: !!(locals.user as { twoFactorEnabled?: boolean | null } | undefined)?.twoFactorEnabled,
	};
};
