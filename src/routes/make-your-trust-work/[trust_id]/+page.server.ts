import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { trust, invoice, TrustStatus } from '$lib/server/db/schema';
import type { FundingRetirementBeneficiary, FundingTriState } from '$lib/server/db/schema';
import {
	loadFundingForTrust,
	seedFundingDashboardOnApprove,
	saveFindYourStuff,
	updateMilestoneChecklist,
	setMilestoneNotApplicable,
	createFundingFlag,
	logFundingEvent,
	flagsFromDashboard,
	syncConfirmSigningFromTrustStatus,
	syncPourOverFromFiles,
	ensureMilestoneRows,
} from '$lib/server/funding';
import {
	computeFundingProgress,
	getNextUp,
	isFundingAccessible,
	isMilestoneApplicable,
	deriveMilestoneStatus,
	hasRetirementBeneficiaryRisk,
	shouldShowConsult,
	shouldWarnScheduleAMissing,
} from '$lib/funding/logic';
import {
	FUNDING_MODULES,
	FUNDING_MILESTONES,
	FIND_YOUR_STUFF_QUESTIONS,
	RETIREMENT_BENEFICIARY_QUESTION,
	RETIREMENT_BENEFICIARY_RISK_NOTE,
	ASSET_REFERENCE_TITLE,
	ASSET_REFERENCE_MATCH_HINT,
	ASSET_REFERENCE_NO_MATCH_HINT,
	ASSET_REFERENCE_SHOW_ALL,
	ASSET_REFERENCE_HIDE_ALL,
	SCHEDULE_A_MISSING_WARNING,
	CATEGORY_TRANSLATION,
	FUNDING_DISCLAIMER,
	FUNDING_SUBTITLE,
	COMPLETE_PHASE_LOCKED_EXPLAINER,
	COMPLETION_BANNER_TITLE,
	COMPLETION_BANNER_BODY,
	NEED_HELP_MODAL_BODY,
	PREPARE_COMPLETE_WHILE_LOCKED_COPY,
	PREPARE_PHASE_COMPLETE_TITLE,
	PREPARE_PHASE_COMPLETE_BODY,
	COMPLETE_PHASE_COMPLETE_TITLE,
	COMPLETE_PHASE_COMPLETE_BODY,
	FUNDING_UNLOCKED_BANNER,
	fundingBookingUrl,
	webinarRegistrationUrl,
	webinarReplayUrl,
	getMilestoneContent,
} from '$lib/funding/content';
import { assetsForCategories, collectListedAssets } from '$lib/funding/assets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, `/login?redirectTo=/make-your-trust-work/${params.trust_id}`);

	const trustId = Number(params.trust_id);
	if (Number.isNaN(trustId)) throw error(404, 'Not found');

	const t = await db.query.trust.findFirst({
		where: eq(trust.id, trustId),
		columns: {
			id: true,
			userId: true,
			status: true,
			approved: true,
			selectedPlan: true,
			generated_files: true,
			user_files: true,
			file_urls: true,
			notarizationLinkUrl: true,
			joint: true,
			responses: true,
		},
	});
	if (!t) throw error(404, 'Trust not found');

	const isOwner = t.userId === locals.user.id;
	const isAdmin = locals.user.role === 'admin';
	if (!isOwner && !isAdmin) throw error(403, 'Forbidden');

	const paidRows = await db.query.invoice.findMany({
		where: and(eq(invoice.userId, t.userId), eq(invoice.paid, true)),
		columns: { id: true },
		limit: 1,
	});
	const hasPaid = t.selectedPlan !== null || paidRows.length > 0;
	if (!hasPaid && !isAdmin) throw redirect(302, '/dashboard');

	if (!isFundingAccessible(t.status) && !isAdmin) {
		throw redirect(302, '/dashboard');
	}

	let dash = await loadFundingForTrust(trustId);
	if (!dash && (t.approved || isFundingAccessible(t.status))) {
		await seedFundingDashboardOnApprove(trustId, locals.user.id);
		dash = await loadFundingForTrust(trustId);
	}
	if (!dash) throw redirect(302, '/dashboard');

	const packageFiles = [...(t.generated_files ?? []), ...(t.user_files ?? [])];
	const pourOverChanged = await syncPourOverFromFiles(dash.id, packageFiles);
	const rowsBackfilled = await ensureMilestoneRows(dash.id, dash.fundingUnlockedAt != null);

	if (t.status === TrustStatus.Completed || pourOverChanged || rowsBackfilled) {
		if (t.status === TrustStatus.Completed) {
			await syncConfirmSigningFromTrustStatus(dash.id, t.status);
		}
		dash = await loadFundingForTrust(trustId);
		if (!dash) throw redirect(302, '/dashboard');
	}

	const flags = flagsFromDashboard(dash);
	const retirementQuestionApplies =
		dash.isMarried === true &&
		(dash.hasEmployerPlan === 'yes' ||
			dash.hasEmployerPlan === 'not_sure' ||
			dash.hasIra === 'yes' ||
			dash.hasIra === 'not_sure');
	const retirementBeneficiaryAtRisk = hasRetirementBeneficiaryRisk(flags);
	const progress = computeFundingProgress(flags, dash.milestones, {
		fundingUnlockedAt: dash.fundingUnlockedAt,
	});
	const nextUp = getNextUp(flags, dash.milestones, {
		fundingUnlockedAt: dash.fundingUnlockedAt,
	});

	const completeUnlocked = dash.fundingUnlockedAt != null;

	const listedAssets = collectListedAssets(t.responses);

	const milestoneViews = FUNDING_MILESTONES.map((content) => {
		const row = dash!.milestones.find((m) => m.key === content.key);
		const applicable = isMilestoneApplicable(content.key, flags, completeUnlocked);
		const phaseLocked = content.phase === 'complete' && !completeUnlocked;
		const status = deriveMilestoneStatus(row, content, { phaseLocked, applicable });
		return {
			key: content.key,
			moduleId: content.moduleId,
			phase: content.phase,
			title: content.title,
			body: content.body,
			warning: content.warning ?? null,
			checklist: content.checklist,
			videoUrl: content.videoUrl ?? null,
			allowNa: !!content.allowNa,
			showConsult: shouldShowConsult(content.consultWhen, flags),
			informational: !!content.informational,
			riskNote:
				retirementBeneficiaryAtRisk &&
				(content.key === 'employer_retirement' || content.key === 'ira')
					? RETIREMENT_BENEFICIARY_RISK_NOTE
					: null,
			showAssetReference: !!content.assetCategories?.length && listedAssets.length > 0,
			matchedAssets: assetsForCategories(listedAssets, content.assetCategories),
			scheduleAWarning: shouldWarnScheduleAMissing(content.assetCategories, flags, listedAssets),
			applicable,
			status,
			checklistState: row?.checklist ?? {},
			naReason: row?.naReason ?? null,
		};
	});

	const docs = [
		...((t.user_files ?? []) as { filename: string; url: string; kind: string }[]).map((f) => ({
			name: f.filename,
			label: f.kind,
			url: f.url,
		})),
		...((t.generated_files ?? []) as { filename: string; url: string; kind: string }[]).map((f) => ({
			name: f.filename,
			label: f.kind,
			url: f.url,
		})),
		...((t.file_urls ?? []) as string[]).map((url, i) => ({
			name: `Document ${i + 1}`,
			label: 'Document',
			url,
		})),
	];

	return {
		trustId: t.id,
		trustStatus: t.status,
		notarizationLinkUrl: t.notarizationLinkUrl,
		dashboardId: dash.id,
		documentsReadyAt: dash.documentsReadyAt?.toISOString() ?? null,
		fundingUnlockedAt: dash.fundingUnlockedAt?.toISOString() ?? null,
		implementationCompletedAt: dash.implementationCompletedAt?.toISOString() ?? null,
		actionNeededNote: dash.actionNeededNote,
		pourOverWillIncluded: dash.pourOverWillIncluded,
		isMarried: dash.isMarried === true,
		findYourStuff: {
			completed: dash.findYourStuffCompletedAt != null,
			retirementQuestionApplies,
			retirementBeneficiary: dash.retirementBeneficiary,
			answers: {
				ownsHome: dash.ownsHome,
				hasBankAccounts: dash.hasBankAccounts,
				hasBrokerage: dash.hasBrokerage,
				hasEmployerPlan: dash.hasEmployerPlan,
				hasIra: dash.hasIra,
				hasLifeInsurance: dash.hasLifeInsurance,
				hasVehicle: dash.hasVehicle,
				hasCrypto: dash.hasCrypto,
				hasBusiness: dash.hasBusiness,
				retirementOverThreshold: dash.retirementOverThreshold,
			},
		},
		progress,
		nextUp,
		modules: FUNDING_MODULES.map((m) => ({
			...m,
			progress: progress.modules.find((p) => p.id === m.id)!,
		})),
		milestones: milestoneViews,
		listedAssets,
		showAssetOwners: t.joint === true && listedAssets.some((a) => a.owner !== null),
		documents: docs,
		copy: {
			disclaimer: FUNDING_DISCLAIMER,
			subtitle: FUNDING_SUBTITLE,
			completeLockedExplainer: COMPLETE_PHASE_LOCKED_EXPLAINER,
			completionTitle: COMPLETION_BANNER_TITLE,
			completionBody: COMPLETION_BANNER_BODY,
			needHelpBody: NEED_HELP_MODAL_BODY,
			prepareCompleteWhileLocked: PREPARE_COMPLETE_WHILE_LOCKED_COPY,
			preparePhaseCompleteTitle: PREPARE_PHASE_COMPLETE_TITLE,
			preparePhaseCompleteBody: PREPARE_PHASE_COMPLETE_BODY,
			completePhaseCompleteTitle: COMPLETE_PHASE_COMPLETE_TITLE,
			completePhaseCompleteBody: COMPLETE_PHASE_COMPLETE_BODY,
			fundingUnlockedBanner: FUNDING_UNLOCKED_BANNER,
			assetReferenceTitle: ASSET_REFERENCE_TITLE,
			assetReferenceMatchHint: ASSET_REFERENCE_MATCH_HINT,
			assetReferenceNoMatchHint: ASSET_REFERENCE_NO_MATCH_HINT,
			assetReferenceShowAll: ASSET_REFERENCE_SHOW_ALL,
			assetReferenceHideAll: ASSET_REFERENCE_HIDE_ALL,
			scheduleAWarning: SCHEDULE_A_MISSING_WARNING,
			bookingUrl: fundingBookingUrl,
			webinarRegistrationUrl,
			webinarReplayUrl,
		},
		findYourStuffQuestions: FIND_YOUR_STUFF_QUESTIONS,
		retirementBeneficiaryQuestion: RETIREMENT_BENEFICIARY_QUESTION,
		categoryTranslation: CATEGORY_TRANSLATION,
	};
};

const TRI: FundingTriState[] = ['yes', 'no', 'not_sure'];

function parseTri(v: FormDataEntryValue | null): FundingTriState | null {
	if (typeof v !== 'string') return null;
	return TRI.includes(v as FundingTriState) ? (v as FundingTriState) : null;
}

const RETIREMENT_BENEFICIARIES: FundingRetirementBeneficiary[] = ['spouse_sole', 'other', 'not_sure'];

function parseRetirementBeneficiary(
	v: FormDataEntryValue | null,
): FundingRetirementBeneficiary | null {
	if (typeof v !== 'string') return null;
	return RETIREMENT_BENEFICIARIES.includes(v as FundingRetirementBeneficiary)
		? (v as FundingRetirementBeneficiary)
		: null;
}

export const actions: Actions = {
	saveFindYourStuff: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const trustId = Number(params.trust_id);
		const dash = await loadFundingForTrust(trustId);
		if (!dash || (dash.userId !== locals.user.id && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Forbidden' });
		}

		const fd = await request.formData();
		const fields = [
			'ownsHome',
			'hasBankAccounts',
			'hasBrokerage',
			'hasEmployerPlan',
			'hasIra',
			'hasLifeInsurance',
			'hasVehicle',
			'hasCrypto',
			'hasBusiness',
			'retirementOverThreshold',
		] as const;

		const input: Record<(typeof fields)[number], FundingTriState> = {} as never;
		for (const f of fields) {
			const v = parseTri(fd.get(f));
			if (!v) return fail(400, { message: `Missing answer for ${f}` });
			input[f] = v;
		}

		// Only married users with a retirement account are asked who is named as beneficiary.
		const retirementApplies =
			dash.isMarried === true &&
			(input.hasEmployerPlan !== 'no' || input.hasIra !== 'no');
		let retirementBeneficiary: FundingRetirementBeneficiary | null = null;
		if (retirementApplies) {
			retirementBeneficiary = parseRetirementBeneficiary(fd.get('retirementBeneficiary'));
			if (!retirementBeneficiary) {
				return fail(400, { message: 'Missing answer for retirement beneficiary' });
			}
		}

		await saveFindYourStuff(dash.id, { ...input, retirementBeneficiary }, locals.user.id);
		return { saved: true };
	},

	toggleChecklist: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const trustId = Number(params.trust_id);
		const dash = await loadFundingForTrust(trustId);
		if (!dash || (dash.userId !== locals.user.id && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Forbidden' });
		}

		const fd = await request.formData();
		const milestoneKey = String(fd.get('milestoneKey') ?? '');
		const itemId = String(fd.get('itemId') ?? '');
		const checked = fd.get('checked') === 'true';

		const content = getMilestoneContent(milestoneKey);
		if (!content) return fail(400, { message: 'Unknown milestone' });
		if (content.phase === 'complete' && !dash.fundingUnlockedAt) {
			return fail(400, { message: 'Complete phase is locked until after notarization' });
		}

		const row = dash.milestones.find((m) => m.key === milestoneKey);
		const checklist = { ...(row?.checklist ?? {}), [itemId]: checked };
		await updateMilestoneChecklist(dash.id, milestoneKey, checklist, 'in_progress', locals.user.id);
		return { toggled: true };
	},

	setMilestoneNa: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const trustId = Number(params.trust_id);
		const dash = await loadFundingForTrust(trustId);
		if (!dash || (dash.userId !== locals.user.id && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Forbidden' });
		}

		const fd = await request.formData();
		const milestoneKey = String(fd.get('milestoneKey') ?? '');
		const content = getMilestoneContent(milestoneKey);
		if (!content?.allowNa) return fail(400, { message: 'N/A not allowed' });
		if (content.phase === 'complete' && !dash.fundingUnlockedAt) {
			return fail(400, { message: 'Complete phase is locked' });
		}

		await setMilestoneNotApplicable(dash.id, milestoneKey, 'Marked not applicable by user', locals.user.id);
		return { na: true };
	},

	requestHelp: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const trustId = Number(params.trust_id);
		const dash = await loadFundingForTrust(trustId);
		if (!dash || (dash.userId !== locals.user.id && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Forbidden' });
		}

		const fd = await request.formData();
		const message = String(fd.get('message') ?? '').trim().slice(0, 2000);
		await createFundingFlag(dash.id, 'help_clicked', {
			severity: 'attention',
			reason: message || 'User requested help',
			payload: { message },
		});
		await logFundingEvent(dash.id, 'help_clicked', { message }, locals.user.id);
		return { helpLogged: true };
	},

	ackConsult: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const trustId = Number(params.trust_id);
		const dash = await loadFundingForTrust(trustId);
		if (!dash || (dash.userId !== locals.user.id && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Forbidden' });
		}
		await createFundingFlag(dash.id, 'consult_clicked', {
			severity: 'info',
			reason: 'User clicked consult CTA',
		});
		await logFundingEvent(dash.id, 'consult_clicked', {}, locals.user.id);
		return { consultLogged: true };
	},
};
