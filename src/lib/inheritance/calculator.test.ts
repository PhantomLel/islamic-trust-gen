import { describe, it, expect } from 'vitest';
import { IslamicInheritanceCalculator } from './calculator';
import { Fraction, frac } from './Fraction';
import type { EstateInput, HeirType } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────

const EMPTY: EstateInput = {
	decedentGender: 'male',
	spouse: false,
	fatherAlive: false,
	motherAlive: false,
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

function calc(overrides: Partial<EstateInput>) {
	return new IslamicInheritanceCalculator({ ...EMPTY, ...overrides }).calculate();
}

function share(result: ReturnType<typeof calc>, heir: HeirType): Fraction | null {
	const entry = result.heirs.find((h) => h.heirType === heir);
	return entry ? entry.totalShare : null;
}

function perPerson(result: ReturnType<typeof calc>, heir: HeirType): Fraction | null {
	const entry = result.heirs.find((h) => h.heirType === heir);
	return entry ? entry.perPersonShare : null;
}

function isBlocked(result: ReturnType<typeof calc>, heir: HeirType): boolean {
	return result.blockedHeirs.some((b) => b.heirType === heir);
}

function totalSumEqualsOne(result: ReturnType<typeof calc>): boolean {
	let sum = Fraction.ZERO;
	for (const h of result.heirs) {
		sum = sum.add(h.totalShare);
	}
	return sum.equals(Fraction.ONE);
}

function expectFrac(actual: Fraction | null, n: number, d: number) {
	expect(actual).not.toBeNull();
	const expected = frac(n, d);
	expect(actual!.equals(expected), `expected ${expected}, got ${actual}`).toBe(true);
}

// ─── Fraction class ───────────────────────────────────────────────────

describe('Fraction', () => {
	it('auto-simplifies', () => {
		const f = frac(4, 8);
		expect(f.n).toBe(1);
		expect(f.d).toBe(2);
	});

	it('handles zero numerator', () => {
		const f = frac(0, 5);
		expect(f.n).toBe(0);
		expect(f.d).toBe(1);
	});

	it('normalises negative denominator', () => {
		const f = frac(3, -6);
		expect(f.n).toBe(-1);
		expect(f.d).toBe(2);
	});

	it('adds correctly', () => {
		expect(frac(1, 3).add(frac(1, 6)).equals(frac(1, 2))).toBe(true);
	});

	it('subtracts correctly', () => {
		expect(frac(1, 2).subtract(frac(1, 6)).equals(frac(1, 3))).toBe(true);
	});

	it('multiplies correctly', () => {
		expect(frac(2, 3).multiply(frac(3, 4)).equals(frac(1, 2))).toBe(true);
	});

	it('divides correctly', () => {
		expect(frac(1, 2).divide(frac(3, 4)).equals(frac(2, 3))).toBe(true);
	});

	it('throws on zero denominator', () => {
		expect(() => frac(1, 0)).toThrow();
	});

	it('toJSON produces expected output', () => {
		const j = frac(1, 3).toJSON();
		expect(j.numerator).toBe(1);
		expect(j.denominator).toBe(3);
		expect(j.display).toBe('1/3');
	});
});

// ─── Basic cases ──────────────────────────────────────────────────────

describe('Basic inheritance cases', () => {
	it('wife + 1 son + 1 daughter (free-will v11 regression — packet QA)', () => {
		const r = calc({ spouse: true, sons: 1, daughters: 1 });

		expectFrac(share(r, 'wife'), 1, 8);
		expectFrac(perPerson(r, 'son'), 7, 12);
		expectFrac(perPerson(r, 'daughter'), 7, 24);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('wife + 2 sons + 1 daughter + both parents', () => {
		const r = calc({
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
			sons: 2,
			daughters: 1,
		});

		expectFrac(share(r, 'wife'), 1, 8);
		expectFrac(share(r, 'father'), 1, 6);
		expectFrac(share(r, 'mother'), 1, 6);
		expectFrac(share(r, 'son'), 13, 30);
		expectFrac(share(r, 'daughter'), 13, 120);
		expect(r.awlApplied).toBe(false);
		expect(r.raddApplied).toBe(false);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('husband + 1 daughter + mother (female decedent, radd)', () => {
		const r = calc({
			decedentGender: 'female',
			spouse: true,
			motherAlive: true,
			daughters: 1,
		});

		// Fixed: 1/4 + 1/2 + 1/6 = 11/12, radd redistributes 1/12 to non-spouse
		expectFrac(share(r, 'husband'), 1, 4);
		expectFrac(share(r, 'daughter'), 9, 16);
		expectFrac(share(r, 'mother'), 3, 16);
		expect(r.raddApplied).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('father only (pure asaba)', () => {
		const r = calc({ fatherAlive: true });
		expectFrac(share(r, 'father'), 1, 1);
		expect(r.heirs[0].shareType).toBe('residuary');
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('mother only (radd to full estate)', () => {
		const r = calc({ motherAlive: true });
		expectFrac(share(r, 'mother'), 1, 1);
		expect(r.raddApplied).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});
});

// ─── Spouse shares ────────────────────────────────────────────────────

describe('Spouse shares', () => {
	it('wife gets 1/4 with no descendants', () => {
		const r = calc({ spouse: true, fatherAlive: true });
		expectFrac(share(r, 'wife'), 1, 4);
	});

	it('wife gets 1/8 with descendants', () => {
		const r = calc({ spouse: true, sons: 1 });
		expectFrac(share(r, 'wife'), 1, 8);
	});

	it('husband gets 1/2 with no descendants', () => {
		const r = calc({ decedentGender: 'female', spouse: true, fatherAlive: true });
		expectFrac(share(r, 'husband'), 1, 2);
	});

	it('husband gets 1/4 with descendants', () => {
		const r = calc({ decedentGender: 'female', spouse: true, sons: 1 });
		expectFrac(share(r, 'husband'), 1, 4);
	});
});

// ─── Daughter shares ──────────────────────────────────────────────────

describe('Daughter shares', () => {
	it('1 daughter = 1/2', () => {
		const r = calc({ daughters: 1, fatherAlive: true });
		expectFrac(share(r, 'daughter'), 1, 2);
	});

	it('2 daughters = 2/3', () => {
		const r = calc({ daughters: 2, fatherAlive: true });
		expectFrac(share(r, 'daughter'), 2, 3);
	});

	it('daughters become asaba with sons (2:1)', () => {
		const r = calc({ sons: 1, daughters: 1 });
		expectFrac(share(r, 'son'), 2, 3);
		expectFrac(share(r, 'daughter'), 1, 3);
	});
});

// ─── Father dual role ─────────────────────────────────────────────────

describe('Father dual role', () => {
	it('father gets 1/6 only with male descendants', () => {
		const r = calc({ fatherAlive: true, sons: 1 });
		expectFrac(share(r, 'father'), 1, 6);
		expect(r.heirs.find((h) => h.heirType === 'father')!.shareType).toBe('fixed');
	});

	it('father gets 1/6 + residual with female-only descendants', () => {
		const r = calc({
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
			daughters: 1,
		});
		expectFrac(share(r, 'father'), 5, 24);
		expect(r.heirs.find((h) => h.heirType === 'father')!.shareType).toBe('fixed_and_residuary');
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('father is pure asaba with no descendants', () => {
		const r = calc({ fatherAlive: true, motherAlive: true });
		expectFrac(share(r, 'father'), 2, 3);
		expect(r.heirs.find((h) => h.heirType === 'father')!.shareType).toBe('residuary');
	});
});

// ─── Umariyyah (Gharāwayn) ───────────────────────────────────────────

describe('Umariyyah (Gharāwayn)', () => {
	it('husband + father + mother', () => {
		const r = calc({
			decedentGender: 'female',
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
		});
		expectFrac(share(r, 'husband'), 1, 2);
		expectFrac(share(r, 'mother'), 1, 6);
		expectFrac(share(r, 'father'), 1, 3);
		expect(r.notes.some((n) => n.includes('Umariyyah'))).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('wife + father + mother', () => {
		const r = calc({
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
		});
		expectFrac(share(r, 'wife'), 1, 4);
		expectFrac(share(r, 'mother'), 1, 4);
		expectFrac(share(r, 'father'), 1, 2);
		expect(r.notes.some((n) => n.includes('Umariyyah'))).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('does NOT apply when 2+ siblings exist', () => {
		const r = calc({
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
			fullBrothers: 2,
		});
		expectFrac(share(r, 'mother'), 1, 6);
		expect(r.notes.some((n) => n.includes('Umariyyah'))).toBe(false);
	});
});

// ─── ʿAwl ─────────────────────────────────────────────────────────────

describe('ʿAwl (proportional reduction)', () => {
	it('husband + mother + 2 full sisters', () => {
		const r = calc({
			decedentGender: 'female',
			spouse: true,
			motherAlive: true,
			fullSisters: 2,
		});
		expectFrac(share(r, 'husband'), 3, 8);
		expectFrac(share(r, 'mother'), 1, 8);
		expectFrac(share(r, 'full_sister'), 1, 2);
		expect(r.awlApplied).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('husband + 2 daughters + mother + father', () => {
		const r = calc({
			decedentGender: 'female',
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
			daughters: 2,
		});
		expect(r.awlApplied).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});
});

// ─── Radd ─────────────────────────────────────────────────────────────

describe('Radd (proportional increase)', () => {
	it('mother + 1 daughter, no spouse', () => {
		const r = calc({ motherAlive: true, daughters: 1 });
		expectFrac(share(r, 'mother'), 1, 4);
		expectFrac(share(r, 'daughter'), 3, 4);
		expect(r.raddApplied).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('wife + mother + daughter (radd excludes spouse)', () => {
		const r = calc({
			spouse: true,
			motherAlive: true,
			daughters: 1,
		});
		expect(r.raddApplied).toBe(true);
		expectFrac(share(r, 'wife'), 1, 8);
		const motherShare = share(r, 'mother')!;
		const daughterShare = share(r, 'daughter')!;
		expect(motherShare.add(daughterShare).equals(frac(7, 8))).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});
});

// ─── Dhawul Arḥām ────────────────────────────────────────────────────

describe('Dhawul Arḥām detection', () => {
	it('spouse only → flags dhawul arham', () => {
		const r = calc({ spouse: true });
		expect(r.dhawulArhamNeeded).toBe(true);
		expect(r.error).toBeDefined();
		expectFrac(share(r, 'wife'), 1, 4);
	});

	it('no heirs at all → flags dhawul arham (estate goes to bayt al-mal)', () => {
		const r = calc({});
		expect(r.heirs).toHaveLength(0);
		expect(r.dhawulArhamNeeded).toBe(true);
	});
});

// ─── Blocking rules ──────────────────────────────────────────────────

describe('Blocking (ḥajb al-ḥirmān)', () => {
	it('father blocks paternal grandfather', () => {
		const r = calc({ fatherAlive: true, paternalGrandfatherAlive: true });
		expect(isBlocked(r, 'paternal_grandfather')).toBe(true);
	});

	it('mother blocks both grandmothers', () => {
		const r = calc({
			motherAlive: true,
			paternalGrandmotherAlive: true,
			maternalGrandmotherAlive: true,
			fatherAlive: true,
		});
		expect(isBlocked(r, 'maternal_grandmother')).toBe(true);
		expect(isBlocked(r, 'paternal_grandmother')).toBe(true);
	});

	it('father blocks paternal grandmother', () => {
		const r = calc({ fatherAlive: true, paternalGrandmotherAlive: true });
		expect(isBlocked(r, 'paternal_grandmother')).toBe(true);
	});

	it('son blocks grandsons and granddaughters', () => {
		const r = calc({ sons: 1, sonsOfSons: 1, daughtersOfSons: 1, fatherAlive: true });
		expect(isBlocked(r, 'sons_of_sons')).toBe(true);
		expect(isBlocked(r, 'daughters_of_sons')).toBe(true);
	});

	it('2+ daughters block granddaughters (without grandson)', () => {
		const r = calc({ daughters: 2, daughtersOfSons: 1, fatherAlive: true });
		expect(isBlocked(r, 'daughters_of_sons')).toBe(true);
	});

	it('2 daughters do NOT block granddaughters when grandson exists', () => {
		const r = calc({ daughters: 2, sonsOfSons: 1, daughtersOfSons: 1, fatherAlive: true });
		expect(isBlocked(r, 'daughters_of_sons')).toBe(false);
	});

	it('father blocks all siblings (Ḥanafī)', () => {
		const r = calc({
			fatherAlive: true,
			fullBrothers: 1, fullSisters: 1,
			paternalHalfBrothers: 1, paternalHalfSisters: 1,
			maternalHalfBrothers: 1, maternalHalfSisters: 1,
		});
		expect(isBlocked(r, 'full_brother')).toBe(true);
		expect(isBlocked(r, 'full_sister')).toBe(true);
		expect(isBlocked(r, 'paternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'paternal_half_sister')).toBe(true);
		expect(isBlocked(r, 'maternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'maternal_half_sister')).toBe(true);
	});

	it('paternal grandfather blocks all siblings (Ḥanafī)', () => {
		const r = calc({
			paternalGrandfatherAlive: true,
			fullBrothers: 1, fullSisters: 1,
			paternalHalfBrothers: 1, maternalHalfBrothers: 1,
		});
		expect(isBlocked(r, 'full_brother')).toBe(true);
		expect(isBlocked(r, 'full_sister')).toBe(true);
		expect(isBlocked(r, 'paternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'maternal_half_brother')).toBe(true);
	});

	it('son blocks full brothers, sisters, and uncle', () => {
		const r = calc({
			sons: 1,
			fullBrothers: 1,
			fullSisters: 1,
			fullPaternalUncles: 1,
		});
		expect(isBlocked(r, 'full_brother')).toBe(true);
		expect(isBlocked(r, 'full_sister')).toBe(true);
		expect(isBlocked(r, 'full_paternal_uncle')).toBe(true);
	});

	it('full brother blocks paternal half-siblings and uncle', () => {
		const r = calc({
			fullBrothers: 1,
			paternalHalfBrothers: 1,
			paternalHalfSisters: 1,
			fullPaternalUncles: 1,
		});
		expect(isBlocked(r, 'paternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'paternal_half_sister')).toBe(true);
		expect(isBlocked(r, 'full_paternal_uncle')).toBe(true);
	});

	it('descendants block maternal half-siblings', () => {
		const r = calc({
			daughters: 1,
			maternalHalfBrothers: 1,
			maternalHalfSisters: 1,
			fatherAlive: true,
		});
		expect(isBlocked(r, 'maternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'maternal_half_sister')).toBe(true);
	});

	it('full sisters as asaba block paternal half-siblings', () => {
		const r = calc({
			daughters: 1,
			fullSisters: 1,
			paternalHalfBrothers: 1,
			paternalHalfSisters: 1,
		});
		expect(isBlocked(r, 'paternal_half_brother')).toBe(true);
		expect(isBlocked(r, 'paternal_half_sister')).toBe(true);
	});

	it('2+ full sisters block paternal half-sisters (no half-brother)', () => {
		const r = calc({ fullSisters: 2, paternalHalfSisters: 1 });
		expect(isBlocked(r, 'paternal_half_sister')).toBe(true);
	});
});

// ─── Grandchildren through sons ──────────────────────────────────────

describe('Grandchildren through sons', () => {
	it('1 granddaughter alone = 1/2', () => {
		const r = calc({ daughtersOfSons: 1, fatherAlive: true });
		expectFrac(share(r, 'daughters_of_sons'), 1, 2);
	});

	it('2 granddaughters alone = 2/3', () => {
		const r = calc({ daughtersOfSons: 2, fatherAlive: true });
		expectFrac(share(r, 'daughters_of_sons'), 2, 3);
	});

	it('granddaughter with 1 daughter = 1/6 (completing 2/3)', () => {
		const r = calc({ daughters: 1, daughtersOfSons: 1, fatherAlive: true });
		expectFrac(share(r, 'daughter'), 1, 2);
		expectFrac(share(r, 'daughters_of_sons'), 1, 6);
	});

	it('grandson + granddaughter as asaba bi-l-ghayr', () => {
		const r = calc({ sonsOfSons: 1, daughtersOfSons: 1 });
		const ssShare = share(r, 'sons_of_sons')!;
		const sdShare = share(r, 'daughters_of_sons')!;
		expect(ssShare.equals(sdShare.multiply(frac(2)))).toBe(true);
		expect(ssShare.add(sdShare).equals(Fraction.ONE)).toBe(true);
	});
});

// ─── Grandparents ─────────────────────────────────────────────────────

describe('Grandparents', () => {
	it('paternal grandfather acts like father (1/6 + residual with daughters)', () => {
		const r = calc({ paternalGrandfatherAlive: true, daughters: 1 });
		const gfShare = share(r, 'paternal_grandfather')!;
		expect(gfShare.greaterThan(frac(1, 6))).toBe(true);
		expect(r.heirs.find((h) => h.heirType === 'paternal_grandfather')!.shareType).toBe('fixed_and_residuary');
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('paternal grandfather is pure asaba with no descendants', () => {
		const r = calc({ paternalGrandfatherAlive: true, motherAlive: true });
		expectFrac(share(r, 'paternal_grandfather'), 2, 3);
		expect(r.heirs.find((h) => h.heirType === 'paternal_grandfather')!.shareType).toBe('residuary');
	});

	it('both grandmothers share 1/6', () => {
		const r = calc({
			paternalGrandmotherAlive: true,
			maternalGrandmotherAlive: true,
			fullBrothers: 1,
		});
		expectFrac(share(r, 'paternal_grandmother'), 1, 12);
		expectFrac(share(r, 'maternal_grandmother'), 1, 12);
	});

	it('single grandmother gets full 1/6', () => {
		const r = calc({ maternalGrandmotherAlive: true, fullBrothers: 1 });
		expectFrac(share(r, 'maternal_grandmother'), 1, 6);
	});
});

// ─── Siblings ─────────────────────────────────────────────────────────

describe('Siblings', () => {
	it('full brother alone takes entire estate', () => {
		const r = calc({ fullBrothers: 1 });
		expectFrac(share(r, 'full_brother'), 1, 1);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('full brothers + full sisters share as asaba (2:1)', () => {
		const r = calc({ fullBrothers: 1, fullSisters: 1 });
		expectFrac(share(r, 'full_brother'), 2, 3);
		expectFrac(share(r, 'full_sister'), 1, 3);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('1 full sister alone = 1/2', () => {
		const r = calc({ fullSisters: 1, fullPaternalUncles: 1 });
		expectFrac(share(r, 'full_sister'), 1, 2);
	});

	it('2 full sisters = 2/3', () => {
		const r = calc({ fullSisters: 2, fullPaternalUncles: 1 });
		expectFrac(share(r, 'full_sister'), 2, 3);
	});

	it('full sister as asaba with daughters', () => {
		const r = calc({ daughters: 2, fullSisters: 1 });
		expectFrac(share(r, 'daughter'), 2, 3);
		expectFrac(share(r, 'full_sister'), 1, 3);
		expect(r.heirs.find((h) => h.heirType === 'full_sister')!.shareType).toBe('residuary');
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('paternal half-sisters get 1/6 completing 2/3 with 1 full sister', () => {
		const r = calc({ fullSisters: 1, paternalHalfSisters: 1, fullPaternalUncles: 1 });
		expectFrac(share(r, 'full_sister'), 1, 2);
		expectFrac(share(r, 'paternal_half_sister'), 1, 6);
	});

	it('1 maternal half-brother = 1/6', () => {
		const r = calc({ maternalHalfBrothers: 1, fullBrothers: 1 });
		expectFrac(share(r, 'maternal_half_brother'), 1, 6);
	});

	it('2+ maternal siblings = 1/3 shared equally', () => {
		const r = calc({ maternalHalfBrothers: 1, maternalHalfSisters: 1, fullBrothers: 1 });
		expectFrac(share(r, 'maternal_half_brother'), 1, 6);
		expectFrac(share(r, 'maternal_half_sister'), 1, 6);
	});
});

// ─── Uncles ───────────────────────────────────────────────────────────

describe('Uncles', () => {
	it('uncle takes residual when no higher asaba', () => {
		const r = calc({ motherAlive: true, fullPaternalUncles: 1 });
		expectFrac(share(r, 'mother'), 1, 3);
		expectFrac(share(r, 'full_paternal_uncle'), 2, 3);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('uncle blocked by full brother', () => {
		const r = calc({ fullBrothers: 1, fullPaternalUncles: 1 });
		expect(isBlocked(r, 'full_paternal_uncle')).toBe(true);
		expect(share(r, 'full_paternal_uncle')).toBeNull();
	});
});

// ─── Mother's share with siblings (ḥajb al-nuqṣān) ──────────────────

describe("Mother's share with siblings", () => {
	it('mother gets 1/6 with 2+ siblings even if blocked by father', () => {
		const r = calc({
			fatherAlive: true,
			motherAlive: true,
			fullBrothers: 3,
		});
		expectFrac(share(r, 'mother'), 1, 6);
		expect(isBlocked(r, 'full_brother')).toBe(true);
	});

	it('mother gets 1/3 with only 1 sibling', () => {
		const r = calc({
			motherAlive: true,
			fullBrothers: 1,
		});
		expectFrac(share(r, 'mother'), 1, 3);
	});
});

// ─── Complex integration cases ───────────────────────────────────────

describe('Complex integration cases', () => {
	it('wife + 2 daughters + granddaughter + mother + full sister', () => {
		const r = calc({
			spouse: true,
			motherAlive: true,
			daughters: 2,
			daughtersOfSons: 1,
			fullSisters: 1,
		});
		expect(isBlocked(r, 'daughters_of_sons')).toBe(true);
		expect(r.heirs.find((h) => h.heirType === 'full_sister')!.shareType).toBe('residuary');
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('wife + 1 daughter + 1 granddaughter + father + mother (ʿawl)', () => {
		const r = calc({
			spouse: true,
			fatherAlive: true,
			motherAlive: true,
			daughters: 1,
			daughtersOfSons: 1,
		});
		// Fixed shares: 1/8 + 1/2 + 1/6 + 1/6 + 1/6 = 27/24 → ʿawl
		expect(r.awlApplied).toBe(true);
		expectFrac(share(r, 'wife'), 1, 9);
		expectFrac(share(r, 'daughter'), 4, 9);
		expectFrac(share(r, 'daughters_of_sons'), 4, 27);
		expectFrac(share(r, 'father'), 4, 27);
		expectFrac(share(r, 'mother'), 4, 27);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('husband + mother + 2 maternal brothers + 1 full brother (Mushārakah note)', () => {
		const r = calc({
			decedentGender: 'female',
			spouse: true,
			motherAlive: true,
			maternalHalfBrothers: 2,
			fullBrothers: 1,
		});
		expectFrac(share(r, 'husband'), 1, 2);
		expectFrac(share(r, 'mother'), 1, 6);
		expectFrac(share(r, 'maternal_half_brother'), 1, 3);
		expect(share(r, 'full_brother')).toBeNull();
		expect(r.notes.some((n) => n.includes('Mushārakah'))).toBe(true);
		expect(totalSumEqualsOne(r)).toBe(true);
	});

	it('all shares sum to 1 across many different inputs', () => {
		const cases: Partial<EstateInput>[] = [
			{ sons: 3 },
			{ sons: 1, daughters: 2, spouse: true, motherAlive: true, fatherAlive: true },
			{ daughters: 3, motherAlive: true, fullSisters: 2 },
			{ spouse: true, fatherAlive: true, motherAlive: true, daughters: 2, sonsOfSons: 1, daughtersOfSons: 1 },
			{ fullBrothers: 2, fullSisters: 3, motherAlive: true, maternalGrandmotherAlive: true },
			{ paternalHalfBrothers: 1, paternalHalfSisters: 2, motherAlive: true },
			{ fullPaternalUncles: 3, paternalGrandmotherAlive: true, maternalGrandmotherAlive: true },
		];
		for (const c of cases) {
			const r = calc(c);
			if (!r.dhawulArhamNeeded) {
				expect(totalSumEqualsOne(r), `Failed for input: ${JSON.stringify(c)}`).toBe(true);
			}
		}
	});
});
