import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user, TrustStatus } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const targetUser = await db.query.user.findFirst({
		where: eq(user.id, params.id),
	});

	if (!targetUser) throw error(404, 'User not found');

	const trusts = await db.query.trust.findMany({
		where: eq(trust.userId, params.id),
		orderBy: [desc(trust.createdAt)],
	});
	const hasPaid = trusts.some((t) => t.selectedPlan !== null);

	return {
		currentAdminId: locals.user.id,
		targetUser: {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			createdAt: targetUser.createdAt.toISOString(),
			role: targetUser.role,
			requestedConsultation: targetUser.requestedConsultationAt != null,
			paid: hasPaid,
		},
		trusts: trusts.map((t) => ({
			id: t.id,
			createdAt: t.createdAt.toISOString(),
			updatedAt: t.updatedAt.toISOString(),
			joint: t.joint,
			complete: t.complete,
			isEligible: t.isEligible,
			awaitingPayment: t.status === TrustStatus.AwaitingPayment && t.selectedPlan === null,
			responses: (t.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
		})),
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const responses = JSON.parse(formData.get('responses') as string);

		await db.update(trust).set({
			responses,
			updatedAt: new Date(),
		}).where(eq(trust.id, trustId));

		return { saved: true };
	},

	toggleEligibility: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const isEligible = formData.get('isEligible') === 'true';

		await db.update(trust).set({
			isEligible,
			updatedAt: new Date(),
		}).where(eq(trust.id, trustId));

		return { toggled: true };
	},

	toggleConsultation: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const requested = formData.get('requested') === 'true';

		await db.update(user).set({
			requestedConsultationAt: requested ? new Date() : null,
		}).where(eq(user.id, userId));

		return { toggled: true };
	},

	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

		const formData = await request.formData();
		const userId = formData.get('userId');
		if (typeof userId !== 'string' || !userId.trim()) {
			return fail(400, { message: 'Missing user ID' });
		}
		if (locals.user.id === userId) {
			return fail(400, { message: 'You cannot delete your own account.' });
		}

		const target = await db.query.user.findFirst({
			where: eq(user.id, userId),
		});
		if (!target) {
			return fail(404, { message: 'User not found.' });
		}
		if (target.role === 'admin') {
			return fail(400, { message: 'Admin accounts cannot be deleted from this screen.' });
		}

		await db.delete(user).where(eq(user.id, userId));
		redirect(303, '/admin');
	},
};
