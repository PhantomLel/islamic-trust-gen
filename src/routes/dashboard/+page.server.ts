import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoice, trust } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { questions } from '$lib/config';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });

function getUploadThingFileKey(fileUrl: string): string | null {
	try {
		const url = new URL(fileUrl);
		// Typical UploadThing URLs look like /f/<fileKey>
		const fSegmentIndex = url.pathname.split('/').findIndex((segment) => segment === 'f');
		if (fSegmentIndex >= 0) {
			const maybeKey = url.pathname.split('/')[fSegmentIndex + 1];
			if (maybeKey) return maybeKey;
		}

		// Fallback: use last path segment
		const lastSegment = url.pathname.split('/').filter(Boolean).at(-1);
		return lastSegment ?? null;
	} catch {
		return null;
	}
}

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
	const hasHouse = responses.find((r) => r.id === 'has-house')?.response === true;
	const invoices = await db.query.invoice.findMany({
		where: eq(invoice.userId, locals.user.id),
		columns: { paid: true },
	});
	const paid = !invoices.some((i) => !i.paid);

	return {
		userId: locals.user.id,
		userName: locals.user.name,
		requestedConsultation: (locals.user as any).requestedConsultationAt != null,
		paid,
		trust: {
			id: existing.id,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: existing.updatedAt.toISOString(),
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			approved: existing.approved,
			fileUrls: existing.file_urls ?? [],
			houseDeedUrl: existing.house_deed_url,
			hasHouse,
			questionnaireProgress,
		},
	};
};

export const actions: Actions = {
	saveHouseDeed: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const trustId = Number(formData.get('trustId'));
		const houseDeedUrl = formData.get('houseDeedUrl');

		if (Number.isNaN(trustId) || typeof houseDeedUrl !== 'string' || !houseDeedUrl) {
			return { saved: false };
		}

		const existingTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
			columns: {
				house_deed_url: true
			}
		});

		if (!existingTrust) return { saved: false };

		const previousHouseDeedUrl = existingTrust.house_deed_url;
		if (previousHouseDeedUrl && previousHouseDeedUrl !== houseDeedUrl) {
			const previousFileKey = getUploadThingFileKey(previousHouseDeedUrl);
			if (previousFileKey) {
				try {
					await utapi.deleteFiles(previousFileKey);
				} catch (error) {
					// Keep update flow resilient if cleanup fails.
					console.error('Failed to delete previous house deed file', error);
				}
			}
		}

		await db
			.update(trust)
			.set({
				house_deed_url: houseDeedUrl,
				updatedAt: new Date(),
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { saved: true };
	},
};
