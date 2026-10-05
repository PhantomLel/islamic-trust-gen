import type { LayoutServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { can } from '$lib/content/permissions';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// The security page is where staff enrol two-factor, so it must load without it.
	const onSecurity = url.pathname.startsWith('/admin/content/security');
	const actor = requireContentStaff(locals, { allowWithout2fa: onSecurity });
	return {
		staff: {
			name: locals.user?.name ?? '',
			role: actor.role ?? '',
			canPublish: can(actor.role, 'publish'),
			canManageTaxonomy: can(actor.role, 'manage_taxonomy'),
			canManageTeam: can(actor.role, 'manage_team'),
			twoFactorEnabled: !!(locals.user as { twoFactorEnabled?: boolean | null } | undefined)?.twoFactorEnabled,
		},
	};
};
