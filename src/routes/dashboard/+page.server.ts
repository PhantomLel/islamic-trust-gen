import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { getIntakeQuestionnaireProgress } from '$lib/question-response-helpers';
import { TrustStatus } from '$lib/server/db/schema';
import type { UserFile } from '$lib/server/db/schema';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });

function getUploadThingFileKey(fileUrl: string): string | null {
	try {
		const url = new URL(fileUrl);
		const fSegmentIndex = url.pathname.split('/').findIndex((segment) => segment === 'f');
		if (fSegmentIndex >= 0) {
			const maybeKey = url.pathname.split('/')[fSegmentIndex + 1];
			if (maybeKey) return maybeKey;
		}
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

	// Match create-trust: joint/individual picker is hidden; default to joint.
	if (existing.isEligible === true && existing.joint === null) {
		await db
			.update(trust)
			.set({ joint: true, updatedAt: new Date() })
			.where(and(eq(trust.id, existing.id), eq(trust.userId, locals.user.id)));
		existing.joint = true;
	}

	if (
		existing.status === TrustStatus.Started ||
		existing.status === TrustStatus.AwaitingPayment ||
		existing.status === TrustStatus.AwaitingAnswers
	) {
		throw redirect(302, `/create-trust/${existing.id}`);
	}

	const responses = (existing.responses ?? []) as { id: string; response: unknown }[];
	const hasPaid = existing.selectedPlan !== null;
	const questionnaireProgress = getIntakeQuestionnaireProgress(responses, { hasPaid });
	const hasHouse = responses.find((r) => r.id === 'has-house')?.response === true;
	const awaitingPayment = existing.status === TrustStatus.AwaitingPayment && !hasPaid;
	const intakeUnderReview = existing.status === TrustStatus.RequiresReview;

	return {
		userId: locals.user.id,
		userName: locals.user.name,
		requestedConsultation: (locals.user as any).requestedConsultationAt != null,
		paid: hasPaid,
		trust: {
			id: existing.id,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: existing.updatedAt.toISOString(),
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			status: existing.status,
			approved: existing.approved,
			fileUrls: existing.file_urls ?? [],
			houseDeedUrl: existing.house_deed_url,
			hasHouse,
			questionnaireProgress,
			awaitingPayment,
			intakeUnderReview,
			userFiles: (existing.user_files ?? []) as UserFile[],
			generatedFiles: existing.generated_files ?? [],
			notarizationLinkUrl: existing.notarizationLinkUrl ?? null,
			notarizationBookedAt: existing.notarizationBookedAt?.toISOString() ?? null,
			notarizationStartTime: existing.notarizationStartTime?.toISOString() ?? null,
			notarizationEndTime: existing.notarizationEndTime?.toISOString() ?? null,
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
			columns: { house_deed_url: true },
		});

		if (!existingTrust) return { saved: false };

		const previousHouseDeedUrl = existingTrust.house_deed_url;
		if (previousHouseDeedUrl && previousHouseDeedUrl !== houseDeedUrl) {
			const previousFileKey = getUploadThingFileKey(previousHouseDeedUrl);
			if (previousFileKey) {
				try {
					await utapi.deleteFiles(previousFileKey);
				} catch (error) {
					console.error('Failed to delete previous house deed file', error);
				}
			}
		}

		await db
			.update(trust)
			.set({ house_deed_url: houseDeedUrl })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { saved: true };
	},
};
