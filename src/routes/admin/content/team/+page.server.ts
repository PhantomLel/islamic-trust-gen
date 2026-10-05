import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireContentStaff } from '$lib/server/content/guard';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireContentStaff(locals, { need: 'manage_team' });
	const staff = await db
		.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
		.from(user)
		.orderBy(desc(user.createdAt));
	return {
		staff: staff.filter((u) => (u.role ?? '').includes('content_author') || (u.role ?? '').includes('content_publisher')),
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		requireContentStaff(locals, { need: 'manage_team' });
		const f = await request.formData();
		const email = String(f.get('email') ?? '').trim();
		const name = String(f.get('name') ?? '').trim();
		const password = String(f.get('password') ?? '');
		const role = String(f.get('role') ?? '');
		if (!email || !password || password.length < 12) {
			return fail(400, { message: 'Email and a password of at least 12 characters are required.' });
		}
		if (role !== 'content_author' && role !== 'content_publisher') {
			return fail(400, { message: 'Choose author or publisher.' });
		}
		try {
			await auth.api.createUser({
				headers: request.headers,
				body: { email, password, name: name || email, role, data: {} },
			});
		} catch (e) {
			console.error('[content/team] createUser failed', e);
			return fail(400, { message: 'Could not create that account. It may already exist.' });
		}
		return { created: true };
	},
};
