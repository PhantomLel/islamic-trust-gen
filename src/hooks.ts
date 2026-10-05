import type { Reroute } from '@sveltejs/kit';

/**
 * mcdanielestateplanning.com is served from this same app: any request hitting
 * that hostname is internally rerouted to the /mcdaniel route tree, so the law
 * firm site lives at the root of its own domain without a separate deployment.
 */
const MCDANIEL_HOSTS = new Set(['mcdanielestateplanning.com', 'www.mcdanielestateplanning.com']);

/** Served by one shared handler that inspects the host, so they are never prefixed. */
const SHARED_ROOT_PATHS = new Set(['/robots.txt', '/sitemap.xml']);

export const reroute: Reroute = ({ url }) => {
	if (MCDANIEL_HOSTS.has(url.hostname) && !SHARED_ROOT_PATHS.has(url.pathname)) {
		return url.pathname === '/' ? '/mcdaniel' : `/mcdaniel${url.pathname}`;
	}
};
