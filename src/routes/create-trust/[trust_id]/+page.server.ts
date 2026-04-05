import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trust, user, TrustStatus } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { prePaymentQuestions, postPaymentQuestions } from '$lib/config';
import { getActiveQuestions, isQuestionResponseComplete } from '$lib/question-response-helpers';
import type { QuestionResponseValue } from '$lib/config';
import type { PageServerLoad, Actions } from './$types';

type TrustRow = InferSelectModel<typeof trust>;

const POST_PAYMENT_IDS = new Set(postPaymentQuestions.map((q) => q.id));

function responsesToRecord(
	rows: { id: string; response: unknown }[]
): Record<string, QuestionResponseValue> {
	return Object.fromEntries(
		rows.map((r) => [r.id, r.response as QuestionResponseValue])
	);
}

function mergeResponses(
	existing: { id: string; response: unknown }[] | null | undefined,
	parsed: { id: string; response: unknown }[],
	hasPaidInvoice: boolean
): { id: string; response: unknown }[] {
	const map = new Map<string, unknown>();
	for (const r of existing ?? []) {
		map.set(r.id, r.response);
	}
	for (const { id, response } of parsed) {
		if (!hasPaidInvoice && POST_PAYMENT_IDS.has(id)) continue;
		map.set(id, response);
	}
	return [...map.entries()].map(([id, response]) => ({ id, response }));
}

function isPhaseComplete(
	record: Record<string, QuestionResponseValue>,
	questionList: typeof prePaymentQuestions
): boolean {
	const { active } = getActiveQuestions(record, questionList);
	return active.every((q) => isQuestionResponseComplete(q.type, record[q.id]));
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trustId = parseInt(params.trust_id, 10);
	if (isNaN(trustId)) throw error(404, 'Trust not found');

	const existing = await db.query.trust.findFirst({
		where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
	});

	if (!existing) throw error(404, 'Trust not found');
	if (existing.isEligible === false) throw redirect(302, `/consultation/${trustId}`);

	const hasPaidInvoice = existing.selectedPlan !== null;

	if (existing.status === TrustStatus.AwaitingPayment && hasPaidInvoice) {
		await db
			.update(trust)
			.set({ status: TrustStatus.AwaitingAnswers, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));
		existing.status = TrustStatus.AwaitingAnswers;
	}

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
		},
		userName: locals.user.name,
		userEmail: locals.user.email,
		hasPaidInvoice,
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
			.set({
				isEligible: eligible,
				...(eligible ? { joint: true } : {}),
				updatedAt: new Date(),
			})
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

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
		});
		if (!currentTrust) throw error(404, 'Trust not found');

		const hasPaidInvoice = currentTrust.selectedPlan !== null;

		const formData = await request.formData();
		const responsesRaw = formData.get('responses');
		if (typeof responsesRaw !== 'string') throw error(400, 'Invalid data');

		const parsed = JSON.parse(responsesRaw) as { id: string; response: unknown }[];
		const merged = mergeResponses(currentTrust.responses, parsed, hasPaidInvoice);
		const record = responsesToRecord(merged);

		const preDone = isPhaseComplete(record, prePaymentQuestions);
		const postDone = hasPaidInvoice ? isPhaseComplete(record, postPaymentQuestions) : false;
		// `trust.complete` means the full intake (including post-payment) is submitted — see completePostPayment.
		const allDone = hasPaidInvoice && preDone && postDone;

		await db
			.update(trust)
			.set({
				responses: merged as TrustRow['responses'],
				updatedAt: new Date(),
				complete: allDone,
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

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
			// Already completed — just redirect to payment page.
			return { completedPre: true };
		}

		const record = responsesToRecord((currentTrust.responses ?? []) as { id: string; response: unknown }[]);
		if (!isPhaseComplete(record, prePaymentQuestions)) throw error(400, 'Pre-payment intake incomplete');

		await db
			.update(trust)
			.set({ status: TrustStatus.AwaitingPayment, updatedAt: new Date() })
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { completedPre: true };
	},

	completePostPayment: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');

		const trustId = parseInt(params.trust_id, 10);
		if (isNaN(trustId)) throw error(400, 'Invalid trust');

		const currentTrust = await db.query.trust.findFirst({
			where: and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)),
			columns: { responses: true, selectedPlan: true },
		});
		if (!currentTrust) throw error(404, 'Trust not found');

		if (currentTrust.selectedPlan === null) throw error(403, 'Payment required');

		const record = responsesToRecord((currentTrust.responses ?? []) as { id: string; response: unknown }[]);
		if (!isPhaseComplete(record, prePaymentQuestions)) {
			throw error(400, 'Pre-payment intake incomplete');
		}
		if (!isPhaseComplete(record, postPaymentQuestions)) throw error(400, 'Intake incomplete');

		await db
			.update(trust)
			.set({
				complete: true,
				status: TrustStatus.RequiresReview,
				updatedAt: new Date(),
			})
			.where(and(eq(trust.id, trustId), eq(trust.userId, locals.user.id)));

		return { completedPost: true };
	},
};
