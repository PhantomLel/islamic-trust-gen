/**
 * Pure domain logic for Make Your Trust Work progress, applicability, and Next Up.
 */

import { TrustStatus } from '$lib/server/db/schema';
import type {
	FundingChecklistState,
	FundingMilestoneStatus,
	FundingRetirementBeneficiary,
	FundingTriState,
} from '$lib/server/db/schema';
import type { ListedAsset } from './assets';
import {
	FUNDING_MILESTONES,
	FUNDING_MODULES,
	webinarRegistrationUrl,
	webinarReplayUrl,
	willSigningEnabled,
	fundingExplainerVideoUrl,
	type FundingAssetCategory,
	type FundingMilestoneKey,
	type FundingModuleId,
	type FundingPhaseId,
	type FundingMilestoneContent,
	type FundingConsultCondition,
} from './content';

/** Ordered trust lifecycle for comparisons (TrustStatus is a string enum). */
export const TRUST_STATUS_ORDER: string[] = [
	TrustStatus.Started,
	TrustStatus.AwaitingPayment,
	TrustStatus.AwaitingAnswers,
	TrustStatus.RequiresReview,
	TrustStatus.NotarizationPending,
	TrustStatus.NotarizationScheduled,
	TrustStatus.Completed,
];

export function statusRank(status: string): number {
	const i = TRUST_STATUS_ORDER.indexOf(status);
	return i === -1 ? -1 : i;
}

export function isFundingAccessible(status: string): boolean {
	return statusRank(status) >= statusRank(TrustStatus.NotarizationPending);
}

export function isCompletePhaseUnlocked(fundingUnlockedAt: Date | string | null | undefined): boolean {
	return fundingUnlockedAt != null;
}

export type FindYourStuffFlags = {
	ownsHome: FundingTriState | null;
	hasBankAccounts: FundingTriState | null;
	hasBrokerage: FundingTriState | null;
	hasEmployerPlan: FundingTriState | null;
	hasIra: FundingTriState | null;
	hasLifeInsurance: FundingTriState | null;
	hasVehicle: FundingTriState | null;
	hasCrypto: FundingTriState | null;
	hasBusiness: FundingTriState | null;
	retirementOverThreshold: FundingTriState | null;
	retirementBeneficiary: FundingRetirementBeneficiary | null;
	findYourStuffCompletedAt: Date | string | null;
	isHomeowner: boolean | null;
	isMarried: boolean | null;
	pourOverWillIncluded: boolean;
};

type RetirementRiskFlags = Pick<
	FindYourStuffFlags,
	'retirementBeneficiary' | 'retirementOverThreshold'
>;

/** Retirement beneficiary is someone other than the spouse, or the user does not know. */
export function hasRetirementBeneficiaryRisk(flags: RetirementRiskFlags): boolean {
	return flags.retirementBeneficiary === 'other' || flags.retirementBeneficiary === 'not_sure';
}

/**
 * Whether a card's consult CTA applies. The retirement cards only offer it to users whose own
 * answers show a risk factor, so a click is a meaningful routing signal rather than background
 * furniture. "Not sure" counts as risk here, matching the admin flags — we should not raise a flag
 * about someone while hiding their route to resolve it.
 */
export function shouldShowConsult(
	when: FundingConsultCondition | undefined,
	flags: RetirementRiskFlags,
): boolean {
	switch (when) {
		case 'always':
			return true;
		case 'retirement_beneficiary_risk':
			return hasRetirementBeneficiaryRisk(flags);
		case 'retirement_risk':
			return (
				hasRetirementBeneficiaryRisk(flags) ||
				flags.retirementOverThreshold === 'yes' ||
				flags.retirementOverThreshold === 'not_sure'
			);
		default:
			return false;
	}
}

export type MilestoneRow = {
	key: string;
	phase: FundingPhaseId;
	status: FundingMilestoneStatus;
	checklist: FundingChecklistState;
	naReason: string | null;
	completedAt: Date | string | null;
};

function showsForTriState(v: FundingTriState | null): boolean {
	return v === 'yes' || v === 'not_sure';
}

const CATEGORY_FYS_FLAG: Record<
	FundingAssetCategory,
	keyof Pick<
		FindYourStuffFlags,
		| 'ownsHome'
		| 'hasBankAccounts'
		| 'hasBrokerage'
		| 'hasEmployerPlan'
		| 'hasIra'
		| 'hasLifeInsurance'
		| 'hasVehicle'
		| 'hasCrypto'
	>
> = {
	bank: 'hasBankAccounts',
	brokerage: 'hasBrokerage',
	employer_plan: 'hasEmployerPlan',
	ira: 'hasIra',
	life_insurance: 'hasLifeInsurance',
	vehicle: 'hasVehicle',
	crypto: 'hasCrypto',
	real_property: 'ownsHome',
};

/** User said they have a category in Find Your Stuff but nothing on Schedule A matches it. */
export function shouldWarnScheduleAMissing(
	assetCategories: FundingAssetCategory[] | undefined,
	flags: FindYourStuffFlags,
	listedAssets: ListedAsset[],
): boolean {
	if (!assetCategories?.length) return false;

	for (const category of assetCategories) {
		const flagKey = CATEGORY_FYS_FLAG[category];
		if (!showsForTriState(flags[flagKey])) continue;
		const hasMatch = listedAssets.some((a) => a.categories.includes(category));
		if (!hasMatch) return true;
	}
	return false;
}

function findYourStuffDone(flags: FindYourStuffFlags): boolean {
	return flags.findYourStuffCompletedAt != null;
}

/** Whether a milestone should appear for this user. */
export function isMilestoneApplicable(
	key: FundingMilestoneKey,
	flags: FindYourStuffFlags,
	completeUnlocked: boolean,
): boolean {
	const content = FUNDING_MILESTONES.find((m) => m.key === key);
	if (!content) return false;

	if (content.key === 'webinar' && !(webinarRegistrationUrl || webinarReplayUrl)) return false;
	// The explainer is a video card. With no video there is nothing to watch, so hide it rather
	// than showing a checkbox that cannot move the progress bar.
	if (content.key === 'funding_explainer' && !fundingExplainerVideoUrl) return false;

	if (content.key === 'prepare_pour_over' || content.key === 'will_signing') {
		if (!flags.pourOverWillIncluded || !willSigningEnabled) return false;
	}

	if (
		content.key === 'home_deed_office' ||
		content.key === 'home_insurance' ||
		content.key === 'homestead'
	) {
		if (flags.isHomeowner === false) return false;
	}

	const needsStuff = findYourStuffDone(flags);

	const assetGatedMap: Partial<Record<FundingMilestoneKey, keyof FindYourStuffFlags>> = {
		forms_bank: 'hasBankAccounts',
		forms_brokerage: 'hasBrokerage',
		forms_employer: 'hasEmployerPlan',
		forms_ira: 'hasIra',
		forms_life: 'hasLifeInsurance',
		bank_brokerage: 'hasBankAccounts', // also brokerage — handled below
		employer_retirement: 'hasEmployerPlan',
		ira: 'hasIra',
		life_insurance: 'hasLifeInsurance',
		vehicles: 'hasVehicle',
		crypto_digital: 'hasCrypto',
	};

	if (key === 'bank_brokerage') {
		if (!needsStuff) return false;
		return showsForTriState(flags.hasBankAccounts) || showsForTriState(flags.hasBrokerage);
	}

	const flagKey = assetGatedMap[key];
	if (flagKey) {
		if (!needsStuff) return false;
		const v = flags[flagKey];
		if (typeof v === 'string' || v === null) {
			return showsForTriState(v as FundingTriState | null);
		}
		return false;
	}

	// Complete-phase milestones are still "applicable" for progress math when locked;
	// UI locks interaction. home_insurance requires homeowner (above).
	void completeUnlocked;
	return true;
}

export function isMilestoneDone(row: MilestoneRow | undefined, content: FundingMilestoneContent): boolean {
	if (!row) return false;
	if (row.status === 'complete' || row.status === 'not_applicable') return true;
	if (content.checklist.length === 0) return false;
	return content.checklist.every((item) => row.checklist[item.id] === true);
}

export function deriveMilestoneStatus(
	row: MilestoneRow | undefined,
	content: FundingMilestoneContent,
	opts: { phaseLocked: boolean; applicable: boolean },
): FundingMilestoneStatus {
	if (!opts.applicable) return 'not_applicable';
	if (opts.phaseLocked) return 'locked';
	if (!row) return 'not_started';
	if (row.status === 'action_needed') return 'action_needed';
	if (row.status === 'not_applicable') return 'not_applicable';
	if (isMilestoneDone(row, content)) return 'complete';
	const anyChecked = content.checklist.some((item) => row.checklist[item.id] === true);
	if (anyChecked || row.status === 'in_progress') return 'in_progress';
	return 'not_started';
}

export type ProgressSlice = {
	done: number;
	total: number;
	pct: number;
};

export type ModuleProgress = ProgressSlice & {
	id: FundingModuleId;
	status: 'locked' | 'available' | 'in_progress' | 'complete';
	phase: FundingPhaseId;
};

export type FundingProgress = {
	journey: ProgressSlice;
	prepare: ProgressSlice;
	complete: ProgressSlice;
	modules: ModuleProgress[];
	completePhaseLocked: boolean;
	implementationComplete: boolean;
	prepareComplete: boolean;
};

function slice(done: number, total: number): ProgressSlice {
	const t = Math.max(0, total);
	const d = Math.min(done, t);
	return { done: d, total: t, pct: t === 0 ? 100 : Math.round((d / t) * 100) };
}

export function computeFundingProgress(
	flags: FindYourStuffFlags,
	milestones: MilestoneRow[],
	opts: { fundingUnlockedAt: Date | string | null },
): FundingProgress {
	const completeUnlocked = isCompletePhaseUnlocked(opts.fundingUnlockedAt);
	const byKey = new Map(milestones.map((m) => [m.key, m]));

	const modules: ModuleProgress[] = FUNDING_MODULES.map((mod) => {
		const phaseLocked = mod.phase === 'complete' && !completeUnlocked;
		const applicableContents = mod.milestoneKeys
			.map((k) => FUNDING_MILESTONES.find((m) => m.key === k)!)
			.filter((c) => c && isMilestoneApplicable(c.key, flags, completeUnlocked))
			.filter((c) => !c.excludeFromCompletion);

		let done = 0;
		for (const c of applicableContents) {
			const row = byKey.get(c.key);
			const status = deriveMilestoneStatus(row, c, {
				phaseLocked,
				applicable: true,
			});
			if (status === 'complete' || status === 'not_applicable') done += 1;
		}

		const total = applicableContents.length;
		const pctSlice = slice(phaseLocked ? 0 : done, total);
		let status: ModuleProgress['status'] = 'available';
		if (phaseLocked) status = 'locked';
		else if (total === 0) status = 'complete';
		else if (done >= total) status = 'complete';
		else if (done > 0) status = 'in_progress';

		return {
			id: mod.id,
			phase: mod.phase,
			status,
			...pctSlice,
			// While locked, show potential total but 0 done for the bar fill
			done: phaseLocked ? 0 : done,
			total,
			pct: phaseLocked ? 0 : pctSlice.pct,
		};
	});

	const phaseSlice = (phase: FundingPhaseId, locked: boolean): ProgressSlice => {
		const mods = modules.filter((m) => m.phase === phase);
		const done = mods.reduce((a, m) => a + m.done, 0);
		const total = mods.reduce((a, m) => a + m.total, 0);
		if (locked) return slice(0, total);
		return slice(done, total);
	};

	const prepare = phaseSlice('prepare', false);
	const complete = phaseSlice('complete', !completeUnlocked);

	// Journey: prepare progress + complete only after unlock
	const journeyDone = prepare.done + (completeUnlocked ? complete.done : 0);
	const journeyTotal = prepare.total + complete.total;
	const journey = slice(journeyDone, journeyTotal);

	const prepareComplete = prepare.total > 0 && prepare.done >= prepare.total;
	const implementationComplete =
		completeUnlocked &&
		prepareComplete &&
		complete.total > 0 &&
		complete.done >= complete.total;

	return {
		journey,
		prepare,
		complete,
		modules,
		completePhaseLocked: !completeUnlocked,
		implementationComplete,
		prepareComplete,
	};
}

export type NextUp = {
	moduleId: FundingModuleId;
	moduleTitle: string;
	milestoneKey: FundingMilestoneKey;
	milestoneTitle: string;
} | null;

export function getNextUp(
	flags: FindYourStuffFlags,
	milestones: MilestoneRow[],
	opts: { fundingUnlockedAt: Date | string | null },
): NextUp {
	const completeUnlocked = isCompletePhaseUnlocked(opts.fundingUnlockedAt);
	const byKey = new Map(milestones.map((m) => [m.key, m]));

	for (const mod of FUNDING_MODULES) {
		const phaseLocked = mod.phase === 'complete' && !completeUnlocked;
		if (phaseLocked) continue;

		for (const key of mod.milestoneKeys) {
			const content = FUNDING_MILESTONES.find((m) => m.key === key);
			if (!content) continue;
			if (!isMilestoneApplicable(key, flags, completeUnlocked)) continue;
			// Cards outside the denominator must not be offered as Next Up, or the journey can
			// report a phase complete while still pointing the user at an unchecked card.
			if (content.excludeFromCompletion) continue;

			const row = byKey.get(key);
			const status = deriveMilestoneStatus(row, content, {
				phaseLocked: false,
				applicable: true,
			});
			if (status === 'complete' || status === 'not_applicable') continue;

			return {
				moduleId: mod.id,
				moduleTitle: mod.title,
				milestoneKey: key,
				milestoneTitle: content.title,
			};
		}
	}
	return null;
}

/** Seed milestone keys for a new dashboard. */
export function allMilestoneSeedRows(): { key: FundingMilestoneKey; phase: FundingPhaseId }[] {
	return FUNDING_MILESTONES.map((m) => ({ key: m.key, phase: m.phase }));
}

export function detectPourOverIncluded(files: { kind: string }[]): boolean {
	return files.some(
		(f) =>
			f.kind === 'pour-over-will-husband' ||
			f.kind === 'pour-over-will-wife' ||
			f.kind.includes('pour-over'),
	);
}
