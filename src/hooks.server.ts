import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { session as sessionTable } from '$lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';
import { contentSessionIdleExpired } from '$lib/content/permissions';
import { findRedirectForPath } from '$lib/server/content/redirects';
import {
	ATTRIBUTION_COOKIE,
	ATTRIBUTION_COOKIE_MAX_AGE_SECONDS,
	ATTRIBUTION_QUERY_PARAM,
	resolveAttributionCode
} from '$lib/attribution';

const FREE_WILL_REDIRECT_HOSTS = new Set(['freemuslimwill.org', 'www.freemuslimwill.org']);
const FREE_WILL_URL = 'https://www.muslimlegacyplanning.com/free-islamic-will';

const handleFreeWillRedirect: Handle = async ({ event, resolve }) => {
	if (FREE_WILL_REDIRECT_HOSTS.has(event.url.hostname)) {
		return Response.redirect(FREE_WILL_URL, 308);
	}
	return resolve(event);
};

/**
 * First-party source capture (spec v3 §5.1). On a page request, read the campaign
 * parameter, resolve it to a short code, and keep only the code in a first-party
 * cookie. First touch wins. The raw query string is never stored.
 */
const handleAttribution: Handle = async ({ event, resolve }) => {
	if (event.request.method === 'GET' && !event.cookies.get(ATTRIBUTION_COOKIE)) {
		const code = resolveAttributionCode(event.url.searchParams.get(ATTRIBUTION_QUERY_PARAM));
		if (code) {
			event.cookies.set(ATTRIBUTION_COOKIE, code, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: event.url.protocol === 'https:',
				maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SECONDS
			});
		}
	}
	return resolve(event);
};

/**
 * Redirects the publisher has set up (for example after a slug change). Only the content
 * library paths are checked, so ordinary pages never pay for the lookup.
 */
const handleContentRedirect: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (event.request.method === 'GET' && (path.startsWith('/answers/') || path.startsWith('/videos/'))) {
		try {
			const hit = await findRedirectForPath(path);
			if (hit) {
				return new Response(null, { status: hit.statusCode, headers: { location: hit.toPath } });
			}
		} catch (err) {
			console.error('[content-redirect] lookup failed', err);
		}
	}
	return resolve(event);
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		// Content staff re-authenticate after 12 idle hours (spec v3 §7). `updatedAt` is the
		// session's last refresh, which better-auth bumps every few minutes of activity.
		if (contentSessionIdleExpired(session.user.role, session.session.updatedAt)) {
			await db.delete(sessionTable).where(eq(sessionTable.token, session.session.token));
		} else {
			event.locals.session = session.session;
			event.locals.user = session.user as App.Locals['user'];
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleFreeWillRedirect, handleAttribution, handleContentRedirect, handleBetterAuth);
