import type { QuestionResponseValue, ChildResponse, HeirResponse } from '$lib/config';
import type { EstateInput, DecedentGender } from './types';

/**
 * Convert questionnaire responses (Record<string, QuestionResponseValue>)
 * into the structured EstateInput the calculator expects.
 *
 * NOTE: The questionnaire skips sibling questions when father is alive.
 * This means the calculator cannot detect the "2+ siblings reduce mother
 * to 1/6" rule in that scenario. If you need full accuracy, ensure
 * sibling counts are provided separately.
 */
export function convertResponsesToEstateInput(
	responses: Record<string, QuestionResponseValue>
): EstateInput {
	const gender = (responses['gender'] as string)?.toLowerCase() as DecedentGender | undefined;

	return {
		decedentGender: gender === 'female' ? 'female' : 'male',
		spouse: responses['married'] === true,
		fatherAlive: responses['father-alive'] === true,
		motherAlive: responses['mother-alive'] === true,
		sons: countChildren(responses['children-data-sons']),
		daughters: countChildren(responses['children-data-daughters']),
		sonsOfSons: countHeirs(responses['grandchildren-data-sons-predeceased']),
		daughtersOfSons: countHeirs(responses['grandchildren-data-sons-daughters']),
		paternalGrandfatherAlive: responses['grandfather-paternal-alive'] === true,
		paternalGrandmotherAlive: responses['grandmother-paternal-alive'] === true,
		maternalGrandmotherAlive: responses['grandmother-maternal-alive'] === true,
		fullBrothers: countHeirs(responses['siblings-data-full-brothers']),
		fullSisters: countHeirs(responses['siblings-data-full-sisters']),
		paternalHalfBrothers: countHeirs(responses['siblings-data-paternal-brothers']),
		paternalHalfSisters: countHeirs(responses['siblings-data-paternal-sisters']),
		maternalHalfBrothers: countHeirs(responses['siblings-data-maternal-brothers']),
		maternalHalfSisters: countHeirs(responses['siblings-data-maternal-sisters']),
		fullPaternalUncles: countHeirs(responses['paternal-uncles-full-data']),
	};
}

function countChildren(value: QuestionResponseValue): number {
	if (!Array.isArray(value)) return 0;
	return (value as ChildResponse[]).filter(
		(c) => c && typeof c === 'object' && 'firstName' in c && c.firstName?.trim()
	).length;
}

function countHeirs(value: QuestionResponseValue): number {
	if (!Array.isArray(value)) return 0;
	return (value as HeirResponse[]).filter(
		(h) => h && typeof h === 'object' && 'firstName' in h && h.firstName?.trim()
	).length;
}
