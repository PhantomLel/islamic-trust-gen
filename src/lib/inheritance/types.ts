import type { Fraction } from './Fraction';

export type DecedentGender = 'male' | 'female';

/**
 * Structured input for the inheritance calculator.
 * Each field represents the count or presence of a specific heir category.
 * The calculator applies its own blocking logic, so include ALL heirs
 * that actually exist (alive at time of death), even if you think they
 * might be blocked.
 */
export type EstateInput = {
	decedentGender: DecedentGender;
	spouse: boolean;
	fatherAlive: boolean;
	motherAlive: boolean;
	sons: number;
	daughters: number;
	sonsOfSons: number;
	daughtersOfSons: number;
	paternalGrandfatherAlive: boolean;
	paternalGrandmotherAlive: boolean;
	maternalGrandmotherAlive: boolean;
	fullBrothers: number;
	fullSisters: number;
	paternalHalfBrothers: number;
	paternalHalfSisters: number;
	maternalHalfBrothers: number;
	maternalHalfSisters: number;
	fullPaternalUncles: number;
};

export type HeirType =
	| 'husband'
	| 'wife'
	| 'father'
	| 'mother'
	| 'son'
	| 'daughter'
	| 'sons_of_sons'
	| 'daughters_of_sons'
	| 'paternal_grandfather'
	| 'paternal_grandmother'
	| 'maternal_grandmother'
	| 'full_brother'
	| 'full_sister'
	| 'paternal_half_brother'
	| 'paternal_half_sister'
	| 'maternal_half_brother'
	| 'maternal_half_sister'
	| 'full_paternal_uncle';

export type ShareType = 'fixed' | 'residuary' | 'fixed_and_residuary';

export type HeirAllocation = {
	heirType: HeirType;
	label: string;
	count: number;
	totalShare: Fraction;
	perPersonShare: Fraction;
	shareType: ShareType;
	reasons: string[];
};

export type BlockedHeir = {
	heirType: HeirType;
	label: string;
	reason: string;
};

export type CalculationResult = {
	heirs: HeirAllocation[];
	blockedHeirs: BlockedHeir[];
	totalFixedShares: Fraction;
	residual: Fraction;
	awlApplied: boolean;
	raddApplied: boolean;
	dhawulArhamNeeded: boolean;
	notes: string[];
	error?: string;
};

export const HEIR_LABELS: Record<HeirType, string> = {
	husband: 'Husband',
	wife: 'Wife',
	father: 'Father',
	mother: 'Mother',
	son: 'Son',
	daughter: 'Daughter',
	sons_of_sons: "Grandson (son's son)",
	daughters_of_sons: "Granddaughter (son's daughter)",
	paternal_grandfather: 'Paternal Grandfather',
	paternal_grandmother: 'Paternal Grandmother',
	maternal_grandmother: 'Maternal Grandmother',
	full_brother: 'Full Brother',
	full_sister: 'Full Sister',
	paternal_half_brother: 'Paternal Half-Brother',
	paternal_half_sister: 'Paternal Half-Sister',
	maternal_half_brother: 'Maternal Half-Brother',
	maternal_half_sister: 'Maternal Half-Sister',
	full_paternal_uncle: 'Full Paternal Uncle',
};
