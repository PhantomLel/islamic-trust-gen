/**
 * AA-W1 — one app, two public hosts, plus the freemuslimwill.org redirect.
 * Canonical hosts are www (D9). `dev` (localhost) behaves as MLP so local
 * preview of `/mcdaniel/*` stays on this machine.
 */
import { mcdanielOrigin, mlpOrigin } from '$lib/config';

export type HostSite = 'mlp' | 'mep' | 'freewill' | 'dev';
export type PublicSiteId = 'mlp' | 'mcdaniel';

const MLP_APEX = 'muslimlegacyplanning.com';
const MEP_APEX = 'mcdanielestateplanning.com';
const FREEWILL_APEX = 'freemuslimwill.org';

/** Served by one shared handler that inspects the host, so they are never prefixed. */
const SHARED_ROOT_PATHS = new Set(['/robots.txt', '/sitemap.xml']);

export function hostSite(hostname: string): HostSite {
	const host = hostname.toLowerCase();
	if (host === 'localhost' || host === '127.0.0.1') return 'dev';
	if (host === MLP_APEX || host === `www.${MLP_APEX}`) return 'mlp';
	if (host === MEP_APEX || host === `www.${MEP_APEX}`) return 'mep';
	if (host === FREEWILL_APEX || host === `www.${FREEWILL_APEX}`) return 'freewill';
	return 'mlp';
}

/** App and tool routes that exist only on MLP (AA-W1.3). Prefix match. */
export const MEP_APP_PATHS = [
	'/login',
	'/signup',
	'/trust',
	'/create-trust',
	'/dashboard',
	'/admin',
	'/make-your-trust-work',
	'/free-islamic-will',
	'/inheritance-calculator',
	'/which-plan',
	'/plans',
	'/answers',
	'/videos',
	'/consultation',
	'/unsubscribe',
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function redirectFor(url: URL, method: string): { status: 301; location: string } | null {
	const verb = method.toUpperCase();
	if (verb !== 'GET' && verb !== 'HEAD') return null;
	if (matchesPrefix(url.pathname, '/api')) return null;

	const site = hostSite(url.hostname);
	const search = url.search;
	const host = url.hostname.toLowerCase();

	if (site === 'freewill') {
		return { status: 301, location: `${mlpOrigin}/free-islamic-will${search}` };
	}

	if (host === MLP_APEX) {
		return { status: 301, location: `https://www.${MLP_APEX}${url.pathname}${search}` };
	}
	if (host === MEP_APEX) {
		return { status: 301, location: `https://www.${MEP_APEX}${url.pathname}${search}` };
	}

	if (site === 'mep' && MEP_APP_PATHS.some((prefix) => matchesPrefix(url.pathname, prefix))) {
		return { status: 301, location: `${mlpOrigin}${url.pathname}${search}` };
	}

	if (site === 'mlp' && (url.pathname === '/mcdaniel' || url.pathname.startsWith('/mcdaniel/'))) {
		const stripped = url.pathname.slice('/mcdaniel'.length) || '/';
		return { status: 301, location: `${mcdanielOrigin}${stripped}${search}` };
	}

	return null;
}

/** Internal path for the MEP host, or undefined when the request stays on the public path. */
export function rerouteFor(url: URL): string | undefined {
	if (hostSite(url.hostname) !== 'mep') return undefined;
	if (SHARED_ROOT_PATHS.has(url.pathname)) return undefined;
	return url.pathname === '/' ? '/mcdaniel' : `/mcdaniel${url.pathname}`;
}

/** Path as the visitor sees it on the owning site (no internal `/mcdaniel` prefix). */
export function publicPathFor(url: URL): { site: PublicSiteId; path: string } {
	const host = hostSite(url.hostname);
	let path = url.pathname || '/';
	let site: PublicSiteId = host === 'mep' ? 'mcdaniel' : 'mlp';
	if (site === 'mlp' && (path === '/mcdaniel' || path.startsWith('/mcdaniel/'))) {
		site = 'mcdaniel';
		path = path.slice('/mcdaniel'.length) || '/';
	}
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	if (!path) path = '/';
	return { site, path };
}
