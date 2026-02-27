import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trustId = parseInt(params.trust_id, 10);
	if (isNaN(trustId)) throw error(404, 'Not found');

	const existing = await db.query.trust.findFirst({
		where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
	});

	if (!existing) throw error(404, 'Not found');
	if (existing.isEligible !== false) throw redirect(302, `/create-trust/${trustId}`);

	return {
		trustId: existing.id,
	};
};

export const actions: Actions = {
	requestConsultation: async ({ locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		await db.update(user).set({ requestedConsultationAt: new Date()}).where(eq(user.id, locals.user.id));
		return { success: true };
	},
};