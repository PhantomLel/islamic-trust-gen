import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

function safeRedirectPath(path: string | null | undefined): string | null {
	if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
	return path;
}

function resolveCallbackURL(url: URL, data: FormData): string {
	const fromForm = data.get('redirectTo');
	const fromQuery = url.searchParams.get('redirectTo');
	return (
		safeRedirectPath(typeof fromForm === 'string' ? fromForm : null) ??
		safeRedirectPath(fromQuery) ??
		'/dashboard'
	);
}

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		if (event.locals.user.role === "admin") {
			return redirect(302, '/admin');
		}
		const redirectTo = safeRedirectPath(event.url.searchParams.get('redirectTo'));
		if (redirectTo) {
			return redirect(302, redirectTo);
		}
		return redirect(302, '/create-trust');
	}
	return {};
};

export const actions: Actions = {
	signInMagicLink: async ({ request, url }) => {
		const data = await request.formData();
		const emailRaw = data.get('email');
		if (typeof emailRaw !== 'string' || !emailRaw.trim()) {
			return fail(400, { message: 'Email is required' });
		}
		const email = emailRaw.trim();

		const [row] = await db
			.select({ id: user.id })
			.from(user)
			.where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
			.limit(1);

		if (!row) {
			return { needsSignup: true as const, email };
		}

		try {
			await auth.api.signInMagicLink({
				body: {
					email,
					callbackURL: resolveCallbackURL(url, data),
				},
				headers: request.headers,
			});
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: e.message || 'Something went wrong. Please try again.' });
			}
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		return { sent: true as const };
	},
};
