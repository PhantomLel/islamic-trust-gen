import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { attributionCodeFromCookies } from '$lib/attribution';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, '/login');

	const existing = await db.query.trust.findFirst({
		where: eq(trust.userId, locals.user.id),
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	});

	if (existing) {
		throw redirect(302, '/dashboard');
	}

	const [newTrust] = await db.insert(trust).values({
		userId: locals.user.id,
		// Short first-party source code from the arrival cookie (spec v3 §5.1). Never a raw campaign string.
		attributionCode: attributionCodeFromCookies(cookies),
	}).returning({ id: trust.id });

	throw redirect(302, `/create-trust/${newTrust.id}`);
};
