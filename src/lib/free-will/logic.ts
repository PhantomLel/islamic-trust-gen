/**
 * Free Islamic Will — derived logic.
 *
 * Pure functions over `WillResponses`: which steps are active, lead tagging,
 * legal-mode selection, community-property handling, plan recommendation, and a
 * mapping into the Islamic inheritance calculator's `EstateInput`. Keeping this
 * logic pure mirrors how `buildContext.ts` reads trust responses.
 */

import type { EstateInput } from '$lib/inheritance/types';
import {
	assetRangeFloor,
	assetRanges,
	attorneyServiceStates,
	communityPropertyClauseStates,
	communityPropertyWarningStates,
	willSteps,
	type ChildrenCounts,
	type WillResponses,
	type WillStep,
	type YesNoUnsure,
} from './config';

// ─── Active steps (dependency-aware) ─────────────────────────────────────────

export function isStepActive(step: WillStep, responses: WillResponses): boolean {
	if (!step.depends) return true;
	return responses[step.depends.field] === step.depends.eq;
}

export function getActiveSteps(responses: WillResponses): WillStep[] {
	return willSteps.filter((s) => isStepActive(s, responses));
}

export function isStepAnswered(step: WillStep, responses: WillResponses): boolean {
	const v = responses[step.id];
	if (v === null || v === undefined) return false;
	if (step.type === 'counts') {
		const c = v as ChildrenCounts;
		return !!c && typeof c === 'object' && (c.sons > 0 || c.daughters > 0);
	}
	if (typeof v === 'string') return v.trim().length > 0;
	return true; // boolean answers (yes-no) are always considered answered once set
}

/** True when every currently-active step has a usable answer. */
export function isWillComplete(responses: WillResponses): boolean {
	return getActiveSteps(responses).every((s) => isStepAnswered(s, responses));
}

/** 0..1 progress across the active steps (used for the numberless progress bar). */
export function willProgress(responses: WillResponses, currentIndex: number): number {
	const total = getActiveSteps(responses).length;
	if (total === 0) return 0;
	return Math.min(1, Math.max(0, (currentIndex + 1) / total));
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export function isMarried(responses: WillResponses): boolean {
	return responses['marital_status'] === 'Married';
}

export function childrenCounts(responses: WillResponses): ChildrenCounts {
	const c = responses['children_counts'] as ChildrenCounts | undefined;
	if (responses['has_children'] !== true || !c) return { sons: 0, daughters: 0 };
	return { sons: Math.max(0, c.sons || 0), daughters: Math.max(0, c.daughters || 0) };
}

function yesNoUnsureTruthy(v: unknown): boolean {
	return v === true || v === 'yes';
}

// ─── Community property ───────────────────────────────────────────────────────

/** Married + in a community-property warning state (TX, CA, WI). */
export function isCommunityPropertySituation(responses: WillResponses): boolean {
	const state = responses['state'];
	return isMarried(responses) && typeof state === 'string' && communityPropertyWarningStates.has(state);
}

/** Whether the five auto-insert clauses apply (TX, CA only — WI excluded pending review). */
export function appliesCommunityPropertyClauses(responses: WillResponses): boolean {
	const state = responses['state'];
	return isMarried(responses) && typeof state === 'string' && communityPropertyClauseStates.has(state);
}

export const communityPropertyWarning =
	'Because you are married and live in a community property state, some property may already belong to your spouse under state law and may not be controlled by your will. This free will applies Islamic inheritance to the property your will can control and includes language designed to reduce conflicts with your spouse\u2019s community property rights. For stricter planning \u2014 especially if you own a home, retirement accounts, or significant assets \u2014 attorney review is recommended.';

/** The five clauses inserted automatically for married users in clause states (dev brief §5). */
export const communityPropertyClauses: { title: string; body: string }[] = [
	{
		title: 'Testamentary Estate Definition',
		body: 'This Will disposes only of property that the testator owns and has legal authority to dispose of at death. This Will does not alter, waive, partition, transmute, transfer, or gift any property interest belonging to the spouse under applicable law.',
	},
	{
		title: 'Community Property Acknowledgment',
		body: 'If domiciled in a community property, marital property, or similar jurisdiction at death, the testator acknowledges that the spouse may own or retain property rights outside the testamentary estate. The Islamic Distribution Schedule applies to the testamentary estate only.',
	},
	{
		title: 'Spousal Share Offset',
		body: 'In determining any amount passing to the surviving spouse from the residuary estate, the personal representative may consider property passing to or retained by the spouse outside this Will, including community property or marital property interests. If such property equals or exceeds the Islamic spousal share reflected in the Islamic Distribution Schedule, the spouse shall receive no additional share of the residuary estate unless required by applicable law.',
	},
	{
		title: 'Post-Death Islamic Reconciliation Request',
		body: 'The testator requests that the surviving spouse, heirs, and personal representative consult qualified legal and religious counsel after death regarding any difference between the legal distribution of property and Islamic inheritance. The testator further requests that they consider a lawful family settlement, disclaimer, gift, or other arrangement to bring the final distribution as close as reasonably possible to Islamic inheritance.',
	},
	{
		title: 'Nonbinding Label',
		body: 'This expression of religious intent is not intended to create a marital property agreement, postnuptial agreement, lifetime gift, partition, transmutation, waiver, or contract between spouses.',
	},
];

// ─── Legal mode (dev brief §9) ────────────────────────────────────────────────

export type LegalMode = 'attorney' | 'self-help';

export function legalMode(responses: WillResponses): LegalMode {
	const state = responses['state'];
	return typeof state === 'string' && attorneyServiceStates.has(state) ? 'attorney' : 'self-help';
}

export const legalModeDisclaimers: Record<LegalMode, string> = {
	'self-help':
		'This document is a self-help educational tool. It does not create an attorney-client relationship. Laws vary by state. Consult a licensed attorney in your state for legal advice specific to your situation.',
	attorney:
		'Legal services in Texas and California are provided by McDaniel Estate Planning, PLLC. An attorney-client relationship is formed only after formal engagement and conflict check.',
};

// ─── Lead tagging (dev brief §6) ──────────────────────────────────────────────

export type LeadTag =
	| 'community_property_state'
	| 'homeowner'
	| 'homeowner_review'
	| 'minor_children'
	| 'special_needs_heir'
	| 'blended_family'
	| 'business_owner'
	| 'beneficiary_designation_review'
	| 'non_muslim_heir'
	| 'high_priority_review'
	| 'charitable_intent'
	| 'waqf_interest'
	| 'attorney_interest';

export function computeLeadTags(responses: WillResponses): LeadTag[] {
	const tags = new Set<LeadTag>();

	const communityProperty = isCommunityPropertySituation(responses);
	const homeowner = responses['own_home'] === true;
	const floor = assetRangeFloor(
		assetRanges.find((r) => r.label === responses['asset_range'])?.id,
	);

	if (communityProperty) tags.add('community_property_state');
	if (homeowner) tags.add('homeowner');
	if (homeowner && communityProperty) tags.add('homeowner_review');
	if (responses['minor_children'] === true) tags.add('minor_children');
	if (responses['special_needs'] === true) tags.add('special_needs_heir');
	if (responses['blended_family'] === true) tags.add('blended_family');
	if (responses['business_ownership'] === true) tags.add('business_owner');
	if (responses['retirement_accounts'] === true || responses['life_insurance'] === true) {
		tags.add('beneficiary_designation_review');
	}
	if (responses['non_muslim_heirs'] === true) tags.add('non_muslim_heir');
	if (floor >= 500_000) tags.add('high_priority_review');
	if (yesNoUnsureTruthy(responses['charity_interest'])) tags.add('charitable_intent');
	// Charitable + institutional interest is treated as waqf interest for routing.
	if (responses['charity_interest'] === 'yes') tags.add('waqf_interest');
	if (responses['attorney_review'] === true) tags.add('attorney_interest');

	return [...tags];
}

// ─── Plan recommendation / upsell routing (dev brief §7) ──────────────────────

export type PlanKey = 'goodtree-trust' | 'legacy-plan' | 'family-waqf' | null;

export type PlanRecommendation = {
	plan: PlanKey;
	/** Whether to surface the "attorney review recommended" note (assets > $1M). */
	attorneyReviewNote: boolean;
};

export function recommendPlan(responses: WillResponses): PlanRecommendation {
	const tags = new Set(computeLeadTags(responses));
	const floor = assetRangeFloor(
		assetRanges.find((r) => r.label === responses['asset_range'])?.id,
	);
	const homeowner = responses['own_home'] === true;

	const attorneyReviewNote = floor >= 1_000_000;

	// Most complex situations route to the Legacy Plan.
	if (tags.has('business_owner') || tags.has('blended_family') || tags.has('special_needs_heir')) {
		return { plan: 'legacy-plan', attorneyReviewNote };
	}
	if (attorneyReviewNote) {
		return { plan: 'legacy-plan', attorneyReviewNote: true };
	}
	if (tags.has('waqf_interest') || tags.has('charitable_intent')) {
		return { plan: 'family-waqf', attorneyReviewNote };
	}
	if (homeowner || floor >= 250_000) {
		return { plan: 'goodtree-trust', attorneyReviewNote };
	}
	return { plan: null, attorneyReviewNote };
}

// ─── Inheritance calculator mapping ───────────────────────────────────────────

/**
 * Build the calculator `EstateInput` from will responses so the preview can
 * show an accurate Islamic distribution schedule based on the family structure.
 * Only the heirs the free will asks about are populated; the rest default to 0.
 */
export function buildEstateInput(responses: WillResponses): EstateInput {
	const gender = responses['gender'] === 'Female' ? 'female' : 'male';
	const counts = childrenCounts(responses);
	const parents = responses['parents_living'];

	return {
		decedentGender: gender,
		spouse: isMarried(responses),
		fatherAlive: parents === 'Both' || parents === 'Father only',
		motherAlive: parents === 'Both' || parents === 'Mother only',
		sons: counts.sons,
		daughters: counts.daughters,
		sonsOfSons: 0,
		daughtersOfSons: 0,
		paternalGrandfatherAlive: false,
		paternalGrandmotherAlive: false,
		maternalGrandmotherAlive: false,
		fullBrothers: 0,
		fullSisters: 0,
		paternalHalfBrothers: 0,
		paternalHalfSisters: 0,
		maternalHalfBrothers: 0,
		maternalHalfSisters: 0,
		fullPaternalUncles: 0,
	};
}

export type { YesNoUnsure };
