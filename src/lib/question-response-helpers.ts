import {
	questions,
	type ChildResponse,
	type CharityResponse,
	type HeirResponse,
	type Question,
	type QuestionResponseValue
} from '$lib/config';

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
		return false;
	}
	return value != null && value !== '';
}

export function isQuestionResponseComplete(type: Question['type'], value: unknown): boolean {
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
	return isQuestionResponseAnswered(value);
}

export function getActiveQuestions(
	responses: Record<string, QuestionResponseValue>
): { active: Question[]; autoValues: Record<string, string | boolean> } {
	const autoValues: Record<string, string | boolean> = {};
	const active = questions.filter((q) => {
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
