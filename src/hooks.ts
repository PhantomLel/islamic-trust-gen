import type { Reroute } from '@sveltejs/kit';

/**
 * mcdanielestateplanning.com is served from this same app: any request hitting
 * that hostname is internally rerouted to the /mcdaniel route tree, so the law
 * firm site lives at the root of its own domain without a separate deployment.
 *
 * freemuslimwill.org serves the free will generator at its root URL.
 */
const MCDANIEL_HOSTS = new Set(['mcdanielestateplanning.com', 'www.mcdanielestateplanning.com']);
const FREE_WILL_HOSTS = new Set(['freemuslimwill.org', 'www.freemuslimwill.org']);

export const reroute: Reroute = ({ url }) => {
	if (MCDANIEL_HOSTS.has(url.hostname)) {
		return url.pathname === '/' ? '/mcdaniel' : `/mcdaniel${url.pathname}`;
	}
	if (FREE_WILL_HOSTS.has(url.hostname) && url.pathname === '/') {
		return '/free-islamic-will';
	}
};
