import {
	allIntakeQuestions,
	charities as configuredCharities,
	prePaymentQuestions,
	type ChildResponse,
	type CharityResponse,
	type CharitiesResponse,
	type HeirResponse,
	type MinorDistributionResponse,
	type NonCharitableBequestEntry,
	type NonCharitableBequestsResponse,
	type PersonalDataResponse,
	type Question,
	type QuestionResponseValue
} from '$lib/config';

/** Islamic wasiyyah cap: one-third of the estate (charitable + non-charitable combined). */
export const WASIYYAH_THIRD_PERCENT = 100 / 3;

const CHARITY_ID_SET = new Set(configuredCharities.map((c) => c.id));

/** Minimum charitable wasiyyah to one preset or user-added charity when the user chose the discounted (pledge) plan. */
export const DISCOUNTED_CHARITY_MIN_PCT = 1;

/** User-added charity row (name + EIN stored on the response). */
export function isCustomCharityResponse(c: unknown): c is CharityResponse & { customName: string; customEin: string } {
	return (
		!!c &&
		typeof c === 'object' &&
		'customName' in c &&
		typeof (c as CharityResponse).customName === 'string'
	);
}

export function isCharitiesResponseShape(value: unknown): value is CharitiesResponse {
	return (
		value != null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'husbandInterested' in value &&
		'wifeInterested' in value &&
		'husbandCharities' in value &&
		'wifeCharities' in value &&
		Array.isArray((value as CharitiesResponse).husbandCharities) &&
		Array.isArray((value as CharitiesResponse).wifeCharities)
	);
}

function meetsPledgeForCharityRow(c: CharityResponse): boolean {
	if (
		typeof c.charityId !== 'string' ||
		typeof c.percentage !== 'number' ||
		Number.isNaN(c.percentage) ||
		c.percentage < DISCOUNTED_CHARITY_MIN_PCT - 1e-6
	) {
		return false;
	}
	if (CHARITY_ID_SET.has(c.charityId)) return true;
	if (isCustomCharityResponse(c)) {
		return c.customName.trim() !== '' && c.customEin.trim() !== '';
	}
	return false;
}

/** True when at least one listed or user-added charity (from either spouse) has a wasiyyah allocation at or above the discounted-plan minimum. */
export function meetsDiscountedCharityPledge(charitiesValue: unknown): boolean {
	if (!isCharitiesResponseShape(charitiesValue)) return false;
	const all = [...charitiesValue.husbandCharities, ...charitiesValue.wifeCharities];
	return all.some((raw) => meetsPledgeForCharityRow(raw));
}

/** Total charitable wasiyyah for the husband's estate. */
export function getHusbandCharityPercentage(charitiesValue: unknown): number {
	if (!isCharitiesResponseShape(charitiesValue)) return 0;
	return charitiesValue.husbandCharities.reduce((sum, c) => sum + (c.percentage || 0), 0);
}

/** Total charitable wasiyyah for the wife's estate. */
export function getWifeCharityPercentage(charitiesValue: unknown): number {
	if (!isCharitiesResponseShape(charitiesValue)) return 0;
	return charitiesValue.wifeCharities.reduce((sum, c) => sum + (c.percentage || 0), 0);
}

export type QuestionCompletionContext = {
	selectedPlan?: string | null;
};

export function isNonCharitableBequestsShape(value: unknown): value is NonCharitableBequestsResponse {
	return (
		value != null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'husbandInterested' in value &&
		'wifeInterested' in value &&
		'husbandBequests' in value &&
		'wifeBequests' in value &&
		typeof (value as NonCharitableBequestsResponse).husbandInterested === 'boolean' &&
		typeof (value as NonCharitableBequestsResponse).wifeInterested === 'boolean' &&
		Array.isArray((value as NonCharitableBequestsResponse).husbandBequests) &&
		Array.isArray((value as NonCharitableBequestsResponse).wifeBequests)
	);
}

function sumBequestPercentages(rows: NonCharitableBequestEntry[]): number {
	return rows.reduce((s, e) => s + (typeof e.percentage === 'number' && !Number.isNaN(e.percentage) ? e.percentage : 0), 0);
}

export function getTotalNonCharitableBequestPercentage(value: unknown): number {
	if (!isNonCharitableBequestsShape(value)) return 0;
	return sumBequestPercentages(value.husbandBequests) + sumBequestPercentages(value.wifeBequests);
}

export function getCombinedWasiyyahPercentage(charitiesValue: unknown, nonCharitableValue: unknown): number {
	return getTotalCharityPercentage(charitiesValue) + getTotalNonCharitableBequestPercentage(nonCharitableValue);
}

function isNonCharitableBequestEntryComplete(e: unknown): e is NonCharitableBequestEntry {
	if (e == null || typeof e !== 'object' || Array.isArray(e)) return false;
	const row = e as Partial<NonCharitableBequestEntry>;
	return (
		typeof row.recipientName === 'string' &&
		row.recipientName.trim() !== '' &&
		typeof row.relationship === 'string' &&
		row.relationship.trim() !== '' &&
		typeof row.percentage === 'number' &&
		Number.isInteger(row.percentage) &&
		row.percentage >= 1 &&
		row.percentage <= 33
	);
}

function isNonCharitableBequestsComplete(
	value: unknown,
	allResponses?: Record<string, QuestionResponseValue>
): boolean {
	if (!isNonCharitableBequestsShape(value)) return false;

	const charitiesValue = allResponses?.['charities'];
	const husbandCharityPct = allResponses ? getHusbandCharityPercentage(charitiesValue) : 0;
	const wifeCharityPct = allResponses ? getWifeCharityPercentage(charitiesValue) : 0;
	if (husbandCharityPct + sumBequestPercentages(value.husbandBequests) > WASIYYAH_THIRD_PERCENT + 1e-6) return false;
	if (wifeCharityPct + sumBequestPercentages(value.wifeBequests) > WASIYYAH_THIRD_PERCENT + 1e-6) return false;

	if (value.husbandInterested) {
		if (value.husbandBequests.length === 0) return false;
		if (!value.husbandBequests.every((e) => isNonCharitableBequestEntryComplete(e))) return false;
	} else if (value.husbandBequests.length > 0) {
		return false;
	}

	if (value.wifeInterested) {
		if (value.wifeBequests.length === 0) return false;
		if (!value.wifeBequests.every((e) => isNonCharitableBequestEntryComplete(e))) return false;
	} else if (value.wifeBequests.length > 0) {
		return false;
	}

	return true;
}

const MINOR_MODES = ['staggered', 'single-age', 'age-of-majority'] as const;

function isMinorDistributionShape(value: unknown): value is MinorDistributionResponse {
	if (value == null || typeof value !== 'object' || Array.isArray(value) || !('mode' in value)) {
		return false;
	}
	const m = (value as { mode: string }).mode;
	return MINOR_MODES.includes(m as (typeof MINOR_MODES)[number]);
}

function isMinorDistributionComplete(value: unknown): boolean {
	if (!isMinorDistributionShape(value)) return false;
	if (value.mode === 'age-of-majority') return true;
	if (value.mode === 'single-age') {
		return Number.isInteger(value.age) && value.age >= 18 && value.age <= 30;
	}
	const v = value;
	const sum = v.firstPercent + v.secondPercent;
	const remainder = 100 - sum;
	if (
		!Number.isInteger(v.firstPercent) ||
		!Number.isInteger(v.secondPercent) ||
		v.firstPercent < 1 ||
		v.secondPercent < 1 ||
		sum > 99 ||
		remainder < 1
	) {
		return false;
	}
	for (const age of [v.firstAge, v.secondAge, v.remainderAge]) {
		if (!Number.isInteger(age) || age < 18 || age > 30) return false;
	}
	if (v.firstAge > v.secondAge || v.secondAge > v.remainderAge) return false;
	return true;
}

export function isPersonalDataShape(value: unknown): value is PersonalDataResponse {
	return (
		value != null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'name' in value &&
		'dob' in value &&
		'county' in value &&
		!('verified' in value)
	);
}

export function isChildResponseComplete(child: Partial<ChildResponse>): boolean {
	return (
		typeof child.firstName === 'string' &&
		child.firstName.trim() !== '' &&
		typeof child.lastName === 'string' &&
		child.lastName.trim() !== '' &&
		typeof child.dob === 'string' &&
		child.dob.trim() !== ''
	);
}

export function isCharityResponseComplete(charity: Partial<CharityResponse>): boolean {
	if (
		typeof charity.charityId !== 'string' ||
		charity.charityId.trim() === '' ||
		typeof charity.percentage !== 'number' ||
		charity.percentage <= 0
	) {
		return false;
	}
	if (isCustomCharityResponse(charity)) {
		return charity.customName.trim() !== '' && charity.customEin.trim() !== '';
	}
	return true;
}

export function isHeirResponseComplete(heir: Partial<HeirResponse>): boolean {
	return (
		typeof heir.firstName === 'string' &&
		heir.firstName.trim() !== '' &&
		typeof heir.lastName === 'string' &&
		heir.lastName.trim() !== ''
	);
}

export function getTotalCharityPercentage(value: unknown): number {
	if (isCharitiesResponseShape(value)) {
		return getHusbandCharityPercentage(value) + getWifeCharityPercentage(value);
	}
	return 0;
}

export function isQuestionResponseAnswered(value: unknown): boolean {
	if (isCharitiesResponseShape(value)) {
		return true;
	}
	if (Array.isArray(value)) {
		if (value.length === 0) return false;
		const first = value[0];
		if (first && typeof first === 'object' && 'firstName' in first) {
			if ('dob' in first) {
				return value.some((child) => !!child && typeof child === 'object' && isChildResponseComplete(child));
			}
			return value.some((heir) => !!heir && typeof heir === 'object' && isHeirResponseComplete(heir));
		}
		if (first && typeof first === 'object' && 'assetName' in first) {
			return value.some((entry) => typeof entry?.assetName === 'string' && entry.assetName.trim() !== '');
		}
		if (first && typeof first === 'object' && 'fullName' in first && 'relationship' in first) {
			return value.some((entry) => typeof entry?.fullName === 'string' && entry.fullName.trim() !== '');
		}
		if (first && typeof first === 'object' && 'itemDescription' in first) {
			return value.some((entry) => typeof entry?.itemDescription === 'string' && entry.itemDescription.trim() !== '');
		}
		return false;
	}
	if (value != null && typeof value === 'object' && !Array.isArray(value) && 'husbandConfirmation' in value) {
		const heba = value as { husbandConfirmation: string | null; wifeConfirmation: string | null };
		return heba.husbandConfirmation !== null || heba.wifeConfirmation !== null;
	}
	if (value != null && typeof value === 'object' && 'verified' in value) {
		return (value as { verified: boolean }).verified === true;
	}
	if (isPersonalDataShape(value)) {
		return [value.name, value.dob, value.county].some(
			(s) => typeof s === 'string' && s.trim() !== ''
		);
	}
	if (isMinorDistributionShape(value)) {
		return true;
	}
	if (isNonCharitableBequestsShape(value)) {
		return true;
	}
	return value != null && value !== '';
}

export function isQuestionResponseComplete(
	type: Question['type'],
	value: unknown,
	allResponses?: Record<string, QuestionResponseValue>,
	context?: QuestionCompletionContext
): boolean {
	if (type === 'heirs-calculator') {
		return (
			value != null &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			'verified' in value &&
			(value as { verified: boolean }).verified === true
		);
	}
	if (type === 'children') {
		return (
			Array.isArray(value) &&
			value.length > 0 &&
			value.every((child) => !!child && typeof child === 'object' && isChildResponseComplete(child))
		);
	}
	if (type === 'heir') {
		return (
			Array.isArray(value) &&
			value.length > 0 &&
			value.every((heir) => !!heir && typeof heir === 'object' && isHeirResponseComplete(heir))
		);
	}
	if (type === 'charities') {
		if (!isCharitiesResponseShape(value)) return false;
		if (value.husbandInterested) {
			if (value.husbandCharities.length === 0) return false;
			if (!value.husbandCharities.every((c) => isCharityResponseComplete(c))) return false;
			if (getHusbandCharityPercentage(value) > WASIYYAH_THIRD_PERCENT + 1e-6) return false;
		}
		if (value.wifeInterested) {
			if (value.wifeCharities.length === 0) return false;
			if (!value.wifeCharities.every((c) => isCharityResponseComplete(c))) return false;
			if (getWifeCharityPercentage(value) > WASIYYAH_THIRD_PERCENT + 1e-6) return false;
		}
		const discounted = context?.selectedPlan === 'discounted';
		if (discounted && !meetsDiscountedCharityPledge(value)) return false;
		return true;
	}
	if (type === 'tel') {
		return typeof value === 'string' && value.replace(/\D/g, '').length === 10;
	}
	if (type === 'heba') {
		if (value == null || typeof value !== 'object' || Array.isArray(value)) return false;
		if (!('husbandConfirmation' in value)) return false;
		const heba = value as { husbandConfirmation: string | null; wifeConfirmation: string | null };
		return heba.husbandConfirmation !== null && heba.wifeConfirmation !== null;
	}
	if (type === 'heba-assets') {
		return true; // optional — all heba property is jointly owned regardless of what's listed
	}
	if (type === 'separate-property') {
		return true; // optional — user can leave it blank
	}
	if (type === 'personal-property') {
		return true; // optional — user can skip if no high-value items
	}
	if (type === 'house-deed') {
		return true; // optional — upload goes directly to trust.house_deed_url, not responses
	}
	if (type === 'trustee-on-first-death') {
		return value === 'survivor-serves' || value === 'survivor-skipped';
	}
	if (type === 'successor-trustees') {
		if (!Array.isArray(value) || value.length === 0) return false;
		const valid = value.filter(
			(e) => e && typeof e === 'object' && typeof e.fullName === 'string' && e.fullName.trim() !== '' && typeof e.relationship === 'string' && e.relationship.trim() !== ''
		);
		return valid.length >= 2;
	}
	if (type === 'pour-over-representatives') {
		if (!Array.isArray(value) || value.length === 0) return false;
		const valid = value.filter(
			(e) => e && typeof e === 'object' && typeof e.fullName === 'string' && e.fullName.trim() !== '' && typeof e.relationship === 'string' && e.relationship.trim() !== ''
		);
		return valid.length >= 1;
	}
	if (type === 'heir-preview' || type === 'summary-review') {
		if (
			type === 'summary-review' &&
			context?.selectedPlan === 'discounted' &&
			allResponses &&
			!meetsDiscountedCharityPledge(allResponses['charities'])
		) {
			return false;
		}
		return value === true;
	}
	if (type === 'minor-distribution') {
		return isMinorDistributionComplete(value);
	}
	if (type === 'non-charitable-bequests') {
		if (value == null) return true;
		return isNonCharitableBequestsComplete(value, allResponses);
	}
	if (type === 'assets') {
		if (!Array.isArray(value) || value.length === 0) return false;
		return value.every(
			(entry) =>
				entry != null &&
				typeof entry === 'object' &&
				typeof entry.assetName === 'string' &&
				entry.assetName.trim() !== '' &&
				['husband', 'wife', '50-50'].includes(entry.spouse)
		);
	}
	if (type === 'personal-data') {
		if (!isPersonalDataShape(value)) return false;
		return (
			typeof value.name === 'string' &&
			value.name.trim() !== '' &&
			typeof value.dob === 'string' &&
			value.dob.trim() !== '' &&
			typeof value.county === 'string' &&
			value.county.trim() !== ''
		);
	}
	return isQuestionResponseAnswered(value);
}

export function getActiveQuestions(
	responses: Record<string, QuestionResponseValue>,
	questionList: Question[]
): { active: Question[]; autoValues: Record<string, string | boolean> } {
	const autoValues: Record<string, string | boolean> = {};
	const active = questionList.filter((q) => {
		if (q.defaultWhen && responses[q.defaultWhen.field] === q.defaultWhen.eq) {
			autoValues[q.id] = q.defaultWhen.value;
			return false;
		}
		if (q.depends) {
			if (Array.isArray(q.depends)) {
				return q.depends.every((dep) => responses[dep.field] === dep.eq);
			} else {
				return responses[q.depends.field] === q.depends.eq;
			}
		}
		return true;
	});
	return { active, autoValues };
}

/** True when every question in `questionList` that is active for `record` has a complete response. */
export function isIntakePhaseComplete(
	record: Record<string, QuestionResponseValue>,
	questionList: Question[],
	completionContext?: QuestionCompletionContext
): boolean {
	const { active } = getActiveQuestions(record, questionList);
	return active.every((q) =>
		isQuestionResponseComplete(q.type, record[q.id], record, completionContext)
	);
}

export type IntakeProgressOptions = {
	/** When false, only pre-payment questions count (matches create-trust gating). */
	hasPaid?: boolean;
};

export function responsesRowsToRecord(
	rows: { id: string; response: unknown }[]
): Record<string, QuestionResponseValue> {
	return Object.fromEntries(
		rows.map((r) => [r.id, r.response as QuestionResponseValue])
	);
}

/** Progress for admin/dashboard: active intake questions only, capped at 100%. */
export function getIntakeQuestionnaireProgress(
	responseRows: { id: string; response: unknown }[],
	options: IntakeProgressOptions = {}
): number {
	const hasPaid = options.hasPaid ?? false;
	const record = responsesRowsToRecord(responseRows);
	const questionList = hasPaid ? allIntakeQuestions : prePaymentQuestions;
	const { active } = getActiveQuestions(record, questionList);
	if (active.length === 0) return 0;
	const answered = active.filter((q) => isQuestionResponseAnswered(record[q.id])).length;
	return Math.min(100, Math.round((answered / active.length) * 100));
}
