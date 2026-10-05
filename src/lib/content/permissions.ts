/**
 * Content-platform permissions (spec v3 §7 "Roles").
 *
 * - `content_author`: create and edit drafts, submit for review. Cannot publish, unpublish or schedule.
 * - `content_publisher`: everything the author can, plus publish, unpublish, schedule, categories, redirects, featured video.
 * - `admin`: may publish. `admin` is also the role that sees client matters; authors and publishers do not.
 *
 * Server actions call `assertCan` — never rely on the UI hiding a button.
 */
export type ContentAction =
	| 'view'
	| 'draft'
	| 'submit'
	| 'publish'
	| 'unpublish'
	| 'schedule'
	| 'manage_taxonomy'
	| 'manage_team';

const MATRIX: Record<string, ContentAction[]> = {
	content_author: ['view', 'draft', 'submit'],
	content_publisher: ['view', 'draft', 'submit', 'publish', 'unpublish', 'schedule', 'manage_taxonomy'],
	admin: ['view', 'draft', 'submit', 'publish', 'unpublish', 'schedule', 'manage_taxonomy', 'manage_team'],
};

/** Roles are stored as a comma-separated string by better-auth. */
export function rolesOf(role: string | null | undefined): string[] {
	return (role ?? '')
		.split(',')
		.map((r) => r.trim())
		.filter(Boolean);
}

export function can(role: string | null | undefined, action: ContentAction): boolean {
	return rolesOf(role).some((r) => MATRIX[r]?.includes(action));
}

export class ContentPermissionError extends Error {
	constructor(action: ContentAction) {
		super(`Not allowed to ${action.replace('_', ' ')}.`);
		this.name = 'ContentPermissionError';
	}
}

export function assertCan(role: string | null | undefined, action: ContentAction): void {
	if (!can(role, action)) throw new ContentPermissionError(action);
}

/** True for the two roles that must use two-factor sign-in and a 12-hour idle session. */
export function isContentStaffRole(role: string | null | undefined): boolean {
	return rolesOf(role).some((r) => r === 'content_author' || r === 'content_publisher');
}

export const CONTENT_SESSION_IDLE_MS = 12 * 60 * 60 * 1000;

/** Content roles re-authenticate after 12 hours without activity. */
export function contentSessionIdleExpired(
	role: string | null | undefined,
	lastActivity: Date | string | number | null | undefined,
	now: number = Date.now(),
): boolean {
	if (!isContentStaffRole(role)) return false;
	if (lastActivity == null) return true;
	const t = new Date(lastActivity).getTime();
	if (Number.isNaN(t)) return true;
	return now - t > CONTENT_SESSION_IDLE_MS;
}

/**
 * Content staff may only start a session with a password sign-in, which two-factor
 * then challenges, or by completing that challenge. Magic links and social sign-in
 * do not pass through the second factor, so they are refused for these roles.
 */
export function contentSessionPathAllowed(path: string | null | undefined): boolean {
	if (!path) return false;
	return path.startsWith('/sign-in/email') || path.startsWith('/two-factor/');
}
