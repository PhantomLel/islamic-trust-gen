import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const FREE_WILL_REDIRECT_HOSTS = new Set(['freemuslimwill.org', 'www.freemuslimwill.org']);
const FREE_WILL_URL = 'https://www.muslimlegacyplanning.com/free-islamic-will';

const handleFreeWillRedirect: Handle = async ({ event, resolve }) => {
	if (FREE_WILL_REDIRECT_HOSTS.has(event.url.hostname)) {
		return Response.redirect(FREE_WILL_URL, 308);
	}
	return resolve(event);
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user as App.Locals['user'];
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleFreeWillRedirect, handleBetterAuth);
