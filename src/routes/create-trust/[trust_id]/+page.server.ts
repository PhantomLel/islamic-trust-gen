import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user, TrustStatus } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import {
	allIntakeQuestions,
	prePaymentQuestions,
	screeningQuestions,
	isEligibleForOnlineTrustFromScreening
} from '$lib/config';
import type { TrustScreeningAnswers, LoeAgreementData } from '$lib/server/db/schema';
import { LOE_AGREEMENT_VERSION } from '$lib/server/db/schema';
import {
	isIntakePhaseComplete,
	meetsDiscountedCharityPledge,
	type QuestionCompletionContext
} from '$lib/question-response-helpers';
import type { QuestionResponseValue } from '$lib/config';
import type { PageServerLoad, Actions } from './$types';
import { adminUserUrl, notifyAdmins } from '$lib/server/notifyAdmins';
import { stripe } from '$lib/server/stripe';
import { fulfillCheckoutSession } from '$lib/server/fulfillCheckout';
import { loadHelpBlockedStepsForUser } from '$lib/server/help/escalate';

type TrustRow = InferSelectModel<typeof trust>;

function responsesToRecord(
	rows: { id: string; response: unknown }[]
): Record<string, QuestionResponseValue> {
	return Object.fromEntries(
		rows.map((r) => [r.id, r.response as QuestionResponseValue])
	);
}

const SCREENING_QUESTION_IDS = screeningQuestions.map((q) => q.id);

function parseScreeningAnswersJson(raw: string | FormDataEntryValue | null): TrustScreeningAnswers {
	if (typeof raw !== 'string' || !raw.trim()) throw error(400, 'Screening answers are required');

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw error(400, 'Invalid screening answers');
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw error(400, 'Invalid screening answers');
	}
	const obj = parsed as Record<string, unknown>;
	const out: TrustScreeningAnswers = {};
	for (const id of SCREENING_QUESTION_IDS) {
		if (typeof obj[id] !== 'boolean') throw error(400, 'Invalid screening answers');
		out[id] = obj[id];
	}
	return out;
}

function mergeResponses(
	existing: { id: string; response: unknown }[] | null | undefined,
	parsed: { id: string; response: unknown }[]
): { id: string; response: unknown }[] {
	const map = new Map<string, unknown>();
	for (const r of existing ?? []) {
		map.set(r.id, r.response);
	}
	// Persist every answer the client sends, including post-payment ones. Answers are
	// harmless before payment (they cannot be submitted — `completePostPayment` still
	// requires a confirmed payment via `selectedPlan`), and silently dropping them here
	// used to destroy a user's progress whenever payment confirmation was pending.
	for (const { id, response } of parsed) {
		map.set(id, response);
	}
	return [...map.entries()].map(([id, response]) => ({ id, response }));
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trustId = parseInt(params.trust_id, 10);
	if (isNaN(trustId)) throw error(404, 'Trust not found');

	let [existing, countyRow] = await Promise.all([
		db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		}),
		db.query.user.findFirst({
			where: eq(user.id, locals.user.id),
			columns: { county: true },
		}),
	]);

	if (!existing) throw error(404, 'Trust not found');

	// Reconcile payment on the return from Stripe. This is a safety net for when the
	// `checkout.session.completed` webhook is delayed or never delivered (Stripe does
	// not reliably send it for no-cost orders). Without this, a paid trust can stay in
	// AwaitingPayment with a null selectedPlan, which silently discards the user's
	// post-payment answers and bounces them back to the payment page. Idempotent.
	if (
		url.searchParams.get('payment') === 'success' &&
		existing.status === TrustStatus.AwaitingPayment
	) {
		const sessionId = url.searchParams.get('session_id');
		if (sessionId) {
			try {
				const session = await stripe.checkout.sessions.retrieve(sessionId);
				const paid =
					session.status === 'complete' ||
					session.payment_status === 'paid' ||
					session.payment_status === 'no_payment_required';
				if (paid && session.metadata?.trustId === String(trustId)) {
					await fulfillCheckoutSession(session);
					const refreshed = await db.query.trust.findFirst({
						where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
					});
					if (refreshed) existing = refreshed;
				}
			} catch (err) {
				console.error('[create-trust load] Payment reconciliation failed:', err);
			}
		}
	}

	if (existing.isEligible === false) throw redirect(302, `/consultation/${trustId}`);

	// Intake is closed after submission; user continues from the dashboard.
	if (
		existing.status === TrustStatus.RequiresReview ||
		existing.status === TrustStatus.NotarizationPending ||
		existing.status === TrustStatus.Completed
	) {
		throw redirect(302, '/dashboard');
	}

	const hasPaidInvoice = existing.selectedPlan !== null;

	const helpBlockedSteps = await loadHelpBlockedStepsForUser(locals.user.id, 'create_trust');

	// Joint trust by default when the type picker is hidden (see +page.svelte).
	if (existing.isEligible === true && existing.joint === null) {
		await db
			.update(trust)
			.set({ joint: true, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));
		existing.joint = true;
	}

	return {
		trust: {
			id: existing.id,
			isEligible: existing.isEligible,
			joint: existing.joint,
			complete: existing.complete,
			status: existing.status,
			selectedPlan: existing.selectedPlan ?? null,
			responses: (existing.responses ?? []) as { id: string; response: string | string[] | boolean | number | null }[],
			deedRetrievalRequested: existing.deedRetrievalRequested,
			houseDeedUrl: existing.house_deed_url,
		},
		userId: locals.user.id,
		userName: locals.user.name,
		userEmail: locals.user.email,
		userCounty: countyRow?.county?.trim() || null,
		hasPaidInvoice,
		helpBlockedSteps,
	};
};

export const actions: Actions = {
	screen: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const data = await request.formData();
		const countyRaw = data.get('county');
		const county = typeof countyRaw === 'string' ? countyRaw.trim() : '';
		const screeningAnswers = parseScreeningAnswersJson(data.get('answers'));
		const eligible = isEligibleForOnlineTrustFromScreening(screeningAnswers);

		if (!county) throw error(400, 'County is required');

		// Parse LOE agreement data (only present when user is eligible and accepted)
		let loeAcceptedAt: Date | null = null;
		let loeAgreementData: LoeAgreementData | null = null;
		const loeRaw = data.get('loe');
		if (eligible && typeof loeRaw === 'string' && loeRaw.trim()) {
			try {
				const parsed = JSON.parse(loeRaw) as LoeAgreementData;
				if (parsed && parsed.version === LOE_AGREEMENT_VERSION && parsed.clientTimestamp) {
					loeAgreementData = parsed;
					loeAcceptedAt = new Date(); // server-side timestamp for legal purposes
				}
			} catch {
				// Non-fatal: we still allow the screening to proceed
				console.error('[screen] Failed to parse LOE agreement data');
			}
		}

		await db
			.update(trust)
			.set({
				isEligible: eligible,
				screeningAnswers,
				...(eligible ? { joint: true } : {}),
				...(loeAcceptedAt ? { loeAcceptedAt, loeAgreementData } : {}),
				updatedAt: new Date(),
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		await db.update(user).set({ county }).where(eq(user.id, locals.user.id));

		if (eligible && screeningAnswers.business_ownership === true) {
			const profile = await db.query.user.findFirst({
				where: eq(user.id, locals.user.id),
				columns: { id: true, name: true, email: true },
			});
			if (profile) {
				await notifyAdmins(
					`Business owner continued after screening — trust #${trustId}`,
					[
						'Event: User answered Yes to business ownership and continued the online trust (not sent to consultation).',
						`Trust ID: ${trustId}`,
						`User ID: ${profile.id}`,
						`User name: ${profile.name}`,
						`User email: ${profile.email}`,
						`Open in admin: ${adminUserUrl(profile.id)}`,
					].join('\n')
				);
			}
		}

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

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		});
		if (!currentTrust) throw error(404, 'Trust not found');

		if (
			currentTrust.status === TrustStatus.RequiresReview ||
			currentTrust.status === TrustStatus.NotarizationPending ||
			currentTrust.status === TrustStatus.Completed
		) {
			throw error(403, 'This intake has already been submitted');
		}

		const hasPaidInvoice = currentTrust.selectedPlan !== null;

		const formData = await request.formData();
		const responsesRaw = formData.get('responses');
		if (typeof responsesRaw !== 'string') throw error(400, 'Invalid data');

		const parsed = JSON.parse(responsesRaw) as { id: string; response: unknown }[];
		const merged = mergeResponses(currentTrust.responses, parsed);
		const record = responsesToRecord(merged);

		const completionCtx: QuestionCompletionContext = { selectedPlan: currentTrust.selectedPlan };
		// `trust.complete` means the full intake (including post-payment) is submitted — see completePostPayment.
		const allDone =
			hasPaidInvoice && isIntakePhaseComplete(record, allIntakeQuestions, completionCtx);

		await db
			.update(trust)
			.set({
				responses: merged as TrustRow['responses'],
				updatedAt: new Date(),
				complete: allDone,
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		await db.update(user).set({ updatedAt: new Date() }).where(eq(user.id, locals.user.id));

		return { saved: true };
	},

	completePrePayment: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		});
		if (!currentTrust) throw error(404, 'Trust not found');

		if (currentTrust.status === TrustStatus.AwaitingPayment) {
			// Already at payment gate — client redirects to payment.
			return { completedPre: true };
		}

		if (currentTrust.status !== TrustStatus.Started) {
			throw error(400, 'Pre-payment phase is not open for this trust');
		}

		const record = responsesToRecord((currentTrust.responses ?? []) as { id: string; response: unknown }[]);
		if (!isIntakePhaseComplete(record, prePaymentQuestions)) throw error(400, 'Pre-payment intake incomplete');

		await db
			.update(trust)
			.set({ status: TrustStatus.AwaitingPayment, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		await db.update(user).set({ updatedAt: new Date() }).where(eq(user.id, locals.user.id));

		return { completedPre: true };
	},

	completePostPayment: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
			columns: { responses: true, selectedPlan: true, status: true },
		});
		if (!currentTrust) throw error(404, 'Trust not found');

		if (currentTrust.status === TrustStatus.RequiresReview) {
			return { completedPost: true };
		}

		const postIntakeUnlocked = currentTrust.status === TrustStatus.AwaitingAnswers;

		if (!postIntakeUnlocked) {
			throw error(400, 'Full intake can only be submitted after payment, while your trust is open for answers');
		}

		if (currentTrust.selectedPlan === null) throw error(403, 'Payment required');

		const record = responsesToRecord((currentTrust.responses ?? []) as { id: string; response: unknown }[]);
		const completionCtx: QuestionCompletionContext = { selectedPlan: currentTrust.selectedPlan };
		if (!isIntakePhaseComplete(record, allIntakeQuestions, completionCtx)) {
			const needsCharityPledge =
				currentTrust.selectedPlan === 'discounted' &&
				!meetsDiscountedCharityPledge(record['charities']);
			throw error(
				400,
				needsCharityPledge
					? 'Intake incomplete: the discounted plan requires at least 1% of wasiyyah to one eligible charity (listed or added by you).'
					: 'Intake incomplete: not all required questions are answered.'
			);
		}

		const blockedSteps = await loadHelpBlockedStepsForUser(locals.user.id, 'create_trust');
		if (blockedSteps.length > 0) {
			throw error(
				403,
				'A consultation is required before you can submit intake. Please use the Help Assistant to book a consult.',
			);
		}

		await db
			.update(trust)
			.set({
				complete: true,
				status: TrustStatus.RequiresReview,
				updatedAt: new Date(),
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		await db.update(user).set({ updatedAt: new Date() }).where(eq(user.id, locals.user.id));

		const [profile, trustSnapshot] = await Promise.all([
			db.query.user.findFirst({
				where: eq(user.id, locals.user.id),
				columns: { id: true, name: true, email: true, county: true },
			}),
			db.query.trust.findFirst({
				where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
				columns: { joint: true, deedRetrievalRequested: true },
			}),
		]);
		if (profile) {
			await notifyAdmins(
				`Intake submitted — trust #${trustId}`,
				[
					'Event: User finished all questions and submitted intake for review',
					`Trust ID: ${trustId}`,
					`Trust status: ${TrustStatus.RequiresReview}`,
					`Trust marked complete: yes`,
					`User ID: ${profile.id}`,
					`User name: ${profile.name}`,
					`User email: ${profile.email}`,
					`User county: ${profile.county?.trim() ? profile.county : '(not set)'}`,
					`Selected plan: ${currentTrust.selectedPlan ?? ''}`,
					`Joint trust: ${trustSnapshot == null || trustSnapshot.joint === null ? 'unknown' : trustSnapshot.joint ? 'yes' : 'no'}`,
					`Deed retrieval add-on: ${trustSnapshot?.deedRetrievalRequested ? 'yes' : 'no'}`,
					`Open in admin: ${adminUserUrl(profile.id)}`,
				].join('\n')
			);
		}

		return { completedPost: true };
	},

	saveHouseDeed: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const formData = await request.formData();
		const houseDeedUrl = formData.get('houseDeedUrl');
		if (typeof houseDeedUrl !== 'string' || !houseDeedUrl) {
			throw error(400, 'Invalid house deed URL');
		}

		await db
			.update(trust)
			.set({ house_deed_url: houseDeedUrl })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { saved: true };
	},
};
