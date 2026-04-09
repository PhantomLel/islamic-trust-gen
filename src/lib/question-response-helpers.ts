import {
	type ChildResponse,
	type CharityResponse,
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

	const charityPct = allResponses ? getTotalCharityPercentage(allResponses['charities']) : 0;
	const nonCharityTotal = getTotalNonCharitableBequestPercentage(value);
	if (charityPct + nonCharityTotal > WASIYYAH_THIRD_PERCENT + 1e-6) return false;

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
	return (
		typeof charity.charityId === 'string' &&
		charity.charityId.trim() !== '' &&
		typeof charity.percentage === 'number' &&
		charity.percentage > 0
	);
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
	if (!Array.isArray(value)) return 0;
	return value
		.filter((item): item is CharityResponse => 
			!!item && typeof item === 'object' && 'charityId' in item
		)
		.reduce((sum, c) => sum + (c.percentage || 0), 0);
}

export function isQuestionResponseAnswered(value: unknown): boolean {
	if (Array.isArray(value)) {
		if (value.length === 0) return false;
		const first = value[0];
		if (first && typeof first === 'object' && 'firstName' in first) {
			if ('dob' in first) {
				return value.some((child) => !!child && typeof child === 'object' && isChildResponseComplete(child));
			}
			return value.some((heir) => !!heir && typeof heir === 'object' && isHeirResponseComplete(heir));
		}
		if (first && typeof first === 'object' && 'charityId' in first) {
			return value.some((charity) => !!charity && typeof charity === 'object' && isCharityResponseComplete(charity));
		}
		if (first && typeof first === 'object' && 'assetName' in first) {
			return value.some((entry) => typeof entry?.assetName === 'string' && entry.assetName.trim() !== '');
		}
		if (first && typeof first === 'object' && 'fullName' in first && 'relationship' in first) {
			return value.some((entry) => typeof entry?.fullName === 'string' && entry.fullName.trim() !== '');
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
	allResponses?: Record<string, QuestionResponseValue>
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
		if (!Array.isArray(value) || value.length === 0) return true;
		const allComplete = value.every((charity) => !!charity && typeof charity === 'object' && isCharityResponseComplete(charity));
		const totalPercentage = getTotalCharityPercentage(value);
		return allComplete && totalPercentage <= WASIYYAH_THIRD_PERCENT + 1e-6;
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
	if (type === 'separate-property') {
		return true; // optional — user can leave it blank
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
	if (type === 'heir-preview') {
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
