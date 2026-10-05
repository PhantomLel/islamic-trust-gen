/**
 * First-party source capture (spec v3 §5.1).
 *
 * On arrival we read the campaign parameter, look it up in `ATTRIBUTION_CODES`,
 * and keep only the short code. The raw tracking string is discarded: it is not
 * stored on a lead or a matter, and it is not sent to any third party. Reporting
 * outside the app is aggregate counts only (spec 5.2).
 *
 * The map is SHIPPED EMPTY. The code list comes from Leonard (Appendix A item 5
 * of the spec was not delivered). Add entries as `'incoming-campaign-value': 'code'`.
 * Until then no code is ever stored.
 */

/** incoming campaign value (lower-case) → short code. Empty until Leonard supplies the list. */
export const ATTRIBUTION_CODES: Readonly<Record<string, string>> = {};

/** The query parameter we read the campaign value from. */
export const ATTRIBUTION_QUERY_PARAM = 'utm_campaign';

/** First-party cookie that carries the code from arrival to booking and matter creation. */
export const ATTRIBUTION_COOKIE = 'mlp_src';

export const ATTRIBUTION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/** Resolve an incoming campaign value to a short code, or null when it is not in the map. */
export function resolveAttributionCode(
	campaign: string | null | undefined,
	codes: Readonly<Record<string, string>> = ATTRIBUTION_CODES
): string | null {
	const key = (campaign ?? '').trim().toLowerCase();
	if (!key) return null;
	if (Object.hasOwn(codes, key)) return codes[key]!;
	// A share link carries the short code itself; accept it when it is a known code.
	return Object.values(codes).find((c) => c.toLowerCase() === key) ?? null;
}

/**
 * Accept a stored code (from the cookie) only if it is still a value in the map.
 * Anything else, including a hand-edited cookie, resolves to null.
 */
export function validateAttributionCode(
	code: string | null | undefined,
	codes: Readonly<Record<string, string>> = ATTRIBUTION_CODES
): string | null {
	const c = (code ?? '').trim();
	if (!c) return null;
	return Object.values(codes).includes(c) ? c : null;
}

/** Append the attribution parameter to a share link (plan Phase 9). No-ops without a code. */
export function withAttributionParam(url: string, code: string | null): string {
	if (!code) return url;
	const u = new URL(url);
	u.searchParams.set(ATTRIBUTION_QUERY_PARAM, code);
	return u.toString();
}

/** Read the validated source code off a request's cookies (server side). */
export function attributionCodeFromCookies(cookies: { get(name: string): string | undefined }): string | null {
	return validateAttributionCode(cookies.get(ATTRIBUTION_COOKIE));
}
