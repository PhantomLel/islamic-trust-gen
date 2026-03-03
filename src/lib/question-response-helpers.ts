import { questions, type ChildResponse, type Question, type QuestionResponseValue } from '$lib/config';

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

export function isQuestionResponseAnswered(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.some((child) => !!child && typeof child === 'object' && isChildResponseComplete(child));
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
		if (q.depends && responses[q.depends.field] !== q.depends.eq) {
			return false;
		}
		return true;
	});
	return { active, autoValues };
}
