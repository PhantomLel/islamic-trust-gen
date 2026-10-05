/**
 * Guard for any future public-page analytics (spec v3 §1.2, §5.3).
 *
 * The default is OFF. No analytics, pixel, or tag manager is implemented in this
 * app. If one is added later it must be loaded only when
 * `isAnalyticsAllowedPath(pathname)` returns true.
 *
 * Spec 5.3 says to send the analytics configuration to Leonard for approval
 * before it goes live, so `PUBLIC_ANALYTICS_ALLOWED_PREFIXES` ships empty.
 */

/** Path prefixes where public-page analytics may run. Empty until approved. */
export const PUBLIC_ANALYTICS_ALLOWED_PREFIXES: readonly string[] = [];

/**
 * Path prefixes where no advertising, analytics, or session-replay code may ever
 * run, even if one is added to the allowlist by mistake (spec 1.2).
 */
export const SENSITIVE_PATH_PREFIXES: readonly string[] = [
	'/free-islamic-will',
	'/create-trust',
	'/consultation',
	'/dashboard',
	'/make-your-trust-work',
	'/login',
	'/signup',
	'/admin',
	'/help',
	'/api',
	'/unsubscribe',
	'/demo'
];

function matchesPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
}

export function isSensitivePath(pathname: string): boolean {
	return SENSITIVE_PATH_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isAnalyticsAllowedPath(
	pathname: string,
	allowlist: readonly string[] = PUBLIC_ANALYTICS_ALLOWED_PREFIXES
): boolean {
	if (isSensitivePath(pathname)) return false;
	return allowlist.some((p) => matchesPrefix(pathname, p));
}
