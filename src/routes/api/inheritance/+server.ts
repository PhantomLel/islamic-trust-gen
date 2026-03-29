import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { IslamicInheritanceCalculator } from '$lib/inheritance/calculator';
import type { EstateInput } from '$lib/inheritance/types';

const ESTATE_INPUT_KEYS: (keyof EstateInput)[] = [
	'decedentGender', 'spouse',
	'fatherAlive', 'motherAlive',
	'sons', 'daughters',
	'sonsOfSons', 'daughtersOfSons',
	'paternalGrandfatherAlive', 'paternalGrandmotherAlive', 'maternalGrandmotherAlive',
	'fullBrothers', 'fullSisters',
	'paternalHalfBrothers', 'paternalHalfSisters',
	'maternalHalfBrothers', 'maternalHalfSisters',
	'fullPaternalUncles',
];

function validateEstateInput(body: unknown): { valid: true; input: EstateInput } | { valid: false; error: string } {
	if (!body || typeof body !== 'object') {
		return { valid: false, error: 'Request body must be a JSON object' };
	}

	const obj = body as Record<string, unknown>;

	if (obj.decedentGender !== 'male' && obj.decedentGender !== 'female') {
		return { valid: false, error: 'decedentGender must be "male" or "female"' };
	}

	const booleanFields: (keyof EstateInput)[] = [
		'spouse', 'fatherAlive', 'motherAlive',
		'paternalGrandfatherAlive', 'paternalGrandmotherAlive', 'maternalGrandmotherAlive',
	];
	for (const field of booleanFields) {
		if (typeof obj[field] !== 'boolean') {
			return { valid: false, error: `${field} must be a boolean` };
		}
	}

	const numberFields: (keyof EstateInput)[] = [
		'sons', 'daughters', 'sonsOfSons', 'daughtersOfSons',
		'fullBrothers', 'fullSisters',
		'paternalHalfBrothers', 'paternalHalfSisters',
		'maternalHalfBrothers', 'maternalHalfSisters',
		'fullPaternalUncles',
	];
	for (const field of numberFields) {
		const val = obj[field];
		if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
			return { valid: false, error: `${field} must be a non-negative integer` };
		}
	}

	return { valid: true, input: obj as unknown as EstateInput };
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const validation = validateEstateInput(body);
	if (!validation.valid) {
		return json({ error: validation.error }, { status: 400 });
	}

	const calculator = new IslamicInheritanceCalculator(validation.input);
	const result = calculator.calculate();

	return json({
		heirs: result.heirs.map((h) => ({
			heirType: h.heirType,
			label: h.label,
			count: h.count,
			totalShare: h.totalShare.toJSON(),
			perPersonShare: h.perPersonShare.toJSON(),
			shareType: h.shareType,
			reasons: h.reasons,
		})),
		blockedHeirs: result.blockedHeirs,
		totalFixedShares: result.totalFixedShares.toJSON(),
		residual: result.residual.toJSON(),
		awlApplied: result.awlApplied,
		raddApplied: result.raddApplied,
		dhawulArhamNeeded: result.dhawulArhamNeeded,
		notes: result.notes,
		error: result.error,
	});
};
