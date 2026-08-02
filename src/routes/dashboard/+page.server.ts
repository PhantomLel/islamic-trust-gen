import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, fundingDashboard } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { stopLead } from '$lib/server/drip/stop';
import { getIntakeQuestionnaireProgress } from '$lib/question-response-helpers';
import { TrustStatus } from '$lib/server/db/schema';
import type { UserFile } from '$lib/server/db/schema';
import { UTApi } from 'uploadthing/server';
import { env } from '$env/dynamic/private';
import { isFundingAccessible, computeFundingProgress, getNextUp } from '$lib/funding/logic';
import { flagsFromDashboard } from '$lib/server/funding';
import { getModuleContent } from '$lib/funding/content';
import { reconcileNotarizationForTrust } from '$lib/server/notarization';
	import { loadHelpBlockedStepsForUser } from '$lib/server/help/escalate';
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

	let fundingSummary: {
		pct: number;
		label: string;
		href: string;
		completeUnlocked: boolean;
		implementationComplete: boolean;
	} | null = null;

	if (isFundingAccessible(existing.status)) {
		const dash = await db.query.fundingDashboard.findFirst({
			where: eq(fundingDashboard.trustId, existing.id),
			with: { milestones: true },
		});
		if (dash) {
			const flags = flagsFromDashboard(dash);
			const progress = computeFundingProgress(flags, dash.milestones, {
				fundingUnlockedAt: dash.fundingUnlockedAt,
			});
			const next = getNextUp(flags, dash.milestones, {
				fundingUnlockedAt: dash.fundingUnlockedAt,
			});
			const modTitle = next ? getModuleContent(next.moduleId)?.title : null;
			fundingSummary = {
				pct: progress.journey.pct,
				label: progress.implementationComplete
					? 'Guided steps complete'
					: modTitle
						? `Funding: ${progress.journey.pct}% · ${modTitle}`
						: `Funding: ${progress.journey.pct}%`,
				href: `/make-your-trust-work/${existing.id}`,
				completeUnlocked: dash.fundingUnlockedAt != null,
				implementationComplete: progress.implementationComplete,
			};
		} else if (existing.approved) {
			fundingSummary = {
				pct: 0,
				label: 'Prepare your funding',
				href: `/make-your-trust-work/${existing.id}`,
				completeUnlocked: false,
				implementationComplete: false,
			};
		}
	}

	let notarizationLinkUrl = existing.notarizationLinkUrl ?? null;
	let trustStatus = existing.status;
	let notarizationBookedAt = existing.notarizationBookedAt;
	let notarizationStartTime = existing.notarizationStartTime;
	let notarizationEndTime = existing.notarizationEndTime;

	if (
		existing.approved &&
		(trustStatus === TrustStatus.NotarizationPending ||
			trustStatus === TrustStatus.NotarizationScheduled)
	) {
		const reconciled = await reconcileNotarizationForTrust(existing.id);
		if (reconciled) {
			trustStatus = reconciled.status;
			notarizationLinkUrl = reconciled.notarizationLinkUrl;
			notarizationBookedAt = reconciled.notarizationBookedAt;
			notarizationStartTime = reconciled.notarizationStartTime;
			notarizationEndTime = reconciled.notarizationEndTime;
		}
	}

	return {
		userId: locals.user.id,
		userName: locals.user.name,
		requestedConsultation: (locals.user as any).requestedConsultationAt != null,
		paid: hasPaid,
		fundingSummary,
		helpBlockedSteps: await loadHelpBlockedStepsForUser(locals.user.id, 'dashboard'),
		trust: {
			id: existing.id,
			createdAt: existing.createdAt.toISOString(),
			updatedAt: existing.updatedAt.toISOString(),
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			status: trustStatus,
			approved: existing.approved,
			fileUrls: existing.file_urls ?? [],
			houseDeedUrl: existing.house_deed_url,
			hasHouse,
			questionnaireProgress,
			awaitingPayment,
			intakeUnderReview,
			userFiles: (existing.user_files ?? []) as UserFile[],
			generatedFiles: existing.generated_files ?? [],
			notarizationLinkUrl,
			notarizationBookedAt: notarizationBookedAt?.toISOString() ?? null,
			notarizationStartTime: notarizationStartTime?.toISOString() ?? null,
			notarizationEndTime: notarizationEndTime?.toISOString() ?? null,
		},
	};
};

export const actions: Actions = {
	requestConsultation: async ({ locals }) => {
		if (!locals.user) throw redirect(302, '/login');
		const { user } = await import('$lib/server/db/schema');
		await db.update(user).set({ requestedConsultationAt: new Date() }).where(eq(user.id, locals.user.id));
		stopLead(locals.user.email, 'stopped_consult', 'consultation_requested').catch((err) =>
			console.error('[drip] Stop on dashboard consult failed:', err),
		);
		return { success: true };
	},
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
