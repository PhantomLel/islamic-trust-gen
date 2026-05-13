import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const trusts = await db.query.trust.findMany({
		with: { user: true },
		orderBy: [desc(trust.createdAt)],
	});

	return {
		trusts: trusts
			.filter((t) => t.user.role !== 'admin')
			.map((t) => ({
				id: t.id,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString(),
				joint: t.joint,
				complete: t.complete,
				approved: t.approved,
				isEligible: t.isEligible,
				businessOwnership:
					t.screeningAnswers == null
						? null
						: typeof t.screeningAnswers.business_ownership === 'boolean'
							? t.screeningAnswers.business_ownership
							: null,
				status: t.status,
				selectedPlan: t.selectedPlan,
				deedRetrievalRequested: t.deedRetrievalRequested,
				customPrice: t.customPrice,
				responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
				user: {
					id: t.user.id,
					name: t.user.name,
					email: t.user.email,
				},
			})),
	};
};

export const actions: Actions = {
	updatePrice: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = parseInt(formData.get('trustId') as string, 10);
		const price = parseInt(formData.get('price') as string, 10);

		if (isNaN(trustId)) throw error(400, 'Invalid trust ID');
		if (isNaN(price) || price < 0) throw error(400, 'Invalid price');

		const existing = await db.query.trust.findFirst({
			where: eq(trust.id, trustId),
			columns: { id: true },
		});

		if (!existing) throw error(404, 'Trust not found');

		await db
			.update(trust)
			.set({ customPrice: price })
			.where(eq(trust.id, trustId));

		return { updated: true };
	},
};
