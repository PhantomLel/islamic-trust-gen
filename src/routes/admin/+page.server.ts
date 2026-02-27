import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trusts = await db.query.trust.findMany({
		with: { user: true },
		orderBy: [desc(trust.createdAt)],
	});

	return {
		trusts: trusts.map((t) => ({
			id: t.id,
			createdAt: t.createdAt.toISOString(),
			updatedAt: t.updatedAt.toISOString(),
			joint: t.joint,
			complete: t.complete,
			isEligible: t.isEligible,
			responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
			user: {
				id: t.user.id,
				name: t.user.name,
				email: t.user.email,
				requestedConsultation: t.user.requestedConsultationAt != null,
			},
		})),
	};
};
