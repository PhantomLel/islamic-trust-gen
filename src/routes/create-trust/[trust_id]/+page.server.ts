import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/config';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trustId = parseInt(params.trust_id, 10);
	if (isNaN(trustId)) throw error(404, 'Trust not found');

	const existing = await db.query.trust.findFirst({
		where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
	});

	if (!existing) throw error(404, 'Trust not found');
	if (existing.isEligible === false) throw redirect(302, `/consultation/${trustId}`);

	return {
		trust: {
			id: existing.id,
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			responses: (existing.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
		},
		userName: locals.user.name,
	};
};

export const actions: Actions = {
	screen: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const data = await request.formData();
		const eligible = data.get('eligible') === 'true';

		await db
			.update(trust)
			.set({ isEligible: eligible, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { screened: true, eligible };
	},

	select: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const data = await request.formData();
		const isJoint = data.get('joint') === 'true';

		await db
			.update(trust)
			.set({ joint: isJoint, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { selected: true };
	},

	save: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const formData = await request.formData();
		const responsesRaw = formData.get('responses');
		if (typeof responsesRaw !== 'string') throw error(400, 'Invalid data');

		const parsed = JSON.parse(responsesRaw) as { id: string; response: unknown }[];
		const answeredIds = new Set(parsed.filter((r) => r.response != null && r.response !== '').map((r) => r.id));
		const allAnswered = questions.every((q) => answeredIds.has(q.id));

		const updates: Record<string, unknown> = { responses: parsed, updatedAt: new Date() };
		if (!allAnswered) updates.complete = false;

		await db
			.update(trust)
			.set(updates)
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { saved: true };
	},

	complete: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		await db
			.update(trust)
			.set({ complete: true, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { completed: true };
	},
};
