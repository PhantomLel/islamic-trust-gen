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
	charities as presetCharities,
	type HeirsCalculatorResponse,
	type NamedHeir,
	type PersonalDataResponse,
	type QuestionResponseValue,
} from '$lib/config';
import {
	assetRangeFloor,
	assetRanges,
	attorneyServiceStates,
	communityPropertyClauseStates,
	communityPropertyWarningStates,
	isWillAvailableState,
	stateName,
	willSteps,
	WILL_WASIYYAH_CAP,
	type AddressValue,
	type ChildrenCounts,
	type WillResponseValue,
	type WillResponses,
	type WillStep,
	resolveWillWasiyyahRecipientName,
	type WillWasiyyahResponse,
	type YesNoUnsure,
} from './config';

/** Flat `{ id, response }[]` storage rows → keyed `WillResponses` for logic functions. */
export function toWillResponses(
	rows: { id: string; response: unknown }[] | null | undefined,
): WillResponses {
	return Object.fromEntries(
		(rows ?? []).map((r) => [r.id, r.response as WillResponseValue]),
	);
}

// ─── Active steps (dependency-aware) ─────────────────────────────────────────

export function isStepActive(step: WillStep, responses: WillResponses): boolean {
	if (step.depends && responses[step.depends.field] !== step.depends.eq) return false;
	if (step.showIf && !step.showIf(responses)) return false;
	return true;
}

export function getActiveSteps(responses: WillResponses): WillStep[] {
	return willSteps.filter((s) => isStepActive(s, responses));
}

export function isStepAnswered(step: WillStep, responses: WillResponses): boolean {
	const v = responses[step.id];
	if (v === null || v === undefined) return false;
	if (step.type === 'heirs-calculator') {
		return !!v && typeof v === 'object' && 'verified' in v && (v as HeirsCalculatorResponse).verified === true;
	}
	if (step.type === 'executors') {
		if (!Array.isArray(v) || v.length !== 3) return false;
		return v.every((e: any) => e && typeof e.fullName === 'string' && e.fullName.trim().length > 0 && typeof e.relationship === 'string' && e.relationship.trim().length > 0);
	}
	if (step.type === 'guardians') {
		if (!Array.isArray(v) || v.length !== 2) return false;
		return v.every((g: any) => g && typeof g.fullName === 'string' && g.fullName.trim().length > 0 && typeof g.relationship === 'string' && g.relationship.trim().length > 0);
	}
	if (step.type === 'address') {
		const a = v as AddressValue;
		return !!a && typeof a === 'object' && !!a.street?.trim() && !!a.city?.trim() && !!a.zip?.trim();
	}
	if (step.type === 'state') {
		return typeof v === 'string' && isWillAvailableState(v);
	}
	if (step.type === 'county') {
		return typeof v === 'string' && v.trim().length > 0;
	}
	if (step.type === 'wasiyyah') {
		const w = v as WillWasiyyahResponse;
		if (!w || typeof w !== 'object' || !('interested' in w)) return false;
		// Not interested = valid, answered
		if (!w.interested) return true;
		// Interested: must have at least one bequest, all with valid percentages, total ≤ cap
		if (!Array.isArray(w.bequests) || w.bequests.length === 0) return false;
		const total = w.bequests.reduce((s, b) => s + (b.percentage || 0), 0);
		if (total > WILL_WASIYYAH_CAP + 1e-6) return false;
		const presetNames = new Map(presetCharities.map((c) => [c.id, c.name]));
		return w.bequests.every(
			(b) => b.percentage > 0 && resolveWillWasiyyahRecipientName(b, presetNames).length > 0,
		);
	}
	if (typeof v === 'string') return v.trim().length > 0;
	return true;
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

export function getAddress(responses: WillResponses): AddressValue | undefined {
	const v = responses['address'];
	if (v && typeof v === 'object' && 'street' in v) return v as AddressValue;
	return undefined;
}

/** Single-line address combining the address fields with the selected state. */
export function formatAddress(responses: WillResponses): string {
	const a = getAddress(responses);
	if (!a) return '';
	const stateCode = typeof responses['state'] === 'string' ? responses['state'] : '';
	const line1 = [a.street, a.unit].filter((p) => p && p.trim()).join(', ');
	const line2 = [a.city, stateName(stateCode), a.zip].filter((p) => p && p.trim()).join(', ');
	return [line1, line2].filter((p) => p).join(', ');
}

/** The confirmed heirs-calculator response, if the user has completed it. */
export function getHeirsResponse(responses: WillResponses): HeirsCalculatorResponse | undefined {
	const v = responses['heirs'];
	if (v && typeof v === 'object' && 'verified' in v) return v as HeirsCalculatorResponse;
	return undefined;
}

/** The named heirs (with names + shares) from the heirs-calculator response. */
export function getNamedHeirs(responses: WillResponses): NamedHeir[] {
	return getHeirsResponse(responses)?.namedHeirs ?? [];
}

export function childrenCounts(responses: WillResponses): ChildrenCounts {
	const heirs = getNamedHeirs(responses);
	const sons = heirs.filter((h) => h.heirType === 'son').reduce((s, h) => s + (h.count || 0), 0);
	const daughters = heirs
		.filter((h) => h.heirType === 'daughter')
		.reduce((s, h) => s + (h.count || 0), 0);
	return { sons, daughters };
}

export function hasChildren(responses: WillResponses): boolean {
	const { sons, daughters } = childrenCounts(responses);
	return sons + daughters > 0;
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

// ─── Will limitation warning ─────────────────────────────────────────────────

/** Situations where a will alone may not fully implement Islamic inheritance. */
export type WillLimitationReason =
	| 'married'
	| 'homeowner'
	| 'retirement_accounts'
	| 'life_insurance'
	| 'strict_faraid';

export const willLimitationWarningIntro =
	'A will alone may not fully implement Islamic inheritance in your situation.';

export const willLimitationReasonLabels: Record<WillLimitationReason, string> = {
	married:
		'Married couples may have property rights between spouses that pass outside a will.',
	homeowner:
		'Homes can pass outside your will depending on how title is held and state law.',
	retirement_accounts:
		'Retirement accounts such as 401(k)s and IRAs typically pass by beneficiary designation, not your will.',
	life_insurance:
		'Life insurance proceeds typically pass by beneficiary designation, not your will.',
	strict_faraid:
		'You indicated that strict faraid compliance is important to you.',
};

export const willLimitationWarningOutro =
	'Additional planning \u2014 such as a trust or a beneficiary designation review \u2014 may be needed to align your estate with faraid.';

/** Returns the active limitation reasons for this user\u2019s responses. */
export function getWillLimitationReasons(responses: WillResponses): WillLimitationReason[] {
	const reasons: WillLimitationReason[] = [];
	if (isMarried(responses)) reasons.push('married');
	if (responses['own_home'] === true) reasons.push('homeowner');
	if (responses['retirement_accounts'] === true) reasons.push('retirement_accounts');
	if (responses['life_insurance'] === true) reasons.push('life_insurance');
	if (responses['strict_faraid'] === true) reasons.push('strict_faraid');
	return reasons;
}

/** True when the app should flag that a will alone may not fully implement Islamic inheritance. */
export function needsWillLimitationWarning(responses: WillResponses): boolean {
	return getWillLimitationReasons(responses).length > 0;
}

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
	| 'attorney_interest'
	| 'strict_faraid_intent'
	| 'will_limitation_flag';

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
	if (responses['strict_faraid'] === true) tags.add('strict_faraid_intent');
	if (needsWillLimitationWarning(responses)) tags.add('will_limitation_flag');

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
 * The `EstateInput` captured by the heirs-calculator step. This is the canonical
 * record of the family structure; the calculator already validated and used it.
 * Falls back to a minimal input (gender + spouse) before the step is completed.
 */
export function buildEstateInput(responses: WillResponses): EstateInput {
	const stored = getHeirsResponse(responses)?.estateInput;
	if (stored) return stored;

	const gender = responses['gender'] === 'Female' ? 'female' : 'male';
	return {
		decedentGender: gender,
		spouse: isMarried(responses),
		fatherAlive: responses['father_alive'] === true,
		motherAlive: responses['mother_alive'] === true,
		sons: 0,
		daughters: 0,
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

/** The gender→trust questionId the heirs-calculator component expects. */
export function heirsQuestionId(responses: WillResponses): 'husband-heirs' | 'wife-heirs' {
	return responses['gender'] === 'Female' ? 'wife-heirs' : 'husband-heirs';
}

/**
 * Map will responses into the keys `HeirsCalculatorInput` reads for pre-filling
 * parent alive checkboxes, spouse presence, spouse name, and parent names.
 */
export function heirsCalculatorAllResponses(
	responses: WillResponses,
): Record<string, QuestionResponseValue> {
	const spouseName =
		typeof responses['spouse_name'] === 'string' ? responses['spouse_name'].trim() : '';
	const fatherName =
		typeof responses['father_name'] === 'string' ? responses['father_name'].trim() : '';
	const motherName =
		typeof responses['mother_name'] === 'string' ? responses['mother_name'].trim() : '';

	const mapped: Record<string, QuestionResponseValue> = {
		'father-alive': responses['father_alive'] === true,
		'mother-alive': responses['mother_alive'] === true,
		'father-name': fatherName,
		'mother-name': motherName,
		'spouse-present': isMarried(responses),
	};

	// Reuse the trust spouse-data keys so getSpouseAutoName() works unchanged.
	const spouseDataId = responses['gender'] === 'Female' ? 'husband-data' : 'wife-data';
	if (spouseName) {
		const spouseData: PersonalDataResponse = { name: spouseName, dob: '', county: '' };
		mapped[spouseDataId] = spouseData;
	}

	return mapped;
}

export type { YesNoUnsure };
