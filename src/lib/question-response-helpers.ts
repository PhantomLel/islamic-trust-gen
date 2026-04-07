import {
	type ChildResponse,
	type CharityResponse,
	type HeirResponse,
	type PersonalDataResponse,
	type Question,
	type QuestionResponseValue
} from '$lib/config';

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
	return value != null && value !== '';
}

export function isQuestionResponseComplete(type: Question['type'], value: unknown): boolean {
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
		return allComplete && totalPercentage <= 100;
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
