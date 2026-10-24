const JOIN_PREFIXES = ['/j/', '/w/', '/s/', '/my/', '/wc/'] as const;

/**
 * D14: https only, host zoom.us or a subdomain, join path /j/, /w/, /s/, /my/, or /wc/.
 * zoom.com, zoomgov.com, and every other host are rejected.
 */
export function isZoomJoinUrl(input: string | null | undefined): boolean {
	const raw = (input ?? '').trim();
	if (!raw || raw.length > 2000) return false;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return false;
	}
	if (url.protocol !== 'https:') return false;
	if (url.username || url.password) return false;
	if (url.port && url.port !== '443') return false;
	const host = url.hostname.toLowerCase();
	if (host !== 'zoom.us' && !host.endsWith('.zoom.us')) return false;
	const path = url.pathname;
	return JOIN_PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}
