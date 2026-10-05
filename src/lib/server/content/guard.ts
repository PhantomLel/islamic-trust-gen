import { error, redirect } from '@sveltejs/kit';
import { can, isContentStaffRole, type ContentAction } from '$lib/content/permissions';
import type { Actor } from './pages';

type LocalsLike = { user?: { id: string; role?: string | null; twoFactorEnabled?: boolean | null } | null };

/**
 * Gate for every route under /admin/content. Admins and content staff only. Content
 * staff must have enrolled two-factor before they can see anything else; admins are
 * unaffected (they use their normal sign-in).
 */
export function requireContentStaff(locals: LocalsLike, opts: { allowWithout2fa?: boolean; need?: ContentAction } = {}): Actor {
	const u = locals.user;
	if (!u) throw redirect(302, '/login/staff');
	if (!can(u.role, opts.need ?? 'view')) throw error(403, 'Forbidden');
	if (isContentStaffRole(u.role) && !u.twoFactorEnabled && !opts.allowWithout2fa) {
		throw redirect(302, '/admin/content/security');
	}
	return { id: u.id, role: u.role };
}
