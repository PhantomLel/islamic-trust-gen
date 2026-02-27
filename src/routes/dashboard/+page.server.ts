import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { questions } from '$lib/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	if (locals.user.role === 'admin') throw redirect(302, '/admin');

	const existing = await db.query.trust.findFirst({
		where: eq(trust.userId, locals.user.id),
		orderBy: (t, { desc }) => [desc(t.createdAt)],
	});


	if (!existing) throw redirect(302, '/create-trust');
	
	if (existing.isEligible === null) throw redirect(302, `/create-trust/${existing.id}`);

	const responses = (existing.responses ?? []) as { id: string; response: unknown }[];
	const answered = responses.filter((r) => r.response != null && r.response !== '').length;
	const questionnaireProgress = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

	return {
		userName: locals.user.name,
		requestedConsultation: (locals.user as any).requestedConsultationAt != null,
		trust: {
			id: existing.id,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: existing.updatedAt.toISOString(),
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			approved: existing.approved,
			paid: existing.paid,
			fileUrls: existing.file_urls ?? [],
			questionnaireProgress,
		},
	};
};
