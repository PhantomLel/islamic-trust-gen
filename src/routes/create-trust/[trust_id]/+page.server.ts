import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/config';
import { isQuestionResponseAnswered } from '$lib/question-response-helpers';
import { createInvoiceWithEmail } from '$lib/server/invoice';
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
		userEmail: locals.user.email,
	};
};

export const actions: Actions = {
	screen: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const data = await request.formData();
		const eligible = data.get('eligible') === 'true';
		const countyRaw = data.get('county');
		const county = typeof countyRaw === 'string' ? countyRaw.trim() : '';

		if (!county) throw error(400, 'County is required');

		await db
			.update(trust)
			.set({ isEligible: eligible, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		await db
			.update(user)
			.set({ county, updatedAt: new Date() })
			.where(eq(user.id, locals.user.id));

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
		const answeredIds = new Set(parsed.filter((r) => isQuestionResponseAnswered(r.response)).map((r) => r.id));
		const allAnswered = questions.every((q) => answeredIds.has(q.id));

		const updates: Record<string, unknown> = { responses: parsed, updatedAt: new Date() };
		updates.complete = allAnswered; // TODO check this out make sure no bug

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

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
			columns: {
				responses: true
			}
		});

		if (!currentTrust) throw error(404, 'Trust not found');

		await db
			.update(trust)
			.set({ complete: true, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		const responses = (currentTrust.responses ?? []) as { id: string; response: unknown }[];
		const requestedDeedRetrieval = responses.find((r) => r.id === 'house-deed-retrieval')?.response === true;

		await createInvoiceWithEmail({
			userId: locals.user.id,
			name: 'Trust Preparation Fee',
			description: 'Base fee for trust preparation and document drafting',
			amount: 799,
		});

		if (requestedDeedRetrieval) {
			await createInvoiceWithEmail({
				userId: locals.user.id,
				name: 'Deed Retrieval Fee',
				description: 'Fee for retrieving your existing house deed',
				amount: 29,
			});
		}

		return { completed: true };
	},
};
